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
  // Always try to use the current window location origin first
  // This ensures we match the domain the user is actually on
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  
  if (isDev) {
    // In development, always use the current origin (localhost)
    return `${currentOrigin}${path}`;
  } else {
    // In production, prefer the configured app URL, but fall back to current origin
    // This handles cases where the app might be deployed to multiple domains
    const configuredUrl = apiConfig.app.url;
    
    // If configured URL exists and looks valid, use it
    if (configuredUrl && configuredUrl.startsWith('http')) {
      return `${configuredUrl}${path}`;
    }
    
    // Fallback to current origin if config is missing or invalid
    if (currentOrigin) {
      console.warn('⚠️ Using current origin for auth redirect - ensure VITE_APP_URL is set correctly');
      return `${currentOrigin}${path}`;
    }
    
    // Last resort fallback (should rarely happen)
    console.error('❌ No valid redirect URL found - check VITE_APP_URL configuration');
    return `https://taxi-carpooling.vercel.app${path}`;
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

  // Helper method to ensure user profile exists with retry logic
  async ensureUserProfile(userId: string, email: string, name: string, retryCount = 0): Promise<void> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      // First, check if profile already exists
      console.log(`🔍 Checking if user profile exists... (attempt ${retryCount + 1})`);
      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to avoid PGRST116 errors

      if (selectError) {
        console.error('❌ Error checking existing profile:', selectError);
        // If we can't check, try to create anyway
      } else if (existingProfile) {
        console.log('✅ User profile already exists');
        return;
      }

      // Profile doesn't exist or we couldn't check, try to create it
      console.log('📝 Creating user profile...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: name,
          is_active: true,
        });

      if (insertError) {
        // Handle specific error cases
        if (insertError.code === '23505') {
          console.log('✅ User profile created by another process (race condition handled)');
          return;
        }
        
        if (insertError.code === '42501' && retryCount < maxRetries) {
          console.warn(`⚠️ RLS policy error, retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.ensureUserProfile(userId, email, name, retryCount + 1);
        }
        
        console.error('❌ Failed to create user profile:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        });
        throw insertError;
      }

      console.log('✅ User profile created successfully');
      
    } catch (error) {
      console.error('❌ Error in ensureUserProfile:', error);
      
      // If we've exhausted retries, don't throw - allow auth to proceed
      if (retryCount >= maxRetries) {
        console.warn('⚠️ Profile creation failed after max retries. User can still authenticate.');
        return;
      }
      
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
          .maybeSingle(); // Use maybeSingle to avoid PGRST116 errors

        if (profileError) {
          console.error('❌ Profile fetch error:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError
          });

          // Handle profile fetch error
          console.log('🔄 Profile fetch failed, creating fallback profile...');
          const fallbackProfile = await this.createFallbackProfile(
            authData.user.id, 
            authData.user.email!, 
            authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || 'User'
          );
          
          if (fallbackProfile) {
            console.log('✅ Fallback profile created successfully');
            return { user: fallbackProfile, error: null };
          }

          return { user: null, error: 'Unable to load your profile. Please try again or contact support.' };
        }

        if (!profile) {
          console.log('🔄 Profile not found, creating fallback profile...');
          const fallbackProfile = await this.createFallbackProfile(
            authData.user.id, 
            authData.user.email!, 
            authData.user.user_metadata?.name || authData.user.user_metadata?.full_name || 'User'
          );
          
          if (fallbackProfile) {
            console.log('✅ Fallback profile created successfully');
            return { user: fallbackProfile, error: null };
          }
          
          return { user: null, error: 'Profile not found and could not be created' };
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

  // Helper method to create fallback profile during login with retry logic
  async createFallbackProfile(userId: string, email: string, name: string, retryCount = 0): Promise<User | null> {
    const maxRetries = 3;
    const retryDelay = 1000;

    try {
      console.log(`🔧 Creating fallback profile for user: ${userId} (attempt ${retryCount + 1})`);
      
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          name: name,
          is_active: true,
        })
        .select()
        .maybeSingle(); // Use maybeSingle to avoid PGRST116 errors

      if (createError) {
        // Handle specific error cases  
        if (createError.code === '23505') {
          console.log('✅ Profile already exists (race condition), fetching existing...');
          const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          return existingProfile as User || null;
        }

        if (createError.code === '42501' && retryCount < maxRetries) {
          console.warn(`⚠️ RLS policy error, retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.createFallbackProfile(userId, email, name, retryCount + 1);
        }

        console.error('❌ Failed to create fallback profile:', {
          code: createError.code,
          message: createError.message,
          details: createError.details
        });
        return null;
      }

      if (!newProfile) {
        console.error('❌ No profile data returned from insert');
        return null;
      }

      console.log('✅ Fallback profile created successfully');
      return newProfile as User;

    } catch (error) {
      console.error('❌ Error creating fallback profile:', error);
      
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying fallback profile creation... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.createFallbackProfile(userId, email, name, retryCount + 1);
      }
      
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
        .maybeSingle();

      if (profileError) {
        console.error('❌ Error fetching current user profile:', {
          code: profileError.code,
          message: profileError.message
        });
        
        // Profile fetch failed, create fallback
        console.log('🔄 Current user profile not found, creating fallback...');
        return await this.createFallbackProfile(
          authUser.id,
          authUser.email!,
          authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User'
        );
      }

      if (!profile) {
        console.log('🔄 Profile is null, creating fallback...');
        return await this.createFallbackProfile(
          authUser.id,
          authUser.email!,
          authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'User'
        );
      }

      console.log('✅ Current user profile loaded successfully');
      return profile as User;
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
        try {
          // Get user profile directly instead of using getCurrentUser to avoid recursion
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error fetching user profile in auth state change:', profileError);
            // Profile fetch failed, try to create fallback
            const fallbackProfile = await this.createFallbackProfile(
              session.user.id,
              session.user.email!,
              session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'User'
            );
            callback(fallbackProfile);
          } else if (!profile) {
            // Profile is null, create fallback
            const fallbackProfile = await this.createFallbackProfile(
              session.user.id,
              session.user.email!,
              session.user.user_metadata?.name || session.user.user_metadata?.full_name || 'User'
            );
            callback(fallbackProfile);
          } else {
            callback(profile as User);
          }
        } catch (error) {
          console.error('Unexpected error in auth state change:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  },
};