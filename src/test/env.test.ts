import { describe, it, expect } from 'vitest';
import { env } from '@/lib/env';

describe('Environment Variables Validation', () => {
  it('loads valid environment variables using Zod schema', () => {
    expect(env.VITE_APP_NAME).toBe('Udhari Khata');
    expect(env.VITE_SUPABASE_URL).toBeDefined();
    expect(env.VITE_SUPABASE_ANON_KEY).toBeDefined();
    expect(env.VITE_APP_ENV).toBe('development');
  });
});
