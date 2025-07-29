import { supabase } from './client';
import type { TripRequest, LocationData } from '../../types';

export interface CreateRequestData {
  trip_id: string;
  sender_id: string;
  receiver_id: string;
  message?: string;
  seats_requested: number;
  pickup_location?: LocationData;
  dropoff_location?: LocationData;
  departure_flexibility: number;
}

export interface UpdateRequestData {
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  message?: string;
  responded_at?: string;
}

export interface RequestFilters {
  status?: string[];
  trip_id?: string;
  sender_id?: string;
  receiver_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface RequestResponse {
  request: TripRequest | null;
  error: string | null;
}

export interface RequestsResponse {
  requests: TripRequest[];
  total: number;
  error: string | null;
}

class RequestService {
  async createRequest(data: CreateRequestData): Promise<RequestResponse> {
    try {
      // Set expiration time (24 hours from now)
      const expires_at = new Date();
      expires_at.setHours(expires_at.getHours() + 24);

      const { data: request, error } = await supabase
        .from('trip_requests')
        .insert([{
          ...data,
          expires_at: expires_at.toISOString(),
          status: 'PENDING'
        }])
        .select(`
          *,
          trip:trips(*),
          sender:sender_id(id, name, email, avatar, rating_average, verification_level),
          receiver:receiver_id(id, name, email, avatar, rating_average, verification_level)
        `)
        .single();

      if (error) {
        console.error('Error creating trip request:', error);
        return { request: null, error: error.message };
      }

      return { request, error: null };
    } catch (err) {
      console.error('Unexpected error creating request:', err);
      return { 
        request: null, 
        error: err instanceof Error ? err.message : 'Failed to create request' 
      };
    }
  }

  async updateRequest(requestId: string, data: UpdateRequestData): Promise<RequestResponse> {
    try {
      // If accepting or declining, set responded_at timestamp
      if (data.status === 'ACCEPTED' || data.status === 'DECLINED') {
        data.responded_at = new Date().toISOString();
      }

      const { data: request, error } = await supabase
        .from('trip_requests')
        .update(data)
        .eq('id', requestId)
        .select(`
          *,
          trip:trips(*),
          sender:sender_id(id, name, email, avatar, rating_average, verification_level),
          receiver:receiver_id(id, name, email, avatar, rating_average, verification_level)
        `)
        .single();

      if (error) {
        console.error('Error updating trip request:', error);
        return { request: null, error: error.message };
      }

      // If request was accepted, update trip passenger count
      if (data.status === 'ACCEPTED' && request) {
        await this.updateTripPassengerCount(request.trip_id, request.seats_requested, 'add');
      }
      // If request was declined after being accepted, decrease passenger count
      else if (data.status === 'DECLINED' && request) {
        const { data: originalRequest } = await supabase
          .from('trip_requests')
          .select('status')
          .eq('id', requestId)
          .single();
        
        if (originalRequest?.status === 'ACCEPTED') {
          await this.updateTripPassengerCount(request.trip_id, request.seats_requested, 'remove');
        }
      }

      return { request, error: null };
    } catch (err) {
      console.error('Unexpected error updating request:', err);
      return { 
        request: null, 
        error: err instanceof Error ? err.message : 'Failed to update request' 
      };
    }
  }

  async getRequest(requestId: string): Promise<RequestResponse> {
    try {
      const { data: request, error } = await supabase
        .from('trip_requests')
        .select(`
          *,
          trip:trips(*),
          sender:sender_id(id, name, email, avatar, rating_average, verification_level),
          receiver:receiver_id(id, name, email, avatar, rating_average, verification_level)
        `)
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('Error fetching trip request:', error);
        return { request: null, error: error.message };
      }

      return { request, error: null };
    } catch (err) {
      console.error('Unexpected error fetching request:', err);
      return { 
        request: null, 
        error: err instanceof Error ? err.message : 'Failed to fetch request' 
      };
    }
  }

  async getRequests(filters: RequestFilters = {}): Promise<RequestsResponse> {
    try {
      let query = supabase
        .from('trip_requests')
        .select(`
          *,
          trip:trips(*),
          sender:sender_id(id, name, email, avatar, rating_average, verification_level),
          receiver:receiver_id(id, name, email, avatar, rating_average, verification_level)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.trip_id) {
        query = query.eq('trip_id', filters.trip_id);
      }

      if (filters.sender_id) {
        query = query.eq('sender_id', filters.sender_id);
      }

      if (filters.receiver_id) {
        query = query.eq('receiver_id', filters.receiver_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Pagination
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data: requests, error, count } = await query;

      if (error) {
        console.error('Error fetching trip requests:', error);
        return { requests: [], total: 0, error: error.message };
      }

      return { 
        requests: requests || [], 
        total: count || 0, 
        error: null 
      };
    } catch (err) {
      console.error('Unexpected error fetching requests:', err);
      return { 
        requests: [], 
        total: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch requests' 
      };
    }
  }

  async getUserRequests(userId: string, type: 'sent' | 'received' | 'all' = 'all'): Promise<RequestsResponse> {
    const filters: RequestFilters = {};
    
    if (type === 'sent') {
      filters.sender_id = userId;
    } else if (type === 'received') {
      filters.receiver_id = userId;
    } else {
      // For 'all', we need a custom query
      try {
        const { data: requests, error, count } = await supabase
          .from('trip_requests')
          .select(`
            *,
            trip:trips(*),
            sender:sender_id(id, name, email, avatar, rating_average, verification_level),
            receiver:receiver_id(id, name, email, avatar, rating_average, verification_level)
          `, { count: 'exact' })
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user requests:', error);
          return { requests: [], total: 0, error: error.message };
        }

        return { 
          requests: requests || [], 
          total: count || 0, 
          error: null 
        };
      } catch (err) {
        console.error('Unexpected error fetching user requests:', err);
        return { 
          requests: [], 
          total: 0,
          error: err instanceof Error ? err.message : 'Failed to fetch user requests' 
        };
      }
    }

    return this.getRequests(filters);
  }

  async cancelRequest(requestId: string): Promise<RequestResponse> {
    return this.updateRequest(requestId, { 
      status: 'CANCELLED',
      responded_at: new Date().toISOString()
    });
  }

  async acceptRequest(requestId: string, message?: string): Promise<RequestResponse> {
    return this.updateRequest(requestId, { 
      status: 'ACCEPTED',
      message
    });
  }

  async declineRequest(requestId: string, message?: string): Promise<RequestResponse> {
    return this.updateRequest(requestId, { 
      status: 'DECLINED',
      message
    });
  }

  async deleteRequest(requestId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('trip_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting trip request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('Unexpected error deleting request:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete request' 
      };
    }
  }

  async getExpiredRequests(): Promise<RequestsResponse> {
    try {
      const { data: requests, error, count } = await supabase
        .from('trip_requests')
        .select(`
          *,
          trip:trips(*),
          sender:sender_id(id, name, email, avatar, rating_average, verification_level),
          receiver:receiver_id(id, name, email, avatar, rating_average, verification_level)
        `, { count: 'exact' })
        .eq('status', 'PENDING')
        .lt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true });

      if (error) {
        console.error('Error fetching expired requests:', error);
        return { requests: [], total: 0, error: error.message };
      }

      return { 
        requests: requests || [], 
        total: count || 0, 
        error: null 
      };
    } catch (err) {
      console.error('Unexpected error fetching expired requests:', err);
      return { 
        requests: [], 
        total: 0,
        error: err instanceof Error ? err.message : 'Failed to fetch expired requests' 
      };
    }
  }

  async markExpiredRequests(): Promise<{ success: boolean; count: number; error: string | null }> {
    try {
      const { data, error, count } = await supabase
        .from('trip_requests')
        .update({ status: 'EXPIRED' })
        .eq('status', 'PENDING')
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        console.error('Error marking expired requests:', error);
        return { success: false, count: 0, error: error.message };
      }

      return { success: true, count: count || 0, error: null };
    } catch (err) {
      console.error('Unexpected error marking expired requests:', err);
      return { 
        success: false, 
        count: 0,
        error: err instanceof Error ? err.message : 'Failed to mark expired requests' 
      };
    }
  }

  private async updateTripPassengerCount(
    tripId: string, 
    seatCount: number, 
    operation: 'add' | 'remove'
  ): Promise<void> {
    try {
      // Get current trip data
      const { data: trip, error: fetchError } = await supabase
        .from('trips')
        .select('current_passengers, max_passengers')
        .eq('id', tripId)
        .single();

      if (fetchError || !trip) {
        console.error('Error fetching trip for passenger update:', fetchError);
        return;
      }

      const newPassengerCount = operation === 'add' 
        ? trip.current_passengers + seatCount
        : Math.max(0, trip.current_passengers - seatCount);

      const availableSeats = trip.max_passengers - newPassengerCount;

      // Update trip with new passenger count
      const { error: updateError } = await supabase
        .from('trips')
        .update({
          current_passengers: newPassengerCount,
          available_seats: availableSeats,
          status: availableSeats === 0 ? 'MATCHED' : 'ACTIVE'
        })
        .eq('id', tripId);

      if (updateError) {
        console.error('Error updating trip passenger count:', updateError);
      }
    } catch (err) {
      console.error('Unexpected error updating trip passenger count:', err);
    }
  }

  // Real-time subscription for requests
  subscribeToUserRequests(
    userId: string,
    onRequestUpdate: (request: TripRequest) => void,
    onError?: (error: Error) => void
  ) {
    const subscription = supabase
      .channel('user_requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_requests',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`
        },
        async (payload) => {
          try {
            // Fetch the complete request data with relations
            const { data: request, error } = await supabase
              .from('trip_requests')
              .select(`
                *,
                trip:trips(*),
                sender:sender_id(id, name, email, avatar, rating_average, verification_level),
                receiver:receiver_id(id, name, email, avatar, rating_average, verification_level)
              `)
              .eq('id', payload.new?.id || payload.old?.id)
              .single();

            if (!error && request) {
              onRequestUpdate(request);
            }
          } catch (err) {
            onError?.(err instanceof Error ? err : new Error('Unknown error'));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const requestService = new RequestService();