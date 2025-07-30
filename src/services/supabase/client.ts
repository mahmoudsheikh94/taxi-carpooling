import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { apiConfig, isProd } from '../../config/env';

const supabaseUrl = apiConfig.supabase.url;
const supabaseAnonKey = apiConfig.supabase.anonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Client-Info': `taxi-carpooling-web@${isProd ? 'production' : 'development'}`,
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: unknown): string => {
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message as string;
  }
  return 'An unexpected error occurred';
};