import { createClient, type RealtimeChannel, type Session } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { env } from './env';

const DEFAULT_SUPABASE_URL = 'https://qcwfzovkzycakjekxfxh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_b5o9QiAFzsqdVFLRplYmew_COlWErL9';

const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Authentication listener helper
 */
export function subscribeToAuthChanges(callback: (session: Session | null) => void) {
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
 * Realtime subscription manager helper
 */
export function subscribeToRealtimeChanges<T extends Record<string, unknown>>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: T) => void
): () => void {
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
