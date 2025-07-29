import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatWindow, ChatRoomList, MessageSearch, FileUpload } from '../../components/chat';
import { LoadingSpinner, EmptyState } from '../../components/ui';
import { useChatStore } from '../../store/chatStore';
import { useUserStatusStore } from '../../store/userStatusStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/Toast';
import type { ChatRoom, Message } from '../../types';

export function ChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();
  
  const { 
    currentChatRoom, 
    getChatRoom, 
    createChatRoom,
    isLoading, 
    error,
    sendMessage,
    clearError 
  } = useChatStore();
  
  const { connect } = useUserStatusStore();

  const [showSearch, setShowSearch] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Connect user status on mount
  useEffect(() => {
    if (user?.id) {
      connect(user.id);
    }
  }, [user?.id, connect]);

  // Load chat room if roomId is provided
  useEffect(() => {
    if (roomId) {
      getChatRoom(roomId);
    }
  }, [roomId, getChatRoom]);

  const handleChatSelect = (chatRoom: ChatRoom) => {
    navigate(`/chat/${chatRoom.id}`);
  };

  const handleBack = () => {
    if (isMobile) {
      navigate('/chat');
    } else {
      navigate('/dashboard');
    }
  };

  const handleUserProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleFileUpload = async (url: string, type: string, size: number, fileName: string) => {
    if (!currentChatRoom?.id || !user?.id) return;

    try {
      await sendMessage(currentChatRoom.id, fileName, type, url);
      setShowFileUpload(false);
      showToast('File sent successfully', 'success');
    } catch (error) {
      showToast('Failed to send file', 'error');
    }
  };

  const handleMessageSelect = (message: Message) => {
    setShowSearch(false);
    // TODO: Scroll to message in chat window
    showToast('Message found', 'info');
  };

  // Error state
  if (error && !currentChatRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Failed to load chat</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <div className="space-x-3">
            <button
              onClick={clearError}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !currentChatRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Mobile layout - show only chat room list or chat window
  if (isMobile) {
    if (currentChatRoom) {
      return (
        <div className="min-h-screen bg-white">
          <ChatWindow
            chatRoom={currentChatRoom}
            onBack={handleBack}
            onUserProfile={handleUserProfile}
            className="h-screen"
          />

          {/* Search overlay */}
          {showSearch && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <MessageSearch
                chatRoomId={currentChatRoom.id}
                onClose={() => setShowSearch(false)}
                onMessageSelect={handleMessageSelect}
                className="w-full max-w-md max-h-96"
              />
            </div>
          )}

          {/* File upload overlay */}
          {showFileUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <FileUpload
                chatRoomId={currentChatRoom.id}
                onFileUpload={handleFileUpload}
                onCancel={() => setShowFileUpload(false)}
                className="w-full max-w-md"
              />
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <ChatRoomList
            onChatSelect={handleChatSelect}
            showActiveOnly={false}
          />
        </div>
      );
    }
  }

  // Desktop layout - side by side
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Chat list sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Back to dashboard"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ChatRoomList
            onChatSelect={handleChatSelect}
            showActiveOnly={false}
            className="p-4"
          />
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {currentChatRoom ? (
          <>
            <ChatWindow
              chatRoom={currentChatRoom}
              onUserProfile={handleUserProfile}
              className="flex-1"
            />

            {/* Search panel */}
            {showSearch && (
              <div className="absolute top-16 right-4 w-96 z-40">
                <MessageSearch
                  chatRoomId={currentChatRoom.id}
                  onClose={() => setShowSearch(false)}
                  onMessageSelect={handleMessageSelect}
                />
              </div>
            )}

            {/* File upload panel */}
            {showFileUpload && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 z-40">
                <FileUpload
                  chatRoomId={currentChatRoom.id}
                  onFileUpload={handleFileUpload}
                  onCancel={() => setShowFileUpload(false)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="Select a conversation"
              description="Choose a chat from the sidebar to start messaging, or create a new trip to find travel companions."
            />
          </div>
        )}
      </div>

      {/* Floating action buttons */}
      {currentChatRoom && (
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            title="Search messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            title="Upload file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 008.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
      )}

      {/* Overlay backgrounds */}
      {(showSearch || showFileUpload) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-30"
          onClick={() => {
            setShowSearch(false);
            setShowFileUpload(false);
          }}
        />
      )}
    </div>
  );
}