import { supabase } from '../supabase/client';
import type { Trip } from '../../types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface TripRealtimeHandlers {
  onTripUpdate?: (trip: Trip) => void;
  onTripDelete?: (tripId: string) => void;
  onTripStatusChange?: (tripId: string, status: string, oldStatus: string) => void;
  onError?: (error: string) => void;
}

export class TripRealtimeManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private handlers: TripRealtimeHandlers = {};

  constructor(handlers: TripRealtimeHandlers = {}) {
    this.handlers = handlers;
  }

  /**
   * Subscribe to all trip changes
   */
  subscribeToTrips(filters?: { userId?: string; status?: string }): () => void {
    const channelName = 'all-trips';
    
    // Unsubscribe if already subscribed
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: filters?.userId ? `user_id=eq.${filters.userId}` : undefined,
        },
        (payload) => {
          this.handleTripChange(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to trip updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to trip updates');
          this.handlers.onError?.('Failed to subscribe to trip updates');
        }
      });

    this.subscriptions.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName);
  }

  /**
   * Subscribe to specific trip changes
   */
  subscribeToTrip(tripId: string): () => void {
    const channelName = `trip-${tripId}`;
    
    // Unsubscribe if already subscribed
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        (payload) => {
          this.handleTripChange(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to trip ${tripId} updates`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to trip ${tripId} updates`);
          this.handlers.onError?.(`Failed to subscribe to trip ${tripId} updates`);
        }
      });

    this.subscriptions.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName);
  }

  /**
   * Subscribe to trip requests for a specific trip
   */
  subscribeToTripRequests(tripId: string, onRequestUpdate: (request: any) => void): () => void {
    const channelName = `trip-requests-${tripId}`;
    
    // Unsubscribe if already subscribed
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_requests',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('Trip request update:', payload);
          onRequestUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to trip ${tripId} request updates`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to trip ${tripId} request updates`);
          this.handlers.onError?.(`Failed to subscribe to trip ${tripId} request updates`);
        }
      });

    this.subscriptions.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName);
  }

  /**
   * Subscribe to user's trip notifications
   */
  subscribeToUserNotifications(userId: string, onNotification: (notification: any) => void): () => void {
    const channelName = `user-notifications-${userId}`;
    
    // Unsubscribe if already subscribed
    this.unsubscribeFromChannel(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification:', payload);
          onNotification(payload.new);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to user ${userId} notifications`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Failed to subscribe to user ${userId} notifications`);
          this.handlers.onError?.(`Failed to subscribe to user ${userId} notifications`);
        }
      });

    this.subscriptions.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribeFromChannel(channelName);
  }

  /**
   * Handle trip change events
   */
  private handleTripChange(payload: any) {
    console.log('Trip change event:', payload);
    
    try {
      switch (payload.eventType) {
        case 'INSERT':
          // New trip created
          if (payload.new) {
            this.handlers.onTripUpdate?.(payload.new as Trip);
          }
          break;

        case 'UPDATE':
          // Trip updated
          if (payload.new && payload.old) {
            const newTrip = payload.new as Trip;
            const oldTrip = payload.old as Trip;
            
            // Check for status change
            if (newTrip.status !== oldTrip.status) {
              this.handlers.onTripStatusChange?.(newTrip.id, newTrip.status, oldTrip.status);
            }
            
            this.handlers.onTripUpdate?.(newTrip);
          }
          break;

        case 'DELETE':
          // Trip deleted
          if (payload.old) {
            this.handlers.onTripDelete?.(payload.old.id);
          }
          break;

        default:
          console.log('Unknown trip event type:', payload.eventType);
      }
    } catch (error) {
      console.error('Error handling trip change:', error);
      this.handlers.onError?.('Error processing trip update');
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  private unsubscribeFromChannel(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    for (const [channelName, channel] of this.subscriptions) {
      supabase.removeChannel(channel);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    }
    this.subscriptions.clear();
  }

  /**
   * Update handlers
   */
  updateHandlers(handlers: Partial<TripRealtimeHandlers>) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get active subscription names
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

// Singleton instance for global use
export const tripRealtimeManager = new TripRealtimeManager();