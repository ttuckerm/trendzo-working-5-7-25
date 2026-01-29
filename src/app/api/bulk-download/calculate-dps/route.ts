/**
 * Bulk Download Actual DPS Calculation API
 * 
 * POST /api/bulk-download/calculate-dps - Calculate actual DPS from metrics and compare with prediction
 * 
 * Takes actual video metrics (views, likes, comments, shares, saves),
 * calculates actual DPS, compares with predicted DPS, and feeds
 * results to the learning loop.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface CalculateDpsRequest {
  itemId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

/**
 * Calculate DPS score from engagement metrics
 * Same formula as used in upload-test page
 */
function calculateDPS(v: number, l: number, c: number, sh: number, sv: number): number {
  if (v === 0) return 0;

  // Calculate engagement rate
  const engagementRate = (l + c + sh + sv) / v;

  // TikTok benchmark: 3-9% is average, 10%+ is good, 20%+ is viral
  // Map engagement rate to DPS score
  let baseScore = 0;

  if (engagementRate >= 0.20) {
    baseScore = 80 + (engagementRate - 0.20) * 100; // 80-100 for 20%+
  } else if (engagementRate >= 0.10) {
    baseScore = 60 + (engagementRate - 0.10) * 200; // 60-80 for 10-20%
  } else if (engagementRate >= 0.05) {
    baseScore = 40 + (engagementRate - 0.05) * 400; // 40-60 for 5-10%
  } else if (engagementRate >= 0.03) {
    baseScore = 30 + (engagementRate - 0.03) * 500; // 30-40 for 3-5%
  } else {
    baseScore = engagementRate * 1000; // 0-30 for <3%
  }

  // Views multiplier (more views = higher confidence in the score)
  let viewsMultiplier = 1.0;
  if (v >= 1000000) viewsMultiplier = 1.1;
  else if (v >= 100000) viewsMultiplier = 1.05;
  else if (v < 10000) viewsMultiplier = 0.95;

  return Math.max(0, Math.min(100, baseScore * viewsMultiplier));
}

/**
 * POST - Calculate actual DPS and compare with prediction
 */
export async function POST(request: NextRequest) {
  try {
    const body: CalculateDpsRequest = await request.json();

    if (!body.itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Validate metrics
    const { views, likes, comments, shares, saves } = body;
    if (views === undefined || likes === undefined || comments === undefined || 
        shares === undefined || saves === undefined) {
      return NextResponse.json(
        { success: false, error: 'All metrics are required: views, likes, comments, shares, saves' },
        { status: 400 }
      );
    }

    // Get the download item with prediction
    const { data: item, error: itemError } = await supabase
      .from('bulk_download_items')
      .select('*')
      .eq('id', body.itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: 'Download item not found' },
        { status: 404 }
      );
    }

    if (!item.predicted_dps) {
      return NextResponse.json(
        { success: false, error: 'No prediction found for this item. Run prediction first.' },
        { status: 400 }
      );
    }

    // Calculate actual DPS
    const actualDps = calculateDPS(views, likes, comments, shares, saves);
    const predictedDps = item.predicted_dps;
    
    // Calculate error and comparison
    const error = predictedDps - actualDps;
    const errorPct = actualDps > 0 ? (Math.abs(error) / actualDps) * 100 : 0;
    const withinRange = actualDps >= (item.predicted_range_low || 0) && 
                        actualDps <= (item.predicted_range_high || 100);

    const engagementRate = ((likes + comments + shares + saves) / views) * 100;

    const comparisonData = {
      predicted: predictedDps,
      actual: actualDps,
      error,
      errorPct,
      withinRange,
      engagementRate,
      metrics: { views, likes, comments, shares, saves },
      calculatedAt: new Date().toISOString()
    };

    // Update the download item with actual metrics and comparison
    const { error: updateError } = await supabase
      .from('bulk_download_items')
      .update({
        actual_dps: actualDps,
        actual_views: views,
        actual_likes: likes,
        actual_comments: comments,
        actual_shares: shares,
        actual_saves: saves,
        comparison_data: comparisonData
      })
      .eq('id', body.itemId);

    if (updateError) {
      console.error('[Calculate DPS] Failed to save comparison:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save comparison results' },
        { status: 500 }
      );
    }

    // Feed to learning loop if we have a prediction_id
    let learningUpdated = false;
    let learningInsights: any = null;

    if (item.prediction_id) {
      try {
        // Get niche and account size from prediction data
        const predictionData = item.prediction_data || {};
        const niche = predictionData.niche || 'general';
        const accountSize = predictionData.accountSize || 'medium (10K-100K)';

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
        const learningResponse = await fetch(`${baseUrl}/api/learning/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prediction_id: item.prediction_id,
            video_id: item.video_id,
            actual_views: views,
            actual_likes: likes,
            actual_comments: comments,
            actual_shares: shares,
            actual_saves: saves,
            niche,
            account_size: accountSize
          })
        });

        const learningData = await learningResponse.json();
        if (learningData.success) {
          learningUpdated = true;
          learningInsights = {
            componentsUpdated: learningData.components_updated,
            insights: learningData.insights
          };
          console.log('[Calculate DPS] ✓ Learning loop updated');
        }
      } catch (learningError: any) {
        console.warn('[Calculate DPS] Learning update failed:', learningError.message);
        // Don't fail the request - learning is optional
      }
    }

    console.log(`[Calculate DPS] ✓ ${item.video_id}: Predicted ${predictedDps.toFixed(1)} vs Actual ${actualDps.toFixed(1)} (${error > 0 ? '+' : ''}${error.toFixed(1)} DPS)`);

    return NextResponse.json({
      success: true,
      data: {
        itemId: body.itemId,
        videoId: item.video_id,
        predicted: predictedDps,
        actual: actualDps,
        error,
        errorPct,
        withinRange,
        engagementRate,
        metrics: { views, likes, comments, shares, saves },
        learningUpdated,
        learningInsights,
        interpretation: getInterpretation(error, actualDps, withinRange)
      }
    });

  } catch (error: any) {
    console.error('[Calculate DPS] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable interpretation of the comparison
 */
function getInterpretation(error: number, actualDps: number, withinRange: boolean): {
  type: 'accurate' | 'over' | 'under';
  severity: 'low' | 'medium' | 'high';
  message: string;
} {
  const absError = Math.abs(error);
  
  if (absError <= 10) {
    return {
      type: 'accurate',
      severity: 'low',
      message: `Accurate prediction - within ±10 DPS. The model correctly identified this video's viral potential.`
    };
  }
  
  if (error > 0) {
    // Over-prediction
    const severity = absError > 20 ? 'high' : 'medium';
    return {
      type: 'over',
      severity,
      message: `Over-predicted by ${absError.toFixed(1)} DPS. The model overestimated this video's engagement potential.`
    };
  } else {
    // Under-prediction (actually good - video did better than expected)
    const severity = absError > 20 ? 'high' : 'medium';
    return {
      type: 'under',
      severity,
      message: `Under-predicted by ${absError.toFixed(1)} DPS. The video performed better than expected - the model was conservative.`
    };
  }
}










