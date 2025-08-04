import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLoading } from '../../components/ui';
import { useAuthStore, useToastStore } from '../../store';
import { supabase } from '../../services/supabase';
import { ROUTES } from '../../constants';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initializeAuth, user, setLoading, clearError } = useAuthStore();
  const { addToast } = useToastStore();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing auth callback...');
        setIsProcessing(true);
        setLoading(true);
        clearError();

        // Get auth code and error from URL parameters
        const authCode = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors (like user cancelled)
        if (error) {
          console.error('❌ OAuth error:', error, errorDescription);
          let userMessage = 'Authentication failed. Please try again.';
          
          if (error === 'access_denied') {
            userMessage = 'Authentication was cancelled. Please try again if you want to sign in.';
          } else if (errorDescription) {
            userMessage = decodeURIComponent(errorDescription);
          }
          
          addToast({ 
            type: 'error', 
            title: 'Authentication Error', 
            message: userMessage,
            duration: 8000
          });
          
          navigate(ROUTES.LOGIN);
          return;
        }

        // If no auth code, this might be a malformed callback
        if (!authCode) {
          console.error('❌ No auth code in callback URL');
          addToast({ 
            type: 'error', 
            title: 'Invalid Authentication Link', 
            message: 'The authentication link appears to be invalid or expired. Please try signing in again.',
            duration: 8000
          });
          navigate(ROUTES.LOGIN);
          return;
        }

        console.log('✅ Auth code found, exchanging for session...');

        // Exchange the auth code for a session
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(authCode);

        if (sessionError) {
          console.error('❌ Session exchange error:', sessionError);
          let userMessage = 'Failed to complete authentication. Please try again.';
          
          if (sessionError.message.includes('expired')) {
            userMessage = 'The authentication link has expired. Please request a new one.';
          } else if (sessionError.message.includes('invalid')) {
            userMessage = 'The authentication link is invalid. Please request a new one.';
          }
          
          addToast({ 
            type: 'error', 
            title: 'Authentication Failed', 
            message: userMessage,
            duration: 8000
          });
          
          navigate(ROUTES.LOGIN);
          return;
        }

        if (!data.session || !data.user) {
          console.error('❌ No session or user data received');
          addToast({ 
            type: 'error', 
            title: 'Authentication Incomplete', 
            message: 'Authentication was not completed successfully. Please try again.',
            duration: 8000
          });
          navigate(ROUTES.LOGIN);
          return;
        }

        console.log('✅ Session created successfully for user:', data.user.email);

        // Initialize auth to load user profile
        await initializeAuth();

        // Small delay to ensure auth state is updated
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if we have a user in the store now
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser) {
          console.log('✅ User authenticated successfully:', currentUser.email);
          
          // Determine redirect location
          const redirectTo = searchParams.get('redirect_to') || ROUTES.DASHBOARD;
          
          // Show success message
          const isNewUser = !data.user.email_confirmed_at || 
                           data.user.created_at === data.user.updated_at;
          
          addToast({ 
            type: 'success', 
            title: isNewUser ? 'Welcome!' : 'Welcome back!',
            message: isNewUser ? 
              'Your account has been created successfully.' : 
              'You have been signed in successfully.',
            duration: 5000
          });
          
          navigate(redirectTo, { replace: true });
        } else {
          console.warn('⚠️ Session created but user not found in store');
          addToast({ 
            type: 'warning', 
            title: 'Almost there!', 
            message: 'Authentication completed, but we need to set up your profile. Please try signing in.',
            duration: 8000
          });
          navigate(ROUTES.LOGIN);
        }

      } catch (error) {
        console.error('❌ Unexpected error in auth callback:', error);
        addToast({ 
          type: 'error', 
          title: 'Authentication Error', 
          message: 'An unexpected error occurred during authentication. Please try again.',
          duration: 8000
        });
        navigate(ROUTES.LOGIN);
      } finally {
        setIsProcessing(false);
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, initializeAuth, addToast, setLoading, clearError]);

  return (
    <PageLoading 
      message={isProcessing ? "Completing authentication..." : "Redirecting..."} 
    />
  );
}