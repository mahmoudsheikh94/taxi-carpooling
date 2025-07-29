import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatRoomList, UserStatus, ConnectionStatus } from '../../components/chat';
import { Button, Badge, LoadingSpinner } from '../../components/ui';
import { useChatStore } from '../../store/chatStore';
import { useUserStatusStore } from '../../store/userStatusStore';
import { useAuthStore } from '../../store/authStore';
import type { ChatRoom } from '../../types';

export function ChatListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    chatRooms, 
    totalUnreadCount, 
    isLoading,
    error,
    getChatRooms,
    clearError 
  } = useChatStore();
  
  const { connect, disconnect } = useUserStatusStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'active'>('all');

  // Connect user status on mount
  useEffect(() => {
    if (user?.id) {
      connect(user.id);
      return () => {
        disconnect(user.id);
      };
    }
  }, [user?.id, connect, disconnect]);

  // Load chat rooms
  useEffect(() => {
    if (user?.id) {
      getChatRooms(user.id);
    }
  }, [user?.id, getChatRooms]);

  const handleChatSelect = (chatRoom: ChatRoom) => {
    navigate(`/chat/${chatRoom.id}`);
  };

  const handleCreateChat = () => {
    navigate('/trips/create');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const getFilteredChatRooms = () => {
    switch (activeFilter) {
      case 'unread':
        return chatRooms.filter(room => {
          // This would need to be implemented with unread count logic
          return room.message_count > 0; // Placeholder
        });
      case 'active':
        return chatRooms.filter(room => room.is_active);
      default:
        return chatRooms;
    }
  };

  const filteredChatRooms = getFilteredChatRooms();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Failed to load chats</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <div className="space-x-3">
            <Button onClick={clearError}>
              Try Again
            </Button>
            <Button onClick={handleBackToDashboard} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection Status */}
      <ConnectionStatus />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Back to dashboard"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>Messages</span>
                  {totalUnreadCount > 0 && (
                    <Badge color="red" size="sm">
                      {totalUnreadCount}
                    </Badge>
                  )}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Stay connected with your travel companions
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* User status indicator */}
              {user?.id && (
                <UserStatus userId={user.id} showStatusText={false} />
              )}

              <Button onClick={handleCreateChat} className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Trip</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-1 bg-white rounded-lg p-1">
          {[
            { key: 'all', label: 'All Chats', count: chatRooms.length },
            { key: 'unread', label: 'Unread', count: totalUnreadCount },
            { key: 'active', label: 'Active', count: chatRooms.filter(r => r.is_active).length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <Badge 
                  color={activeFilter === key ? 'blue' : 'gray'} 
                  size="sm"
                >
                  {count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {isLoading && chatRooms.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600 mt-4">Loading your conversations...</p>
            </div>
          </div>
        ) : (
          <ChatRoomList
            onChatSelect={handleChatSelect}
            showActiveOnly={activeFilter === 'active'}
          />
        )}
      </div>

      {/* Stats footer */}
      {!isLoading && chatRooms.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{chatRooms.length} total conversations</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{chatRooms.filter(r => r.is_active).length} active chats</span>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions floating button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleCreateChat}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          title="Create new trip"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}