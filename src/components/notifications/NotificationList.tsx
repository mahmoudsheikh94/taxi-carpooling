import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../../store/notificationStore';
import { Button, LoadingSpinner, EmptyState, Card } from '../ui';
import { useToast } from '../../hooks/useToast';
import type { NotificationData } from '../../services/notifications/notificationService';

interface NotificationListProps {
  userId: string;
  unreadOnly?: boolean;
  limit?: number;
  onNotificationClick?: (notification: NotificationData) => void;
  className?: string;
}

export function NotificationList({ 
  userId, 
  unreadOnly = false, 
  limit,
  onNotificationClick,
  className = '' 
}: NotificationListProps) {
  const {
    notifications,
    isLoading,
    error,
    hasMore,
    currentPage,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const { showToast } = useToast();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Load notifications on mount
  useEffect(() => {
    getNotifications(userId, 1, unreadOnly);
  }, [userId, unreadOnly, getNotifications]);

  const handleNotificationClick = async (notification: NotificationData) => {
    // Mark as read if unread
    if (!notification.read) {
      const result = await markAsRead(notification.id);
      if (!result.success) {
        showToast(result.error || 'Failed to mark notification as read', 'error');
      }
    }

    onNotificationClick?.(notification);
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead(userId);
    if (result.success) {
      showToast('All notifications marked as read', 'success');
    } else {
      showToast(result.error || 'Failed to mark all notifications as read', 'error');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      showToast('Notification deleted', 'success');
    } else {
      showToast(result.error || 'Failed to delete notification', 'error');
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    
    try {
      await getNotifications(userId, nextPage, unreadOnly);
    } catch (err) {
      showToast('Failed to load more notifications', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trip_request':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        );
      case 'trip_update':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'trip_match':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        );
      case 'trip_cancelled':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'trip_completed':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Show error state
  if (error && !isLoading && notifications.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <EmptyState
          title="Failed to load notifications"
          description={error}
          action={
            <Button onClick={() => getNotifications(userId, 1, unreadOnly)}>
              Try Again
            </Button>
          }
        />
      </Card>
    );
  }

  // Show empty state
  if (!isLoading && notifications.length === 0) {
    const emptyTitle = unreadOnly ? 'No unread notifications' : 'No notifications';
    const emptyDescription = unreadOnly 
      ? 'You\'re all caught up! No new notifications to show.' 
      : 'You don\'t have any notifications yet. When you do, they\'ll appear here.';
    
    return (
      <Card className={`p-6 ${className}`}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      </Card>
    );
  }

  const displayedNotifications = limit ? notifications.slice(0, limit) : notifications;
  const hasUnreadNotifications = notifications.some(n => !n.read);

  return (
    <Card className={className}>
      {/* Header with actions */}
      {!limit && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {unreadOnly ? 'Unread Notifications' : 'All Notifications'}
            </h2>
            {hasUnreadNotifications && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading state for initial load */}
      {isLoading && notifications.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
          </div>
        </div>
      )}

      {/* Notification List */}
      {displayedNotifications.length > 0 && (
        <div className="divide-y divide-gray-200">
          {displayedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                {getNotificationIcon(notification.type)}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${
                      !notification.read ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity text-gray-400 hover:text-gray-600"
                  aria-label="Delete notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !limit && displayedNotifications.length >= 20 && (
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="w-full"
          >
            {isLoadingMore && <LoadingSpinner className="mr-2" />}
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Error banner for partial failures */}
      {error && notifications.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg m-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </Card>
  );
}