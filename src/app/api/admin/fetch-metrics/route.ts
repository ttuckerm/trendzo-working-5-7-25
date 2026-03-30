/**
 * Admin Lab: Fetch Metrics API
 *
 * POST /api/admin/fetch-metrics
 *
 * Manually enter engagement metrics for a prediction (Phase 0: manual only)
 * Phase 1: Automated via Apify scraper
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service key (Phase 0: code-level separation)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

// Legacy calculateDPS removed (2026-03-25). Ground-truth DPS is in dps-v2.ts.
// This endpoint now stores raw engagement rate for prediction_actuals display.
function calculateEngagementRate(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  bookmarks: number
): number {
  if (views === 0) return 0;
  return (likes + comments + shares + bookmarks) / views;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prediction_id,
      snapshot_type,
      views,
      likes,
      comments,
      shares,
      bookmarks
    } = body;

    // Validate input
    if (!prediction_id || !snapshot_type) {
      return NextResponse.json(
        { success: false, error: 'prediction_id and snapshot_type are required' },
        { status: 400 }
      );
    }

    const validSnapshots = ['1h', '4h', '8h', '24h', '7d', 'lifetime'];
    if (!validSnapshots.includes(snapshot_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid snapshot_type. Must be one of: ${validSnapshots.join(', ')}` },
        { status: 400 }
      );
    }

    if (views === undefined || likes === undefined || comments === undefined || shares === undefined || bookmarks === undefined) {
      return NextResponse.json(
        { success: false, error: 'All metrics required: views, likes, comments, shares, bookmarks' },
        { status: 400 }
      );
    }

    // Get prediction details for accuracy calculation
    const { data: prediction, error: predError } = await supabase
      .from('prediction_events')
      .select('*')
      .eq('id', prediction_id)
      .single();

    if (predError || !prediction) {
      return NextResponse.json(
        { success: false, error: `Prediction not found: ${prediction_id}` },
        { status: 404 }
      );
    }

    // Calculate actual DPS from metrics
    const actualDps = calculateEngagementRate(views, likes, comments, shares, bookmarks);

    // Insert metrics into prediction_actuals
    const { data: actual, error: insertError } = await supabase
      .from('prediction_actuals')
      .insert({
        prediction_id,
        snapshot_type,
        views: views || null,
        likes: likes || null,
        comments: comments || null,
        shares: shares || null,
        bookmarks: bookmarks || null,
        actual_dps: actualDps,
        fetched_at: new Date().toISOString(),
        source: 'manual'
      })
      .select()
      .single();

    if (insertError) {
      // Check if duplicate
      if (insertError.code === '23505') {
        return NextResponse.json(
          { success: false, error: `Metrics already exist for ${snapshot_type}. Update not supported in Phase 0.` },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Failed to save metrics: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Calculate accuracy
    const predictedDps = Number(prediction.predicted_dps);
    const predictionError = predictedDps - actualDps;
    const withinRange = actualDps >= Number(prediction.predicted_dps_low) &&
                       actualDps <= Number(prediction.predicted_dps_high);

    console.log(`\n✅ Metrics saved for ${snapshot_type}:`);
    console.log(`   Predicted: ${predictedDps.toFixed(1)} DPS`);
    console.log(`   Actual: ${actualDps.toFixed(1)} DPS`);
    console.log(`   Error: ${predictionError.toFixed(1)} DPS`);
    console.log(`   Within Range: ${withinRange ? 'YES' : 'NO'}\n`);

    return NextResponse.json({
      success: true,
      metrics: {
        views: actual.views,
        likes: actual.likes,
        comments: actual.comments,
        shares: actual.shares,
        bookmarks: actual.bookmarks
      },
      actual_dps: actualDps,
      predicted_dps: predictedDps,
      predicted_range: [
        Number(prediction.predicted_dps_low),
        Number(prediction.predicted_dps_high)
      ],
      prediction_error: predictionError,
      absolute_error: Math.abs(predictionError),
      within_range: withinRange,
      snapshot_type: actual.snapshot_type,
      fetched_at: actual.fetched_at,
      source: actual.source
    });

  } catch (error: any) {
    console.error('❌ Fetch metrics error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Check API status
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: 'POST /api/admin/fetch-metrics',
    description: 'Admin Lab metrics entry endpoint',
    phase: 'Phase 0: Manual entry only',
    accepts: {
      prediction_id: 'UUID (required)',
      snapshot_type: '1h | 4h | 8h | 24h | 7d | lifetime (required)',
      views: 'number (required)',
      likes: 'number (required)',
      comments: 'number (required)',
      shares: 'number (required)',
      bookmarks: 'number (required)'
    },
    returns: {
      actual_dps: 'number (calculated from metrics)',
      predicted_dps: 'number (from frozen prediction)',
      prediction_error: 'number (predicted - actual)',
      within_range: 'boolean (is actual within predicted range?)'
    }
  });
}
