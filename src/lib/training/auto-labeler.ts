/**
 * Auto-Labeler — Lenient automated VPS labeling
 *
 * Computes actual VPS for eligible prediction runs using the canonical
 * DPS v2 module. Writes labels through the single v2 write path.
 *
 * Metric resolution (3 sources, priority order):
 * 1. metric_check_schedule.actual_metrics — best checkpoint (7d > 48h > 24h > 4h)
 * 2. scraped_video_metrics — time-series snapshot closest to +7d
 * 3. scraped_videos — inline metrics (last resort)
 *
 * Tracks labeling_mode='auto_cron' on each labeled run.
 */

import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from './dps-v2';
import { resolveFollowerCount } from './follower-resolver';
import { emitEvent } from '@/lib/events/emit';

const CHECKPOINT_PRIORITY = ['7d', '48h', '24h', '4h'] as const;
const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;
const COHORT_PAGE_SIZE = 1000;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

export interface AutoLabelItemResult {
  run_id: string;
  status: 'labeled' | 'skipped' | 'failed' | 'incomplete';
  actual_dps?: number | null;
  actual_tier?: string;
  checkpoint_used?: string;
  metrics_source?: string;
  skip_reason?: string;
  error?: string;
}

export interface AutoLabelResult {
  processed: number;
  labeled: number;
  skipped: number;
  failed: number;
  details: AutoLabelItemResult[];
}

/**
 * Run the auto-labeler: find eligible runs, compute actual VPS via v2, write results.
 */
export async function runAutoLabeler(opts?: {
  limit?: number;
  dryRun?: boolean;
  force?: boolean;
}): Promise<AutoLabelResult> {
  const limit = Math.min(opts?.limit ?? 50, 200);
  const dryRun = opts?.dryRun ?? false;
  const force = opts?.force ?? false;
  const supabase = getSupabase();

  console.log(`[AutoLabeler] Starting (limit=${limit}, dryRun=${dryRun}, force=${force})`);

  // Step 1: Find run IDs with at least one completed schedule
  const { data: completedScheds } = await supabase
    .from('metric_check_schedule')
    .select('prediction_run_id')
    .eq('status', 'completed');

  const runIdsWithCompletedSchedules = Array.from(
    new Set((completedScheds || []).map((s: any) => s.prediction_run_id)),
  );

  if (runIdsWithCompletedSchedules.length === 0) {
    console.log('[AutoLabeler] No runs with completed schedules found');
    return { processed: 0, labeled: 0, skipped: 0, failed: 0, details: [] };
  }

  // Step 2: Filter to eligible runs (7+ days old, no actual_dps unless force)
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS).toISOString();

  let query = supabase
    .from('prediction_runs')
    .select('id, video_id, predicted_dps_7d, prediction_range_low, prediction_range_high, created_at, source_meta')
    .in('id', runIdsWithCompletedSchedules)
    .lte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!force) {
    query = query.is('actual_dps', null);
  }

  const { data: eligibleRuns, error: runErr } = await query;

  if (runErr) {
    throw new Error(`Failed to query eligible runs: ${runErr.message}`);
  }

  if (!eligibleRuns || eligibleRuns.length === 0) {
    console.log('[AutoLabeler] No eligible runs found');
    return { processed: 0, labeled: 0, skipped: 0, failed: 0, details: [] };
  }

  console.log(`[AutoLabeler] Found ${eligibleRuns.length} eligible runs`);

  const result: AutoLabelResult = {
    processed: eligibleRuns.length,
    labeled: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  // Pre-fetch niche info for all video_ids
  const videoIds = Array.from(new Set(eligibleRuns.map((r: any) => r.video_id)));
  const { data: videoFiles } = await supabase
    .from('video_files')
    .select('id, niche')
    .in('id', videoIds);
  const nicheMap = new Map((videoFiles || []).map((v: any) => [v.id, v.niche]));

  // Cache cohorts by niche to avoid re-fetching
  const cohortCache = new Map<string, ScrapedVideoRow[]>();

  for (const run of eligibleRuns) {
    const r = run as any;
    const itemResult = await labelSingleRun(supabase, r, nicheMap, cohortCache, dryRun);
    result.details.push(itemResult);

    if (itemResult.status === 'labeled') result.labeled++;
    else if (itemResult.status === 'skipped') result.skipped++;
    else result.failed++;
  }

  console.log(
    `[AutoLabeler] Complete: ${result.labeled} labeled, ${result.skipped} skipped, ${result.failed} failed`,
  );

  return result;
}

async function labelSingleRun(
  supabase: any,
  run: any,
  nicheMap: Map<string, string>,
  cohortCache: Map<string, ScrapedVideoRow[]>,
  dryRun: boolean,
): Promise<AutoLabelItemResult> {
  const runId = run.id;

  try {
    // Source A: Get best completed checkpoint from metric_check_schedule
    const metrics = await getMetricsFromSchedule(supabase, runId);

    if (!metrics) {
      return { run_id: runId, status: 'skipped', skip_reason: 'no_completed_metrics' };
    }

    const { views, likes, comments, shares, saves, checkpointUsed, metricsSource } = metrics;

    if (views === 0 && likes === 0 && comments === 0) {
      return { run_id: runId, status: 'skipped', skip_reason: 'zero_metrics' };
    }

    // Get niche for cohort lookup
    const niche = nicheMap.get(run.video_id) || 'side_hustles';

    // Get or fetch cohort
    let cohort = cohortCache.get(niche);
    if (!cohort) {
      cohort = await fetchCohort(supabase, niche);
      cohortCache.set(niche, cohort);
    }

    if (cohort.length === 0) {
      return { run_id: runId, status: 'failed', error: 'empty_cohort' };
    }

    // Resolve follower count for view_to_follower_ratio signal
    let followerCount = 0;
    try {
      followerCount = (await resolveFollowerCount(supabase, runId, run.source_meta)) ?? 0;
    } catch {
      // Non-fatal — v2 degrades gracefully without follower data
    }

    const elapsedHours = run.created_at
      ? (Date.now() - new Date(run.created_at).getTime()) / 3600000
      : 168;

    // Build raw metrics for v2
    const rawMetrics: DpsV2RawMetrics = {
      views,
      likes,
      comments,
      shares,
      saves,
      follower_count: followerCount,
      hours_since_post: elapsedHours,
    };

    // Compute DPS v2
    const v2Result = computeDpsV2FromRows(rawMetrics, cohort);

    if (dryRun) {
      console.log(
        `[AutoLabeler] [DRY RUN] Would label run ${runId}: VPS=${v2Result.score?.toFixed(4) ?? 'INCOMPLETE'}, tier=${v2Result.tier}, checkpoint=${checkpointUsed}`,
      );
      return {
        run_id: runId,
        status: v2Result.dps_v2_incomplete ? 'incomplete' : 'labeled',
        actual_dps: v2Result.score,
        actual_tier: v2Result.tier,
        checkpoint_used: checkpointUsed,
        metrics_source: metricsSource,
      };
    }

    // Write via canonical v2 writer
    const writeResult = await labelPredictionRunWithDpsV2(
      supabase,
      {
        run_id: runId,
        raw_metrics: rawMetrics,
        breakdown: v2Result.breakdown,
        dps_score: v2Result.score,
        tier: v2Result.tier,
        label_trust: v2Result.dps_v2_incomplete ? 'untrusted' : 'medium',
        training_weight: v2Result.dps_v2_incomplete ? 0 : 0.7,
        source_tag: 'auto_cron',
        predicted_dps: run.predicted_dps_7d,
        prediction_range_low: run.prediction_range_low,
        prediction_range_high: run.prediction_range_high,
        dps_v2_incomplete: v2Result.dps_v2_incomplete,
        dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
      },
      {
        metrics_source: metricsSource,
        actual_checkpoint_used: checkpointUsed,
        actual_follower_count: followerCount || null,
      },
    );

    if (!writeResult.success) {
      return { run_id: runId, status: 'failed', error: `Update failed: ${writeResult.error}` };
    }

    console.log(
      `[AutoLabeler] Labeled run ${runId}: VPS=${v2Result.score?.toFixed(4) ?? 'INCOMPLETE'}, tier=${v2Result.tier}, checkpoint=${checkpointUsed}`,
    );

    // Emit platform event (fire-and-forget)
    emitEvent({
      eventType: 'ground_truth.collected',
      payload: {
        videoId: run.video_id,
        actualDps: v2Result.score ?? null,
        daysSincePost: elapsedHours !== null ? Math.round(elapsedHours / 24 * 10) / 10 : null,
      },
      entityType: 'prediction_run',
      entityId: runId,
    }).catch(() => {});

    return {
      run_id: runId,
      status: 'labeled',
      actual_dps: v2Result.score,
      actual_tier: v2Result.tier,
      checkpoint_used: checkpointUsed,
      metrics_source: metricsSource,
    };
  } catch (err: any) {
    console.error(`[AutoLabeler] Error labeling run ${runId}: ${err.message}`);
    return { run_id: runId, status: 'failed', error: err.message };
  }
}

/**
 * Get metrics from the best completed checkpoint in metric_check_schedule.
 */
async function getMetricsFromSchedule(
  supabase: any,
  runId: string,
): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  checkpointUsed: string;
  metricsSource: string;
} | null> {
  const { data: schedules } = await supabase
    .from('metric_check_schedule')
    .select('check_type, actual_metrics')
    .eq('prediction_run_id', runId)
    .eq('status', 'completed');

  if (!schedules || schedules.length === 0) return null;

  for (const checkType of CHECKPOINT_PRIORITY) {
    const sched = schedules.find((s: any) => s.check_type === checkType);
    if (!sched) continue;

    const m = (sched as any).actual_metrics;
    if (!m || m.error) continue;

    return {
      views: Number(m.views) || 0,
      likes: Number(m.likes) || 0,
      comments: Number(m.comments) || 0,
      shares: Number(m.shares) || 0,
      saves: Number(m.saves) || 0,
      checkpointUsed: checkType,
      metricsSource: 'apify',
    };
  }

  return null;
}

/**
 * Fetch cohort data from scraped_videos for a given niche.
 */
async function fetchCohort(
  supabase: any,
  niche: string,
): Promise<ScrapedVideoRow[]> {
  const cohort: ScrapedVideoRow[] = [];
  let offset = 0;

  while (true) {
    const { data: page, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + COHORT_PAGE_SIZE - 1);

    if (error) {
      console.error(`[AutoLabeler] Cohort fetch error for ${niche}: ${error.message}`);
      break;
    }
    if (!page || page.length === 0) break;

    for (const r of page) {
      cohort.push({
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

  return cohort;
}
