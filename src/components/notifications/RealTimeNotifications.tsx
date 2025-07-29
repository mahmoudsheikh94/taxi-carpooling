import { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '../ui';
import { MatchNotification } from './MatchNotification';
import { useNotificationStore } from '../../store/notificationStore';
import { useMatchStore } from '../../store/matchStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import type { Notification } from '../../types';

interface RealTimeNotificationsProps {
  showUnreadOnly?: boolean;
  maxNotifications?: number;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export function RealTimeNotifications({
  showUnreadOnly = false,
  maxNotifications = 10,
  onNotificationClick,
  className = '',
}: RealTimeNotificationsProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showAll, setShowAll] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    getNotifications,
    markAsRead,
    dismissNotification,
    subscribeToNotifications,
    clearError,
  } = useNotificationStore();

  const {
    updateMatchStatus,
    getMatchById,
  } = useMatchStore();

  // Load notifications on mount
  useEffect(() => {
    if (user?.id) {
      getNotifications(user.id);
    }
  }, [user?.id, getNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      // Play notification sound for new matches
      if (notification.type === 'new_match' && audioRef.current) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {
          // Ignore audio play errors (user might not have interacted with page yet)
        });
      }

      // Show toast for important notifications
      if (notification.type === 'new_match') {
        showToast('New match found! Check your notifications.', 'success');
      }
    });

    return unsubscribe;
  }, [user?.id, subscribeToNotifications, showToast]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    onNotificationClick?.(notification);
  };

  const handleMatchAccept = async (matchId: string) => {
    try {
      const result = await updateMatchStatus(matchId, 'ACCEPTED');
      if (result.success) {
        showToast('Match accepted successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to accept match', 'error');
      }
    } catch (error) {
      showToast('An error occurred while accepting the match', 'error');
    }
  };

  const handleMatchDecline = async (matchId: string) => {
    try {
      const result = await updateMatchStatus(matchId, 'DECLINED');
      if (result.success) {
        showToast('Match declined', 'info');
      } else {
        showToast(result.error || 'Failed to decline match', 'error');
      }
    } catch (error) {
      showToast('An error occurred while declining the match', 'error');
    }
  };

  const handleMatchView = async (matchId: string) => {
    try {
      await getMatchById(matchId);
      await updateMatchStatus(matchId, 'VIEWED');
      // You could navigate to match details page here
      showToast('Match details loaded', 'success');
    } catch (error) {
      showToast('Failed to load match details', 'error');
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await dismissNotification(notificationId);
      showToast('Notification dismissed', 'info');
    } catch (error) {
      showToast('Failed to dismiss notification', 'error');
    }
  };

  // Filter notifications based on props
  const filteredNotifications = notifications
    .filter(notification => showUnreadOnly ? !notification.read : true)
    .slice(0, showAll ? undefined : maxNotifications);

  const hasMoreNotifications = notifications.length > maxNotifications && !showAll;

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Failed to load notifications</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <Button onClick={clearError} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Audio element for notification sounds */}
      <audio ref={audioRef} preload="auto">
        <source src="/notification-sound.mp3" type="audio/mpeg" />
        <source src="/notification-sound.ogg" type="audio/ogg" />
      </audio>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {showUnreadOnly ? 'Unread Notifications' : 'All Notifications'}
          </h3>
          {unreadCount > 0 && (
            <Badge color="red" size="sm">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center space-x-2 text-xs text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates</span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && filteredNotifications.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading notifications...</p>
          </div>
        </Card>
      )}

      {/* Notifications List */}
      {!isLoading && filteredNotifications.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v10z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-sm">
              {showUnreadOnly 
                ? "You're all caught up! New notifications will appear here."
                : "We'll notify you when we find trip matches or have updates."
              }
            </p>
          </div>
        </Card>
      )}

      {filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className="cursor-pointer"
            >
              <MatchNotification
                notification={notification}
                match={notification.data?.match}
                onAccept={handleMatchAccept}
                onDecline={handleMatchDecline}
                onView={handleMatchView}
                onDismiss={handleDismiss}
              />
            </div>
          ))}
        </div>
      )}

      {/* Show More Button */}
      {hasMoreNotifications && (
        <div className="text-center pt-4">
          <Button
            onClick={() => setShowAll(true)}
            variant="outline"
            size="sm"
          >
            Show {notifications.length - maxNotifications} more notifications
          </Button>
        </div>
      )}

      {/* Show Less Button */}
      {showAll && notifications.length > maxNotifications && (
        <div className="text-center pt-4">
          <Button
            onClick={() => setShowAll(false)}
            variant="outline"
            size="sm"
          >
            Show less
          </Button>
        </div>
      )}

      {/* Performance indicator */}
      {filteredNotifications.length > 0 && (
        <div className="text-center text-xs text-gray-500">
          Showing {filteredNotifications.length} of {notifications.length} notifications
          {unreadCount > 0 && ` • ${unreadCount} unread`}
        </div>
      )}
    </div>
  );
}