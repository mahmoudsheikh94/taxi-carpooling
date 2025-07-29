import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, Badge, LoadingSpinner, EmptyState } from '../ui';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useUserOnlineStatus } from '../../store/userStatusStore';
import type { ChatRoom } from '../../types';

interface ChatRoomListProps {
  onChatSelect?: (chatRoom: ChatRoom) => void;
  onChatCreate?: (userId: string) => void;
  showActiveOnly?: boolean;
  className?: string;
}

export function ChatRoomList({
  onChatSelect,
  onChatCreate,
  showActiveOnly = false,
  className = '',
}: ChatRoomListProps) {
  const { user } = useAuthStore();
  const {
    chatRooms,
    isLoading,
    error,
    totalUnreadCount,
    getChatRooms,
    getUnreadCount,
    clearError,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');

  // Load chat rooms on mount
  useEffect(() => {
    if (user?.id) {
      getChatRooms(user.id);
    }
  }, [user?.id, getChatRooms]);

  // Filter chat rooms based on search and active status
  const filteredChatRooms = chatRooms.filter(room => {
    if (showActiveOnly && !room.is_active) return false;
    
    if (searchQuery) {
      const otherUser = room.user1_id === user?.id ? room.user2 : room.user1;
      const userName = otherUser?.name?.toLowerCase() || '';
      const lastMessage = room.latest_message?.content?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      return userName.includes(query) || lastMessage.includes(query);
    }
    
    return true;
  });

  const handleChatClick = (chatRoom: ChatRoom) => {
    onChatSelect?.(chatRoom);
  };

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Failed to load chats</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Messages
            {totalUnreadCount > 0 && (
              <Badge color="red" size="sm" className="ml-2">
                {totalUnreadCount}
              </Badge>
            )}
          </h2>
        </div>

        {/* Search bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search chats..."
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && chatRooms.length === 0 && (
        <Card className="p-8">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Loading your chats...</p>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && filteredChatRooms.length === 0 && (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          title={searchQuery ? 'No chats found' : 'No messages yet'}
          description={
            searchQuery 
              ? `No chats match "${searchQuery}". Try a different search term.`
              : 'Start a conversation by accepting a trip match or creating a new trip!'
          }
          action={
            searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            ) : undefined
          }
        />
      )}

      {/* Chat rooms list */}
      {filteredChatRooms.length > 0 && (
        <div className="space-y-2">
          {filteredChatRooms.map((chatRoom) => (
            <ChatRoomCard
              key={chatRoom.id}
              chatRoom={chatRoom}
              currentUserId={user?.id || ''}
              unreadCount={getUnreadCount(chatRoom.id)}
              onClick={() => handleChatClick(chatRoom)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ChatRoomCardProps {
  chatRoom: ChatRoom;
  currentUserId: string;
  unreadCount: number;
  onClick: () => void;
}

function ChatRoomCard({ chatRoom, currentUserId, unreadCount, onClick }: ChatRoomCardProps) {
  const otherUser = chatRoom.user1_id === currentUserId ? chatRoom.user2 : chatRoom.user1;
  const { isOnline, lastSeenText } = useUserOnlineStatus(otherUser?.id || '');
  const lastMessage = chatRoom.latest_message;

  const getLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';
    
    const isOwn = lastMessage.sender?.id === currentUserId;
    const prefix = isOwn ? 'You: ' : '';
    
    switch (lastMessage.message_type) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'file':
        return `${prefix}📄 File`;
      case 'location':
        return `${prefix}📍 Location`;
      case 'system':
        return lastMessage.content;
      default:
        return `${prefix}${lastMessage.content}`;
    }
  };

  const getLastMessageTime = () => {
    if (!lastMessage) return '';
    
    const messageDate = new Date(lastMessage.created_at);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(messageDate, { addSuffix: true });
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        {/* User avatar with online status */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
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
          
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* Chat info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {otherUser?.name || 'Unknown User'}
            </h3>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Badge color="red" size="sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              
              <span className="text-xs text-gray-500">
                {getLastMessageTime()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className={`text-sm truncate ${unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
              {getLastMessagePreview()}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {isOnline ? 'Online' : lastSeenText}
            </span>
            
            {chatRoom.trip_id && (
              <Badge color="blue" variant="outline" size="sm">
                Trip
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}