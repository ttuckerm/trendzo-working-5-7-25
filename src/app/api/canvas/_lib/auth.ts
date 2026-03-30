import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolves the authenticated user and the correct Supabase client for canvas routes.
 *
 * - When the user IS authenticated: returns their userId and the original (anon-key)
 *   client, which respects RLS scoped to that user.
 * - Otherwise: returns a 401 errorResponse.
 */
export async function resolveCanvasAuth(
  anonClient: SupabaseClient
): Promise<{
  userId: string | null;
  supabase: SupabaseClient;
  errorResponse: NextResponse | null;
}> {
  const { data: { user }, error: authError } = await anonClient.auth.getUser();

  if (user) {
    return { userId: user.id, supabase: anonClient, errorResponse: null };
  }

  console.warn('[canvas auth] Unauthorized:', authError?.message ?? 'no user');
  return {
    userId: null,
    supabase: anonClient,
    errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}
