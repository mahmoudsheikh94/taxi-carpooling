import { create } from 'zustand';
import { typingStatusService } from '../services/supabase';
import type { UserStatus } from '../services/supabase/typing';

interface UserStatusState {
  // User online status
  userStatuses: Record<string, UserStatus>; // userId -> status
  currentUserStatus: UserStatus | null;
  
  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  connectionError: string | null;
  
  // Subscriptions
  statusSubscriptions: Record<string, any>; // userId -> subscription
  heartbeatInterval: NodeJS.Timeout | null;
  
  // UI state
  showOnlineStatus: boolean;
  statusMessage: string;
}

interface UserStatusActions {
  // User status management
  updateUserStatus: (userId: string, isOnline: boolean, statusMessage?: string) => Promise<void>;
  setCurrentUserStatus: (status: UserStatus) => void;
  getUserStatus: (userId: string) => UserStatus | null;
  
  // Connection management
  connect: (userId: string) => Promise<void>;
  disconnect: (userId: string) => Promise<void>;
  setConnectionStatus: (connected: boolean, error?: string) => void;
  
  // Status subscriptions
  subscribeToUserStatus: (userId: string) => () => void;
  unsubscribeFromUser: (userId: string) => void;
  unsubscribeAll: () => void;
  
  // Heartbeat management
  startHeartbeat: (userId: string) => void;
  stopHeartbeat: () => void;
  
  // UI state
  setShowOnlineStatus: (show: boolean) => void;
  setStatusMessage: (message: string) => void;
  
  // Utility methods
  isUserOnline: (userId: string) => boolean;
  getLastSeenText: (userId: string) => string;
  getUsersOnlineCount: () => number;
  
  // Cleanup
  reset: () => void;
}

type UserStatusStore = UserStatusState & UserStatusActions;

const initialState: UserStatusState = {
  userStatuses: {},
  currentUserStatus: null,
  isConnected: false,
  isReconnecting: false,
  connectionError: null,
  statusSubscriptions: {},
  heartbeatInterval: null,
  showOnlineStatus: true,
  statusMessage: '',
};

export const useUserStatusStore = create<UserStatusStore>()((set, get) => ({
  ...initialState,

  // User status management
  updateUserStatus: async (userId: string, isOnline: boolean, statusMessage?: string) => {
    try {
      const { success, error } = await typingStatusService.updateUserStatus(
        userId,
        isOnline,
        statusMessage
      );
      
      if (success) {
        const status: UserStatus = {
          user_id: userId,
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
          status_message: statusMessage,
        };
        
        set((state) => ({
          userStatuses: {
            ...state.userStatuses,
            [userId]: status,
          },
          currentUserStatus: state.currentUserStatus?.user_id === userId ? status : state.currentUserStatus,
        }));
      } else {
        set({ connectionError: error || 'Failed to update status' });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to update user status';
      set({ connectionError: error });
    }
  },

  setCurrentUserStatus: (status: UserStatus) => {
    set({
      currentUserStatus: status,
      userStatuses: {
        ...get().userStatuses,
        [status.user_id]: status,
      },
    });
  },

  getUserStatus: (userId: string) => {
    return get().userStatuses[userId] || null;
  },

  // Connection management
  connect: async (userId: string) => {
    set({ isReconnecting: true, connectionError: null });
    
    try {
      await get().updateUserStatus(userId, true);
      get().startHeartbeat(userId);
      
      set({
        isConnected: true,
        isReconnecting: false,
        connectionError: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to connect';
      set({
        isConnected: false,
        isReconnecting: false,
        connectionError: error,
      });
    }
  },

  disconnect: async (userId: string) => {
    try {
      await get().updateUserStatus(userId, false);
      get().stopHeartbeat();
      get().unsubscribeAll();
      
      set({
        isConnected: false,
        isReconnecting: false,
        connectionError: null,
      });
    } catch (err) {
      console.warn('Error during disconnect:', err);
    }
  },

  setConnectionStatus: (connected: boolean, error?: string) => {
    set({
      isConnected: connected,
      connectionError: error || null,
      isReconnecting: false,
    });
  },

  // Status subscriptions
  subscribeToUserStatus: (userId: string) => {
    const existingSubscription = get().statusSubscriptions[userId];
    if (existingSubscription) {
      return () => {}; // Already subscribed
    }
    
    const subscription = typingStatusService.subscribeToUserStatus(userId, (status) => {
      set((state) => ({
        userStatuses: {
          ...state.userStatuses,
          [userId]: status,
        },
        currentUserStatus: state.currentUserStatus?.user_id === userId ? status : state.currentUserStatus,
      }));
    });
    
    set((state) => ({
      statusSubscriptions: {
        ...state.statusSubscriptions,
        [userId]: subscription,
      },
    }));
    
    return () => {
      subscription.unsubscribe();
      set((state) => {
        const { [userId]: removed, ...rest } = state.statusSubscriptions;
        return { statusSubscriptions: rest };
      });
    };
  },

  unsubscribeFromUser: (userId: string) => {
    const subscription = get().statusSubscriptions[userId];
    if (subscription) {
      subscription.unsubscribe();
      
      set((state) => {
        const { [userId]: removed, ...rest } = state.statusSubscriptions;
        return { statusSubscriptions: rest };
      });
    }
  },

  unsubscribeAll: () => {
    const subscriptions = get().statusSubscriptions;
    
    Object.values(subscriptions).forEach((subscription: any) => {
      subscription?.unsubscribe();
    });
    
    set({ statusSubscriptions: {} });
  },

  // Heartbeat management
  startHeartbeat: (userId: string) => {
    // Clear existing heartbeat
    get().stopHeartbeat();
    
    // Start new heartbeat every 30 seconds
    const interval = typingStatusService.createHeartbeat(userId, 30000);
    set({ heartbeatInterval: interval });
  },

  stopHeartbeat: () => {
    const interval = get().heartbeatInterval;
    if (interval) {
      clearInterval(interval);
      set({ heartbeatInterval: null });
    }
  },

  // UI state
  setShowOnlineStatus: (show: boolean) => {
    set({ showOnlineStatus: show });
  },

  setStatusMessage: (message: string) => {
    set({ statusMessage: message });
  },

  // Utility methods
  isUserOnline: (userId: string) => {
    const status = get().userStatuses[userId];
    if (!status) return false;
    
    // Consider user online if their last seen was within 5 minutes
    const lastSeen = new Date(status.last_seen_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return status.is_online && lastSeen > fiveMinutesAgo;
  },

  getLastSeenText: (userId: string) => {
    const status = get().userStatuses[userId];
    if (!status) return 'Never seen';
    
    const lastSeen = new Date(status.last_seen_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    
    if (get().isUserOnline(userId)) {
      return 'Online';
    }
    
    // Less than 1 minute
    if (diffMs < 60 * 1000) {
      return 'Just now';
    }
    
    // Less than 1 hour
    if (diffMs < 60 * 60 * 1000) {
      const minutes = Math.floor(diffMs / (60 * 1000));
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    
    // Less than 1 day
    if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    
    // Less than 1 week
    if (diffMs < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    
    // Format as date
    return lastSeen.toLocaleDateString();
  },

  getUsersOnlineCount: () => {
    const userStatuses = get().userStatuses;
    return Object.values(userStatuses).filter(status => get().isUserOnline(status.user_id)).length;
  },

  // Cleanup
  reset: () => {
    get().stopHeartbeat();
    get().unsubscribeAll();
    set(initialState);
  },
}));

// Selector hooks for convenient access
export const useUserOnlineStatus = (userId: string) => {
  return useUserStatusStore((state) => ({
    isOnline: state.isUserOnline(userId),
    lastSeenText: state.getLastSeenText(userId),
    status: state.getUserStatus(userId),
  }));
};

export const useConnectionStatus = () => {
  return useUserStatusStore((state) => ({
    isConnected: state.isConnected,
    isReconnecting: state.isReconnecting,
    error: state.connectionError,
  }));
};