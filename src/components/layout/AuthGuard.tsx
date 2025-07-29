import { type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageLoading } from '../ui';
import { useAuthStore } from '../../store';
import { ROUTES } from '../../constants';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string | undefined;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo 
}: AuthGuardProps) {
  const { user, isLoading, isInitialized, initializeAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (requireAuth && !user) {
      // Store the attempted location for redirect after login
      const returnTo = location.pathname !== ROUTES.HOME ? location.pathname : ROUTES.DASHBOARD;
      navigate(redirectTo || ROUTES.LOGIN, { 
        state: { from: returnTo },
        replace: true 
      });
    } else if (!requireAuth && user) {
      // Redirect authenticated users away from auth pages
      const from = location.state?.from || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    }
  }, [
    user, 
    isLoading, 
    isInitialized, 
    requireAuth, 
    navigate, 
    location, 
    redirectTo
  ]);

  // Show loading while initializing auth or redirecting
  if (!isInitialized || isLoading) {
    return <PageLoading message="Checking authentication..." />;
  }

  // Show loading while redirecting
  if (requireAuth && !user) {
    return <PageLoading message="Redirecting to login..." />;
  }

  if (!requireAuth && user) {
    return <PageLoading message="Redirecting..." />;
  }

  return <>{children}</>;
}

// Higher-order component for protected routes
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth = true,
  redirectTo?: string
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard requireAuth={requireAuth} redirectTo={redirectTo}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}