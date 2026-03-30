/**
 * GET /api/training/readiness-summary
 *
 * Returns rows from the training_readiness_summary Supabase VIEW.
 * Optional query param: ?niche=side_hustles
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  );
}

export async function GET(request: NextRequest) {
  noStore();
  try {
    const niche = request.nextUrl.searchParams.get('niche') || null;
    const supabase = getSupabase();

    let query = supabase.from('training_readiness_summary').select('*');
    if (niche) query = query.eq('niche', niche);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } },
      );
    }

    return NextResponse.json(
      { success: true, data: data || [], serverTimestamp: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } },
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
