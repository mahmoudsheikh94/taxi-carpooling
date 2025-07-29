import { supabase, handleSupabaseError } from './client';
import type { Trip } from '../../types';
import type { TripFormData, TripFilterFormData } from '../../utils/validations';

export interface CreateTripData {
  origin: string;
  destination: string;
  origin_location: {
    address: string;
    coordinates: { lat: number; lng: number };
    placeId: string;
    name?: string;
    types?: string[];
  };
  destination_location: {
    address: string;
    coordinates: { lat: number; lng: number };
    placeId: string;
    name?: string;
    types?: string[];
  };
  departure_time: string;
  max_passengers: number;
  price_per_seat?: number;
  currency?: string;
  payment_method?: 'cash' | 'card' | 'app' | 'split';
  notes?: string;
  smoking_allowed?: boolean;
  pets_allowed?: boolean;
  music_preference?: 'yes' | 'no' | 'indifferent';
  conversation_level?: 'chatty' | 'quiet' | 'indifferent';
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate?: string;
}

export interface TripResponse {
  trip: Trip | null;
  error: string | null;
}

export interface TripsResponse {
  trips: Trip[];
  error: string | null;
  count?: number;
}

export const tripService = {
  // Create a new trip
  async createTrip(userId: string, data: CreateTripData): Promise<TripResponse> {
    try {
      const tripData = {
        user_id: userId,
        ...data,
        status: 'ACTIVE' as const,
        current_passengers: 1,
        currency: data.currency || 'USD',
        smoking_allowed: data.smoking_allowed ?? false,
        pets_allowed: data.pets_allowed ?? true,
        music_preference: data.music_preference || 'indifferent',
        conversation_level: data.conversation_level || 'indifferent',
      };

      const { data: trip, error } = await supabase
        .from('trips')
        .insert(tripData)
        .select(`
          *,
          user:users(id, name, email, rating_average, trips_completed)
        `)
        .single();

      if (error) {
        return { trip: null, error: handleSupabaseError(error) };
      }

      return { trip: trip as Trip, error: null };
    } catch (error) {
      return { trip: null, error: handleSupabaseError(error) };
    }
  },

  // Get trip by ID
  async getTripById(tripId: string): Promise<TripResponse> {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .select(`
          *,
          user:users(id, name, email, rating_average, trips_completed)
        `)
        .eq('id', tripId)
        .single();

      if (error) {
        return { trip: null, error: handleSupabaseError(error) };
      }

      return { trip: trip as Trip, error: null };
    } catch (error) {
      return { trip: null, error: handleSupabaseError(error) };
    }
  },

  // Get trips with filters and pagination
  async getTrips(
    filters: TripFilterFormData = {},
    limit = 20,
    offset = 0
  ): Promise<TripsResponse> {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          user:users(id, name, email, rating_average, trips_completed)
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      } else {
        // Default to active trips if no status filter
        query = query.eq('status', 'ACTIVE');
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.departure_date) {
        const startOfDay = new Date(filters.departure_date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(filters.departure_date);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.gte('departure_time', startOfDay.toISOString())
                     .lte('departure_time', endOfDay.toISOString());
      }

      if (filters.min_departure_time) {
        query = query.gte('departure_time', filters.min_departure_time);
      }

      if (filters.max_departure_time) {
        query = query.lte('departure_time', filters.max_departure_time);
      }

      if (filters.max_passengers) {
        query = query.gte('available_seats', filters.max_passengers);
      }

      if (filters.min_price !== undefined) {
        query = query.gte('price_per_seat', filters.min_price);
      }

      if (filters.max_price !== undefined) {
        query = query.lte('price_per_seat', filters.max_price);
      }

      if (filters.smoking_allowed !== undefined) {
        query = query.eq('smoking_allowed', filters.smoking_allowed);
      }

      if (filters.pets_allowed !== undefined) {
        query = query.eq('pets_allowed', filters.pets_allowed);
      }

      if (filters.music_preference) {
        query = query.eq('music_preference', filters.music_preference);
      }

      if (filters.conversation_level) {
        query = query.eq('conversation_level', filters.conversation_level);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Order by departure time
      query = query.order('departure_time', { ascending: true });

      const { data: trips, error, count } = await query;

      if (error) {
        return { trips: [], error: handleSupabaseError(error) };
      }

      return { 
        trips: trips as Trip[], 
        error: null, 
        count: count || 0 
      };
    } catch (error) {
      return { trips: [], error: handleSupabaseError(error) };
    }
  },

  // Search trips by location
  async searchTripsByLocation(
    origin?: string,
    destination?: string,
    limit = 20
  ): Promise<TripsResponse> {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          user:users(id, name, email, rating_average, trips_completed)
        `)
        .eq('status', 'ACTIVE');

      if (origin) {
        query = query.ilike('origin', `%${origin}%`);
      }

      if (destination) {
        query = query.ilike('destination', `%${destination}%`);
      }

      query = query
        .order('departure_time', { ascending: true })
        .limit(limit);

      const { data: trips, error } = await query;

      if (error) {
        return { trips: [], error: handleSupabaseError(error) };
      }

      return { trips: trips as Trip[], error: null };
    } catch (error) {
      return { trips: [], error: handleSupabaseError(error) };
    }
  },

  // Update trip
  async updateTrip(tripId: string, updates: Partial<CreateTripData>): Promise<TripResponse> {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .update(updates)
        .eq('id', tripId)
        .select(`
          *,
          user:users(id, name, email, rating_average, trips_completed)
        `)
        .single();

      if (error) {
        return { trip: null, error: handleSupabaseError(error) };
      }

      return { trip: trip as Trip, error: null };
    } catch (error) {
      return { trip: null, error: handleSupabaseError(error) };
    }
  },

  // Cancel trip
  async cancelTrip(tripId: string): Promise<TripResponse> {
    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .update({ status: 'CANCELLED' })
        .eq('id', tripId)
        .select(`
          *,
          user:users(id, name, email, rating_average, trips_completed)
        `)
        .single();

      if (error) {
        return { trip: null, error: handleSupabaseError(error) };
      }

      return { trip: trip as Trip, error: null };
    } catch (error) {
      return { trip: null, error: handleSupabaseError(error) };
    }
  },

  // Delete trip
  async deleteTrip(tripId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  // Get user's trips
  async getUserTrips(userId: string, status?: string): Promise<TripsResponse> {
    try {
      let query = supabase
        .from('trips')
        .select(`
          *,
          user:users(id, name, email, rating_average, trips_completed)
        `)
        .eq('user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data: trips, error } = await query;

      if (error) {
        return { trips: [], error: handleSupabaseError(error) };
      }

      return { trips: trips as Trip[], error: null };
    } catch (error) {
      return { trips: [], error: handleSupabaseError(error) };
    }
  },

  // Subscribe to trip changes
  subscribeToTrips(callback: (trips: Trip[]) => void) {
    const subscription = supabase
      .channel('trips')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
        },
        () => {
          // Refetch trips when changes occur
          this.getTrips().then(({ trips }) => {
            callback(trips);
          });
        }
      )
      .subscribe();

    return subscription;
  },

  // Subscribe to specific trip changes
  subscribeToTrip(tripId: string, callback: (trip: Trip | null) => void) {
    const subscription = supabase
      .channel(`trip-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        () => {
          // Refetch trip when changes occur
          this.getTripById(tripId).then(({ trip }) => {
            callback(trip);
          });
        }
      )
      .subscribe();

    return subscription;
  },
};