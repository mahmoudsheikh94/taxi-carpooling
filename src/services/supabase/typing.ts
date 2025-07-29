import { supabase } from './client';

export interface TypingStatus {
  user_id: string;
  chat_room_id: string;
  is_typing: boolean;
  last_seen_at: string;
  username?: string;
  avatar?: string;
}

export interface UserStatus {
  user_id: string;
  is_online: boolean;
  last_seen_at: string;
  status_message?: string;
}

class TypingStatusService {
  // Typing status management
  async setTypingStatus(
    chatRoomId: string,
    userId: string,
    isTyping: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const status: TypingStatus = {
        user_id: userId,
        chat_room_id: chatRoomId,
        is_typing: isTyping,
        last_seen_at: new Date().toISOString(),
      };

      // Broadcast typing status to other users in the room
      const channel = supabase.channel(`typing_${chatRoomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'typing_status',
        payload: status,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update typing status' };
    }
  }

  async getTypingUsers(
    chatRoomId: string,
    excludeUserId?: string
  ): Promise<TypingStatus[]> {
    // Note: This would typically be managed in memory or Redis in production
    // For now, we'll rely on real-time subscriptions
    return [];
  }

  // User online status
  async updateUserStatus(
    userId: string,
    isOnline: boolean,
    statusMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const status: UserStatus = {
        user_id: userId,
        is_online: isOnline,
        last_seen_at: new Date().toISOString(),
        status_message,
      };

      // Broadcast user status
      const channel = supabase.channel(`user_status_${userId}`);
      await channel.send({
        type: 'broadcast',
        event: 'user_status',
        payload: status,
      });

      // Also update user's last_login_at in database
      if (isOnline) {
        await supabase
          .from('users')
          .update({
            last_login_at: new Date().toISOString(),
            is_active: true,
          })
          .eq('id', userId);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to update user status' };
    }
  }

  // Real-time subscriptions for typing status
  subscribeToTypingStatus(
    chatRoomId: string,
    onTypingChange: (status: TypingStatus) => void
  ) {
    const channel = supabase
      .channel(`typing_${chatRoomId}`)
      .on('broadcast', { event: 'typing_status' }, (payload) => {
        onTypingChange(payload.payload as TypingStatus);
      })
      .subscribe();

    return channel;
  }

  subscribeToUserStatus(
    userId: string,
    onStatusChange: (status: UserStatus) => void
  ) {
    const channel = supabase
      .channel(`user_status_${userId}`)
      .on('broadcast', { event: 'user_status' }, (payload) => {
        onStatusChange(payload.payload as UserStatus);
      })
      .subscribe();

    return channel;
  }

  // Utility methods for presence management
  async handleUserJoinRoom(chatRoomId: string, userId: string): Promise<void> {
    try {
      const channel = supabase.channel(`room_presence_${chatRoomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'user_joined',
        payload: {
          user_id: userId,
          joined_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to broadcast user join:', error);
    }
  }

  async handleUserLeaveRoom(chatRoomId: string, userId: string): Promise<void> {
    try {
      // Clear typing status when leaving
      await this.setTypingStatus(chatRoomId, userId, false);

      const channel = supabase.channel(`room_presence_${chatRoomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'user_left',
        payload: {
          user_id: userId,
          left_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to broadcast user leave:', error);
    }
  }

  // Auto-cleanup typing status after timeout
  createTypingTimeout(
    chatRoomId: string,
    userId: string,
    timeoutMs: number = 3000
  ): NodeJS.Timeout {
    return setTimeout(async () => {
      await this.setTypingStatus(chatRoomId, userId, false);
    }, timeoutMs);
  }

  // Heartbeat for online status
  createHeartbeat(userId: string, intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(async () => {
      await this.updateUserStatus(userId, true);
    }, intervalMs);
  }
}

export const typingStatusService = new TypingStatusService();