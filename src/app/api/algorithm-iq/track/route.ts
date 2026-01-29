/**
 * Algorithm IQ - Track Prediction Endpoint
 * POST /api/algorithm-iq/track
 * 
 * Logs a prediction vs actual result for accuracy tracking.
 * Updates component reliability and generates insights.
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

interface TrackPredictionRequest {
  video_id: string;
  prediction_id?: string;
  
  // Predicted values
  predicted_dps: number;
  confidence?: number;
  component_predictions?: Record<string, number>;
  
  // Actual values (if known)
  actual_dps?: number;
  actual_views?: number;
  actual_likes?: number;
  actual_comments?: number;
  actual_shares?: number;
  actual_saves?: number;
  
  // Context
  niche?: string;
  account_size?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackPredictionRequest = await request.json();

    // Validate required fields
    if (!body.video_id || body.predicted_dps === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: video_id and predicted_dps' },
        { status: 400 }
      );
    }

    // Calculate actual DPS if metrics provided
    let actualDps = body.actual_dps;
    if (actualDps === undefined && body.actual_views !== undefined) {
      const { actual_views, actual_likes = 0, actual_comments = 0, actual_shares = 0, actual_saves = 0 } = body;
      
      if (actual_views > 0) {
        const engagementRate = (actual_likes + actual_comments + actual_shares + actual_saves) / actual_views;
        
        if (engagementRate >= 0.20) {
          actualDps = 80 + (engagementRate - 0.20) * 100;
        } else if (engagementRate >= 0.10) {
          actualDps = 60 + (engagementRate - 0.10) * 200;
        } else if (engagementRate >= 0.05) {
          actualDps = 40 + (engagementRate - 0.05) * 400;
        } else if (engagementRate >= 0.03) {
          actualDps = 30 + (engagementRate - 0.03) * 500;
        } else {
          actualDps = engagementRate * 1000;
        }

        // Views multiplier
        let viewsMultiplier = 1.0;
        if (actual_views >= 1000000) viewsMultiplier = 1.1;
        else if (actual_views >= 100000) viewsMultiplier = 1.05;
        else if (actual_views < 10000) viewsMultiplier = 0.95;

        actualDps = Math.max(0, Math.min(100, actualDps * viewsMultiplier));
      }
    }

    // Calculate error metrics if we have actual DPS
    const errorDelta = actualDps !== undefined ? body.predicted_dps - actualDps : null;
    const errorDeltaAbs = errorDelta !== null ? Math.abs(errorDelta) : null;
    const withinThreshold = errorDeltaAbs !== null ? errorDeltaAbs <= 10 : null;
    const validationStatus = actualDps !== undefined ? 'validated' : 'pending';

    // Insert tracking record
    const { data: tracking, error: trackingError } = await supabase
      .from('prediction_tracking')
      .insert({
        video_id: body.video_id,
        prediction_id: body.prediction_id,
        predicted_dps: body.predicted_dps,
        confidence: body.confidence,
        component_predictions: body.component_predictions || {},
        actual_dps: actualDps,
        actual_metrics_at: actualDps !== undefined ? new Date().toISOString() : null,
        error_delta: errorDelta,
        error_delta_abs: errorDeltaAbs,
        within_threshold: withinThreshold,
        niche: body.niche,
        account_size: body.account_size,
        validation_status: validationStatus
      })
      .select()
      .single();

    if (trackingError) {
      console.error('[Algorithm IQ] Error inserting tracking record:', trackingError);
      return NextResponse.json(
        { success: false, error: 'Failed to insert tracking record', details: trackingError.message },
        { status: 500 }
      );
    }

    // If validated, update component reliability scores
    if (validationStatus === 'validated' && body.component_predictions) {
      for (const [componentId, componentPrediction] of Object.entries(body.component_predictions)) {
        try {
          await supabase.rpc('update_component_reliability', {
            p_component_id: componentId,
            p_predicted_dps: componentPrediction,
            p_actual_dps: actualDps,
            p_niche: body.niche || 'unknown',
            p_account_size: body.account_size || 'unknown'
          });
        } catch (err) {
          console.warn(`[Algorithm IQ] Failed to update reliability for ${componentId}:`, err);
        }
      }

      // Generate insight if significant error
      if (errorDeltaAbs !== null && errorDeltaAbs > 20) {
        await generateInsight({
          type: 'deficiency',
          title: `Large prediction error for ${body.niche || 'unknown'} content`,
          description: `Predicted ${body.predicted_dps.toFixed(1)} DPS but actual was ${actualDps!.toFixed(1)} (error: ${errorDelta!.toFixed(1)})`,
          impactValue: errorDelta,
          niche: body.niche,
          evidence: {
            video_id: body.video_id,
            predicted: body.predicted_dps,
            actual: actualDps,
            component_predictions: body.component_predictions
          }
        });
      }
    }

    // Update daily performance (async, don't wait)
    supabase.rpc('update_daily_performance', { p_date: new Date().toISOString().split('T')[0] })
      .then(() => console.log('[Algorithm IQ] Daily performance updated'))
      .catch(err => console.warn('[Algorithm IQ] Failed to update daily performance:', err));

    return NextResponse.json({
      success: true,
      data: {
        id: tracking.id,
        video_id: tracking.video_id,
        predicted_dps: tracking.predicted_dps,
        actual_dps: tracking.actual_dps,
        error_delta: tracking.error_delta,
        within_threshold: tracking.within_threshold,
        validation_status: tracking.validation_status
      }
    });

  } catch (error: any) {
    console.error('[Algorithm IQ] Track error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper to generate learning insights
async function generateInsight(params: {
  type: 'learned' | 'deficiency' | 'improvement' | 'anomaly';
  title: string;
  description: string;
  impactValue?: number | null;
  componentId?: string;
  niche?: string;
  evidence?: any;
}) {
  try {
    await supabase
      .from('algorithm_learning_insights')
      .insert({
        insight_type: params.type,
        title: params.title,
        description: params.description,
        impact_value: params.impactValue,
        impact_direction: params.impactValue !== null && params.impactValue !== undefined
          ? (params.impactValue > 0 ? 'positive' : params.impactValue < 0 ? 'negative' : 'neutral')
          : 'neutral',
        component_id: params.componentId,
        niche: params.niche,
        evidence: params.evidence || {}
      });
  } catch (err) {
    console.warn('[Algorithm IQ] Failed to generate insight:', err);
  }
}

// PATCH endpoint to update an existing prediction with actual results
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tracking_id, video_id, actual_dps, actual_views, actual_likes, actual_comments, actual_shares, actual_saves } = body;

    if (!tracking_id && !video_id) {
      return NextResponse.json(
        { success: false, error: 'Must provide tracking_id or video_id' },
        { status: 400 }
      );
    }

    // Calculate actual DPS if metrics provided
    let calculatedDps = actual_dps;
    if (calculatedDps === undefined && actual_views !== undefined && actual_views > 0) {
      const engagementRate = ((actual_likes || 0) + (actual_comments || 0) + (actual_shares || 0) + (actual_saves || 0)) / actual_views;
      
      if (engagementRate >= 0.20) {
        calculatedDps = 80 + (engagementRate - 0.20) * 100;
      } else if (engagementRate >= 0.10) {
        calculatedDps = 60 + (engagementRate - 0.10) * 200;
      } else if (engagementRate >= 0.05) {
        calculatedDps = 40 + (engagementRate - 0.05) * 400;
      } else if (engagementRate >= 0.03) {
        calculatedDps = 30 + (engagementRate - 0.03) * 500;
      } else {
        calculatedDps = engagementRate * 1000;
      }

      let viewsMultiplier = 1.0;
      if (actual_views >= 1000000) viewsMultiplier = 1.1;
      else if (actual_views >= 100000) viewsMultiplier = 1.05;
      else if (actual_views < 10000) viewsMultiplier = 0.95;

      calculatedDps = Math.max(0, Math.min(100, calculatedDps * viewsMultiplier));
    }

    if (calculatedDps === undefined) {
      return NextResponse.json(
        { success: false, error: 'Must provide actual_dps or actual metrics' },
        { status: 400 }
      );
    }

    // Get existing tracking record
    let query = supabase.from('prediction_tracking').select('*');
    if (tracking_id) {
      query = query.eq('id', tracking_id);
    } else {
      query = query.eq('video_id', video_id).eq('validation_status', 'pending').order('created_at', { ascending: false }).limit(1);
    }

    const { data: existing, error: fetchError } = await query.single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Tracking record not found' },
        { status: 404 }
      );
    }

    // Calculate errors
    const errorDelta = existing.predicted_dps - calculatedDps;
    const errorDeltaAbs = Math.abs(errorDelta);
    const withinThreshold = errorDeltaAbs <= 10;

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('prediction_tracking')
      .update({
        actual_dps: calculatedDps,
        actual_metrics_at: new Date().toISOString(),
        error_delta: errorDelta,
        error_delta_abs: errorDeltaAbs,
        within_threshold: withinThreshold,
        validation_status: 'validated'
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update tracking record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error: any) {
    console.error('[Algorithm IQ] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
















