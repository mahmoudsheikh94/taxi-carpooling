import { supabase, handleSupabaseError } from '../supabase/client';

export interface NotificationData {
  id: string;
  user_id: string;
  type: 'trip_request' | 'trip_update' | 'trip_match' | 'trip_cancelled' | 'trip_completed' | 'message';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationData['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface NotificationResponse {
  notification: NotificationData | null;
  error: string | null;
}

export interface NotificationsResponse {
  notifications: NotificationData[];
  error: string | null;
  count?: number;
}

export const notificationService = {
  // Create a new notification
  async createNotification(data: CreateNotificationData): Promise<NotificationResponse> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          ...data,
          read: false,
        })
        .select('*')
        .single();

      if (error) {
        return { notification: null, error: handleSupabaseError(error) };
      }

      return { notification: notification as NotificationData, error: null };
    } catch (error) {
      return { notification: null, error: handleSupabaseError(error) };
    }
  },

  // Get user's notifications
  async getUserNotifications(
    userId: string,
    limit = 50,
    offset = 0,
    unreadOnly = false
  ): Promise<NotificationsResponse> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: notifications, error, count } = await query;

      if (error) {
        return { notifications: [], error: handleSupabaseError(error) };
      }

      return { 
        notifications: notifications as NotificationData[], 
        error: null, 
        count: count || 0 
      };
    } catch (error) {
      return { notifications: [], error: handleSupabaseError(error) };
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  // Mark all user notifications as read
  async markAllAsRead(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        return { count: 0, error: handleSupabaseError(error) };
      }

      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: handleSupabaseError(error) };
    }
  },

  // Subscribe to user notifications
  subscribeToUserNotifications(userId: string, callback: (notification: NotificationData) => void) {
    const subscription = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as NotificationData);
        }
      )
      .subscribe();

    return subscription;
  },

  // Helper methods for creating specific notification types
  async createTripRequestNotification(
    userId: string,
    tripId: string,
    requesterName: string,
    tripRoute: string
  ): Promise<NotificationResponse> {
    return this.createNotification({
      user_id: userId,
      type: 'trip_request',
      title: 'New Trip Request',
      message: `${requesterName} requested to join your trip to ${tripRoute}`,
      data: { tripId, requesterName, tripRoute },
    });
  },

  async createTripUpdateNotification(
    userId: string,
    tripId: string,
    updateType: string,
    message: string
  ): Promise<NotificationResponse> {
    return this.createNotification({
      user_id: userId,
      type: 'trip_update',
      title: 'Trip Update',
      message,
      data: { tripId, updateType },
    });
  },

  async createTripMatchNotification(
    userId: string,
    tripId: string,
    matchedTripRoute: string
  ): Promise<NotificationResponse> {
    return this.createNotification({
      user_id: userId,
      type: 'trip_match',
      title: 'Trip Match Found',
      message: `We found a trip match for your route: ${matchedTripRoute}`,
      data: { tripId, matchedTripRoute },
    });
  },

  async createTripCancelledNotification(
    userId: string,
    tripId: string,
    tripRoute: string
  ): Promise<NotificationResponse> {
    return this.createNotification({
      user_id: userId,
      type: 'trip_cancelled',
      title: 'Trip Cancelled',
      message: `Your trip to ${tripRoute} has been cancelled`,
      data: { tripId, tripRoute },
    });
  },

  async createTripCompletedNotification(
    userId: string,
    tripId: string,
    tripRoute: string
  ): Promise<NotificationResponse> {
    return this.createNotification({
      user_id: userId,
      type: 'trip_completed',
      title: 'Trip Completed',
      message: `Your trip to ${tripRoute} has been completed. Please rate your experience.`,
      data: { tripId, tripRoute },
    });
  },
};