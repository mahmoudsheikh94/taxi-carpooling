import { supabase, handleSupabaseError } from './client';
import type { User } from '../../types';

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
            full_name: data.name, // Add fallback for different metadata field names
          },
        },
      };
      
      console.log('📤 Sending signup request with payload:', { 
        email: signUpPayload.email, 
        metadata: signUpPayload.options.data 
      });

      const { data: authData, error: signUpError } = await supabase.auth.signUp(signUpPayload);

      if (signUpError) {
        console.error('❌ Supabase signup error:', {
          message: signUpError.message,
          code: signUpError.status,
          details: signUpError
        });
        return { user: null, error: handleSupabaseError(signUpError) };
      }

      if (!authData.user) {
        console.error('❌ No user returned from Supabase auth');
        return { user: null, error: 'User creation failed - no user data returned' };
      }

      console.log('✅ Auth user created successfully:', {
        id: authData.user.id,
        email: authData.user.email,
        confirmed: authData.user.email_confirmed_at !== null
      });

      // Check if email confirmation is required
      if (!authData.user.email_confirmed_at && authData.session === null) {
        console.log('📧 Email confirmation required - user created but not confirmed');
        return { 
          user: null, 
          error: 'Please check your email and click the confirmation link to complete your registration.' 
        };
      }

      // Try to get the user profile that should have been created by the trigger
      try {
        console.log('🔍 Checking if user profile was created by trigger...');
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile not found, trigger may have failed:', profileError);
          
          // Fallback: Create user profile manually if trigger failed
          console.log('🔄 Creating user profile manually as fallback...');
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email!,
              name: data.name,
            });

          if (insertError) {
            console.error('❌ Manual profile creation also failed:', insertError);
            return { user: null, error: 'Account created but profile setup failed. Please contact support.' };
          }
          
          console.log('✅ User profile created manually');
        } else {
          console.log('✅ User profile found - trigger worked correctly');
        }

      } catch (profileCheckError) {
        console.error('❌ Error checking/creating user profile:', profileCheckError);
        // Don't fail the signup for profile issues, user can still access the app
        console.log('⚠️ Continuing with signup despite profile issues');
      }

      console.log('✅ Signup completed successfully');
      return { user: authData.user as unknown as User, error: null };
      
    } catch (error) {
      console.error('❌ Unexpected error during signup:', error);
      return { user: null, error: handleSupabaseError(error) };
    }
  },

  // Sign in with email and password
  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        return { user: null, error: handleSupabaseError(signInError) };
      }

      if (!authData.user) {
        return { user: null, error: 'Sign in failed' };
      }

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        return { user: null, error: 'Failed to load user profile' };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', authData.user.id);

      return { user: profile as User, error: null };
    } catch (error) {
      return { user: null, error: handleSupabaseError(error) };
    }
  },

  // Sign in with Google OAuth
  async signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
        redirectTo: `${window.location.origin}/auth/reset-password`,
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
        return null;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      return profile as User | null;
    } catch {
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