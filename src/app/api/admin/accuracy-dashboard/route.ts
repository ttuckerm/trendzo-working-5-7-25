/**
 * Admin Lab: Accuracy Dashboard API
 *
 * GET /api/admin/accuracy-dashboard
 *
 * Returns comprehensive accuracy metrics:
 * - Overall accuracy (MAE, R², within-range %, Algorithm IQ)
 * - Breakdown by snapshot type (1h, 4h, 8h, 24h, 7d, lifetime)
 * - Breakdown by niche
 * - Breakdown by account size
 * - Breakdown by model version
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateAccuracyBreakdown,
  PredictionWithActual
} from '@/lib/services/accuracy-calculator';

// Use service key (Admin Lab)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export async function GET(request: NextRequest) {
  try {
    // Query all predictions with actuals
    const { data: rawData, error: queryError } = await supabase
      .from('prediction_events')
      .select(`
        id,
        video_id,
        predicted_dps,
        predicted_dps_low,
        predicted_dps_high,
        confidence,
        model_version,
        created_at,
        video_files!inner (
          niche,
          account_size_band
        ),
        prediction_actuals!inner (
          snapshot_type,
          actual_dps,
          fetched_at
        )
      `)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { success: false, error: `Database query failed: ${queryError.message}` },
        { status: 500 }
      );
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No predictions with actuals found',
        overall: {
          total_predictions: 0,
          mae: 0,
          r2_score: 0,
          within_range_count: 0,
          within_range_percentage: 0,
          algorithm_iq: 0,
          average_confidence: 0,
          average_error: 0
        },
        by_snapshot: {},
        by_niche: {},
        by_account_size: {},
        by_model: {}
      });
    }

    // Transform data to PredictionWithActual format
    const predictions: PredictionWithActual[] = rawData.flatMap((row: any) => {
      // Handle prediction_actuals as array (Supabase joins return arrays)
      const actuals = Array.isArray(row.prediction_actuals)
        ? row.prediction_actuals
        : [row.prediction_actuals];

      // Get video metadata
      const videoMeta = Array.isArray(row.video_files)
        ? row.video_files[0]
        : row.video_files;

      return actuals.map((actual: any) => ({
        prediction_id: row.id,
        video_id: row.video_id,
        predicted_dps: Number(row.predicted_dps),
        predicted_dps_low: Number(row.predicted_dps_low),
        predicted_dps_high: Number(row.predicted_dps_high),
        actual_dps: Number(actual.actual_dps),
        confidence: Number(row.confidence),
        snapshot_type: actual.snapshot_type,
        niche: videoMeta?.niche || 'unknown',
        account_size_band: videoMeta?.account_size_band || 'unknown',
        model_version: row.model_version,
        predicted_at: row.created_at,
        fetched_at: actual.fetched_at
      }));
    });

    console.log(`\n📊 Calculating accuracy for ${predictions.length} predictions...`);

    // Calculate accuracy breakdown
    const accuracyBreakdown = calculateAccuracyBreakdown(predictions);

    console.log(`   Overall MAE: ${accuracyBreakdown.overall.mae.toFixed(2)} DPS`);
    console.log(`   Overall R²: ${accuracyBreakdown.overall.r2_score.toFixed(3)}`);
    console.log(`   Within Range: ${accuracyBreakdown.overall.within_range_percentage.toFixed(1)}%`);
    console.log(`   Algorithm IQ: ${accuracyBreakdown.overall.algorithm_iq.toFixed(1)}/100\n`);

    return NextResponse.json({
      success: true,
      overall: accuracyBreakdown.overall,
      by_snapshot: accuracyBreakdown.by_snapshot,
      by_niche: accuracyBreakdown.by_niche,
      by_account_size: accuracyBreakdown.by_account_size,
      by_model: accuracyBreakdown.by_model,
      metadata: {
        total_predictions: predictions.length,
        unique_videos: new Set(predictions.map(p => p.video_id)).size,
        date_range: {
          earliest: predictions[predictions.length - 1]?.predicted_at,
          latest: predictions[0]?.predicted_at
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Accuracy dashboard error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint - Query with filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      snapshot_type,
      niche,
      account_size,
      model_version,
      date_from,
      date_to
    } = body;

    // Build query with filters
    let query = supabase
      .from('prediction_events')
      .select(`
        id,
        video_id,
        predicted_dps,
        predicted_dps_low,
        predicted_dps_high,
        confidence,
        model_version,
        created_at,
        video_files!inner (
          niche,
          account_size_band
        ),
        prediction_actuals!inner (
          snapshot_type,
          actual_dps,
          fetched_at
        )
      `);

    // Apply filters
    if (snapshot_type) {
      query = query.eq('prediction_actuals.snapshot_type', snapshot_type);
    }

    if (niche) {
      query = query.eq('video_files.niche', niche);
    }

    if (account_size) {
      query = query.eq('video_files.account_size_band', account_size);
    }

    if (model_version) {
      query = query.eq('model_version', model_version);
    }

    if (date_from) {
      query = query.gte('created_at', date_from);
    }

    if (date_to) {
      query = query.lte('created_at', date_to);
    }

    query = query.order('created_at', { ascending: false });

    const { data: rawData, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json(
        { success: false, error: `Query failed: ${queryError.message}` },
        { status: 500 }
      );
    }

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No predictions found matching filters',
        overall: {
          total_predictions: 0,
          mae: 0,
          r2_score: 0,
          within_range_count: 0,
          within_range_percentage: 0,
          algorithm_iq: 0,
          average_confidence: 0,
          average_error: 0
        },
        filters_applied: { snapshot_type, niche, account_size, model_version, date_from, date_to }
      });
    }

    // Transform data
    const predictions: PredictionWithActual[] = rawData.flatMap((row: any) => {
      const actuals = Array.isArray(row.prediction_actuals)
        ? row.prediction_actuals
        : [row.prediction_actuals];

      const videoMeta = Array.isArray(row.video_files)
        ? row.video_files[0]
        : row.video_files;

      return actuals.map((actual: any) => ({
        prediction_id: row.id,
        video_id: row.video_id,
        predicted_dps: Number(row.predicted_dps),
        predicted_dps_low: Number(row.predicted_dps_low),
        predicted_dps_high: Number(row.predicted_dps_high),
        actual_dps: Number(actual.actual_dps),
        confidence: Number(row.confidence),
        snapshot_type: actual.snapshot_type,
        niche: videoMeta?.niche || 'unknown',
        account_size_band: videoMeta?.account_size_band || 'unknown',
        model_version: row.model_version,
        predicted_at: row.created_at,
        fetched_at: actual.fetched_at
      }));
    });

    // Calculate accuracy
    const accuracyBreakdown = calculateAccuracyBreakdown(predictions);

    return NextResponse.json({
      success: true,
      overall: accuracyBreakdown.overall,
      by_snapshot: accuracyBreakdown.by_snapshot,
      by_niche: accuracyBreakdown.by_niche,
      by_account_size: accuracyBreakdown.by_account_size,
      by_model: accuracyBreakdown.by_model,
      filters_applied: { snapshot_type, niche, account_size, model_version, date_from, date_to },
      metadata: {
        total_predictions: predictions.length,
        unique_videos: new Set(predictions.map(p => p.video_id)).size
      }
    });

  } catch (error: any) {
    console.error('❌ Filtered accuracy error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
