import { supabase, handleSupabaseError } from './client';
import type { UserPreferences } from '../../types';

export interface CreateUserPreferencesData {
  user_id: string;
  max_detour_distance?: number;
  max_detour_time?: number;
  max_walking_distance?: number;
  time_flexibility?: number;
  price_range_min?: number;
  price_range_max?: number;
  currency?: string;
  smoking_preference?: 'yes' | 'no' | 'indifferent';
  pets_preference?: boolean;
  music_preference?: 'yes' | 'no' | 'indifferent';
  conversation_level?: 'chatty' | 'quiet' | 'indifferent';
  gender_preference?: 'same' | 'any';
  min_age?: number;
  max_age?: number;
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  marketing_emails?: boolean;
  notify_new_matches?: boolean;
  notify_trip_requests?: boolean;
  notify_messages?: boolean;
  notify_trip_updates?: boolean;
}

export interface UserPreferencesResponse {
  preferences: UserPreferences | null;
  error: string | null;
}

export const userPreferencesService = {
  /**
   * Get user preferences by user ID
   */
  async getUserPreferences(userId: string): Promise<UserPreferencesResponse> {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no preferences exist, return null instead of error
        if (error.code === 'PGRST116') {
          return { preferences: null, error: null };
        }
        return { preferences: null, error: handleSupabaseError(error) };
      }

      return { preferences: preferences as UserPreferences, error: null };
    } catch (error) {
      return { preferences: null, error: handleSupabaseError(error) };
    }
  },

  /**
   * Create user preferences
   */
  async createUserPreferences(data: CreateUserPreferencesData): Promise<UserPreferencesResponse> {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .insert(data)
        .select('*')
        .single();

      if (error) {
        return { preferences: null, error: handleSupabaseError(error) };
      }

      return { preferences: preferences as UserPreferences, error: null };
    } catch (error) {
      return { preferences: null, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<CreateUserPreferencesData>
  ): Promise<UserPreferencesResponse> {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        return { preferences: null, error: handleSupabaseError(error) };
      }

      return { preferences: preferences as UserPreferences, error: null };
    } catch (error) {
      return { preferences: null, error: handleSupabaseError(error) };
    }
  },

  /**
   * Create or update user preferences (upsert)
   */
  async upsertUserPreferences(data: CreateUserPreferencesData): Promise<UserPreferencesResponse> {
    try {
      const { data: preferences, error } = await supabase
        .from('user_preferences')
        .upsert(data, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (error) {
        return { preferences: null, error: handleSupabaseError(error) };
      }

      return { preferences: preferences as UserPreferences, error: null };
    } catch (error) {
      return { preferences: null, error: handleSupabaseError(error) };
    }
  },

  /**
   * Delete user preferences
   */
  async deleteUserPreferences(userId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get default preferences for a new user
   */
  getDefaultPreferences(userId: string): CreateUserPreferencesData {
    return {
      user_id: userId,
      max_detour_distance: 10, // km
      max_detour_time: 30, // minutes
      max_walking_distance: 500, // meters
      time_flexibility: 15, // minutes
      price_range_min: 0,
      price_range_max: 50,
      currency: 'USD',
      smoking_preference: 'no',
      pets_preference: true,
      music_preference: 'indifferent',
      conversation_level: 'indifferent',
      gender_preference: 'any',
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      marketing_emails: false,
      notify_new_matches: true,
      notify_trip_requests: true,
      notify_messages: true,
      notify_trip_updates: true,
    };
  },

  /**
   * Initialize preferences for a new user with defaults
   */
  async initializeUserPreferences(userId: string): Promise<UserPreferencesResponse> {
    const defaultPreferences = this.getDefaultPreferences(userId);
    return this.createUserPreferences(defaultPreferences);
  },

  /**
   * Update notification preferences only
   */
  async updateNotificationPreferences(
    userId: string,
    notifications: {
      email_notifications?: boolean;
      push_notifications?: boolean;
      sms_notifications?: boolean;
      marketing_emails?: boolean;
      notify_new_matches?: boolean;
      notify_trip_requests?: boolean;
      notify_messages?: boolean;
      notify_trip_updates?: boolean;
    }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(notifications)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update matching preferences only
   */
  async updateMatchingPreferences(
    userId: string,
    matching: {
      max_detour_distance?: number;
      max_detour_time?: number;
      max_walking_distance?: number;
      time_flexibility?: number;
      price_range_min?: number;
      price_range_max?: number;
      smoking_preference?: 'yes' | 'no' | 'indifferent';
      pets_preference?: boolean;
      music_preference?: 'yes' | 'no' | 'indifferent';
      conversation_level?: 'chatty' | 'quiet' | 'indifferent';
      gender_preference?: 'same' | 'any';
      min_age?: number;
      max_age?: number;
    }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .update(matching)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: handleSupabaseError(error) };
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get preferences for multiple users (for matching algorithm)
   */
  async getBulkUserPreferences(userIds: string[]): Promise<{
    preferences: Record<string, UserPreferences>;
    error: string | null;
  }> {
    try {
      const { data: preferencesList, error } = await supabase
        .from('user_preferences')
        .select('*')
        .in('user_id', userIds);

      if (error) {
        return { preferences: {}, error: handleSupabaseError(error) };
      }

      // Convert array to keyed object for easy lookup
      const preferences: Record<string, UserPreferences> = {};
      preferencesList.forEach(pref => {
        preferences[pref.user_id] = pref as UserPreferences;
      });

      return { preferences, error: null };
    } catch (error) {
      return { preferences: {}, error: handleSupabaseError(error) };
    }
  },

  /**
   * Validate preferences data
   */
  validatePreferences(preferences: Partial<CreateUserPreferencesData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate distance constraints
    if (preferences.max_detour_distance !== undefined) {
      if (preferences.max_detour_distance < 1 || preferences.max_detour_distance > 100) {
        errors.push('Max detour distance must be between 1 and 100 km');
      }
    }

    // Validate time constraints
    if (preferences.max_detour_time !== undefined) {
      if (preferences.max_detour_time < 5 || preferences.max_detour_time > 120) {
        errors.push('Max detour time must be between 5 and 120 minutes');
      }
    }

    // Validate walking distance
    if (preferences.max_walking_distance !== undefined) {
      if (preferences.max_walking_distance < 100 || preferences.max_walking_distance > 2000) {
        errors.push('Max walking distance must be between 100 and 2000 meters');
      }
    }

    // Validate time flexibility
    if (preferences.time_flexibility !== undefined) {
      if (preferences.time_flexibility < 0 || preferences.time_flexibility > 60) {
        errors.push('Time flexibility must be between 0 and 60 minutes');
      }
    }

    // Validate price range
    if (preferences.price_range_min !== undefined && preferences.price_range_max !== undefined) {
      if (preferences.price_range_min < 0) {
        errors.push('Minimum price cannot be negative');
      }
      if (preferences.price_range_max < preferences.price_range_min) {
        errors.push('Maximum price must be greater than minimum price');
      }
    }

    // Validate age constraints
    if (preferences.min_age !== undefined) {
      if (preferences.min_age < 18 || preferences.min_age > 100) {
        errors.push('Minimum age must be between 18 and 100');
      }
    }
    if (preferences.max_age !== undefined) {
      if (preferences.max_age < 18 || preferences.max_age > 100) {
        errors.push('Maximum age must be between 18 and 100');
      }
    }
    if (preferences.min_age !== undefined && preferences.max_age !== undefined) {
      if (preferences.min_age > preferences.max_age) {
        errors.push('Minimum age must be less than or equal to maximum age');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Get user preferences or create with defaults if not exists
   */
  async getOrCreateUserPreferences(userId: string): Promise<UserPreferencesResponse> {
    // Try to get existing preferences first
    const result = await this.getUserPreferences(userId);
    
    if (result.preferences) {
      return result;
    }

    // If no preferences exist, create with defaults
    if (!result.error) {
      return this.initializeUserPreferences(userId);
    }

    return result;
  },
};