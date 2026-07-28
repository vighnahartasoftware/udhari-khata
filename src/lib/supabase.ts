import { createClient, type RealtimeChannel, type Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from './env';

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey =
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDA0MDAwMDAsImV4cCI6MTkwMDA0MDAwMH0.placeholder';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: env.VITE_DATA_MODE === 'supabase',
    autoRefreshToken: env.VITE_DATA_MODE === 'supabase',
    detectSessionInUrl: env.VITE_DATA_MODE === 'supabase',
  },
});

/**
 * Authentication listener helper (Active only in Supabase mode)
 */
export function subscribeToAuthChanges(callback: (session: Session | null) => void) {
  if (env.VITE_DATA_MODE === 'local') {
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Realtime subscription manager helper (Active only in Supabase mode)
 */
export function subscribeToRealtimeChanges<T extends Record<string, unknown>>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: T) => void
): () => void {
  if (env.VITE_DATA_MODE === 'local') {
    return () => {};
  }

  const channel: RealtimeChannel = supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event, schema: 'public', table }, (payload) => {
      callback(payload.new as T);
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
