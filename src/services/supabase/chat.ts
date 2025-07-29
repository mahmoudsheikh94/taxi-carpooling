import { supabase, handleSupabaseError } from './client';
import type { ChatRoom, Message } from '../../types';

// Chat Room interfaces
export interface CreateChatRoomData {
  match_id?: string;
  trip_id?: string;
  user1_id: string;
  user2_id: string;
}

export interface ChatRoomResponse {
  chatRoom: ChatRoom | null;
  error: string | null;
}

export interface ChatRoomsResponse {
  chatRooms: ChatRoom[];
  error: string | null;
  count?: number;
}

// Message interfaces
export interface CreateMessageData {
  chat_room_id: string;
  sender_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'location' | 'system';
  attachment_url?: string;
  attachment_type?: string;
  attachment_size?: number;
}

export interface MessageResponse {
  message: Message | null;
  error: string | null;
}

export interface MessagesResponse {
  messages: Message[];
  error: string | null;
  count?: number;
}

export interface MessageStatusUpdate {
  message_id: string;
  delivered_at?: string;
  read_at?: string;
}

export interface ChatFilters {
  isActive?: boolean;
  hasUnread?: boolean;
  userId?: string;
}

export interface MessageFilters {
  messageType?: string;
  senderId?: string;
  beforeDate?: string;
  afterDate?: string;
  searchQuery?: string;
}

class ChatService {
  // Chat Room Operations
  async createChatRoom(data: CreateChatRoomData): Promise<ChatRoomResponse> {
    try {
      const { data: chatRoom, error } = await supabase
        .from('chat_rooms')
        .insert([{
          ...data,
          is_active: true,
          message_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(`
          *,
          user1:users!chat_rooms_user1_id_fkey(id, name, avatar, is_active),
          user2:users!chat_rooms_user2_id_fkey(id, name, avatar, is_active)
        `)
        .single();

      if (error) {
        return { chatRoom: null, error: handleSupabaseError(error) };
      }

      return { chatRoom, error: null };
    } catch (error) {
      return { chatRoom: null, error: 'Failed to create chat room' };
    }
  }

  async getChatRoom(roomId: string): Promise<ChatRoomResponse> {
    try {
      const { data: chatRoom, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          user1:users!chat_rooms_user1_id_fkey(id, name, avatar, is_active),
          user2:users!chat_rooms_user2_id_fkey(id, name, avatar, is_active),
          latest_message:messages(id, content, message_type, created_at, sender:users(id, name))
        `)
        .eq('id', roomId)
        .order('created_at', { referencedTable: 'messages', ascending: false })
        .limit(1, { referencedTable: 'messages' })
        .single();

      if (error) {
        return { chatRoom: null, error: handleSupabaseError(error) };
      }

      return { chatRoom, error: null };
    } catch (error) {
      return { chatRoom: null, error: 'Failed to get chat room' };
    }
  }

  async getUserChatRooms(
    userId: string,
    limit = 20,
    offset = 0,
    filters: ChatFilters = {}
  ): Promise<ChatRoomsResponse> {
    try {
      let query = supabase
        .from('chat_rooms')
        .select(`
          *,
          user1:users!chat_rooms_user1_id_fkey(id, name, avatar, is_active),
          user2:users!chat_rooms_user2_id_fkey(id, name, avatar, is_active),
          latest_message:messages(id, content, message_type, created_at, sender:users(id, name)),
          unread_count:messages(count)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { referencedTable: 'messages', ascending: false })
        .limit(1, { referencedTable: 'messages' })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      const { data: chatRooms, error, count } = await query;

      if (error) {
        return { chatRooms: [], error: handleSupabaseError(error) };
      }

      return { chatRooms: chatRooms || [], error: null, count: count || undefined };
    } catch (error) {
      return { chatRooms: [], error: 'Failed to get chat rooms' };
    }
  }

  async findOrCreateChatRoom(
    user1Id: string,
    user2Id: string,
    matchId?: string,
    tripId?: string
  ): Promise<ChatRoomResponse> {
    try {
      // First, try to find existing chat room
      const { data: existingRoom, error: findError } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          user1:users!chat_rooms_user1_id_fkey(id, name, avatar, is_active),
          user2:users!chat_rooms_user2_id_fkey(id, name, avatar, is_active)
        `)
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .eq('is_active', true)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        return { chatRoom: null, error: handleSupabaseError(findError) };
      }

      if (existingRoom) {
        return { chatRoom: existingRoom, error: null };
      }

      // Create new chat room if none exists
      return await this.createChatRoom({
        user1_id: user1Id,
        user2_id: user2Id,
        match_id: matchId,
        trip_id: tripId,
      });
    } catch (error) {
      return { chatRoom: null, error: 'Failed to find or create chat room' };
    }
  }

  async updateChatRoom(
    roomId: string,
    updates: Partial<ChatRoom>
  ): Promise<ChatRoomResponse> {
    try {
      const { data: chatRoom, error } = await supabase
        .from('chat_rooms')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId)
        .select(`
          *,
          user1:users!chat_rooms_user1_id_fkey(id, name, avatar, is_active),
          user2:users!chat_rooms_user2_id_fkey(id, name, avatar, is_active)
        `)
        .single();

      if (error) {
        return { chatRoom: null, error: handleSupabaseError(error) };
      }

      return { chatRoom, error: null };
    } catch (error) {
      return { chatRoom: null, error: 'Failed to update chat room' };
    }
  }

  // Message Operations
  async sendMessage(data: CreateMessageData): Promise<MessageResponse> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([{
          ...data,
          message_type: data.message_type || 'text',
          delivered_at: new Date().toISOString(),
          is_edited: false,
          created_at: new Date().toISOString(),
        }])
        .select(`
          *,
          sender:users(id, name, avatar)
        `)
        .single();

      if (error) {
        return { message: null, error: handleSupabaseError(error) };
      }

      // Update chat room's last message timestamp and message count
      await this.updateChatRoomStats(data.chat_room_id);

      return { message, error: null };
    } catch (error) {
      return { message: null, error: 'Failed to send message' };
    }
  }

  async getChatMessages(
    roomId: string,
    limit = 50,
    offset = 0,
    filters: MessageFilters = {}
  ): Promise<MessagesResponse> {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:users(id, name, avatar)
        `)
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters.messageType) {
        query = query.eq('message_type', filters.messageType);
      }
      if (filters.senderId) {
        query = query.eq('sender_id', filters.senderId);
      }
      if (filters.beforeDate) {
        query = query.lt('created_at', filters.beforeDate);
      }
      if (filters.afterDate) {
        query = query.gt('created_at', filters.afterDate);
      }
      if (filters.searchQuery) {
        query = query.ilike('content', `%${filters.searchQuery}%`);
      }

      const { data: messages, error, count } = await query;

      if (error) {
        return { messages: [], error: handleSupabaseError(error) };
      }

      // Reverse to get chronological order
      const reversedMessages = (messages || []).reverse();

      return { messages: reversedMessages, error: null, count: count || undefined };
    } catch (error) {
      return { messages: [], error: 'Failed to get messages' };
    }
  }

  async updateMessageStatus(
    messageId: string,
    status: MessageStatusUpdate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update(status)
        .eq('id', messageId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update message status' };
    }
  }

  async markMessagesAsRead(
    roomId: string,
    userId: string,
    beforeTimestamp?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let query = supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('chat_room_id', roomId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (beforeTimestamp) {
        query = query.lte('created_at', beforeTimestamp);
      }

      const { error } = await query;

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to mark messages as read' };
    }
  }

  async editMessage(
    messageId: string,
    newContent: string
  ): Promise<MessageResponse> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select(`
          *,
          sender:users(id, name, avatar)
        `)
        .single();

      if (error) {
        return { message: null, error: handleSupabaseError(error) };
      }

      return { message, error: null };
    } catch (error) {
      return { message: null, error: 'Failed to edit message' };
    }
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete message' };
    }
  }

  // Utility methods
  private async updateChatRoomStats(roomId: string): Promise<void> {
    try {
      const { data: messageCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('chat_room_id', roomId);

      await supabase
        .from('chat_rooms')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: messageCount?.length || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId);
    } catch (error) {
      // Silent fail for stats update
      console.warn('Failed to update chat room stats:', error);
    }
  }

  async getUnreadMessageCount(roomId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('chat_room_id', roomId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) {
        console.warn('Failed to get unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.warn('Failed to get unread count:', error);
      return 0;
    }
  }

  // Real-time subscriptions
  subscribeToRoomMessages(
    roomId: string,
    onMessage: (message: Message) => void,
    onUpdate: (message: Message) => void,
    onDelete: (messageId: string) => void
  ) {
    const channel = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        async (payload) => {
          // Fetch complete message with sender info
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(id, name, avatar)
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onMessage(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(id, name, avatar)
            `)
            .eq('id', payload.new.id)
            .single();

          if (message) {
            onUpdate(message);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();

    return channel;
  }

  subscribeToUserChatRooms(userId: string, onUpdate: (chatRoom: ChatRoom) => void) {
    const channel = supabase
      .channel(`user_chat_rooms_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`,
        },
        async (payload) => {
          const { data: chatRoom } = await supabase
            .from('chat_rooms')
            .select(`
              *,
              user1:users!chat_rooms_user1_id_fkey(id, name, avatar, is_active),
              user2:users!chat_rooms_user2_id_fkey(id, name, avatar, is_active),
              latest_message:messages(id, content, message_type, created_at, sender:users(id, name))
            `)
            .eq('id', payload.new?.id || payload.old?.id)
            .single();

          if (chatRoom) {
            onUpdate(chatRoom);
          }
        }
      )
      .subscribe();

    return channel;
  }
}

export const chatService = new ChatService();