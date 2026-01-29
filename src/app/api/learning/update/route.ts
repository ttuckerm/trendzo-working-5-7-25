/**
 * Learning Loop Update API
 *
 * POST /api/learning/update
 *
 * Receives actual video metrics and updates component reliability scores.
 * This is the core of the learning loop - Kai gets smarter with each outcome.
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

interface UpdateLearningRequest {
  prediction_id: string;
  video_id: string;

  // Actual metrics
  actual_views: number;
  actual_likes: number;
  actual_comments: number;
  actual_shares: number;
  actual_saves: number;

  // Context (for niche/account-specific learning)
  niche?: string;
  account_size?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateLearningRequest = await request.json();

    // Validate required fields
    if (!body.prediction_id || !body.video_id || !body.actual_views) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate actual DPS
    const { actual_views, actual_likes, actual_comments, actual_shares, actual_saves } = body;
    const engagementRate = (actual_likes + actual_comments + actual_shares + actual_saves) / actual_views;

    let actualDPS = 0;
    if (engagementRate >= 0.20) {
      actualDPS = 80 + (engagementRate - 0.20) * 100;
    } else if (engagementRate >= 0.10) {
      actualDPS = 60 + (engagementRate - 0.10) * 200;
    } else if (engagementRate >= 0.05) {
      actualDPS = 40 + (engagementRate - 0.05) * 400;
    } else if (engagementRate >= 0.03) {
      actualDPS = 30 + (engagementRate - 0.03) * 500;
    } else {
      actualDPS = engagementRate * 1000;
    }

    // Views multiplier
    let viewsMultiplier = 1.0;
    if (actual_views >= 1000000) viewsMultiplier = 1.1;
    else if (actual_views >= 100000) viewsMultiplier = 1.05;
    else if (actual_views < 10000) viewsMultiplier = 0.95;

    actualDPS = Math.max(0, Math.min(100, actualDPS * viewsMultiplier));

    // Fetch the original prediction from prediction_runs (canonical table)
    const { data: prediction, error: predictionError } = await supabase
      .from('prediction_runs')
      .select('*')
      .eq('id', body.prediction_id)
      .single();

    if (predictionError || !prediction) {
      console.error('Prediction lookup error:', predictionError);
      return NextResponse.json(
        { success: false, error: 'Prediction not found in prediction_runs' },
        { status: 404 }
      );
    }

    const predictedDPS = prediction.predicted_dps_7d;
    const accuracyDelta = predictedDPS - actualDPS;
    const accuracyDeltaPct = (Math.abs(accuracyDelta) / Math.max(actualDPS, 1)) * 100;
    const withinRange = actualDPS >= (prediction.prediction_range_low || 0) && actualDPS <= (prediction.prediction_range_high || 100);
    
    // Update prediction_runs with actual metrics
    const { error: updatePredictionError } = await supabase
      .from('prediction_runs')
      .update({
        actual_views,
        actual_likes,
        actual_comments,
        actual_shares,
        actual_saves,
        actual_dps: actualDPS,
        prediction_error: accuracyDelta,
        prediction_error_pct: accuracyDeltaPct,
        within_range: withinRange,
        actuals_entered_at: new Date().toISOString()
      })
      .eq('id', body.prediction_id);
    
    if (updatePredictionError) {
      console.warn('Failed to update prediction_runs with actuals:', updatePredictionError.message);
      // Continue anyway - the prediction_outcomes table will have the data
    } else {
      console.log(`[Learning] Updated prediction_runs ${body.prediction_id} with actual DPS: ${actualDPS.toFixed(1)}`);
    }

    // Calculate component-level deltas from raw_result.componentResults
    const componentDeltas: Record<string, any> = {};
    const rawResult = prediction.raw_result || {};
    const componentResults = rawResult.componentResults || {};

    // Extract component predictions from raw_result structure
    for (const [componentId, result] of Object.entries(componentResults)) {
      const resultData = result as any;
      const componentDPS = resultData?.dps || resultData?.score || null;
      if (componentDPS !== null && typeof componentDPS === 'number') {
        componentDeltas[componentId] = {
          predicted: componentDPS,
          delta: componentDPS - actualDPS,
          deltaPct: (Math.abs(componentDPS - actualDPS) / Math.max(actualDPS, 1)) * 100
        };
      }
    }

    console.log(`[Learning] Found ${Object.keys(componentDeltas).length} components to update reliability for`);

    // Insert prediction_outcome
    const { data: outcome, error: outcomeError } = await supabase
      .from('prediction_outcomes')
      .insert({
        video_id: body.video_id,
        prediction_id: body.prediction_id,
        actual_views,
        actual_likes,
        actual_comments,
        actual_shares,
        actual_saves,
        actual_dps: actualDPS,
        actual_engagement_rate: engagementRate,
        predicted_dps: predictedDPS,
        accuracy_delta: accuracyDelta,
        accuracy_delta_pct: accuracyDeltaPct,
        within_confidence_range: withinRange,
        component_deltas: componentDeltas,
        reported_by: 'user_manual',
        reported_at: new Date().toISOString(),
        days_since_prediction: Math.floor(
          (new Date().getTime() - new Date(prediction.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      })
      .select()
      .single();

    if (outcomeError) {
      console.error('Failed to insert outcome:', outcomeError);
      return NextResponse.json(
        { success: false, error: `Failed to save outcome: ${outcomeError.message}` },
        { status: 500 }
      );
    }

    // Component reliability updates now handled in Algorithm IQ section above
    const componentUpdates = Object.keys(componentDeltas);

    // === ALGORITHM IQ INTEGRATION ===
    // Update prediction_tracking with actual outcome
    try {
      const { error: trackingUpdateError } = await supabase
        .from('prediction_tracking')
        .update({
          actual_dps: actualDPS,
          actual_metrics_at: new Date().toISOString(),
          error_delta: accuracyDelta,
          error_delta_abs: Math.abs(accuracyDelta),
          within_threshold: Math.abs(accuracyDelta) <= 10, // within ±10 DPS
          validation_status: 'validated'
        })
        .eq('prediction_id', body.prediction_id);

      if (trackingUpdateError) {
        console.warn('[Algorithm IQ] Failed to update tracking:', trackingUpdateError.message);
      } else {
        console.log(`[Algorithm IQ] Updated tracking for prediction ${body.prediction_id}`);
      }

      // Update component_reliability for EACH component that contributed
      let componentsUpdated = 0;
      for (const [componentId, deltaData] of Object.entries(componentDeltas)) {
        try {
          const { error: reliabilityError } = await supabase.rpc('update_component_reliability', {
            p_component_id: componentId,
            p_predicted_dps: deltaData.predicted,
            p_actual_dps: actualDPS,
            p_niche: body.niche || 'unknown',
            p_account_size: body.account_size || 'unknown'
          });

          if (reliabilityError) {
            console.warn(`[Algorithm IQ] Failed to update reliability for ${componentId}:`, reliabilityError.message);
          } else {
            componentsUpdated++;
          }
        } catch (compError: any) {
          console.warn(`[Algorithm IQ] Error updating ${componentId}:`, compError.message);
        }
      }
      console.log(`[Algorithm IQ] Updated reliability for ${componentsUpdated}/${Object.keys(componentDeltas).length} components`);

      // Generate learning insight if accuracy is notable
      if (Math.abs(accuracyDelta) > 15 || withinRange) {
        const insightType = withinRange ? 'learned' : (accuracyDelta > 0 ? 'deficiency' : 'improvement');
        const insightTitle = withinRange 
          ? `Accurate prediction for ${body.niche || 'unknown'} niche`
          : `${Math.abs(accuracyDelta).toFixed(1)} DPS ${accuracyDelta > 0 ? 'over' : 'under'}-prediction in ${body.niche || 'unknown'}`;

        // Find best and worst components
        const sortedComponents = Object.entries(componentDeltas)
          .map(([id, data]) => ({ id, delta: Math.abs(data.delta) }))
          .sort((a, b) => a.delta - b.delta);
        
        const bestComponent = sortedComponents[0]?.id || 'unknown';
        const worstComponent = sortedComponents[sortedComponents.length - 1]?.id || 'unknown';

        await supabase
          .from('algorithm_learning_insights')
          .insert({
            insight_type: insightType,
            title: insightTitle,
            description: `Predicted: ${predictedDPS.toFixed(1)} DPS, Actual: ${actualDPS.toFixed(1)} DPS. ${withinRange ? 'Within confidence range.' : 'Outside confidence range.'} Best: ${bestComponent}, Worst: ${worstComponent}`,
            component_id: worstComponent, // Track the worst performer for improvement
            niche: body.niche || null,
            impact_value: Math.abs(accuracyDelta),
            impact_direction: withinRange ? 'positive' : (accuracyDelta > 0 ? 'negative' : 'neutral'),
            evidence: { 
              prediction_id: body.prediction_id,
              predicted: predictedDPS,
              actual: actualDPS,
              delta: accuracyDelta,
              best_component: bestComponent,
              worst_component: worstComponent,
              component_count: Object.keys(componentDeltas).length
            }
          });

        console.log(`[Algorithm IQ] Generated insight: ${insightTitle}`);
      }

      // Trigger daily performance update (function accepts DATE type)
      try {
        await supabase.rpc('update_daily_performance');
        console.log(`[Algorithm IQ] Triggered daily performance update`);
      } catch (perfError: any) {
        console.warn('[Algorithm IQ] Failed to update daily performance:', perfError.message);
      }
    } catch (iqError: any) {
      console.warn('[Algorithm IQ] Integration error:', iqError.message);
    }
    // === END ALGORITHM IQ INTEGRATION ===

    // Fetch updated reliability scores
    const { data: reliabilityScores } = await supabase
      .from('component_reliability')
      .select('component_id, reliability_score, total_predictions, avg_accuracy_delta')
      .in('component_id', componentUpdates);

    return NextResponse.json({
      success: true,
      outcome_id: outcome.id,

      // Accuracy report
      accuracy: {
        predicted_dps: predictedDPS,
        actual_dps: actualDPS,
        delta: accuracyDelta,
        delta_pct: accuracyDeltaPct,
        within_range: withinRange
      },

      // Component updates
      components_updated: componentUpdates.length,
      component_reliability: reliabilityScores,

      // Insights
      insights: generateInsights(accuracyDelta, withinRange, componentDeltas),

      // Metadata
      days_since_prediction: outcome.days_since_prediction,
      engagement_rate: engagementRate
    });

  } catch (error: any) {
    console.error('Learning update error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function generateInsights(
  delta: number,
  withinRange: boolean,
  componentDeltas: Record<string, any>
): string[] {
  const insights: string[] = [];

  if (withinRange) {
    insights.push('✓ Prediction within confidence interval - excellent accuracy');
  } else {
    insights.push('⚠ Prediction outside confidence interval - reliability scores updated');
  }

  if (Math.abs(delta) <= 5) {
    insights.push('✓ Very accurate prediction (±5 DPS)');
  } else if (Math.abs(delta) <= 10) {
    insights.push('✓ Good prediction (±10 DPS)');
  } else if (Math.abs(delta) <= 20) {
    insights.push('⚠ Moderate accuracy (±20 DPS) - components will adjust');
  } else {
    insights.push('⚠ Low accuracy (>20 DPS) - significant weight adjustments applied');
  }

  // Find best and worst components
  const components = Object.entries(componentDeltas).map(([id, data]) => ({
    id,
    delta: Math.abs(data.delta)
  }));

  if (components.length > 0) {
    components.sort((a, b) => a.delta - b.delta);
    const best = components[0];
    const worst = components[components.length - 1];

    insights.push(`Best component: ${best.id} (${best.delta.toFixed(1)} DPS error)`);
    insights.push(`Worst component: ${worst.id} (${worst.delta.toFixed(1)} DPS error)`);
  }

  return insights;
}

/**
 * GET endpoint - Fetch learning statistics
 */
export async function GET() {
  const { data: stats } = await supabase
    .from('component_reliability')
    .select('*')
    .eq('enabled', true)
    .order('reliability_score', { ascending: false });

  const { data: recentOutcomes } = await supabase
    .from('prediction_outcomes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({
    component_reliability: stats,
    recent_outcomes: recentOutcomes,
    system_status: 'learning_enabled'
  });
}
