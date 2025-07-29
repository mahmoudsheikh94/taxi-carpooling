import { useEffect, useState } from 'react';
import { AppRouter } from './components/layout';
import { ToastContainer } from './components/ui';
import { useInstallPrompt } from './components/ui/InstallPrompt';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { useAuthStore, useToastStore } from './store';
import { pwaManager, applyPWAUpdate } from './utils/pwa';
import { initSentry, SentryErrorBoundary, sentryUtils } from './config/sentry';
import { checkRequiredServices } from './config/env';

function App() {
  const { initializeAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const { InstallPrompt } = useInstallPrompt();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check required services
    try {
      checkRequiredServices();
    } catch (error) {
      console.error('Service configuration error:', error);
      addToast({ 
        type: 'error', 
        title: 'Configuration Error',
        message: 'Some services are not properly configured. Please check your environment settings.',
        duration: 0
      });
    }

    // Initialize Sentry
    try {
      const sentryInstance = initSentry();
      
      // Set up error tracking for critical app events
      if (sentryInstance) {
        sentryUtils.addBreadcrumb('App initialization started', 'app.lifecycle');
      }
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }

    // Initialize authentication on app start
    initializeAuth();

    // Initialize PWA features
    initializePWA();

    // Setup connection monitoring
    const unsubscribeConnection = pwaManager.onConnectionChange((online) => {
      setIsOnline(online);
      
      if (online) {
        addToast({ type: 'success', title: 'Connection restored' });
      } else {
        addToast({ 
          type: 'warning', 
          title: 'You are offline. Some features may be limited.',
          duration: 0
        });
      }
    });

    // Listen for PWA updates
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      addToast({
        type: 'info',
        title: 'A new version is available.',
        message: 'Refresh the page to get the latest features and improvements.',
        duration: 0 // Don't auto-dismiss
      });
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    // Request persistent storage for better offline experience
    pwaManager.requestPersistentStorage();

    return () => {
      unsubscribeConnection();
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, [initializeAuth, addToast]);

  const initializePWA = async () => {
    // Log PWA capabilities
    const appInfo = pwaManager.getAppInfo();
    console.log('PWA Status:', appInfo);

    // Show offline indicator if needed
    if (!isOnline) {
      addToast({ 
        type: 'warning', 
        title: 'You are offline. Some features may be limited.',
        duration: 0
      });
    }
  };

  const handleApplyUpdate = async () => {
    try {
      await applyPWAUpdate();
      setUpdateAvailable(false);
    } catch (error) {
      console.error('Failed to apply update:', error);
      addToast({ 
        type: 'error', 
        title: 'Failed to apply update. Please refresh manually.' 
      });
    }
  };

  return (
    <SentryErrorBoundary 
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We've encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>
            <button
              onClick={resetError}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      showDialog={false}
    >
      <AppRouter />
      <ToastContainer />
      <InstallPrompt 
        onInstall={(installed) => {
          if (installed) {
            addToast({ type: 'success', title: 'App installed successfully!' });
            sentryUtils.addBreadcrumb('PWA installed', 'user.action');
          }
        }}
      />
      
      {/* Connection Status Indicator */}
      <OfflineIndicator />
    </SentryErrorBoundary>
  );
}

export default App;
