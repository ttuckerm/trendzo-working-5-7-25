/**
 * Per-run write of CULTURAL training features into training_feature_cache.
 *
 * Mirrors the cultural temporal guard used by the historical backfill
 * (src/lib/backfill/backfill-training-features.ts): if no cultural_events
 * exist in the 14-day window strictly before the run's postDate, the four
 * cultural features are zeroed and cultural_temporal_valid=false. This
 * prevents the model from learning trends that did not yet exist when the
 * video was posted.
 *
 * Step 6 of training-pipeline cron: cultural_events → training_feature_cache
 * on the prediction-write path. Other feature groups (creator, audience,
 * distribution) are NOT written here and remain handled by backfill — this
 * keeps each prediction's row partially populated until backfill fills the
 * other 15 columns.
 *
 * The helper swallows all errors after logging — prediction must still
 * succeed even if the cache write fails.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { extractCulturalFeatures } from '@/lib/features/cultural-momentum';

interface CacheRunCulturalFeaturesArgs {
  runId: string;
  niche: string | null | undefined;
  /** Use prediction_runs.created_at — the same temporal anchor backfill uses. */
  postDate: Date;
  db: SupabaseClient;
}

/**
 * Returns true iff at least one cultural_events row exists in the 14-day
 * window strictly before postDate for the given niche (primary or activated).
 * Identical predicate to backfill's hasPriorCulturalEvent to keep the
 * leakage guard consistent across both write paths.
 */
async function hasPriorCulturalEvent(
  db: SupabaseClient,
  niche: string,
  postDate: Date,
): Promise<boolean> {
  if (!niche) return false;
  const fourteenDaysAgo = new Date(postDate);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data, error } = await db
    .from('cultural_events')
    .select('id')
    .or(`niche.eq.${niche},activated_niches.cs.{${niche}}`)
    .lte('created_at', postDate.toISOString())
    .gte('created_at', fourteenDaysAgo.toISOString())
    .limit(1);

  if (error) {
    console.warn(`[cache-run-features] cultural guard query failed: ${error.message}`);
    return false;
  }
  return !!(data && data.length > 0);
}

export async function cacheRunCulturalFeatures(
  args: CacheRunCulturalFeaturesArgs,
): Promise<void> {
  const { runId, niche, postDate, db } = args;
  try {
    const safeNiche = niche || '';
    const hasPrior = await hasPriorCulturalEvent(db, safeNiche, postDate);

    let culturalF;
    let temporalValid = false;
    if (hasPrior) {
      culturalF = await extractCulturalFeatures(safeNiche, '', postDate, db);
      temporalValid = true;
    } else {
      culturalF = {
        cultural_momentum_score: 0,
        trend_phase_encoded: 0,
        niche_activation_score: 0,
        cultural_timing_advantage: 0,
      };
    }

    // Upsert only the cultural columns. Supabase upsert generates
    // ON CONFLICT (prediction_run_id) DO UPDATE SET <col> = EXCLUDED.<col>
    // for the columns in the payload only — the 15 non-cultural columns
    // remain whatever backfill set them to (or NULL on a fresh row).
    const { error: upsertError } = await db
      .from('training_feature_cache')
      .upsert(
        {
          prediction_run_id: runId,
          feature_cultural_momentum_score: culturalF.cultural_momentum_score,
          feature_trend_phase_encoded: culturalF.trend_phase_encoded,
          feature_niche_activation_score: culturalF.niche_activation_score,
          feature_cultural_timing_advantage: culturalF.cultural_timing_advantage,
          cultural_temporal_valid: temporalValid,
        },
        { onConflict: 'prediction_run_id' },
      );

    if (upsertError) {
      console.warn(
        `[cache-run-features] upsert failed for run ${runId}: ${upsertError.message}`,
      );
      return;
    }

    console.log(
      `[cache-run-features] cached run=${runId} niche=${safeNiche || '∅'} ` +
      `temporal_valid=${temporalValid} momentum=${culturalF.cultural_momentum_score} ` +
      `phase=${culturalF.trend_phase_encoded} activation=${culturalF.niche_activation_score} ` +
      `timing=${culturalF.cultural_timing_advantage}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[cache-run-features] error (non-fatal) for run ${runId}: ${msg}`);
  }
}
