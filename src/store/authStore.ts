import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/supabase';
import type { User } from '../types';
import type { AuthCredentials, SignUpData } from '../services/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (credentials: AuthCredentials) => Promise<boolean>;
  signUp: (data: SignUpData) => Promise<boolean>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isLoading: false,
      isInitialized: false,
      error: null,

      // Actions
      signIn: async (credentials: AuthCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // Add timeout to prevent hanging
          const signInTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Sign in timeout - please try again')), 15000);
          });
          
          const { user, error } = await Promise.race([
            authService.signIn(credentials),
            signInTimeout
          ]);
          
          if (error) {
            // Provide user-friendly error messages
            let userError = error;
            if (error.includes('Invalid login credentials')) {
              userError = 'Invalid email or password. Please check your credentials and try again.';
            } else if (error.includes('Email not confirmed')) {
              userError = 'Please check your email and click the confirmation link before signing in.';
            } else if (error.includes('Too many requests')) {
              userError = 'Too many login attempts. Please wait a few minutes and try again.';
            }
            
            set({ error: userError, isLoading: false });
            return false;
          }
          
          if (!user) {
            set({ error: 'Sign in failed - no user data received', isLoading: false });
            return false;
          }
          
          set({ user, isLoading: false, error: null });
          return true;
        } catch (error) {
          console.error('Sign in error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
          set({ 
            error: errorMessage.includes('timeout') ? errorMessage : 'Sign in failed - please try again', 
            isLoading: false 
          });
          return false;
        }
      },

      signUp: async (data: SignUpData) => {
        set({ isLoading: true, error: null });
        
        try {
          // Add timeout to prevent hanging
          const signUpTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Sign up timeout - please try again')), 20000);
          });
          
          const { user, error } = await Promise.race([
            authService.signUp(data),
            signUpTimeout
          ]);
          
          if (error) {
            // Provide user-friendly error messages
            let userError = error;
            if (error.includes('already registered')) {
              userError = 'An account with this email already exists. Please try signing in instead.';
            } else if (error.includes('Password should be at least')) {
              userError = 'Password must be at least 6 characters long.';
            } else if (error.includes('Invalid email')) {
              userError = 'Please enter a valid email address.';
            } else if (error.includes('check your email')) {
              userError = error; // Keep the email confirmation message as is
            }
            
            set({ error: userError, isLoading: false });
            return false;
          }
          
          set({ user, isLoading: false, error: null });
          return true;
        } catch (error) {
          console.error('Sign up error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
          set({ 
            error: errorMessage.includes('timeout') ? errorMessage : 'Sign up failed - please try again', 
            isLoading: false 
          });
          return false;
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const result = await authService.signInWithGoogle();
          
          if (result.error) {
            set({ error: result.error, isLoading: false });
            return { error: result.error };
          }
          
          // Don't set loading to false here, as OAuth redirect will handle it
          return { error: null };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
          set({ 
            error: errorMessage, 
            isLoading: false 
          });
          return { error: errorMessage };
        }
      },

      signOut: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await authService.signOut();
          
          if (error) {
            set({ error, isLoading: false });
            return;
          }
          
          set({ user: null, isLoading: false, error: null });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Sign out failed', 
            isLoading: false 
          });
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await authService.resetPassword(email);
          
          if (error) {
            set({ error, isLoading: false });
            return false;
          }
          
          set({ isLoading: false, error: null });
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Password reset failed', 
            isLoading: false 
          });
          return false;
        }
      },

      updatePassword: async (password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { error } = await authService.updatePassword(password);
          
          if (error) {
            set({ error, isLoading: false });
            return false;
          }
          
          set({ isLoading: false, error: null });
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Password update failed', 
            isLoading: false 
          });
          return false;
        }
      },

      updateProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return false;

        set({ isLoading: true, error: null });
        
        try {
          const { user: updatedUser, error } = await authService.updateProfile(user.id, updates);
          
          if (error) {
            set({ error, isLoading: false });
            return false;
          }
          
          set({ user: updatedUser, isLoading: false, error: null });
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Profile update failed', 
            isLoading: false 
          });
          return false;
        }
      },

      initializeAuth: async () => {
        if (get().isInitialized) return;
        
        set({ isLoading: true });
        
        try {
          // Add timeout to prevent indefinite hanging
          const authTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Authentication timeout')), 10000);
          });
          
          const user = await Promise.race([
            authService.getCurrentUser(),
            authTimeout
          ]);
          
          // Set up auth state change listener with error handling
          authService.onAuthStateChange((user) => {
            // The auth service already handles profile fetching, just update the state
            set({ user, isLoading: false });
          });
          
          set({ user, isLoading: false, isInitialized: true });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Auth initialization failed',
            isLoading: false,
            isInitialized: true
          });
        }
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist user data, not loading states or errors
        user: state.user,
      }),
    }
  )
);