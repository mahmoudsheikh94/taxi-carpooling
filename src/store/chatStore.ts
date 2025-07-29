import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chatService, typingStatusService } from '../services/supabase';
import type { ChatRoom, Message, TypingStatus } from '../types';
import type { ChatFilters, MessageFilters } from '../services/supabase/chat';

interface ChatState {
  // Chat rooms data
  chatRooms: ChatRoom[];
  currentChatRoom: ChatRoom | null;
  
  // Messages data
  messages: Record<string, Message[]>; // roomId -> messages
  messagePagination: Record<string, { hasMore: boolean; offset: number }>;
  
  // Typing indicators
  typingUsers: Record<string, TypingStatus[]>; // roomId -> typing users
  
  // UI state
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  error: string | null;
  
  // Filters and search
  chatFilters: ChatFilters;
  messageFilters: Record<string, MessageFilters>; // roomId -> filters
  searchQuery: string;
  
  // Real-time subscriptions
  subscriptions: Record<string, any>; // roomId -> subscription
  typingSubscriptions: Record<string, any>; // roomId -> typing subscription
  
  // Unread counts
  unreadCounts: Record<string, number>; // roomId -> unread count
  totalUnreadCount: number;
}

interface ChatActions {
  // Chat room operations
  getChatRooms: (userId: string) => Promise<void>;
  getChatRoom: (roomId: string) => Promise<void>;
  getChatRoomByMatch: (matchId: string) => Promise<string | null>;
  createChatRoom: (user1Id: string, user2Id: string, matchId?: string, tripId?: string) => Promise<string | null>;
  setCurrentChatRoom: (chatRoom: ChatRoom | null) => void;
  
  // Message operations
  getChatMessages: (roomId: string, loadMore?: boolean) => Promise<void>;
  sendMessage: (roomId: string, content: string, messageType?: string, attachmentUrl?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markMessagesAsRead: (roomId: string, userId: string) => Promise<void>;
  
  // Typing status
  setTypingStatus: (roomId: string, userId: string, isTyping: boolean) => Promise<void>;
  clearTypingStatus: (roomId: string, userId: string) => void;
  
  // Real-time subscriptions
  subscribeToRoomMessages: (roomId: string) => () => void;
  subscribeToTypingStatus: (roomId: string) => () => void;
  unsubscribeFromRoom: (roomId: string) => void;
  unsubscribeAll: () => void;
  
  // Search and filters
  setSearchQuery: (query: string) => void;
  setChatFilters: (filters: ChatFilters) => void;
  setMessageFilters: (roomId: string, filters: MessageFilters) => void;
  searchMessages: (roomId: string, query: string) => Promise<void>;
  
  // UI state management
  setError: (error: string | null) => void;
  clearError: () => void;
  addOptimisticMessage: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (roomId: string, messageId: string) => void;
  updateChatRoom: (chatRoom: ChatRoom) => void;
  addChatRoom: (chatRoom: ChatRoom) => void;
  
  // Utility methods
  getOtherUser: (chatRoom: ChatRoom, currentUserId: string) => any;
  getUnreadCount: (roomId: string) => number;
  refreshUnreadCounts: (userId: string) => Promise<void>;
  reset: () => void;
}

type ChatStore = ChatState & ChatActions;

const initialState: ChatState = {
  chatRooms: [],
  currentChatRoom: null,
  messages: {},
  messagePagination: {},
  typingUsers: {},
  isLoading: false,
  isLoadingMessages: false,
  isSending: false,
  error: null,
  chatFilters: {},
  messageFilters: {},
  searchQuery: '',
  subscriptions: {},
  typingSubscriptions: {},
  unreadCounts: {},
  totalUnreadCount: 0,
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Chat room operations
      getChatRooms: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { chatRooms, error } = await chatService.getUserChatRooms(
            userId,
            20,
            0,
            get().chatFilters
          );
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ chatRooms, isLoading: false, error: null });
          
          // Refresh unread counts
          await get().refreshUnreadCounts(userId);
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get chat rooms';
          set({ error, isLoading: false });
        }
      },

      getChatRoom: async (roomId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { chatRoom, error } = await chatService.getChatRoom(roomId);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ currentChatRoom: chatRoom, isLoading: false, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get chat room';
          set({ error, isLoading: false });
        }
      },

      getChatRoomByMatch: async (matchId: string) => {
        try {
          const { chatRooms, error } = await chatService.getChatRooms();
          
          if (error) {
            console.error('Error fetching chat rooms:', error);
            return null;
          }
          
          // Find chat room associated with this match
          const matchedRoom = chatRooms?.find(room => room.match_id === matchId);
          return matchedRoom?.id || null;
        } catch (err) {
          console.error('Error finding chat room by match:', err);
          return null;
        }
      },

      createChatRoom: async (user1Id: string, user2Id: string, matchId?: string, tripId?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { chatRoom, error } = await chatService.findOrCreateChatRoom(
            user1Id,
            user2Id,
            matchId,
            tripId
          );
          
          if (error) {
            set({ error, isLoading: false });
            return null;
          }
          
          if (chatRoom) {
            set((state) => ({
              chatRooms: [chatRoom, ...state.chatRooms.filter(r => r.id !== chatRoom.id)],
              currentChatRoom: chatRoom,
              isLoading: false,
              error: null,
            }));
            
            return chatRoom.id;
          }
          
          return null;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to create chat room';
          set({ error, isLoading: false });
          return null;
        }
      },

      setCurrentChatRoom: (chatRoom: ChatRoom | null) => {
        set({ currentChatRoom: chatRoom });
      },

      // Message operations
      getChatMessages: async (roomId: string, loadMore = false) => {
        set({ isLoadingMessages: true, error: null });
        
        try {
          const state = get();
          const currentPagination = state.messagePagination[roomId] || { hasMore: true, offset: 0 };
          const offset = loadMore ? currentPagination.offset : 0;
          
          const { messages, error, count } = await chatService.getChatMessages(
            roomId,
            50,
            offset,
            state.messageFilters[roomId] || {}
          );
          
          if (error) {
            set({ error, isLoadingMessages: false });
            return;
          }
          
          const hasMore = count ? offset + messages.length < count : messages.length === 50;
          
          set((state) => ({
            messages: {
              ...state.messages,
              [roomId]: loadMore 
                ? [...(state.messages[roomId] || []), ...messages]
                : messages,
            },
            messagePagination: {
              ...state.messagePagination,
              [roomId]: {
                hasMore,
                offset: offset + messages.length,
              },
            },
            isLoadingMessages: false,
            error: null,
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get messages';
          set({ error, isLoadingMessages: false });
        }
      },

      sendMessage: async (roomId: string, content: string, messageType = 'text', attachmentUrl?: string) => {
        set({ isSending: true, error: null });
        
        try {
          const { message, error } = await chatService.sendMessage({
            chat_room_id: roomId,
            sender_id: '', // This should be filled by the calling component
            content,
            message_type: messageType as any,
            attachment_url: attachmentUrl,
          });
          
          if (error) {
            set({ error, isSending: false });
            return;
          }
          
          // Message will be added via real-time subscription
          set({ isSending: false, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to send message';
          set({ error, isSending: false });
        }
      },

      editMessage: async (messageId: string, newContent: string) => {
        try {
          const { message, error } = await chatService.editMessage(messageId, newContent);
          
          if (error || !message) {
            set({ error: error || 'Failed to edit message' });
            return;
          }
          
          // Update message in local state
          const roomId = message.chat_room_id;
          get().updateMessage(roomId, messageId, message);
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to edit message';
          set({ error });
        }
      },

      deleteMessage: async (messageId: string) => {
        try {
          const { success, error } = await chatService.deleteMessage(messageId);
          
          if (!success) {
            set({ error: error || 'Failed to delete message' });
            return;
          }
          
          // Message will be removed via real-time subscription
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to delete message';
          set({ error });
        }
      },

      markMessagesAsRead: async (roomId: string, userId: string) => {
        try {
          const { success, error } = await chatService.markMessagesAsRead(roomId, userId);
          
          if (success) {
            // Update local unread count
            set((state) => ({
              unreadCounts: {
                ...state.unreadCounts,
                [roomId]: 0,
              },
              totalUnreadCount: Math.max(0, state.totalUnreadCount - (state.unreadCounts[roomId] || 0)),
            }));
          } else {
            console.warn('Failed to mark messages as read:', error);
          }
        } catch (err) {
          console.warn('Failed to mark messages as read:', err);
        }
      },

      // Typing status
      setTypingStatus: async (roomId: string, userId: string, isTyping: boolean) => {
        try {
          await typingStatusService.setTypingStatus(roomId, userId, isTyping);
        } catch (err) {
          console.warn('Failed to set typing status:', err);
        }
      },

      clearTypingStatus: (roomId: string, userId: string) => {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [roomId]: (state.typingUsers[roomId] || []).filter(u => u.user_id !== userId),
          },
        }));
      },

      // Real-time subscriptions
      subscribeToRoomMessages: (roomId: string) => {
        const existingSubscription = get().subscriptions[roomId];
        if (existingSubscription) {
          return () => {}; // Already subscribed
        }
        
        const subscription = chatService.subscribeToRoomMessages(
          roomId,
          (message) => {
            set((state) => ({
              messages: {
                ...state.messages,
                [roomId]: [...(state.messages[roomId] || []), message],
              },
            }));
          },
          (message) => {
            get().updateMessage(roomId, message.id, message);
          },
          (messageId) => {
            get().removeMessage(roomId, messageId);
          }
        );
        
        set((state) => ({
          subscriptions: {
            ...state.subscriptions,
            [roomId]: subscription,
          },
        }));
        
        return () => {
          subscription.unsubscribe();
          set((state) => {
            const { [roomId]: removed, ...rest } = state.subscriptions;
            return { subscriptions: rest };
          });
        };
      },

      subscribeToTypingStatus: (roomId: string) => {
        const existingSubscription = get().typingSubscriptions[roomId];
        if (existingSubscription) {
          return () => {}; // Already subscribed
        }
        
        const subscription = typingStatusService.subscribeToTypingStatus(roomId, (status) => {
          set((state) => {
            const currentTyping = state.typingUsers[roomId] || [];
            
            if (status.is_typing) {
              // Add or update typing user
              const filtered = currentTyping.filter(u => u.user_id !== status.user_id);
              return {
                typingUsers: {
                  ...state.typingUsers,
                  [roomId]: [...filtered, status],
                },
              };
            } else {
              // Remove typing user
              return {
                typingUsers: {
                  ...state.typingUsers,
                  [roomId]: currentTyping.filter(u => u.user_id !== status.user_id),
                },
              };
            }
          });
        });
        
        set((state) => ({
          typingSubscriptions: {
            ...state.typingSubscriptions,
            [roomId]: subscription,
          },
        }));
        
        return () => {
          subscription.unsubscribe();
          set((state) => {
            const { [roomId]: removed, ...rest } = state.typingSubscriptions;
            return { typingSubscriptions: rest };
          });
        };
      },

      unsubscribeFromRoom: (roomId: string) => {
        const state = get();
        
        // Unsubscribe from messages
        const messageSubscription = state.subscriptions[roomId];
        if (messageSubscription) {
          messageSubscription.unsubscribe();
        }
        
        // Unsubscribe from typing
        const typingSubscription = state.typingSubscriptions[roomId];
        if (typingSubscription) {
          typingSubscription.unsubscribe();
        }
        
        set((state) => {
          const { [roomId]: removedSub, ...restSubs } = state.subscriptions;
          const { [roomId]: removedTyping, ...restTyping } = state.typingSubscriptions;
          
          return {
            subscriptions: restSubs,
            typingSubscriptions: restTyping,
          };
        });
      },

      unsubscribeAll: () => {
        const state = get();
        
        // Unsubscribe from all message subscriptions
        Object.values(state.subscriptions).forEach((subscription: any) => {
          subscription?.unsubscribe();
        });
        
        // Unsubscribe from all typing subscriptions
        Object.values(state.typingSubscriptions).forEach((subscription: any) => {
          subscription?.unsubscribe();
        });
        
        set({
          subscriptions: {},
          typingSubscriptions: {},
        });
      },

      // Search and filters
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setChatFilters: (filters: ChatFilters) => {
        set({ chatFilters: filters });
      },

      setMessageFilters: (roomId: string, filters: MessageFilters) => {
        set((state) => ({
          messageFilters: {
            ...state.messageFilters,
            [roomId]: filters,
          },
        }));
      },

      searchMessages: async (roomId: string, query: string) => {
        try {
          const { messages, error } = await chatService.getChatMessages(
            roomId,
            50,
            0,
            { searchQuery: query }
          );
          
          if (error) {
            set({ error });
            return;
          }
          
          // Update messages with search results
          set((state) => ({
            messages: {
              ...state.messages,
              [`${roomId}_search`]: messages,
            },
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to search messages';
          set({ error });
        }
      },

      // UI state management
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      addOptimisticMessage: (roomId: string, message: Message) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: [...(state.messages[roomId] || []), message],
          },
        }));
      },

      updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          },
        }));
      },

      removeMessage: (roomId: string, messageId: string) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: (state.messages[roomId] || []).filter(msg => msg.id !== messageId),
          },
        }));
      },

      updateChatRoom: (chatRoom: ChatRoom) => {
        set((state) => ({
          chatRooms: state.chatRooms.map(room =>
            room.id === chatRoom.id ? chatRoom : room
          ),
          currentChatRoom: state.currentChatRoom?.id === chatRoom.id ? chatRoom : state.currentChatRoom,
        }));
      },

      addChatRoom: (chatRoom: ChatRoom) => {
        set((state) => ({
          chatRooms: [chatRoom, ...state.chatRooms.filter(r => r.id !== chatRoom.id)],
        }));
      },

      // Utility methods
      getOtherUser: (chatRoom: ChatRoom, currentUserId: string) => {
        return chatRoom.user1_id === currentUserId ? chatRoom.user2 : chatRoom.user1;
      },

      getUnreadCount: (roomId: string) => {
        return get().unreadCounts[roomId] || 0;
      },

      refreshUnreadCounts: async (userId: string) => {
        try {
          const state = get();
          const unreadCounts: Record<string, number> = {};
          let totalUnread = 0;
          
          for (const room of state.chatRooms) {
            const count = await chatService.getUnreadMessageCount(room.id, userId);
            unreadCounts[room.id] = count;
            totalUnread += count;
          }
          
          set({ unreadCounts, totalUnreadCount: totalUnread });
        } catch (err) {
          console.warn('Failed to refresh unread counts:', err);
        }
      },

      reset: () => {
        get().unsubscribeAll();
        set(initialState);
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        // Only persist chat rooms and unread counts
        chatRooms: state.chatRooms,
        unreadCounts: state.unreadCounts,
        totalUnreadCount: state.totalUnreadCount,
        chatFilters: state.chatFilters,
      }),
    }
  )
);