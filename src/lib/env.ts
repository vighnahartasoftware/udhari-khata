import { z } from 'zod';

const envSchema = z
  .object({
    VITE_APP_NAME: z.string().default('Udhari Khata'),
    VITE_APP_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    VITE_DATA_MODE: z.enum(['local', 'supabase']).default('local'),
    VITE_ENABLE_PWA: z
      .string()
      .transform((val) => val === 'true')
      .default('true'),
    VITE_SUPABASE_URL: z.string().optional().default(''),
    VITE_SUPABASE_ANON_KEY: z.string().optional().default(''),
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

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error(
    `Invalid environment variables: ${JSON.stringify(_env.error.format(), null, 2)}`
  );
}

export const env = _env.data;
export type Env = z.infer<typeof envSchema>;
