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
          const { user, error } = await authService.signIn(credentials);
          
          if (error) {
            set({ error, isLoading: false });
            return false;
          }
          
          set({ user, isLoading: false, error: null });
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Sign in failed', 
            isLoading: false 
          });
          return false;
        }
      },

      signUp: async (data: SignUpData) => {
        set({ isLoading: true, error: null });
        
        try {
          const { user, error } = await authService.signUp(data);
          
          if (error) {
            set({ error, isLoading: false });
            return false;
          }
          
          set({ user, isLoading: false, error: null });
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Sign up failed', 
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
          const user = await authService.getCurrentUser();
          
          // Set up auth state change listener
          authService.onAuthStateChange((user) => {
            set({ user, isLoading: false });
          });
          
          set({ user, isLoading: false, isInitialized: true });
        } catch (error) {
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