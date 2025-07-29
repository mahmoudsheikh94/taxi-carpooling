import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { matchService, userPreferencesService } from '../services/supabase';
import { MatchingAlgorithm } from '../services/matching';
import type { TripMatch, Trip, UserPreferences } from '../types';
import type { MatchFilters } from '../services/supabase/matches';
import type { CompatibilityAnalysis } from '../services/matching/matchingAlgorithm';

interface MatchState {
  // Match data
  matches: TripMatch[];
  currentMatch: TripMatch | null;
  compatibilityResults: CompatibilityAnalysis[];
  
  // UI state
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalCount: number;
  hasMore: boolean;
  
  // Filters
  activeFilters: MatchFilters;
  
  // Real-time subscriptions
  subscriptions: Set<string>;
  
  // User preferences cache
  userPreferences: UserPreferences | null;
}

interface MatchActions {
  // Match operations
  getTripMatches: (tripId: string, page?: number) => Promise<void>;
  getUserMatches: (userId: string, page?: number, filters?: MatchFilters) => Promise<void>;
  getMatchById: (matchId: string) => Promise<void>;
  updateMatchStatus: (matchId: string, status: string) => Promise<{ success: boolean; error?: string }>;
  
  // Matching algorithm
  findCompatibleTrips: (sourceTrip: Trip, availableTrips: Trip[]) => Promise<CompatibilityAnalysis[]>;
  analyzeCompatibility: (sourceTrip: Trip, candidateTrip: Trip) => Promise<CompatibilityAnalysis>;
  
  // User preferences
  getUserPreferences: (userId: string) => Promise<void>;
  updateUserPreferences: (userId: string, preferences: Partial<UserPreferences>) => Promise<{ success: boolean; error?: string }>;
  
  // Filters and pagination
  setFilters: (filters: MatchFilters) => void;
  clearFilters: () => void;
  setCurrentPage: (page: number) => void;
  
  // Real-time subscriptions
  subscribeToUserMatches: (userId: string) => () => void;
  unsubscribeFromMatches: () => void;
  
  // UI state management
  setCurrentMatch: (match: TripMatch | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addMatch: (match: TripMatch) => void;
  updateMatch: (matchId: string, updates: Partial<TripMatch>) => void;
  removeMatch: (matchId: string) => void;
  reset: () => void;
}

type MatchStore = MatchState & MatchActions;

const initialState: MatchState = {
  matches: [],
  currentMatch: null,
  compatibilityResults: [],
  isLoading: false,
  isAnalyzing: false,
  error: null,
  currentPage: 1,
  totalCount: 0,
  hasMore: true,
  activeFilters: {},
  subscriptions: new Set(),
  userPreferences: null,
};

export const useMatchStore = create<MatchStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Get matches for a specific trip
      getTripMatches: async (tripId: string, page = 1) => {
        const limit = 20;
        const offset = (page - 1) * limit;
        
        set({ isLoading: true, error: null });
        
        try {
          const { matches, error, count } = await matchService.getTripMatches(tripId, limit, offset);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          const hasMore = count ? offset + matches.length < count : matches.length === limit;
          
          set((state) => ({
            matches: page === 1 ? matches : [...state.matches, ...matches],
            totalCount: count || 0,
            hasMore,
            currentPage: page,
            isLoading: false,
            error: null,
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get trip matches';
          set({ error, isLoading: false });
        }
      },

      // Get matches for a user across all their trips
      getUserMatches: async (userId: string, page = 1, filters?: MatchFilters) => {
        const limit = 20;
        const offset = (page - 1) * limit;
        
        set({ isLoading: true, error: null });
        
        try {
          const filtersToUse = filters || get().activeFilters;
          const { matches, error, count } = await matchService.getUserMatches(
            userId, 
            limit, 
            offset, 
            filtersToUse
          );
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          const hasMore = count ? offset + matches.length < count : matches.length === limit;
          
          set((state) => ({
            matches: page === 1 ? matches : [...state.matches, ...matches],
            totalCount: count || 0,
            hasMore,
            currentPage: page,
            activeFilters: filtersToUse,
            isLoading: false,
            error: null,
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get user matches';
          set({ error, isLoading: false });
        }
      },

      // Get specific match by ID
      getMatchById: async (matchId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { match, error } = await matchService.getMatchById(matchId);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ currentMatch: match, isLoading: false, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get match';
          set({ error, isLoading: false });
        }
      },

      // Update match status
      updateMatchStatus: async (matchId: string, status: string) => {
        try {
          const { success, error } = await matchService.updateMatchStatus(matchId, status as any);
          
          if (success) {
            set((state) => ({
              matches: state.matches.map(match =>
                match.id === matchId ? { ...match, status: status as any } : match
              ),
              currentMatch: state.currentMatch?.id === matchId 
                ? { ...state.currentMatch, status: status as any }
                : state.currentMatch,
            }));
            return { success: true };
          } else {
            return { success: false, error };
          }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update match status';
          return { success: false, error };
        }
      },

      // Find compatible trips using the matching algorithm
      findCompatibleTrips: async (sourceTrip: Trip, availableTrips: Trip[]) => {
        set({ isAnalyzing: true, error: null });
        
        try {
          const { userPreferences } = get();
          const results = await MatchingAlgorithm.findCompatibleTrips(
            sourceTrip,
            availableTrips,
            userPreferences || undefined
          );
          
          set({ compatibilityResults: results, isAnalyzing: false, error: null });
          return results;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to analyze compatibility';
          set({ error, isAnalyzing: false });
          return [];
        }
      },

      // Analyze compatibility between two specific trips
      analyzeCompatibility: async (sourceTrip: Trip, candidateTrip: Trip) => {
        try {
          const { userPreferences } = get();
          const criteria = {
            maxDetourDistance: userPreferences?.max_detour_distance ?? 10,
            maxDetourTime: userPreferences?.max_detour_time ?? 30,
            maxWalkingDistance: userPreferences?.max_walking_distance ?? 500,
            timeFlexibility: userPreferences?.time_flexibility ?? 15,
            priceRangeMin: userPreferences?.price_range_min ?? 0,
            priceRangeMax: userPreferences?.price_range_max ?? 100,
          };

          return await MatchingAlgorithm.analyzeCompatibility(
            sourceTrip,
            candidateTrip,
            criteria,
            userPreferences || undefined
          );
        } catch (err) {
          throw new Error(err instanceof Error ? err.message : 'Failed to analyze compatibility');
        }
      },

      // Get user preferences
      getUserPreferences: async (userId: string) => {
        try {
          const { preferences, error } = await userPreferencesService.getOrCreateUserPreferences(userId);
          
          if (error) {
            set({ error });
            return;
          }
          
          set({ userPreferences: preferences, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get user preferences';
          set({ error });
        }
      },

      // Update user preferences
      updateUserPreferences: async (userId: string, updates: Partial<UserPreferences>) => {
        try {
          const { preferences, error } = await userPreferencesService.updateUserPreferences(userId, updates);
          
          if (error) {
            return { success: false, error };
          }
          
          set({ userPreferences: preferences, error: null });
          return { success: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update user preferences';
          return { success: false, error };
        }
      },

      // Filters and pagination
      setFilters: (filters: MatchFilters) => {
        set({ activeFilters: filters, currentPage: 1 });
      },

      clearFilters: () => {
        set({ activeFilters: {}, currentPage: 1 });
      },

      setCurrentPage: (page: number) => {
        set({ currentPage: page });
      },

      // Real-time subscriptions
      subscribeToUserMatches: (userId: string) => {
        if (get().subscriptions.has(`user-matches-${userId}`)) {
          return () => {}; // Already subscribed
        }

        const subscription = matchService.subscribeToUserMatches(userId, (match) => {
          get().addMatch(match);
        });

        set((state) => ({
          subscriptions: new Set(state.subscriptions).add(`user-matches-${userId}`),
        }));

        // Return unsubscribe function
        return () => {
          subscription.unsubscribe();
          set((state) => {
            const newSubscriptions = new Set(state.subscriptions);
            newSubscriptions.delete(`user-matches-${userId}`);
            return { subscriptions: newSubscriptions };
          });
        };
      },

      unsubscribeFromMatches: () => {
        // Note: In a real implementation, you would need to store subscription references
        set({ subscriptions: new Set() });
      },

      // UI state management
      setCurrentMatch: (match: TripMatch | null) => {
        set({ currentMatch: match });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      addMatch: (match: TripMatch) => {
        set((state) => ({
          matches: [match, ...state.matches],
          totalCount: state.totalCount + 1,
        }));
      },

      updateMatch: (matchId: string, updates: Partial<TripMatch>) => {
        set((state) => ({
          matches: state.matches.map(match =>
            match.id === matchId ? { ...match, ...updates } : match
          ),
          currentMatch: state.currentMatch?.id === matchId
            ? { ...state.currentMatch, ...updates }
            : state.currentMatch,
        }));
      },

      removeMatch: (matchId: string) => {
        set((state) => ({
          matches: state.matches.filter(match => match.id !== matchId),
          currentMatch: state.currentMatch?.id === matchId ? null : state.currentMatch,
          totalCount: Math.max(0, state.totalCount - 1),
        }));
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'match-store',
      partialize: (state) => ({
        // Only persist filters and preferences
        activeFilters: state.activeFilters,
        userPreferences: state.userPreferences,
      }),
    }
  )
);