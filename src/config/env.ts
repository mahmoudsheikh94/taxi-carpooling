import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  // Supabase Configuration
  VITE_SUPABASE_URL: z.string().url('Invalid Supabase URL').min(1, 'Supabase URL is required'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  
  // Google Maps API
  VITE_GOOGLE_MAPS_API_KEY: z.string().min(1, 'Google Maps API key is required'),
  
  // Application Configuration
  VITE_APP_URL: z.string().url('Invalid app URL').min(1, 'App URL is required'),
  VITE_APP_NAME: z.string().min(1, 'App name is required').default('Taxi Carpooling'),
  
  // Optional: Analytics and Monitoring
  VITE_SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  VITE_GA_MEASUREMENT_ID: z.string().optional(),
  VITE_PLAUSIBLE_DOMAIN: z.string().optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().optional(),
  PROD: z.boolean().optional(),
  
  // Build Configuration (Optional - auto-generated if not provided)
  VITE_BUILD_VERSION: z.string().optional(),
  VITE_BUILD_TIME: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnv(): Env {
  try {
    const env = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      VITE_APP_URL: import.meta.env.VITE_APP_URL,
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
      VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
      VITE_GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
      VITE_PLAUSIBLE_DOMAIN: import.meta.env.VITE_PLAUSIBLE_DOMAIN,
      NODE_ENV: import.meta.env.NODE_ENV,
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
      VITE_BUILD_VERSION: import.meta.env.VITE_BUILD_VERSION,
      VITE_BUILD_TIME: import.meta.env.VITE_BUILD_TIME,
    };

    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      
      console.error('❌ Environment validation failed:');
      console.error(errorMessages.join('\n'));
      
      throw new Error(
        `Environment validation failed:\n${errorMessages.join('\n')}`
      );
    }
    
    throw error;
  }
}

// Export validated environment
export const env = validateEnv();

// Environment helpers
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flags based on environment
export const features = {
  enableAnalytics: isProd && (!!env.VITE_GA_MEASUREMENT_ID || !!env.VITE_PLAUSIBLE_DOMAIN),
  enableSentry: isProd && !!env.VITE_SENTRY_DSN,
  enableServiceWorker: isProd,
  enablePWA: isProd,
  enableDevTools: isDev,
  enableTestIds: isDev || isTest,
} as const;

// API Configuration
export const apiConfig = {
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
  },
  googleMaps: {
    apiKey: env.VITE_GOOGLE_MAPS_API_KEY,
  },
  app: {
    url: env.VITE_APP_URL,
    name: env.VITE_APP_NAME,
  },
  sentry: {
    dsn: env.VITE_SENTRY_DSN,
  },
  analytics: {
    gaId: env.VITE_GA_MEASUREMENT_ID,
    plausibleDomain: env.VITE_PLAUSIBLE_DOMAIN,
  },
} as const;

// Build information with fallbacks
export const buildInfo = {
  version: env.VITE_BUILD_VERSION || 
    (typeof __BUILD_VERSION__ !== 'undefined' ? __BUILD_VERSION__ : 'development'),
  buildTime: env.VITE_BUILD_TIME || 
    (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString()),
  environment: env.NODE_ENV,
} as const;

// Log environment status (only in development)
if (isDev) {
  console.log('🔧 Environment Configuration:');
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`App Name: ${env.VITE_APP_NAME}`);
  console.log(`App URL: ${env.VITE_APP_URL}`);
  console.log(`Supabase URL: ${env.VITE_SUPABASE_URL}`);
  console.log('Features:', features);
  
  if (env.VITE_BUILD_VERSION) {
    console.log(`Build Version: ${env.VITE_BUILD_VERSION}`);
  }
  
  if (env.VITE_BUILD_TIME) {
    console.log(`Build Time: ${env.VITE_BUILD_TIME}`);
  }
}

// Runtime environment checks
export function checkRequiredServices() {
  const checks = [
    {
      name: 'Supabase URL',
      check: () => !!env.VITE_SUPABASE_URL,
      required: true,
    },
    {
      name: 'Supabase Anon Key',
      check: () => !!env.VITE_SUPABASE_ANON_KEY,
      required: true,
    },
    {
      name: 'Google Maps API Key',
      check: () => !!env.VITE_GOOGLE_MAPS_API_KEY,
      required: true,
    },
    {
      name: 'Sentry DSN',
      check: () => !!env.VITE_SENTRY_DSN,
      required: false,
    },
    {
      name: 'Analytics',
      check: () => !!(env.VITE_GA_MEASUREMENT_ID || env.VITE_PLAUSIBLE_DOMAIN),
      required: false,
    },
  ];

  const results = checks.map(({ name, check, required }) => ({
    name,
    status: check(),
    required,
  }));

  const failedRequired = results.filter(r => r.required && !r.status);
  
  if (failedRequired.length > 0) {
    console.error('❌ Required services not configured:');
    failedRequired.forEach(({ name }) => {
      console.error(`  - ${name}`);
    });
    throw new Error('Required services not configured');
  }

  if (isDev) {
    console.log('✅ Service Configuration:');
    results.forEach(({ name, status, required }) => {
      const icon = status ? '✅' : required ? '❌' : '⚠️';
      const label = required ? 'Required' : 'Optional';
      console.log(`  ${icon} ${name} (${label}): ${status ? 'OK' : 'Missing'}`);
    });
  }

  return results;
}