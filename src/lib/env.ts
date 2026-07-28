import { z } from 'zod';

const DEFAULT_SUPABASE_URL = 'https://qcwfzovkzycakjekxfxh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_b5o9QiAFzsqdVFLRplYmew_COlWErL9';

const envSchema = z
  .object({
    VITE_APP_NAME: z.string().default('Udhari Khata'),
    VITE_APP_ENV: z.enum(['development', 'staging', 'production', 'test']).default('production'),
    VITE_DATA_MODE: z.enum(['local', 'supabase']).default('supabase'),
    VITE_ENABLE_PWA: z
      .string()
      .transform((val) => val === 'true')
      .default('true'),
    VITE_SUPABASE_URL: z.string().default(DEFAULT_SUPABASE_URL),
    VITE_SUPABASE_ANON_KEY: z.string().default(DEFAULT_SUPABASE_ANON_KEY),
  })
  .superRefine((data, ctx) => {
    if (data.VITE_DATA_MODE === 'supabase') {
      if (!data.VITE_SUPABASE_URL || !data.VITE_SUPABASE_URL.startsWith('http')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VITE_SUPABASE_URL is required when VITE_DATA_MODE=supabase',
          path: ['VITE_SUPABASE_URL'],
        });
      }
      if (!data.VITE_SUPABASE_ANON_KEY || data.VITE_SUPABASE_ANON_KEY.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VITE_SUPABASE_ANON_KEY is required when VITE_DATA_MODE=supabase',
          path: ['VITE_SUPABASE_ANON_KEY'],
        });
      }
    }
  });

const rawEnv = {
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Udhari Khata',
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'production',
  VITE_DATA_MODE: import.meta.env.VITE_DATA_MODE || 'supabase',
  VITE_ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA || 'true',
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
};

const _env = envSchema.safeParse(rawEnv);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`
  );
}

export const env = _env.data;
export type Env = z.infer<typeof envSchema>;
