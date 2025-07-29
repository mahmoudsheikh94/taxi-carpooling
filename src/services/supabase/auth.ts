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
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      });

      if (signUpError) {
        return { user: null, error: handleSupabaseError(signUpError) };
      }

      if (!authData.user) {
        return { user: null, error: 'User creation failed' };
      }

      // The user profile will be created automatically by the database trigger
      // Return the auth user data for now, profile will be populated later
      return { user: authData.user as unknown as User, error: null };
    } catch (error) {
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