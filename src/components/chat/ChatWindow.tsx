import { useState, useEffect, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator, QuickTypingDots } from './TypingIndicator';
import { LoadingSpinner, EmptyState } from '../ui';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../ui/Toast';
import type { ChatRoom } from '../../types';

interface ChatWindowProps {
  chatRoom: ChatRoom;
  onBack?: () => void;
  onUserProfile?: (userId: string) => void;
  className?: string;
}

export function ChatWindow({
  chatRoom,
  onBack,
  onUserProfile,
  className = '',
}: ChatWindowProps) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const {
    messages,
    messagePagination,
    typingUsers,
    isLoadingMessages,
    error,
    getChatMessages,
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    subscribeToRoomMessages,
    subscribeToTypingStatus,
    unsubscribeFromRoom,
    clearError,
  } = useChatStore();

  const roomMessages = messages[chatRoom.id] || [];
  const roomTypingUsers = typingUsers[chatRoom.id] || [];
  const pagination = messagePagination[chatRoom.id];

  // Load messages on mount
  useEffect(() => {
    getChatMessages(chatRoom.id);
  }, [chatRoom.id, getChatMessages]);

  // Set up real-time subscriptions
  useEffect(() => {
    const unsubscribeMessages = subscribeToRoomMessages(chatRoom.id);
    const unsubscribeTyping = subscribeToTypingStatus(chatRoom.id);

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [chatRoom.id, subscribeToRoomMessages, subscribeToTypingStatus]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromRoom(chatRoom.id);
    };
  }, [chatRoom.id, unsubscribeFromRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomMessages.length, roomTypingUsers.length, shouldAutoScroll]);

  // Mark messages as read when they become visible
  useEffect(() => {
    if (user?.id && roomMessages.length > 0) {
      markMessagesAsRead(chatRoom.id, user.id);
    }
  }, [chatRoom.id, user?.id, roomMessages.length, markMessagesAsRead]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShouldAutoScroll(isAtBottom);
    setShowScrollToBottom(!isAtBottom && roomMessages.length > 0);
  };

  const scrollToBottom = () => {
    setShouldAutoScroll(true);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoadMore = async () => {
    if (pagination?.hasMore && !isLoadingMessages) {
      const prevScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
      
      await getChatMessages(chatRoom.id, true);
      
      // Maintain scroll position after loading more messages
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight;
        }
      }, 100);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
      showToast('Message edited', 'success');
    } catch (error) {
      showToast('Failed to edit message', 'error');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId);
        showToast('Message deleted', 'success');
      } catch (error) {
        showToast('Failed to delete message', 'error');
      }
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    // TODO: Implement message retry logic
    console.log('Retry message:', messageId);
  };

  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <ChatHeader 
          chatRoom={chatRoom}
          currentUserId={user?.id || ''}
          onBack={onBack}
          onUserProfile={onUserProfile}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-lg font-medium">Failed to load chat</p>
              <p className="text-sm text-gray-600 mt-1">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Chat Header */}
      <ChatHeader 
        chatRoom={chatRoom}
        currentUserId={user?.id || ''}
        onBack={onBack}
        onUserProfile={onUserProfile}
      />

      {/* Messages Area */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4 scroll-smooth"
        >
          {/* Load more button */}
          {pagination?.hasMore && (
            <div className="flex justify-center mb-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMessages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isLoadingMessages ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  'Load more messages'
                )}
              </button>
            </div>
          )}

          {/* Initial loading state */}
          {isLoadingMessages && roomMessages.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 mt-4">Loading messages...</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoadingMessages && roomMessages.length === 0 && (
            <div className="flex justify-center items-center h-full">
              <EmptyState
                icon={
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
                title="No messages yet"
                description="Start the conversation by sending a message!"
              />
            </div>
          )}

          {/* Messages */}
          {roomMessages.map((message, index) => {
            const prevMessage = roomMessages[index - 1];
            const showTimestamp = !prevMessage || 
              new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 5 * 60 * 1000; // 5 minutes

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
                showTimestamp={showTimestamp}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onRetry={handleRetryMessage}
              />
            );
          })}

          {/* Typing indicators */}
          {roomTypingUsers.length > 0 && (
            <QuickTypingDots />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Typing indicator bar */}
      {roomTypingUsers.length > 0 && (
        <TypingIndicator typingUsers={roomTypingUsers} />
      )}

      {/* Message Input */}
      <MessageInput 
        chatRoomId={chatRoom.id}
        disabled={!chatRoom.is_active}
        placeholder={chatRoom.is_active ? "Type a message..." : "This chat is no longer active"}
      />
    </div>
  );
}