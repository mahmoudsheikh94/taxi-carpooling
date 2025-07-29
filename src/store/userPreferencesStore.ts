import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userPreferencesService } from '../services/supabase';
import type { UserPreferences } from '../types';
import type { CreateUserPreferencesData } from '../services/supabase/userPreferences';

interface UserPreferencesState {
  // Preferences data
  preferences: UserPreferences | null;
  
  // UI state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Validation
  validationErrors: string[];
  hasUnsavedChanges: boolean;
}

interface UserPreferencesActions {
  // Preferences operations
  getUserPreferences: (userId: string) => Promise<void>;
  createUserPreferences: (data: CreateUserPreferencesData) => Promise<{ success: boolean; error?: string }>;
  updateUserPreferences: (userId: string, updates: Partial<CreateUserPreferencesData>) => Promise<{ success: boolean; error?: string }>;
  upsertUserPreferences: (data: CreateUserPreferencesData) => Promise<{ success: boolean; error?: string }>;
  
  // Specific preference updates
  updateMatchingPreferences: (userId: string, matching: any) => Promise<{ success: boolean; error?: string }>;
  updateNotificationPreferences: (userId: string, notifications: any) => Promise<{ success: boolean; error?: string }>;
  
  // Local state management
  setPreferences: (preferences: UserPreferences | null) => void;
  updateLocalPreferences: (updates: Partial<UserPreferences>) => void;
  validatePreferences: (preferences: Partial<CreateUserPreferencesData>) => { isValid: boolean; errors: string[] };
  
  // UI state
  setError: (error: string | null) => void;
  clearError: () => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  
  // Utils
  getDefaultPreferences: (userId: string) => CreateUserPreferencesData;
  resetToDefaults: (userId: string) => void;
  reset: () => void;
}

type UserPreferencesStore = UserPreferencesState & UserPreferencesActions;

const initialState: UserPreferencesState = {
  preferences: null,
  isLoading: false,
  isSaving: false,
  error: null,
  validationErrors: [],
  hasUnsavedChanges: false,
};

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Get user preferences
      getUserPreferences: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { preferences, error } = await userPreferencesService.getUserPreferences(userId);
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ 
            preferences, 
            isLoading: false, 
            error: null,
            hasUnsavedChanges: false,
          });
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to get user preferences';
          set({ error, isLoading: false });
        }
      },

      // Create new user preferences
      createUserPreferences: async (data: CreateUserPreferencesData) => {
        set({ isSaving: true, error: null });
        
        try {
          // Validate before creating
          const validation = get().validatePreferences(data);
          if (!validation.isValid) {
            set({ 
              validationErrors: validation.errors, 
              isSaving: false,
              error: 'Please fix validation errors before saving',
            });
            return { success: false, error: 'Validation failed' };
          }

          const { preferences, error } = await userPreferencesService.createUserPreferences(data);
          
          if (error) {
            set({ error, isSaving: false });
            return { success: false, error };
          }
          
          set({ 
            preferences, 
            isSaving: false, 
            error: null,
            validationErrors: [],
            hasUnsavedChanges: false,
          });
          return { success: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to create user preferences';
          set({ error, isSaving: false });
          return { success: false, error };
        }
      },

      // Update user preferences
      updateUserPreferences: async (userId: string, updates: Partial<CreateUserPreferencesData>) => {
        set({ isSaving: true, error: null });
        
        try {
          // Validate before updating
          const validation = get().validatePreferences(updates);
          if (!validation.isValid) {
            set({ 
              validationErrors: validation.errors, 
              isSaving: false,
              error: 'Please fix validation errors before saving',
            });
            return { success: false, error: 'Validation failed' };
          }

          const { preferences, error } = await userPreferencesService.updateUserPreferences(userId, updates);
          
          if (error) {
            set({ error, isSaving: false });
            return { success: false, error };
          }
          
          set({ 
            preferences, 
            isSaving: false, 
            error: null,
            validationErrors: [],
            hasUnsavedChanges: false,
          });
          return { success: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update user preferences';
          set({ error, isSaving: false });
          return { success: false, error };
        }
      },

      // Upsert user preferences
      upsertUserPreferences: async (data: CreateUserPreferencesData) => {
        set({ isSaving: true, error: null });
        
        try {
          // Validate before upserting
          const validation = get().validatePreferences(data);
          if (!validation.isValid) {
            set({ 
              validationErrors: validation.errors, 
              isSaving: false,
              error: 'Please fix validation errors before saving',
            });
            return { success: false, error: 'Validation failed' };
          }

          const { preferences, error } = await userPreferencesService.upsertUserPreferences(data);
          
          if (error) {
            set({ error, isSaving: false });
            return { success: false, error };
          }
          
          set({ 
            preferences, 
            isSaving: false, 
            error: null,
            validationErrors: [],
            hasUnsavedChanges: false,
          });
          return { success: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to save user preferences';
          set({ error, isSaving: false });
          return { success: false, error };
        }
      },

      // Update matching preferences only
      updateMatchingPreferences: async (userId: string, matching: any) => {
        set({ isSaving: true, error: null });
        
        try {
          const { success, error } = await userPreferencesService.updateMatchingPreferences(userId, matching);
          
          if (!success) {
            set({ error, isSaving: false });
            return { success: false, error };
          }
          
          // Update local state
          set((state) => ({
            preferences: state.preferences ? { ...state.preferences, ...matching } : null,
            isSaving: false,
            error: null,
            hasUnsavedChanges: false,
          }));
          
          return { success: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update matching preferences';
          set({ error, isSaving: false });
          return { success: false, error };
        }
      },

      // Update notification preferences only
      updateNotificationPreferences: async (userId: string, notifications: any) => {
        set({ isSaving: true, error: null });
        
        try {
          const { success, error } = await userPreferencesService.updateNotificationPreferences(userId, notifications);
          
          if (!success) {
            set({ error, isSaving: false });
            return { success: false, error };
          }
          
          // Update local state
          set((state) => ({
            preferences: state.preferences ? { ...state.preferences, ...notifications } : null,
            isSaving: false,
            error: null,
            hasUnsavedChanges: false,
          }));
          
          return { success: true };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update notification preferences';
          set({ error, isSaving: false });
          return { success: false, error };
        }
      },

      // Local state management
      setPreferences: (preferences: UserPreferences | null) => {
        set({ preferences, hasUnsavedChanges: false });
      },

      updateLocalPreferences: (updates: Partial<UserPreferences>) => {
        set((state) => ({
          preferences: state.preferences ? { ...state.preferences, ...updates } : null,
          hasUnsavedChanges: true,
        }));
      },

      validatePreferences: (preferences: Partial<CreateUserPreferencesData>) => {
        return userPreferencesService.validatePreferences(preferences);
      },

      // UI state
      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null, validationErrors: [] });
      },

      setHasUnsavedChanges: (hasChanges: boolean) => {
        set({ hasUnsavedChanges: hasChanges });
      },

      // Utils
      getDefaultPreferences: (userId: string) => {
        return userPreferencesService.getDefaultPreferences(userId);
      },

      resetToDefaults: (userId: string) => {
        const defaultPreferences = userPreferencesService.getDefaultPreferences(userId);
        set({ 
          preferences: defaultPreferences as UserPreferences,
          hasUnsavedChanges: true,
          error: null,
          validationErrors: [],
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'user-preferences-store',
      partialize: (state) => ({
        // Only persist the preferences data
        preferences: state.preferences,
      }),
    }
  )
);

// Selector hooks for specific preference sections
export const useMatchingPreferences = () => {
  return useUserPreferencesStore((state) => ({
    maxDetourDistance: state.preferences?.max_detour_distance,
    maxDetourTime: state.preferences?.max_detour_time,
    maxWalkingDistance: state.preferences?.max_walking_distance,
    timeFlexibility: state.preferences?.time_flexibility,
    priceRangeMin: state.preferences?.price_range_min,
    priceRangeMax: state.preferences?.price_range_max,
    smokingPreference: state.preferences?.smoking_preference,
    petsPreference: state.preferences?.pets_preference,
    musicPreference: state.preferences?.music_preference,
    conversationLevel: state.preferences?.conversation_level,
    genderPreference: state.preferences?.gender_preference,
    minAge: state.preferences?.min_age,
    maxAge: state.preferences?.max_age,
  }));
};

export const useNotificationPreferences = () => {
  return useUserPreferencesStore((state) => ({
    emailNotifications: state.preferences?.email_notifications,
    pushNotifications: state.preferences?.push_notifications,
    smsNotifications: state.preferences?.sms_notifications,
    marketingEmails: state.preferences?.marketing_emails,
    notifyNewMatches: state.preferences?.notify_new_matches,
    notifyTripRequests: state.preferences?.notify_trip_requests,
    notifyMessages: state.preferences?.notify_messages,
    notifyTripUpdates: state.preferences?.notify_trip_updates,
  }));
};