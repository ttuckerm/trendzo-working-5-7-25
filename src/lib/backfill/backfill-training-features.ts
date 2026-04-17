/**
 * Backfill training_feature_cache with the 20 context features per prediction_run.
 *
 * Applies a temporal guard to cultural features: if no cultural_events exist in
 * the 14-day window strictly before a video's post date, all four cultural
 * features are zeroed and cultural_temporal_valid = false. This prevents the
 * model from learning trends that did not yet exist when the video was posted.
 *
 * Excludes holdout rows unconditionally.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { extractCreatorFeatures } from '@/lib/features/creator-trajectory';
import { extractCulturalFeatures } from '@/lib/features/cultural-momentum';
import { extractAudienceFeatures } from '@/lib/features/audience-quality';
import { extractDistributionFeatures } from '@/lib/features/distribution-signals';

const BATCH_SIZE = 100;
const LOG_EVERY = 500;

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

interface EligibleRun {
  id: string;
  creator_id: string | null;
  video_id: string | null;
  created_at: string;
}

async function fetchEligibleRuns(db: SupabaseClient): Promise<EligibleRun[]> {
  // 1) Pull IDs already cached so we can skip them client-side
  //    (Supabase has no native NOT EXISTS join; cache is small — one column).
  const cachedIds = new Set<string>();
  {
    const pageSize = 1000;
    let offset = 0;
    while (true) {
      const { data, error } = await db
        .from('training_feature_cache')
        .select('prediction_run_id')
        .order('prediction_run_id', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw new Error(`Failed to query training_feature_cache: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const r of data as Array<{ prediction_run_id: string }>) cachedIds.add(r.prediction_run_id);
      if (data.length < pageSize) break;
      offset += pageSize;
    }
  }

  const runs: EligibleRun[] = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await db
      .from('prediction_runs')
      .select('id, creator_id, video_id, created_at')
      .eq('is_holdout', false)
      .not('actual_dps', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Failed to query prediction_runs: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data as EligibleRun[]) {
      if (!cachedIds.has(r.id)) runs.push(r);
    }
    if (data.length < pageSize) break;
    offset += pageSize;
  }
  return runs;
}

async function resolveNiches(
  db: SupabaseClient,
  creatorIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (creatorIds.length === 0) return map;
  const chunkSize = 500;
  for (let i = 0; i < creatorIds.length; i += chunkSize) {
    const chunk = creatorIds.slice(i, i + chunkSize);
    const { data, error } = await db
      .from('onboarding_profiles')
      .select('user_id, selected_niche, niche_key')
      .in('user_id', chunk);
    if (error) throw new Error(`Failed to resolve niches: ${error.message}`);
    for (const row of (data || []) as Array<{
      user_id: string;
      selected_niche: string | null;
      niche_key: string | null;
    }>) {
      const niche = row.selected_niche || row.niche_key || '';
      if (niche) map.set(row.user_id, niche);
    }
  }
  return map;
}

async function hasPriorCulturalEvent(
  db: SupabaseClient,
  niche: string,
  postDate: Date,
): Promise<boolean> {
  if (!niche) return false;
  const fourteenDaysAgo = new Date(postDate);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Any cultural_events matching this niche (primary or activated) that
  // existed in the 14-day window strictly before the video's post date.
  const { data, error } = await db
    .from('cultural_events')
    .select('id')
    .or(`niche.eq.${niche},activated_niches.cs.{${niche}}`)
    .lte('created_at', postDate.toISOString())
    .gte('created_at', fourteenDaysAgo.toISOString())
    .limit(1);

  if (error) {
    console.warn(`[backfill-features] cultural guard query failed: ${error.message}`);
    return false;
  }
  return !!(data && data.length > 0);
}

export async function backfillTrainingFeatures(): Promise<{
  total: number;
  culturalValid: number;
  culturalZeroed: number;
}> {
  const db = getServiceDb();

  const runs = await fetchEligibleRuns(db);
  if (runs.length === 0) {
    console.log('[backfill-features] no eligible prediction_runs to cache');
    return { total: 0, culturalValid: 0, culturalZeroed: 0 };
  }

  const creatorIds = Array.from(new Set(runs.map((r) => r.creator_id).filter((v): v is string => !!v)));
  const nicheByCreator = await resolveNiches(db, creatorIds);

  let total = 0;
  let culturalValid = 0;
  let culturalZeroed = 0;

  for (let i = 0; i < runs.length; i += BATCH_SIZE) {
    const batch = runs.slice(i, i + BATCH_SIZE);
    const rowsToInsert: Record<string, unknown>[] = [];

    for (const run of batch) {
      const creatorId = run.creator_id || '';
      const videoId = run.video_id || '';
      const niche = (creatorId && nicheByCreator.get(creatorId)) || '';
      const postDate = new Date(run.created_at);

      // Feature extraction — each extractor has its own defaults/fallbacks.
      const [creatorF, audienceF, distF] = await Promise.all([
        extractCreatorFeatures(creatorId, postDate, db),
        extractAudienceFeatures(creatorId, db),
        extractDistributionFeatures(videoId, undefined, db),
      ]);

      // Cultural temporal guard.
      const hasPrior = await hasPriorCulturalEvent(db, niche, postDate);
      let culturalF;
      let temporalValid = false;
      if (hasPrior) {
        culturalF = await extractCulturalFeatures(niche, '', postDate, db);
        temporalValid = true;
        culturalValid++;
      } else {
        culturalF = {
          cultural_momentum_score: 0,
          trend_phase_encoded: 0,
          niche_activation_score: 0,
          cultural_timing_advantage: 0,
        };
        culturalZeroed++;
      }

      rowsToInsert.push({
        prediction_run_id: run.id,
        // creator trajectory
        feature_creator_momentum_30d: creatorF.creator_momentum_30d,
        feature_creator_avg_vps_90d: creatorF.creator_avg_vps_90d,
        feature_creator_viral_recency: creatorF.creator_viral_recency,
        feature_creator_consistency_score: creatorF.creator_consistency_score,
        feature_creator_trajectory_label: creatorF.creator_trajectory_label,
        // cultural
        feature_cultural_momentum_score: culturalF.cultural_momentum_score,
        feature_trend_phase_encoded: culturalF.trend_phase_encoded,
        feature_niche_activation_score: culturalF.niche_activation_score,
        feature_cultural_timing_advantage: culturalF.cultural_timing_advantage,
        // audience
        feature_follower_count_log: audienceF.follower_count_log,
        feature_engagement_rate_estimate: audienceF.engagement_rate_estimate,
        feature_follower_growth_velocity: audienceF.follower_growth_velocity,
        feature_audience_size_tier: audienceF.audience_size_tier,
        feature_follower_quality_score: audienceF.follower_quality_score,
        // distribution
        feature_post_hour_score: distF.post_hour_score,
        feature_post_day_score: distF.post_day_score,
        feature_hashtag_strategy_score: distF.hashtag_strategy_score,
        feature_sound_advantage_score: distF.sound_advantage_score,
        feature_early_velocity_signal: distF.early_velocity_signal,
        feature_distribution_composite: distF.distribution_composite,
        cultural_temporal_valid: temporalValid,
      });

      total++;
      if (total % LOG_EVERY === 0) {
        console.log(
          `[backfill-features] processed ${total}/${runs.length} ` +
          `(cultural valid=${culturalValid} zeroed=${culturalZeroed})`,
        );
      }
    }

    // Upsert in one shot per batch — ON CONFLICT (prediction_run_id) guarded by UNIQUE.
    const { error } = await db
      .from('training_feature_cache')
      .upsert(rowsToInsert, { onConflict: 'prediction_run_id' });
    if (error) throw new Error(`Failed to write feature cache batch: ${error.message}`);
  }

  console.log(
    `[backfill-features] DONE — total=${total} culturalValid=${culturalValid} culturalZeroed=${culturalZeroed}`,
  );
  return { total, culturalValid, culturalZeroed };
}
