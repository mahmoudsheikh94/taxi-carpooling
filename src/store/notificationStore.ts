import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { notificationService } from '../services/notifications/notificationService';
import { tripRealtimeManager } from '../services/realtime/tripRealtime';
import type { NotificationData } from '../services/notifications/notificationService';

interface NotificationState {
  // Notification data
  notifications: NotificationData[];
  unreadCount: number;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  hasMore: boolean;
  
  // Real-time subscription
  isSubscribed: boolean;
}

interface NotificationActions {
  // Notification operations
  getNotifications: (userId: string, page?: number, unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  markAllAsRead: (userId: string) => Promise<{ success: boolean; error?: string }>;
  deleteNotification: (notificationId: string) => Promise<{ success: boolean; error?: string }>;
  getUnreadCount: (userId: string) => Promise<void>;
  
  // Real-time subscription management
  subscribeToNotifications: (userId: string) => () => void;
  unsubscribeFromNotifications: () => void;
  
  // UI state management
  setError: (error: string | null) => void;
  clearError: () => void;
  addNotification: (notification: NotificationData) => void;
  reset: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  currentPage: 1,
  hasMore: true,
  isSubscribed: false,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Get user notifications
      getNotifications: async (userId: string, page = 1, unreadOnly = false) => {
        const limit = 20;
        const offset = (page - 1) * limit;
        
        set({ isLoading: true, error: null });
        
        try {
          const { notifications, error, count } = await notificationService.getUserNotifications(
            userId,
            limit,
            offset,
            unreadOnly
          );
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          const hasMore = count ? offset + notifications.length < count : notifications.length === limit;
          
          set((state) => ({
            notifications: page === 1 ? notifications : [...state.notifications, ...notifications],
            hasMore,
            currentPage: page,
            isLoading: false,
            error: null,
          }));

          // Also update unread count
          get().getUnreadCount(userId);
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get notifications';
          set({ error, isLoading: false });
        }
      },

      // Mark notification as read
      markAsRead: async (notificationId: string) => {
        try {
          const { success, error } = await notificationService.markAsRead(notificationId);
          
          if (success) {
            set((state) => ({
              notifications: state.notifications.map(notification =>
                notification.id === notificationId
                  ? { ...notification, read: true }
                  : notification
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            }));
            return { success: true };
          } else {
            return { success: false, error };
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to mark notification as read';
          return { success: false, error };
        }
      },

      // Mark all notifications as read
      markAllAsRead: async (userId: string) => {
        try {
          const { success, error } = await notificationService.markAllAsRead(userId);
          
          if (success) {
            set((state) => ({
              notifications: state.notifications.map(notification => ({
                ...notification,
                read: true,
              })),
              unreadCount: 0,
            }));
            return { success: true };
          } else {
            return { success: false, error };
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
          return { success: false, error };
        }
      },

      // Delete notification
      deleteNotification: async (notificationId: string) => {
        try {
          const { success, error } = await notificationService.deleteNotification(notificationId);
          
          if (success) {
            set((state) => {
              const notification = state.notifications.find(n => n.id === notificationId);
              const wasUnread = notification && !notification.read;
              
              return {
                notifications: state.notifications.filter(n => n.id !== notificationId),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
              };
            });
            return { success: true };
          } else {
            return { success: false, error };
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to delete notification';
          return { success: false, error };
        }
      },

      // Get unread count
      getUnreadCount: async (userId: string) => {
        try {
          const { count, error } = await notificationService.getUnreadCount(userId);
          
          if (!error) {
            set({ unreadCount: count });
          }
        } catch (err) {
          console.error('Failed to get unread count:', err);
        }
      },

      // Subscribe to real-time notifications
      subscribeToNotifications: (userId: string) => {
        if (get().isSubscribed) {
          get().unsubscribeFromNotifications();
        }

        const unsubscribe = tripRealtimeManager.subscribeToUserNotifications(
          userId,
          (notification) => {
            get().addNotification(notification);
          }
        );

        set({ isSubscribed: true });

        // Return unsubscribe function
        return () => {
          unsubscribe();
          set({ isSubscribed: false });
        };
      },

      // Unsubscribe from notifications
      unsubscribeFromNotifications: () => {
        if (get().isSubscribed) {
          // The actual unsubscription is handled by the returned function from subscribeToNotifications
          set({ isSubscribed: false });
        }
      },

      // Add new notification (from real-time subscription)
      addNotification: (notification: NotificationData) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
        }));
      },

      // UI state management
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        // Only persist the unread count
        unreadCount: state.unreadCount,
      }),
    }
  )
);