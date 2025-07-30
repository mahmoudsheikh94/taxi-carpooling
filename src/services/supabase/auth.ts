import { supabase, handleSupabaseError } from './client';
import type { User } from '../../types';
import { apiConfig, isDev } from '../../config/env';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  name: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

// Helper function to get the correct redirect URL based on environment
const getRedirectUrl = (path: string): string => {
  if (isDev) {
    // In development, use localhost
    return `${window.location.origin}${path}`;
  } else {
    // In production, use the configured app URL
    return `${apiConfig.app.url}${path}`;
  }
};

export const authService = {
  // Sign up with email and password
  async signUp(data: SignUpData): Promise<AuthResponse> {
    console.log('🔄 Starting signup process for:', data.email);
    
    try {
      const signUpPayload = {
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            full_name: data.name,
            display_name: data.name, // Multiple metadata fields for compatibility
          },
          emailRedirectTo: getRedirectUrl('/auth/callback'),
        },
      };
      
      console.log('📤 Sending signup request with payload:', { 
        email: signUpPayload.email, 
        metadata: signUpPayload.options.data,
        emailRedirectTo: signUpPayload.options.emailRedirectTo
      });

      const { data: authData, error: signUpError } = await supabase.auth.signUp(signUpPayload);

      if (signUpError) {
        console.error('❌ Supabase signup error:', {
          message: signUpError.message,
          code: signUpError.status,
          name: signUpError.name || 'Unknown',
          details: signUpError
        });
        
        // Provide user-friendly error messages
        let userError = signUpError.message;
        if (signUpError.message.includes('Database error saving new user')) {
          userError = 'There was an issue creating your account. Our team has been notified. Please try again in a few minutes.';
        } else if (signUpError.message.includes('already registered')) {
          userError = 'An account with this email already exists. Please try signing in instead.';
        }
        
        return { user: null, error: userError };
      }

      if (!authData.user) {
        console.error('❌ No user returned from Supabase auth');
        return { user: null, error: 'User creation failed - no user data returned' };
      }

      console.log('✅ Auth user created successfully:', {
        id: authData.user.id,
        email: authData.user.email,
        confirmed: authData.user.email_confirmed_at !== null,
        session: !!authData.session
      });

      // Handle email confirmation requirement
      if (!authData.user.email_confirmed_at && !authData.session) {
        console.log('📧 Email confirmation required - user created but not confirmed');
        return { 
          user: null, 
          error: 'Please check your email and click the confirmation link to complete your registration.' 
        };
      }

      // Always try to create user profile (don't rely on trigger)
      console.log('🔄 Creating user profile...');
      await this.ensureUserProfile(authData.user.id, authData.user.email!, data.name);

      console.log('✅ Signup completed successfully');
      return { user: authData.user as unknown as User, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error during signup:', error);
      return { user: null, error: 'An unexpected error occurred. Please try again.' };
    }
  },

  // Helper method to ensure user profile exists
  async ensureUserProfile(userId: string, email: string, name: string): Promise<void> {
    try {
      // First, check if profile already exists
      console.log('🔍 Checking if user profile exists...');
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (existingProfile) {
        console.log('✅ User profile already exists');
        return;
      }

      // Profile doesn't exist, create it
      console.log('📝 Creating user profile...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: name,
        });

      if (insertError) {
        // Check if it's a duplicate key error (race condition)
        if (insertError.code === '23505') {
          console.log('✅ User profile created by another process (race condition handled)');
          return;
        }
        
        console.error('❌ Failed to create user profile:', insertError);
        throw insertError;
      }

      console.log('✅ User profile created successfully');
      
    } catch (error) {
      console.error('❌ Error in ensureUserProfile:', error);
      // Don't throw error - allow signup to proceed even if profile creation fails
      // The user can still access the app and we can create the profile later
    }
  },

  // Sign in with email and password
  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    console.log('🔄 Starting login process for:', credentials.email);
    
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        console.error('❌ Authentication failed:', signInError);
        return { user: null, error: handleSupabaseError(signInError) };
      }

      if (!authData.user) {
        console.error('❌ No user data returned from authentication');
        return { user: null, error: 'Sign in failed' };
      }

      console.log('✅ Authentication successful for user:', authData.user.id);

      // Get user profile data with comprehensive error handling
      try {
        console.log('🔍 Fetching user profile...');
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile fetch error:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError
          });

          // If profile doesn't exist (PGRST116), create it
          if (profileError.code === 'PGRST116') {
            console.log('🔄 Profile not found, creating fallback profile...');
            const fallbackProfile = await this.createFallbackProfile(
              authData.user.id, 
              authData.user.email!, 
              authData.user.user_metadata?.name || 'User'
            );
            
            if (fallbackProfile) {
              console.log('✅ Fallback profile created successfully');
              return { user: fallbackProfile, error: null };
            }
          }

          return { user: null, error: 'Unable to load your profile. Please try again or contact support.' };
        }

        if (!profile) {
          console.error('❌ Profile data is null despite no error');
          return { user: null, error: 'Profile data not found' };
        }

        console.log('✅ User profile loaded successfully');

        // Update last login (don't fail login if this fails)
        try {
          await supabase
            .from('users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', authData.user.id);
          console.log('✅ Last login timestamp updated');
        } catch (updateError) {
          console.warn('⚠️ Failed to update last login timestamp:', updateError);
          // Don't fail the login for this
        }

        return { user: profile as User, error: null };

      } catch (profileFetchError) {
        console.error('❌ Unexpected error fetching profile:', profileFetchError);
        return { user: null, error: 'Failed to load user profile. Please try again.' };
      }

    } catch (error) {
      console.error('❌ Unexpected error during login:', error);
      return { user: null, error: 'An unexpected error occurred during login. Please try again.' };
    }
  },

  // Helper method to create fallback profile during login
  async createFallbackProfile(userId: string, email: string, name: string): Promise<User | null> {
    try {
      console.log('🔧 Creating fallback profile for user:', userId);
      
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: name,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create fallback profile:', createError);
        return null;
      }

      console.log('✅ Fallback profile created:', newProfile);
      return newProfile as User;

    } catch (error) {
      console.error('❌ Error creating fallback profile:', error);
      return null;
    }
  },

  // Sign in with Google OAuth
  async signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl('/auth/callback'),
        },
      });

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: handleSupabaseError(error) };
      }
      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl('/auth/reset-password'),
      });

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Update password
  async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: handleSupabaseError(error) };
      }

      return { error: null };
    } catch (error) {
      return { error: handleSupabaseError(error) };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('🔍 No authenticated user found');
        return null;
      }

      console.log('🔍 Getting current user profile for:', authUser.id);

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('❌ Error fetching current user profile:', {
          code: profileError.code,
          message: profileError.message
        });
        
        // If profile doesn't exist, try to create it
        if (profileError.code === 'PGRST116') {
          console.log('🔄 Current user profile not found, creating fallback...');
          return await this.createFallbackProfile(
            authUser.id,
            authUser.email!,
            authUser.user_metadata?.name || 'User'
          );
        }
        
        return null;
      }

      console.log('✅ Current user profile loaded successfully');
      return profile as User | null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { user: null, error: handleSupabaseError(error) };
      }

      return { user: data as User, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error) };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  },
};