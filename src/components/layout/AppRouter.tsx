import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { 
  LoginPage, 
  RegisterPage, 
  ForgotPasswordPage, 
  ResetPasswordPage,
  AuthCallbackPage 
} from '../../pages/auth';
import { DashboardPage } from '../../pages/DashboardPage';
import { ChatPage, ChatListPage } from '../../pages/chat';
import { RequestsPage } from '../../pages/requests';
import { ROUTES } from '../../constants';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - redirect to dashboard if authenticated */}
        <Route 
          path={ROUTES.LOGIN} 
          element={
            <AuthGuard requireAuth={false}>
              <LoginPage />
            </AuthGuard>
          } 
        />
        <Route 
          path={ROUTES.REGISTER} 
          element={
            <AuthGuard requireAuth={false}>
              <RegisterPage />
            </AuthGuard>
          } 
        />
        <Route 
          path={ROUTES.FORGOT_PASSWORD} 
          element={
            <AuthGuard requireAuth={false}>
              <ForgotPasswordPage />
            </AuthGuard>
          } 
        />
        
        {/* Auth callback and reset password routes */}
        <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        
        {/* Protected routes - require authentication */}
        <Route 
          path={ROUTES.DASHBOARD} 
          element={
            <AuthGuard requireAuth={true}>
              <DashboardPage />
            </AuthGuard>
          } 
        />
        
        {/* Chat routes */}
        <Route 
          path={ROUTES.CHAT} 
          element={
            <AuthGuard requireAuth={true}>
              <ChatListPage />
            </AuthGuard>
          } 
        />
        <Route 
          path={ROUTES.CHAT_ROOM} 
          element={
            <AuthGuard requireAuth={true}>
              <ChatPage />
            </AuthGuard>
          } 
        />
        
        {/* Requests route */}
        <Route 
          path={ROUTES.REQUESTS} 
          element={
            <AuthGuard requireAuth={true}>
              <RequestsPage />
            </AuthGuard>
          } 
        />
        
        {/* Default redirects */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}