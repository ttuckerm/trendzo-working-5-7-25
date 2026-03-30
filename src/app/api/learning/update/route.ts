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
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from '@/lib/training/dps-v2';

const COHORT_PAGE_SIZE = 1000;

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
  follower_count?: number;
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

    // Fetch the original prediction from prediction_runs first (need follower_count)
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

    // Compute actual DPS via canonical v2 module
    const { actual_views, actual_likes, actual_comments, actual_shares, actual_saves } = body;

    const niche = body.niche || 'general';
    const cohortRows = await fetchCohortForV2(niche);

    // Use real follower count from the prediction run (persisted by prior labeling or prediction)
    const followerCount = body.follower_count ?? prediction.actual_follower_count ?? 0;
    if (!prediction.actual_follower_count) {
      console.warn(`[Learning] No follower count for prediction ${body.prediction_id} — view_to_follower_ratio and cohort percentile will be null`);
    }

    const rawMetrics: DpsV2RawMetrics = {
      views: actual_views,
      likes: actual_likes,
      comments: actual_comments,
      shares: actual_shares,
      saves: actual_saves,
      follower_count: followerCount,
      hours_since_post: 0, // manual entry — unknown timing
    };

    const v2Result = computeDpsV2FromRows(rawMetrics, cohortRows);
    const actualDPS = v2Result.score;

    const engagementRate = actual_views > 0
      ? (actual_likes + actual_comments + actual_shares + actual_saves) / actual_views
      : 0;

    const predictedDPS = prediction.predicted_dps_7d;
    const accuracyDelta = actualDPS != null ? predictedDPS - actualDPS : null;
    const accuracyDeltaPct = actualDPS != null ? (Math.abs(accuracyDelta!) / Math.max(actualDPS, 1)) * 100 : null;
    const withinRange = actualDPS != null
      ? actualDPS >= (prediction.prediction_range_low || 0) && actualDPS <= (prediction.prediction_range_high || 100)
      : null;

    // Write to prediction_runs via canonical v2 writer (single write path)
    const writeResult = await labelPredictionRunWithDpsV2(supabase, {
      run_id: body.prediction_id,
      raw_metrics: rawMetrics,
      breakdown: v2Result.breakdown,
      dps_score: actualDPS,
      tier: v2Result.tier,
      label_trust: v2Result.dps_v2_incomplete ? 'untrusted' : 'low',
      training_weight: v2Result.dps_v2_incomplete ? 0 : 0.3,
      source_tag: 'manual_ui',
      predicted_dps: predictedDPS,
      prediction_range_low: prediction.prediction_range_low,
      prediction_range_high: prediction.prediction_range_high,
      dps_v2_incomplete: v2Result.dps_v2_incomplete,
      dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
    });

    if (!writeResult.success) {
      console.warn('Failed to write v2 label to prediction_runs:', writeResult.error);
    } else {
      console.log(`[Learning] Updated prediction_runs ${body.prediction_id} with DPS v2: ${actualDPS}`);
    }

    // If DPS is incomplete (missing follower count), return early — no accuracy tracking possible
    if (v2Result.dps_v2_incomplete || actualDPS == null) {
      return NextResponse.json({
        success: true,
        dps_v2_incomplete: true,
        dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
        accuracy: {
          predicted_dps: prediction.predicted_dps_7d,
          actual_dps: null,
          actual_dps_display: null,
          actual_tier: 'incomplete',
          delta: null,
          delta_pct: null,
          within_range: null,
          dps_formula_version: 'dps_v2',
        },
      });
    }

    // Calculate component-level deltas from raw_result.componentResults
    // actualDPS is guaranteed non-null here (incomplete case returned above)
    const dps = actualDPS as number;
    const delta = accuracyDelta as number;
    const deltaPct = accuracyDeltaPct as number;
    const inRange = withinRange as boolean;

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
          delta: componentDPS - dps,
          deltaPct: (Math.abs(componentDPS - dps) / Math.max(dps, 1)) * 100
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
        actual_dps: dps,
        actual_engagement_rate: engagementRate,
        predicted_dps: predictedDPS,
        accuracy_delta: delta,
        accuracy_delta_pct: deltaPct,
        within_confidence_range: inRange,
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
          actual_dps: dps,
          actual_metrics_at: new Date().toISOString(),
          error_delta: delta,
          error_delta_abs: Math.abs(delta),
          within_threshold: Math.abs(delta) <= 10, // within ±10 DPS
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
            p_actual_dps: dps,
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
      if (Math.abs(delta) > 15 || inRange) {
        const insightType = inRange ? 'learned' : (delta > 0 ? 'deficiency' : 'improvement');
        const insightTitle = inRange
          ? `Accurate prediction for ${body.niche || 'unknown'} niche`
          : `${Math.abs(delta).toFixed(1)} DPS ${delta > 0 ? 'over' : 'under'}-prediction in ${body.niche || 'unknown'}`;

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
            description: `Predicted: ${predictedDPS.toFixed(1)} DPS, Actual: ${dps.toFixed(1)} DPS. ${inRange ? 'Within confidence range.' : 'Outside confidence range.'} Best: ${bestComponent}, Worst: ${worstComponent}`,
            component_id: worstComponent, // Track the worst performer for improvement
            niche: body.niche || null,
            impact_value: Math.abs(delta),
            impact_direction: inRange ? 'positive' : (delta > 0 ? 'negative' : 'neutral'),
            evidence: {
              prediction_id: body.prediction_id,
              predicted: predictedDPS,
              actual: dps,
              delta,
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
        actual_dps: dps,
        actual_dps_display: v2Result.display_score,
        actual_tier: v2Result.tier,
        delta,
        delta_pct: deltaPct,
        within_range: inRange,
        dps_formula_version: 'dps_v2',
      },

      // Component updates
      components_updated: componentUpdates.length,
      component_reliability: reliabilityScores,

      // Insights
      insights: generateInsights(delta, inRange, componentDeltas),

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

async function fetchCohortForV2(niche: string): Promise<ScrapedVideoRow[]> {
  const rows: ScrapedVideoRow[] = [];
  let offset = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + COHORT_PAGE_SIZE - 1);
    if (error || !page || page.length === 0) break;
    for (const r of page) {
      rows.push({
        views: (r as any).views_count ?? 0,
        likes: (r as any).likes_count ?? 0,
        comments: (r as any).comments_count ?? 0,
        shares: (r as any).shares_count ?? 0,
        saves: (r as any).saves_count ?? 0,
        follower_count: (r as any).creator_followers_count ?? 0,
      });
    }
    if (page.length < COHORT_PAGE_SIZE) break;
    offset += COHORT_PAGE_SIZE;
  }
  // #region agent log
  const _nonZeroFollowers = rows.filter(r => (r.follower_count ?? 0) > 0).length;
  const _sampleFollowers = rows.slice(0, 5).map(r => r.follower_count ?? 0);
  fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f793b9'},body:JSON.stringify({sessionId:'f793b9',location:'learning/update/route.ts:fetchCohortForV2',message:'Cohort follower data after fix',data:{totalRows:rows.length,nonZeroFollowers:_nonZeroFollowers,sampleFollowers:_sampleFollowers,niche},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  return rows;
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
