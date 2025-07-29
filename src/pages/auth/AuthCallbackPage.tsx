import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLoading } from '../../components/ui';
import { useAuthStore } from '../../store';
import { ROUTES } from '../../constants';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { initializeAuth, user } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      await initializeAuth();
      
      // Give some time for auth state to update
      setTimeout(() => {
        if (user) {
          navigate(ROUTES.DASHBOARD);
        } else {
          navigate(ROUTES.LOGIN);
        }
      }, 1000);
    };

    handleAuthCallback();
  }, [initializeAuth, navigate, user]);

  return <PageLoading message="Completing sign in..." />;
}