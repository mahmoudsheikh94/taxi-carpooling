import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserStatusStore } from '../store/userStatusStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import type { UserStatus } from '../types';

export interface UseUserStatusOptions {
  autoConnect?: boolean;
  heartbeatInterval?: number;
  offlineThreshold?: number;
  enableNotifications?: boolean;
  trackLastSeen?: boolean;
}

export function useUserStatus(options: UseUserStatusOptions = {}) {
  const {
    autoConnect = true,
    heartbeatInterval = 30000, // 30 seconds
    offlineThreshold = 60000, // 1 minute
    enableNotifications = false,
    trackLastSeen = true,
  } = options;

  const { user } = useAuthStore();
  const { showToast } = useToast();
  const {
    userStatuses,
    isConnected,
    connect,
    disconnect,
    updateUserStatus,
    getUserStatus,
    subscribeToUserStatus,
    startHeartbeat,
    stopHeartbeat,
    reset,
  } = useUserStatusStore();

  const [error, setError] = useState<string | null>(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const visibilityRef = useRef(document.visibilityState);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user?.id && !isConnected) {
      handleConnect();
    }

    return () => {
      cleanup();
    };
  }, [autoConnect, user?.id, isConnected]);

  // Handle connection with retry logic
  const handleConnect = useCallback(async () => {
    if (!user?.id) return;

    try {
      await connect(user.id);
      
      if (trackLastSeen) {
        await updateUserStatus(user.id, true, `Online`);
      }
      
      startHeartbeat(user.id);
      setConnectionRetries(0);
      setError(null);
      
      if (enableNotifications && connectionRetries > 0) {
        showToast('Reconnected to chat service', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      
      // Exponential backoff retry
      const retryDelay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
      setConnectionRetries(prev => prev + 1);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (connectionRetries < 5) {
          handleConnect();
        } else if (enableNotifications) {
          showToast('Unable to connect to chat service', 'error');
        }
      }, retryDelay);
    }
  }, [user?.id, connect, updateUserStatus, startHeartbeat, trackLastSeen, enableNotifications, showToast, connectionRetries]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    if (!user?.id) return;

    try {
      if (trackLastSeen) {
        await updateUserStatus(user.id, false, `Last seen ${new Date().toLocaleTimeString()}`);
      }
      
      stopHeartbeat();
      await disconnect(user.id);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
    }
  }, [user?.id, disconnect, updateUserStatus, stopHeartbeat, trackLastSeen]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentState = document.visibilityState;
      const previousState = visibilityRef.current;
      visibilityRef.current = currentState;

      if (!user?.id) return;

      if (currentState === 'visible' && previousState === 'hidden') {
        // Page became visible - reconnect if needed
        if (!isConnected) {
          handleConnect();
        } else if (trackLastSeen) {
          updateUserStatus(user.id, true, 'Online');
        }
      } else if (currentState === 'hidden' && previousState === 'visible') {
        // Page became hidden - update status but stay connected
        if (trackLastSeen && isConnected) {
          updateUserStatus(user.id, true, `Away since ${new Date().toLocaleTimeString()}`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.id, isConnected, handleConnect, updateUserStatus, trackLastSeen]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (user?.id && !isConnected) {
        handleConnect();
      }
    };

    const handleOffline = () => {
      if (enableNotifications) {
        showToast('You are offline', 'warning');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user?.id, isConnected, handleConnect, enableNotifications, showToast]);

  // Update own status
  const updateStatus = useCallback(async (isOnline: boolean, statusMessage?: string) => {
    if (!user?.id) return;

    try {
      await updateUserStatus(user.id, isOnline, statusMessage);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      setError(errorMessage);
      
      if (enableNotifications) {
        showToast('Failed to update status', 'error');
      }
    }
  }, [user?.id, updateUserStatus, enableNotifications, showToast]);

  // Get status for specific user
  const getStatus = useCallback((userId: string): UserStatus | null => {
    return getUserStatus(userId);
  }, [getUserStatus]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    const status = getStatus(userId);
    if (!status) return false;
    
    const timeSinceLastSeen = Date.now() - new Date(status.last_seen_at).getTime();
    return status.is_online && timeSinceLastSeen < offlineThreshold;
  }, [getStatus, offlineThreshold]);

  // Get user's last seen text
  const getLastSeenText = useCallback((userId: string): string => {
    const status = getStatus(userId);
    if (!status) return 'Unknown';
    
    if (isUserOnline(userId)) {
      return status.status_message || 'Online';
    }
    
    const lastSeen = new Date(status.last_seen_at);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastSeen.toLocaleDateString();
  }, [getStatus, isUserOnline]);

  // Subscribe to specific user's status
  const subscribeToUser = useCallback((userId: string) => {
    return subscribeToUserStatus(userId);
  }, [subscribeToUserStatus]);

  // Bulk status operations
  const getMultipleStatuses = useCallback((userIds: string[]): Record<string, UserStatus | null> => {
    const statuses: Record<string, UserStatus | null> = {};
    userIds.forEach(id => {
      statuses[id] = getStatus(id);
    });
    return statuses;
  }, [getStatus]);

  const getOnlineUsers = useCallback((userIds: string[]): string[] => {
    return userIds.filter(id => isUserOnline(id));
  }, [isUserOnline]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    stopHeartbeat();
    reset();
  }, [stopHeartbeat, reset]);

  // Activity tracking
  const trackActivity = useCallback(() => {
    if (user?.id && isConnected && trackLastSeen) {
      updateStatus(true, 'Online');
    }
  }, [user?.id, isConnected, trackLastSeen, updateStatus]);

  // Setup activity tracking
  useEffect(() => {
    if (!trackLastSeen) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let activityTimer: NodeJS.Timeout;

    const resetActivityTimer = () => {
      if (activityTimer) clearTimeout(activityTimer);
      
      activityTimer = setTimeout(() => {
        if (user?.id && isConnected) {
          updateStatus(true, `Away since ${new Date().toLocaleTimeString()}`);
        }
      }, 300000); // 5 minutes of inactivity
    };

    const handleActivity = () => {
      trackActivity();
      resetActivityTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    resetActivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (activityTimer) clearTimeout(activityTimer);
    };
  }, [user?.id, isConnected, trackLastSeen, trackActivity, updateStatus]);

  return {
    // State
    userStatuses,
    isConnected,
    error,
    connectionRetries,
    
    // Actions
    connect: handleConnect,
    disconnect: handleDisconnect,
    updateStatus,
    subscribeToUser,
    cleanup,
    trackActivity,
    
    // Getters
    getStatus,
    isUserOnline,
    getLastSeenText,
    getMultipleStatuses,
    getOnlineUsers,
    
    // Computed
    isOnline: isConnected && !error,
    currentUserStatus: user?.id ? getStatus(user.id) : null,
    totalOnlineUsers: Object.values(userStatuses).filter(status => 
      status && status.is_online && (Date.now() - new Date(status.last_seen_at).getTime()) < offlineThreshold
    ).length,
  };
}

// Hook for batch user status management
export function useBatchUserStatus(userIds: string[], options: UseUserStatusOptions = {}) {
  const userStatus = useUserStatus(options);
  const [subscriptions, setSubscriptions] = useState<Record<string, () => void>>({});

  // Subscribe to all users
  useEffect(() => {
    const newSubscriptions: Record<string, () => void> = {};
    
    userIds.forEach(userId => {
      if (!subscriptions[userId]) {
        newSubscriptions[userId] = userStatus.subscribeToUser(userId);
      }
    });

    setSubscriptions(prev => ({ ...prev, ...newSubscriptions }));

    return () => {
      Object.values(newSubscriptions).forEach(unsub => unsub());
    };
  }, [userIds, userStatus.subscribeToUser]);

  // Cleanup unused subscriptions
  useEffect(() => {
    const currentUserIds = new Set(userIds);
    const subscriptionsToRemove: string[] = [];
    
    Object.keys(subscriptions).forEach(userId => {
      if (!currentUserIds.has(userId)) {
        subscriptionsToRemove.push(userId);
      }
    });

    if (subscriptionsToRemove.length > 0) {
      setSubscriptions(prev => {
        const updated = { ...prev };
        subscriptionsToRemove.forEach(userId => {
          if (updated[userId]) {
            updated[userId]();
            delete updated[userId];
          }
        });
        return updated;
      });
    }
  }, [userIds, subscriptions]);

  return {
    ...userStatus,
    userStatuses: userStatus.getMultipleStatuses(userIds),
    onlineUsers: userStatus.getOnlineUsers(userIds),
    subscriptions: Object.keys(subscriptions),
  };
}