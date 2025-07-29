import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button, Badge } from '../ui';
import type { TripMatch, Notification } from '../../types';

interface NotificationToastProps {
  notification: Notification;
  match?: TripMatch;
  onAccept?: (matchId: string) => void;
  onView?: (matchId: string) => void;
  onDismiss?: () => void;
  autoHideDuration?: number; // in milliseconds
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}

export function NotificationToast({
  notification,
  match,
  onAccept,
  onView,
  onDismiss,
  autoHideDuration = 8000,
  position = 'top-right',
  className = '',
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-hide timer
  useEffect(() => {
    if (autoHideDuration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, autoHideDuration - elapsed);
      const progressPercent = (remaining / autoHideDuration) * 100;
      
      setProgress(progressPercent);
      
      if (remaining <= 0) {
        setIsVisible(false);
        setTimeout(() => onDismiss?.(), 300); // Allow fade out animation
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoHideDuration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  const handleAction = (action: () => void) => {
    action();
    handleDismiss();
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'new_match':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        );
      case 'match_accepted':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'trip_request':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 17H9a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v10z" />
            </svg>
          </div>
        );
    }
  };

  const getNotificationTitle = () => {
    switch (notification.type) {
      case 'new_match':
        return '🎉 New Match Found!';
      case 'match_accepted':
        return '✅ Match Accepted';
      case 'trip_request':
        return '👋 New Trip Request';
      default:
        return notification.title || 'Notification';
    }
  };

  const getNotificationMessage = () => {
    if (notification.message) return notification.message;

    switch (notification.type) {
      case 'new_match':
        return match
          ? `${match.compatibility_score * 100}% compatible trip from ${match.matched_trip?.origin} to ${match.matched_trip?.destination}`
          : 'We found a trip that matches your preferences.';
      case 'match_accepted':
        return 'Your trip match has been accepted. Check trip details for next steps.';
      case 'trip_request':
        return 'Someone wants to join your trip. Review their request now.';
      default:
        return 'You have a new notification.';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      <div
        className={`bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm w-full transition-all duration-300 transform ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Progress bar */}
        {autoHideDuration > 0 && (
          <div className="h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Toast content */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            {getNotificationIcon()}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {getNotificationTitle()}
                </h4>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {getNotificationMessage()}
              </p>

              {/* Match details for new match notifications */}
              {notification.type === 'new_match' && match && (
                <div className="bg-blue-50 rounded-lg p-2 mb-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge color="blue" size="sm">
                        {Math.round(match.compatibility_score * 100)}% match
                      </Badge>
                      {match.estimated_savings && (
                        <span className="text-green-600 font-medium">
                          Save ${match.estimated_savings.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500">
                      {match.matched_trip?.departure_time &&
                        formatDistanceToNow(new Date(match.matched_trip.departure_time), { addSuffix: true })
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {notification.type === 'new_match' && match && onAccept && (
                  <Button
                    onClick={() => handleAction(() => onAccept(match.id))}
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    Accept
                  </Button>
                )}
                
                {onView && (
                  <Button
                    onClick={() => handleAction(() => onView(match?.id || notification.id))}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    View
                  </Button>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}