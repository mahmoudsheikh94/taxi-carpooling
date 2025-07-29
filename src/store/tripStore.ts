import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tripService } from '../services/supabase';
import type { Trip } from '../types';
import type { CreateTripData } from '../services/supabase/trips';
import type { TripFilterFormData } from '../utils/validations';

interface TripState {
  // Trip data
  trips: Trip[];
  userTrips: Trip[];
  currentTrip: Trip | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalCount: number;
  hasMore: boolean;
  
  // Filters
  activeFilters: TripFilterFormData;
  
  // Real-time subscriptions
  subscriptions: Set<string>;
}

interface TripActions {
  // Trip CRUD operations
  createTrip: (userId: string, data: CreateTripData) => Promise<{ success: boolean; trip?: Trip; error?: string }>;
  getTripById: (tripId: string) => Promise<void>;
  updateTrip: (tripId: string, updates: Partial<CreateTripData>) => Promise<{ success: boolean; error?: string }>;
  cancelTrip: (tripId: string) => Promise<{ success: boolean; error?: string }>;
  deleteTrip: (tripId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Trip listing and search
  getTrips: (filters?: TripFilterFormData, page?: number) => Promise<void>;
  getUserTrips: (userId: string, status?: string) => Promise<void>;
  searchTripsByLocation: (origin?: string, destination?: string) => Promise<void>;
  
  // Filters and pagination
  setFilters: (filters: TripFilterFormData) => void;
  clearFilters: () => void;
  setCurrentPage: (page: number) => void;
  
  // Real-time subscriptions
  subscribeToTrips: () => void;
  subscribeToTrip: (tripId: string) => void;
  unsubscribeFromTrips: () => void;
  unsubscribeFromTrip: (tripId: string) => void;
  
  // UI state management
  setCurrentTrip: (trip: Trip | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

type TripStore = TripState & TripActions;

const initialState: TripState = {
  trips: [],
  userTrips: [],
  currentTrip: null,
  isLoading: false,
  error: null,
  currentPage: 1,
  totalCount: 0,
  hasMore: true,
  activeFilters: {},
  subscriptions: new Set(),
};

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Trip CRUD operations
      createTrip: async (userId: string, data: CreateTripData) => {
        set({ isLoading: true, error: null });
        
        try {
          const { trip, error } = await tripService.createTrip(userId, data);
          
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          
          if (trip) {
            set((state) => ({
              trips: [trip, ...state.trips],
              userTrips: [trip, ...state.userTrips],
              currentTrip: trip,
              isLoading: false,
              error: null,
            }));
            
            return { success: true, trip };
          }
          
          return { success: false, error: 'Failed to create trip' };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to create trip';
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },

      getTripById: async (tripId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { trip, error } = await tripService.getTripById(tripId);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ currentTrip: trip, isLoading: false, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get trip';
          set({ error, isLoading: false });
        }
      },

      updateTrip: async (tripId: string, updates: Partial<CreateTripData>) => {
        set({ isLoading: true, error: null });
        
        try {
          const { trip, error } = await tripService.updateTrip(tripId, updates);
          
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          
          if (trip) {
            set((state) => ({
              trips: state.trips.map(t => t.id === tripId ? trip : t),
              userTrips: state.userTrips.map(t => t.id === tripId ? trip : t),
              currentTrip: state.currentTrip?.id === tripId ? trip : state.currentTrip,
              isLoading: false,
              error: null,
            }));
            
            return { success: true };
          }
          
          return { success: false, error: 'Failed to update trip' };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update trip';
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },

      cancelTrip: async (tripId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { trip, error } = await tripService.cancelTrip(tripId);
          
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          
          if (trip) {
            set((state) => ({
              trips: state.trips.map(t => t.id === tripId ? trip : t),
              userTrips: state.userTrips.map(t => t.id === tripId ? trip : t),
              currentTrip: state.currentTrip?.id === tripId ? trip : state.currentTrip,
              isLoading: false,
              error: null,
            }));
            
            return { success: true };
          }
          
          return { success: false, error: 'Failed to cancel trip' };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to cancel trip';
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },

      deleteTrip: async (tripId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { success, error } = await tripService.deleteTrip(tripId);
          
          if (error) {
            set({ error, isLoading: false });
            return { success: false, error };
          }
          
          if (success) {
            set((state) => ({
              trips: state.trips.filter(t => t.id !== tripId),
              userTrips: state.userTrips.filter(t => t.id !== tripId),
              currentTrip: state.currentTrip?.id === tripId ? null : state.currentTrip,
              isLoading: false,
              error: null,
            }));
            
            return { success: true };
          }
          
          return { success: false, error: 'Failed to delete trip' };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to delete trip';
          set({ error, isLoading: false });
          return { success: false, error };
        }
      },

      // Trip listing and search
      getTrips: async (filters?: TripFilterFormData, page = 1) => {
        const limit = 20;
        const offset = (page - 1) * limit;
        
        set({ isLoading: true, error: null });
        
        try {
          const filtersToUse = filters || get().activeFilters;
          const { trips, error, count } = await tripService.getTrips(filtersToUse, limit, offset);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          const hasMore = count ? offset + trips.length < count : trips.length === limit;
          
          set((state) => ({
            trips: page === 1 ? trips : [...state.trips, ...trips],
            totalCount: count || 0,
            hasMore,
            currentPage: page,
            activeFilters: filtersToUse,
            isLoading: false,
            error: null,
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get trips';
          set({ error, isLoading: false });
        }
      },

      getUserTrips: async (userId: string, status?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { trips, error } = await tripService.getUserTrips(userId, status);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ userTrips: trips, isLoading: false, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get user trips';
          set({ error, isLoading: false });
        }
      },

      searchTripsByLocation: async (origin?: string, destination?: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { trips, error } = await tripService.searchTripsByLocation(origin, destination);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ trips, isLoading: false, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to search trips';
          set({ error, isLoading: false });
        }
      },

      // Filters and pagination
      setFilters: (filters: TripFilterFormData) => {
        set({ activeFilters: filters, currentPage: 1 });
      },

      clearFilters: () => {
        set({ activeFilters: {}, currentPage: 1 });
      },

      setCurrentPage: (page: number) => {
        set({ currentPage: page });
      },

      // Real-time subscriptions
      subscribeToTrips: () => {
        const subscription = tripService.subscribeToTrips((trips) => {
          set({ trips });
        });
        
        set((state) => ({
          subscriptions: new Set(state.subscriptions).add('all-trips'),
        }));
        
        return subscription;
      },

      subscribeToTrip: (tripId: string) => {
        const subscription = tripService.subscribeToTrip(tripId, (trip) => {
          set((state) => ({
            currentTrip: trip,
            trips: state.trips.map(t => t.id === tripId ? trip : t).filter(Boolean) as Trip[],
            userTrips: state.userTrips.map(t => t.id === tripId ? trip : t).filter(Boolean) as Trip[],
          }));
        });
        
        set((state) => ({
          subscriptions: new Set(state.subscriptions).add(`trip-${tripId}`),
        }));
        
        return subscription;
      },

      unsubscribeFromTrips: () => {
        // Note: In a real implementation, you would need to store the subscription
        // reference and call unsubscribe on it
        set((state) => {
          const newSubscriptions = new Set(state.subscriptions);
          newSubscriptions.delete('all-trips');
          return { subscriptions: newSubscriptions };
        });
      },

      unsubscribeFromTrip: (tripId: string) => {
        // Note: In a real implementation, you would need to store the subscription
        // reference and call unsubscribe on it
        set((state) => {
          const newSubscriptions = new Set(state.subscriptions);
          newSubscriptions.delete(`trip-${tripId}`);
          return { subscriptions: newSubscriptions };
        });
      },

      // UI state management
      setCurrentTrip: (trip: Trip | null) => {
        set({ currentTrip: trip });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'trip-store',
      partialize: (state) => ({
        // Only persist essential data, not loading states or subscriptions
        activeFilters: state.activeFilters,
        currentPage: state.currentPage,
      }),
    }
  )
);