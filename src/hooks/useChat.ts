import { useEffect, useCallback, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useUserStatusStore } from '../store/userStatusStore';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../components/ui/Toast';

export interface UseChatOptions {
  autoConnect?: boolean;
  enableTypingIndicators?: boolean;
  enableNotifications?: boolean;
  maxRetries?: number;
}

export function useChat(options: UseChatOptions = {}) {
  const {
    autoConnect = true,
    enableTypingIndicators = true,
    enableNotifications = true,
    maxRetries = 3,
  } = options;

  const { user } = useAuthStore();
  const { showToast } = useToast();
  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    chatRooms,
    currentChatRoom,
    messages,
    isLoading,
    error,
    totalUnreadCount,
    getChatRooms,
    createChatRoom,
    subscribeToRoomMessages,
    subscribeToTypingStatus,
    unsubscribeAll,
    reset: resetChat,
  } = useChatStore();

  const {
    isConnected,
    connect,
    disconnect,
    reset: resetUserStatus,
  } = useUserStatusStore();

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && user?.id && !isConnected) {
      handleConnect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, user?.id, isConnected]);

  // Load chat rooms when connected
  useEffect(() => {
    if (isConnected && user?.id) {
      getChatRooms(user.id);
    }
  }, [isConnected, user?.id, getChatRooms]);

  // Handle connection errors with retry logic
  useEffect(() => {
    if (error && retryCountRef.current < maxRetries) {
      const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (user?.id) {
          retryCountRef.current += 1;
          handleConnect();
        }
      }, delay);
    } else if (error && retryCountRef.current >= maxRetries) {
      if (enableNotifications) {
        showToast('Unable to connect to chat service. Please check your connection.', 'error');
      }
    }
  }, [error, maxRetries, user?.id, enableNotifications, showToast]);

  // Reset retry count on successful connection
  useEffect(() => {
    if (isConnected && !error) {
      retryCountRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }
  }, [isConnected, error]);

  const handleConnect = useCallback(async () => {
    if (!user?.id) return;

    try {
      await connect(user.id);
    } catch (err) {
      console.error('Failed to connect to chat service:', err);
    }
  }, [user?.id, connect]);

  const handleDisconnect = useCallback(async () => {
    if (!user?.id) return;

    try {
      await disconnect(user.id);
    } catch (err) {
      console.error('Failed to disconnect from chat service:', err);
    }
  }, [user?.id, disconnect]);

  const handleCreateChat = useCallback(async (
    otherUserId: string,
    matchId?: string,
    tripId?: string
  ) => {
    if (!user?.id) return null;

    try {
      const chatRoomId = await createChatRoom(user.id, otherUserId, matchId, tripId);
      
      if (chatRoomId && enableNotifications) {
        showToast('Chat room created', 'success');
      }
      
      return chatRoomId;
    } catch (err) {
      if (enableNotifications) {
        showToast('Failed to create chat room', 'error');
      }
      throw err;
    }
  }, [user?.id, createChatRoom, enableNotifications, showToast]);

  const subscribeToChat = useCallback((roomId: string) => {
    const unsubscribeMessages = subscribeToRoomMessages(roomId);
    const unsubscribeTyping = enableTypingIndicators 
      ? subscribeToTypingStatus(roomId) 
      : () => {};

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [subscribeToRoomMessages, subscribeToTypingStatus, enableTypingIndicators]);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    unsubscribeAll();
    resetChat();
    resetUserStatus();
  }, [unsubscribeAll, resetChat, resetUserStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // State
    chatRooms,
    currentChatRoom,
    messages,
    isLoading,
    error,
    isConnected,
    totalUnreadCount,
    
    // Actions
    connect: handleConnect,
    disconnect: handleDisconnect,
    createChat: handleCreateChat,
    subscribeToChat,
    cleanup,
    
    // Computed
    isOnline: isConnected && !error,
    hasUnreadMessages: totalUnreadCount > 0,
    retryCount: retryCountRef.current,
  };
}

// Hook for managing a specific chat room
export function useChatRoom(roomId: string | null) {
  const { subscribeToChat } = useChat({ autoConnect: false });
  const { 
    currentChatRoom, 
    messages, 
    getChatRoom, 
    getChatMessages,
    markMessagesAsRead 
  } = useChatStore();
  const { user } = useAuthStore();

  const roomMessages = roomId ? messages[roomId] || [] : [];

  // Load chat room and messages
  useEffect(() => {
    if (roomId) {
      getChatRoom(roomId);
      getChatMessages(roomId);
    }
  }, [roomId, getChatRoom, getChatMessages]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (roomId) {
      const unsubscribe = subscribeToChat(roomId);
      return unsubscribe;
    }
  }, [roomId, subscribeToChat]);

  // Mark messages as read when room is active
  useEffect(() => {
    if (roomId && user?.id && roomMessages.length > 0) {
      markMessagesAsRead(roomId, user.id);
    }
  }, [roomId, user?.id, roomMessages.length, markMessagesAsRead]);

  return {
    chatRoom: currentChatRoom,
    messages: roomMessages,
    isActive: !!roomId && !!currentChatRoom,
  };
}