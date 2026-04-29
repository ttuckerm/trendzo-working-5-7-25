/**
 * Data Quality Gate
 *
 * Runs a set of filters over prediction_runs and marks rows that must not be
 * used for XGBoost training or holdout selection. Each disqualified row is
 * tagged with a reason so we have a paper trail.
 *
 * Filters (in order):
 *   1. no_video_analysis   — no FFmpeg resolution data (ever reached analysis)
 *   2. followers_below_1k  — creator follower count is null or < 1000
 *   3. high_null_rate      — too many of the 58 content features would be null
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

/**
 * Features that are always empty in the current dataset and will be excluded
 * from training in S6. These are NOT used to disqualify rows.
 *
 * - 5 speaking_rate detail columns (only speaking_rate_wpm is populated today)
 * - visual_to_verbal_ratio (requires Whisper segments, not wired up in the
 *   training extractor — see feature-extractor.ts)
 */
export const EXCLUDED_FEATURES = [
  'speaking_rate_wpm_variance',
  'speaking_rate_wpm_acceleration',
  'speaking_rate_wpm_peak_count',
  'speaking_rate_fast_segments',
  'speaking_rate_slow_segments',
  'visual_to_verbal_ratio',
] as const;

/**
 * Core components that together produce the bulk of the 58 content features.
 * If a run has fewer than this many successful core components, it's almost
 * certainly missing ≥12 of the 58 content features → high_null_rate.
 */
const CORE_CONTENT_COMPONENTS = [
  'ffmpeg',
  'feature-extraction',
  'hook-scorer',
  'thumbnail-analyzer',
];

const MIN_SUCCESSFUL_CORE_COMPONENTS = 3; // require ≥3 of 4 → miss ≤1 → ≤~4 features null from core

const FOLLOWER_THRESHOLD = 1000;

const REASON = {
  NO_VIDEO_ANALYSIS: 'no_video_analysis',
  FOLLOWERS_BELOW_1K: 'followers_below_1k',
  HIGH_NULL_RATE: 'high_null_rate',
} as const;

export interface QualityGateReport {
  totalRows: number;
  disqualified: {
    no_video_analysis: number;
    followers_below_1k: number;
    high_null_rate: number;
    total: number;
  };
  eligible: number;
  excludedFeatures: readonly string[];
  warnings: string[];
  errors: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Service client
// ────────────────────────────────────────────────────────────────────────────

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase service credentials not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Resolution height from raw ffmpeg `features` (flat or nested — matches canonical analyzer shapes). */
function extractHeightFromFeatures(f: Record<string, unknown> | null): number | null {
  if (!f) return null;
  const direct =
    (f.height ?? f.resolution_height ?? f.ffmpeg_resolution_height) as number | string | null | undefined;
  if (direct != null && Number(direct) > 0) return Number(direct);
  const res = f.resolution as { height?: number } | string | null | undefined;
  if (res && typeof res === 'object' && res.height != null && Number(res.height) > 0) {
    return Number(res.height);
  }
  return null;
}

async function fetchAllRuns(db: SupabaseClient): Promise<Array<{ id: string; video_id: string | null; creator_id: string | null }>> {
  const rows: Array<{ id: string; video_id: string | null; creator_id: string | null }> = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('prediction_runs')
      .select('id, video_id, creator_id')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`fetch prediction_runs: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

/**
 * Build the set of run_ids that have a successful FFmpeg analysis with a
 * non-null resolution height. These are the runs where the video was actually
 * analyzed (not just a text-only or failed prediction).
 */
async function fetchRunsWithVideoAnalysis(db: SupabaseClient, runIds: string[]): Promise<Set<string>> {
  const valid = new Set<string>();
  const BATCH = 500;
  for (let i = 0; i < runIds.length; i += BATCH) {
    const batch = runIds.slice(i, i + BATCH);
    const { data, error } = await db
      .from('run_component_results')
      .select('run_id, success, features')
      .eq('component_id', 'ffmpeg')
      .in('run_id', batch);
    if (error) throw new Error(`fetch ffmpeg components: ${error.message}`);
    for (const row of data || []) {
      if (!row.success) continue;
      const f = row.features as Record<string, unknown> | null;
      if (extractHeightFromFeatures(f) != null) {
        valid.add(row.run_id as string);
      }
    }
  }
  return valid;
}

/**
 * Count successful core content components per run_id.
 */
async function fetchCoreComponentCounts(db: SupabaseClient, runIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  const BATCH = 500;
  for (let i = 0; i < runIds.length; i += BATCH) {
    const batch = runIds.slice(i, i + BATCH);
    const { data, error } = await db
      .from('run_component_results')
      .select('run_id, component_id, success')
      .in('run_id', batch)
      .in('component_id', CORE_CONTENT_COMPONENTS);
    if (error) throw new Error(`fetch core components: ${error.message}`);
    for (const row of data || []) {
      if (!row.success) continue;
      counts.set(row.run_id as string, (counts.get(row.run_id as string) || 0) + 1);
    }
  }
  return counts;
}

/**
 * Best follower count per run for gating: max of (scraped_videos, onboarding_profiles).
 *
 * - scraped_videos: `creator_followers_count` keyed by creator_id / video_id (TikTok scrape).
 * - onboarding_profiles: `follower_count` keyed by user_id — same id as prediction_runs.creator_id
 *   and the source used by `audience-quality.ts` for XGBoost audience features.
 *
 * Using only scraped_videos missed many runs because scraped rows often use TikTok-native
 * creator ids, not Supabase user UUIDs.
 */
async function fetchFollowerCounts(
  db: SupabaseClient,
  runs: Array<{ id: string; video_id: string | null; creator_id: string | null }>,
): Promise<Map<string, number | null>> {
  const followerByRun = new Map<string, number | null>();

  const creatorIds = [...new Set(runs.map((r) => r.creator_id).filter(Boolean) as string[])];
  const byCreator = new Map<string, number>();

  const BATCH = 200;
  for (let i = 0; i < creatorIds.length; i += BATCH) {
    const batch = creatorIds.slice(i, i + BATCH);
    const { data, error } = await db
      .from('scraped_videos')
      .select('creator_id, creator_followers_count, scraped_at')
      .in('creator_id', batch)
      .order('scraped_at', { ascending: false });
    if (error) throw new Error(`fetch scraped_videos by creator: ${error.message}`);
    for (const row of data || []) {
      const cid = row.creator_id as string | null;
      const fc = Number(row.creator_followers_count ?? 0);
      if (!cid || !fc) continue;
      if (!byCreator.has(cid)) byCreator.set(cid, fc); // first row wins (newest first)
    }
  }

  // Fall back to video_id lookup for runs whose creator_id lookup missed.
  const needsVideoLookup = runs.filter((r) => {
    if (!r.creator_id) return !!r.video_id;
    return !byCreator.has(r.creator_id) && !!r.video_id;
  });
  const videoIds = [...new Set(needsVideoLookup.map((r) => r.video_id as string))];
  const byVideo = new Map<string, number>();
  for (let i = 0; i < videoIds.length; i += BATCH) {
    const batch = videoIds.slice(i, i + BATCH);
    const { data, error } = await db
      .from('scraped_videos')
      .select('video_id, creator_followers_count')
      .in('video_id', batch);
    if (error) throw new Error(`fetch scraped_videos by video_id: ${error.message}`);
    for (const row of data || []) {
      const vid = row.video_id as string | null;
      const fc = Number(row.creator_followers_count ?? 0);
      if (!vid || !fc) continue;
      byVideo.set(vid, fc);
    }
  }

  const onboardingFollowers = new Map<string, number>();
  if (creatorIds.length > 0) {
    for (let i = 0; i < creatorIds.length; i += BATCH) {
      const batch = creatorIds.slice(i, i + BATCH);
      const { data, error } = await db
        .from('onboarding_profiles')
        .select('user_id, follower_count')
        .in('user_id', batch);
      if (error) throw new Error(`fetch onboarding_profiles followers: ${error.message}`);
      for (const row of data || []) {
        const uid = row.user_id as string | null;
        const n = Number(row.follower_count ?? 0);
        if (uid && n > 0) onboardingFollowers.set(uid, n);
      }
    }
  }

  for (const r of runs) {
    let scrapedFc: number | null = null;
    if (r.creator_id && byCreator.has(r.creator_id)) {
      scrapedFc = byCreator.get(r.creator_id)!;
    } else if (r.video_id && byVideo.has(r.video_id)) {
      scrapedFc = byVideo.get(r.video_id)!;
    }
    const onboardFc = r.creator_id ? onboardingFollowers.get(r.creator_id) ?? null : null;
    const candidates = [scrapedFc, onboardFc].filter((x): x is number => x != null && x > 0);
    const fc = candidates.length > 0 ? Math.max(...candidates) : null;
    followerByRun.set(r.id, fc);
  }

  return followerByRun;
}

async function markDisqualified(
  db: SupabaseClient,
  runIds: string[],
  reason: string,
): Promise<void> {
  if (runIds.length === 0) return;
  const BATCH = 500;
  for (let i = 0; i < runIds.length; i += BATCH) {
    const batch = runIds.slice(i, i + BATCH);
    const { error } = await db
      .from('prediction_runs')
      .update({ training_eligible: false, training_disqualified_reason: reason })
      .in('id', batch);
    if (error) throw new Error(`mark ${reason}: ${error.message}`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main entry
// ────────────────────────────────────────────────────────────────────────────

export interface QualityGateDiagnosis {
  totalRows: number;
  /** Runs with successful ffmpeg row + positive height (same as gate “has analysis”) */
  passFilter1Count: number;
  /** Among pass-filter-1 runs */
  followerLookupMiss: number;
  followerBelowThreshold: number;
  followerOk: number;
  /** Runs that would pass filter 1 only if nested `resolution.height` were counted */
  runsPass1OnlyWithExtendedHeight: number;
  /** First N distinct feature keys seen on ffmpeg rows (success), for schema checks */
  sampleFfmpegFeatureKeys: string[];
  runsMissingCreatorAndVideo: number;
  /** Simulated gate counts (no DB writes) */
  simulated: QualityGateReport;
}

/**
 * Read-only diagnostics for the quality gate (no prediction_runs updates).
 * Use when POST is blocked or you need to understand bucket math / join health.
 */
export async function diagnoseDataQualityGate(): Promise<QualityGateDiagnosis> {
  const db = getServiceDb();
  const runs = await fetchAllRuns(db);
  const total = runs.length;
  const allIds = runs.map((r) => r.id);

  const keyAccumulator = new Set<string>();
  const extendedHeightPass = new Set<string>();

  const BATCH = 500;
  for (let i = 0; i < allIds.length; i += BATCH) {
    const batch = allIds.slice(i, i + BATCH);
    const { data, error } = await db
      .from('run_component_results')
      .select('run_id, success, features')
      .eq('component_id', 'ffmpeg')
      .in('run_id', batch);
    if (error) throw new Error(`diagnose ffmpeg: ${error.message}`);
    for (const row of data || []) {
      if (!row.success) continue;
      const f = row.features as Record<string, unknown> | null;
      if (f) {
        for (const k of Object.keys(f).slice(0, 40)) keyAccumulator.add(k);
      }
      if (extractHeightFromFeatures(f) != null) {
        extendedHeightPass.add(row.run_id as string);
      }
    }
  }

  const productionVideoOk = await fetchRunsWithVideoAnalysis(db, allIds);
  let runsPass1OnlyWithExtendedHeight = 0;
  for (const id of extendedHeightPass) {
    if (!productionVideoOk.has(id)) runsPass1OnlyWithExtendedHeight += 1;
  }

  const runsWithAnalysis = productionVideoOk;
  const pass1Runs = runs.filter((r) => runsWithAnalysis.has(r.id));
  const followerByRun = await fetchFollowerCounts(db, pass1Runs);
  let followerLookupMiss = 0;
  let followerBelowThreshold = 0;
  let followerOk = 0;
  for (const r of pass1Runs) {
    const fc = followerByRun.get(r.id);
    if (fc == null) followerLookupMiss += 1;
    else if (fc < FOLLOWER_THRESHOLD) followerBelowThreshold += 1;
    else followerOk += 1;
  }

  let runsMissingCreatorAndVideo = 0;
  for (const r of pass1Runs) {
    if (!r.creator_id && !r.video_id) runsMissingCreatorAndVideo += 1;
  }

  const stillEligible = new Set(runs.map((r) => r.id));
  const noAnalysis: string[] = [];
  for (const id of stillEligible) {
    if (!runsWithAnalysis.has(id)) noAnalysis.push(id);
  }
  for (const id of noAnalysis) stillEligible.delete(id);

  const remainingForFollowers = runs.filter((r) => stillEligible.has(r.id));
  const lowFollowers: string[] = [];
  for (const r of remainingForFollowers) {
    const fc = followerByRun.get(r.id);
    if (fc == null || fc < FOLLOWER_THRESHOLD) lowFollowers.push(r.id);
  }
  for (const id of lowFollowers) stillEligible.delete(id);

  const remainingIds = [...stillEligible];
  const coreCounts = await fetchCoreComponentCounts(db, remainingIds);
  const highNull: string[] = [];
  for (const id of remainingIds) {
    const count = coreCounts.get(id) || 0;
    if (count < MIN_SUCCESSFUL_CORE_COMPONENTS) highNull.push(id);
  }
  for (const id of highNull) stillEligible.delete(id);

  const eligible = stillEligible.size;
  const simulated: QualityGateReport = {
    totalRows: total,
    disqualified: {
      no_video_analysis: noAnalysis.length,
      followers_below_1k: lowFollowers.length,
      high_null_rate: highNull.length,
      total: noAnalysis.length + lowFollowers.length + highNull.length,
    },
    eligible,
    excludedFeatures: EXCLUDED_FEATURES,
    warnings: [],
    errors: eligible < 1000 ? [`Only ${eligible} eligible rows — too few to train reliably`] : [],
  };

  const diagnosis: QualityGateDiagnosis = {
    totalRows: total,
    passFilter1Count: pass1Runs.length,
    followerLookupMiss,
    followerBelowThreshold,
    followerOk,
    runsPass1OnlyWithExtendedHeight,
    sampleFfmpegFeatureKeys: [...keyAccumulator].slice(0, 30),
    runsMissingCreatorAndVideo,
    simulated,
  };

  return diagnosis;
}

export async function runDataQualityGate(): Promise<QualityGateReport> {
  const db = getServiceDb();
  const warnings: string[] = [];
  const errors: string[] = [];

  console.log('[QualityGate] Loading prediction_runs…');
  const runs = await fetchAllRuns(db);
  const total = runs.length;
  console.log(`[QualityGate] Loaded ${total} rows.`);

  // Track which rows are still eligible after each pass.
  const stillEligible = new Set(runs.map((r) => r.id));

  // ── Filter 1: no_video_analysis ──────────────────────────────────────────
  console.log('[QualityGate] Filter 1: checking video analysis…');
  const runsWithAnalysis = await fetchRunsWithVideoAnalysis(db, runs.map((r) => r.id));
  const noAnalysis: string[] = [];
  for (const id of stillEligible) {
    if (!runsWithAnalysis.has(id)) noAnalysis.push(id);
  }
  await markDisqualified(db, noAnalysis, REASON.NO_VIDEO_ANALYSIS);
  for (const id of noAnalysis) stillEligible.delete(id);
  console.log(`[QualityGate] Filter 1 disqualified ${noAnalysis.length} rows (no_video_analysis).`);

  // ── Filter 2: followers_below_1k ─────────────────────────────────────────
  console.log('[QualityGate] Filter 2: checking creator follower counts…');
  const remainingForFollowers = runs.filter((r) => stillEligible.has(r.id));
  const followerByRun = await fetchFollowerCounts(db, remainingForFollowers);
  const lowFollowers: string[] = [];
  for (const r of remainingForFollowers) {
    const fc = followerByRun.get(r.id);
    if (fc == null || fc < FOLLOWER_THRESHOLD) {
      lowFollowers.push(r.id);
    }
  }
  await markDisqualified(db, lowFollowers, REASON.FOLLOWERS_BELOW_1K);
  for (const id of lowFollowers) stillEligible.delete(id);
  console.log(`[QualityGate] Filter 2 disqualified ${lowFollowers.length} rows (followers_below_1k).`);

  // ── Filter 3: high_null_rate ─────────────────────────────────────────────
  console.log('[QualityGate] Filter 3: checking content feature coverage…');
  const remainingIds = [...stillEligible];
  const coreCounts = await fetchCoreComponentCounts(db, remainingIds);
  const highNull: string[] = [];
  for (const id of remainingIds) {
    const count = coreCounts.get(id) || 0;
    if (count < MIN_SUCCESSFUL_CORE_COMPONENTS) highNull.push(id);
  }
  await markDisqualified(db, highNull, REASON.HIGH_NULL_RATE);
  for (const id of highNull) stillEligible.delete(id);
  console.log(`[QualityGate] Filter 3 disqualified ${highNull.length} rows (high_null_rate).`);

  // ── Filter 4: excluded features (logged only, not used for disqualification)
  console.log(`[QualityGate] Excluded features (will be dropped in S6): ${EXCLUDED_FEATURES.join(', ')}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  const eligible = stillEligible.size;
  const disqualifiedTotal = noAnalysis.length + lowFollowers.length + highNull.length;

  const summary = `Data Quality Gate complete: ${total} total rows, ${disqualifiedTotal} disqualified (${noAnalysis.length} no analysis, ${lowFollowers.length} low followers, ${highNull.length} high null), ${eligible} eligible for training`;
  console.log(`[QualityGate] ${summary}`);

  if (eligible < 1000) {
    const msg = `Only ${eligible} eligible rows — too few to train reliably`;
    console.error(`[QualityGate] ERROR: ${msg}`);
    errors.push(msg);
  } else if (eligible < 1500) {
    const msg = `Only ${eligible} eligible rows — may need to loosen filters before proceeding`;
    console.warn(`[QualityGate] WARNING: ${msg}`);
    warnings.push(msg);
  }

  return {
    totalRows: total,
    disqualified: {
      no_video_analysis: noAnalysis.length,
      followers_below_1k: lowFollowers.length,
      high_null_rate: highNull.length,
      total: disqualifiedTotal,
    },
    eligible,
    excludedFeatures: EXCLUDED_FEATURES,
    warnings,
    errors,
  };
}
