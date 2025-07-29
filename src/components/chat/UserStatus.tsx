import { useState } from 'react';
import { Badge } from '../ui';
import { useUserOnlineStatus, useConnectionStatus } from '../../store/userStatusStore';

interface UserStatusProps {
  userId: string;
  showStatusText?: boolean;
  showLastSeen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserStatus({
  userId,
  showStatusText = true,
  showLastSeen = true,
  size = 'md',
  className = '',
}: UserStatusProps) {
  const { isOnline, lastSeenText, status } = useUserOnlineStatus(userId);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status indicator dot */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full transition-colors ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
        {isOnline && (
          <div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-green-500 animate-ping opacity-75`}
          />
        )}
      </div>

      {/* Status text */}
      {showStatusText && (
        <div className={`${textSizeClasses[size]} text-gray-600`}>
          {isOnline ? (
            <span className="text-green-600 font-medium">Online</span>
          ) : (
            showLastSeen && <span>{lastSeenText}</span>
          )}
        </div>
      )}

      {/* Custom status message */}
      {status?.status_message && (
        <Badge variant="outline" size="sm" className="text-xs">
          {status.status_message}
        </Badge>
      )}
    </div>
  );
}

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const { isConnected, isReconnecting, error } = useConnectionStatus();
  const [showDetails, setShowDetails] = useState(false);

  if (isConnected && !error) {
    return null; // Don't show anything when connected
  }

  return (
    <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isReconnecting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-yellow-800">Reconnecting...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span className="text-sm font-medium text-yellow-800">
                Connection lost
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-yellow-600 hover:text-yellow-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {showDetails && error && (
        <div className="mt-3 text-sm text-yellow-700">
          <p><strong>Error:</strong> {error}</p>
          <p className="mt-1">
            Your messages may not be delivered until connection is restored.
          </p>
        </div>
      )}
    </div>
  );
}

interface BulkUserStatusProps {
  userIds: string[];
  maxDisplay?: number;
  className?: string;
}

export function BulkUserStatus({
  userIds,
  maxDisplay = 3,
  className = '',
}: BulkUserStatusProps) {
  const [showAll, setShowAll] = useState(false);

  const displayUserIds = showAll ? userIds : userIds.slice(0, maxDisplay);
  const remainingCount = userIds.length - maxDisplay;

  return (
    <div className={`space-y-2 ${className}`}>
      {displayUserIds.map(userId => (
        <UserStatus
          key={userId}
          userId={userId}
          size="sm"
          showLastSeen={false}
        />
      ))}

      {remainingCount > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          +{remainingCount} more
        </button>
      )}

      {showAll && userIds.length > maxDisplay && (
        <button
          onClick={() => setShowAll(false)}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}

interface ActivityIndicatorProps {
  userId: string;
  activity: 'typing' | 'online' | 'away' | 'busy';
  className?: string;
}

export function ActivityIndicator({
  userId,
  activity,
  className = '',
}: ActivityIndicatorProps) {
  const getActivityConfig = () => {
    switch (activity) {
      case 'typing':
        return {
          color: 'bg-blue-500',
          text: 'typing...',
          animate: true,
        };
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'online',
          animate: false,
        };
      case 'away':
        return {
          color: 'bg-yellow-500',
          text: 'away',
          animate: false,
        };
      case 'busy':
        return {
          color: 'bg-red-500',
          text: 'busy',
          animate: false,
        };
      default:
        return {
          color: 'bg-gray-400',
          text: 'offline',
          animate: false,
        };
    }
  };

  const config = getActivityConfig();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${config.color}`} />
        {config.animate && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${config.color} animate-pulse`} />
        )}
      </div>
      <span className="text-sm text-gray-600">{config.text}</span>
    </div>
  );
}