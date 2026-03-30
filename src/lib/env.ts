// Provide safe fallbacks to avoid build-time crashes when env vars are absent
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
// Fall back to anon key at build-time if service key is not provided
export const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
export const ACCURACY_DEV_STORE = String(process.env.ACCURACY_DEV_STORE || '').toLowerCase() === 'true';

export function logSupabaseRuntimeEnv() {
  // Minimal one-line log as requested
  // eslint-disable-next-line no-console
  console.log('RUNTIME ENV', !!SUPABASE_URL, !!SUPABASE_SERVICE_KEY);
}


















































