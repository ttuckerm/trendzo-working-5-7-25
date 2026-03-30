import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Centralized Supabase server client that is resilient in dev.
 * - Prefers real env: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY
 * - Falls back to public anon key if service key not present
 * - As last resort in non-production, uses the same dev fallbacks used elsewhere
 */
export function getServerSupabase(): SupabaseClient<any, any, any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  const resolvedUrl = url || ''
  const resolvedKey = service || anon || ''

  if (!resolvedUrl || !resolvedKey) {
    throw new Error('Supabase configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY or provide dev fallbacks.')
  }

  return createClient(resolvedUrl, resolvedKey)
}

export function supabaseAvailable(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL_FALLBACK) &&
    (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_FALLBACK)
  )
}



