import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { env, features, buildInfo, isProd } from './env';

// Sentry configuration
export function initSentry() {
  if (!features.enableSentry) {
    console.log('Sentry disabled - not in production or DSN not configured');
    return;
  }

  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.NODE_ENV,
    release: buildInfo.version,
    
    // Performance monitoring
    integrations: [
      new BrowserTracing({
        // Capture interactions
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
        
        // Capture page load and navigation transactions
        startTransactionOnLocationChange: true,
        startTransactionOnPageLoad: true,
        
        // Auto-instrument HTTP requests
        tracingOrigins: [
          env.VITE_APP_URL,
          env.VITE_SUPABASE_URL,
          /^\//,  // Relative URLs
        ],
        
        // Performance settings
        idleTimeout: 5000,
        finalTimeout: 30000,
        heartbeatInterval: 5000,
      }),
    ],

    // Sample rates
    tracesSampleRate: isProd ? 0.1 : 1.0, // 10% in production, 100% in development
    profilesSampleRate: isProd ? 0.1 : 1.0,
    
    // Session replay (only in production with lower sample rate)
    replaysSessionSampleRate: isProd ? 0.01 : 0, // 1% in production
    replaysOnErrorSampleRate: isProd ? 0.1 : 0, // 10% when errors occur
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      
      if (error instanceof Error) {
        // Ignore network errors in development
        if (!isProd && error.message.includes('Network Error')) {
          return null;
        }
        
        // Ignore ResizeObserver errors (browser bug)
        if (error.message.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
        
        // Ignore non-Error objects
        if (typeof error === 'string' && error.includes('Non-Error')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: 'taxi-carpooling-web',
        buildTime: buildInfo.buildTime,
      },
      contexts: {
        app: {
          name: env.VITE_APP_NAME,
          version: buildInfo.version,
          build_time: buildInfo.buildTime,
        },
        runtime: {
          name: 'browser',
          version: navigator.userAgent,
        },
      },
    },
    
    // Debug mode in development
    debug: !isProd,
    
    // Capture unhandled promise rejections
    captureUnhandledRejections: true,
    
    // Auto session tracking
    autoSessionTracking: true,
    
    // Send client reports
    sendClientReports: isProd,
  });

  // Set user context when available
  const setUserContext = (user: { id: string; email?: string; name?: string }) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  };

  // Set additional context
  const setAppContext = (context: Record<string, any>) => {
    Sentry.setContext('app_state', context);
  };

  // Add breadcrumb for important events
  const addBreadcrumb = (message: string, category: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  };

  // Performance monitoring helpers
  const startTransaction = (name: string, op: string) => {
    return Sentry.startTransaction({ name, op });
  };

  const captureException = (error: Error, context?: Record<string, any>) => {
    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
  };

  const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
    Sentry.withScope(scope => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureMessage(message, level);
    });
  };

  console.log('✅ Sentry initialized for error tracking and performance monitoring');

  return {
    setUserContext,
    setAppContext,
    addBreadcrumb,
    startTransaction,
    captureException,
    captureMessage,
  };
}

// Export Sentry utilities
export const sentryUtils = {
  captureException: (error: Error, context?: Record<string, any>) => {
    if (features.enableSentry) {
      Sentry.withScope(scope => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        Sentry.captureException(error);
      });
    } else {
      console.error('Error captured (Sentry disabled):', error, context);
    }
  },
  
  captureMessage: (message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) => {
    if (features.enableSentry) {
      Sentry.withScope(scope => {
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
          });
        }
        Sentry.captureMessage(message, level);
      });
    } else {
      console.log(`Message captured (Sentry disabled) [${level}]:`, message, context);
    }
  },
  
  addBreadcrumb: (message: string, category: string, data?: Record<string, any>) => {
    if (features.enableSentry) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
        timestamp: Date.now() / 1000,
      });
    } else {
      console.log(`Breadcrumb (Sentry disabled) [${category}]:`, message, data);
    }
  },
  
  setUserContext: (user: { id: string; email?: string; name?: string }) => {
    if (features.enableSentry) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    }
  },
  
  setContext: (key: string, context: Record<string, any>) => {
    if (features.enableSentry) {
      Sentry.setContext(key, context);
    }
  },
};

// React Error Boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Performance monitoring hook
export function usePerformanceMonitoring(transactionName: string, op: string = 'navigation') {
  React.useEffect(() => {
    if (!features.enableSentry) return;
    
    const transaction = Sentry.startTransaction({ name: transactionName, op });
    
    return () => {
      transaction.finish();
    };
  }, [transactionName, op]);
}

// Add missing imports
import React from 'react';
import { 
  useLocation, 
  useNavigationType, 
  createRoutesFromChildren, 
  matchRoutes 
} from 'react-router-dom';