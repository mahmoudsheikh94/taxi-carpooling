import { useState } from 'react';
import { Button, Badge } from '../ui';
import { useUserOnlineStatus } from '../../store/userStatusStore';
import type { ChatRoom } from '../../types';

interface ChatHeaderProps {
  chatRoom: ChatRoom;
  currentUserId: string;
  onBack?: () => void;
  onUserProfile?: (userId: string) => void;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
  onMoreOptions?: () => void;
  className?: string;
}

export function ChatHeader({
  chatRoom,
  currentUserId,
  onBack,
  onUserProfile,
  onVideoCall,
  onVoiceCall,
  onMoreOptions,
  className = '',
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  // Get the other user in the chat
  const otherUser = chatRoom.user1_id === currentUserId ? chatRoom.user2 : chatRoom.user1;
  const { isOnline, lastSeenText } = useUserOnlineStatus(otherUser?.id || '');

  const handleUserClick = () => {
    if (otherUser?.id) {
      onUserProfile?.(otherUser.id);
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Back button and user info */}
        <div className="flex items-center space-x-3">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors md:hidden"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* User avatar and info */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {otherUser?.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              
              {/* Online status indicator */}
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            <button
              onClick={handleUserClick}
              className="text-left hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
            >
              <div className="font-medium text-gray-900">
                {otherUser?.name || 'Unknown User'}
              </div>
              <div className="text-sm text-gray-500">
                {isOnline ? 'Online' : lastSeenText}
              </div>
            </button>
          </div>

          {/* Trip context badge */}
          {chatRoom.trip_id && (
            <Badge color="blue" variant="outline" size="sm">
              Trip Chat
            </Badge>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Voice call button */}
          {onVoiceCall && (
            <button
              onClick={onVoiceCall}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Voice call"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}

          {/* Video call button */}
          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Video call"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="More options"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => {
                    handleUserClick();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  View Profile
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement search
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Search Messages
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement mute
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Mute Notifications
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={() => {
                    // TODO: Implement block
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Block User
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement report
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Report User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}