import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, Button, Badge } from '../ui';
import { CompatibilityScore } from '../matching';
import type { TripMatch, Notification } from '../../types';

interface MatchNotificationProps {
  notification: Notification;
  match?: TripMatch;
  onAccept?: (matchId: string) => void;
  onDecline?: (matchId: string) => void;
  onView?: (matchId: string) => void;
  onDismiss?: (notificationId: string) => void;
  className?: string;
}

export function MatchNotification({
  notification,
  match,
  onAccept,
  onDecline,
  onView,
  onDismiss,
  className = '',
}: MatchNotificationProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'accept' | 'decline' | 'view', matchId?: string) => {
    if (!matchId) return;
    
    setIsProcessing(true);
    try {
      switch (action) {
        case 'accept':
          await onAccept?.(matchId);
          break;
        case 'decline':
          await onDecline?.(matchId);
          break;
        case 'view':
          await onView?.(matchId);
          break;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'new_match':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        );
      case 'match_accepted':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'match_declined':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

  const getNotificationTitle = () => {
    switch (notification.type) {
      case 'new_match':
        return 'New Match Found!';
      case 'match_accepted':
        return 'Match Accepted';
      case 'match_declined':
        return 'Match Declined';
      default:
        return notification.title || 'Notification';
    }
  };

  const getNotificationMessage = () => {
    if (notification.message) {
      return notification.message;
    }

    switch (notification.type) {
      case 'new_match':
        return 'We found a compatible trip that matches your preferences.';
      case 'match_accepted':
        return 'Great! Your trip match has been accepted.';
      case 'match_declined':
        return 'Unfortunately, this match was declined.';
      default:
        return 'You have a new notification.';
    }
  };

  return (
    <Card className={`p-4 ${!notification.read ? 'border-blue-200 bg-blue-50' : ''} ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0">
          {getNotificationIcon()}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900">
                {getNotificationTitle()}
              </h4>
              {!notification.read && (
                <Badge color="blue" size="sm">New</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              
              {onDismiss && (
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            {getNotificationMessage()}
          </p>

          {/* Match Details */}
          {match && (
            <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {match.matched_trip?.origin}
                  </span>
                </div>
                <CompatibilityScore
                  score={match.compatibility_score}
                  matchType={match.match_type}
                  showBreakdown={false}
                />
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  {match.matched_trip?.destination}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {match.detour_distance && (
                    <span>+{match.detour_distance.toFixed(1)}km detour</span>
                  )}
                  {match.detour_time && (
                    <span>+{Math.round(match.detour_time)}min extra</span>
                  )}
                  {match.estimated_savings && (
                    <span className="text-green-600 font-medium">
                      Save ${match.estimated_savings.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {match.matched_trip?.departure_time && 
                      formatDistanceToNow(new Date(match.matched_trip.departure_time), { addSuffix: true })
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {notification.type === 'new_match' && match && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleAction('view', match.id)}
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="flex-1"
              >
                View Details
              </Button>
              
              <Button
                onClick={() => handleAction('accept', match.id)}
                size="sm"
                disabled={isProcessing}
                className="flex-1"
              >
                Accept Match
              </Button>
              
              <Button
                onClick={() => handleAction('decline', match.id)}
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                Decline
              </Button>
            </div>
          )}

          {notification.type === 'match_accepted' && match && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => handleAction('view', match.id)}
                size="sm"
                disabled={isProcessing}
                className="flex-1"
              >
                View Trip Details
              </Button>
            </div>
          )}

          {notification.type === 'match_declined' && (
            <div className="text-sm text-gray-500">
              Don't worry, we'll keep looking for more compatible trips for you.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}