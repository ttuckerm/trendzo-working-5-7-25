/**
 * GET /api/training/readiness-summary/not-ready?niche=side_hustles&limit=50
 *
 * Returns the most recent N rows from prediction_runs_enriched where training_ready = false,
 * including the columns needed to display a "why not ready" reason.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

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
    const niche = (request.nextUrl.searchParams.get('niche') || 'side-hustles').toLowerCase().replace(/_/g, '-');
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '50', 10),
      200,
    );

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('prediction_runs_enriched')
      .select(
        'id, video_id, status, actual_dps, has_raw_result, has_components, ' +
        'created_at, niche, tiktok_url, account_size_band, predicted_dps_7d, ' +
        'dps_formula_version, dps_label_trust, dps_training_weight, training_label_eligible',
      )
      .eq('niche', niche)
      .eq('training_ready', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[not-ready] Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message, rows: [] },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, rows: data || [] });
  } catch (err: any) {
    console.error('[not-ready] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message, rows: [] },
      { status: 500 },
    );
  }
}
