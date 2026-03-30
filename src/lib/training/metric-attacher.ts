/**
 * Feature #3: Metric Attacher
 *
 * Core logic to write collected metrics from metric_check_schedule
 * back to prediction_runs.actual_* fields via the canonical DPS v2 writer.
 *
 * Guard rails (enforced in order):
 * 1. Idempotency — skip if actuals_entered_at already set (unless force)
 * 2. Contamination lock — require lock + proof
 * 3. Deterministic checkpoint selection — 7d > 48h > 24h > 4h
 * 4. Cohort freeze — filter scraped_videos to data available at prediction time
 */

import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from './dps-v2';
import type { MetricAttachResult, MetricAttachItemResult } from './training-ingest-types';

const CHECKPOINT_PRIORITY: string[] = ['7d', '48h', '24h', '4h'];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

interface AttachOptions {
  force?: boolean;
}

/**
 * Attach collected metrics for a single prediction run.
 */
export async function attachMetricsForRun(
  runId: string,
  opts?: AttachOptions,
): Promise<MetricAttachItemResult> {
  const supabase = getSupabase();

  // ── 1. Fetch the run ──────────────────────────────────────────────────────
  const { data: runRaw, error: runErr } = await supabase
    .from('prediction_runs')
    .select(
      'id, video_id, actuals_entered_at, contamination_lock, contamination_proof, ' +
      'predicted_dps_7d, prediction_range_low, prediction_range_high, ' +
      'cohort_key, cohort_frozen_at, created_at',
    )
    .eq('id', runId)
    .single();

  if (runErr || !runRaw) {
    return { run_id: runId, status: 'failed', error: `Run not found: ${runErr?.message || 'unknown'}` };
  }
  const run = runRaw as any;

  // ── 2. Idempotency guard ──────────────────────────────────────────────────
  if (run.actuals_entered_at && !opts?.force) {
    return { run_id: runId, status: 'skipped', skip_reason: 'already_attached' };
  }

  // ── 3. Contamination lock enforcement ─────────────────────────────────────
  if (!run.contamination_lock || !run.contamination_proof) {
    return { run_id: runId, status: 'skipped', skip_reason: 'run_not_clean_no_proof' };
  }

  // ── 4. Deterministic checkpoint selection ─────────────────────────────────
  const { data: schedules, error: schedErr } = await supabase
    .from('metric_check_schedule')
    .select('id, check_type, status, actual_metrics, completed_at')
    .eq('prediction_run_id', runId)
    .eq('status', 'completed');

  if (schedErr) {
    return { run_id: runId, status: 'failed', error: `Schedule fetch failed: ${schedErr.message}` };
  }

  if (!schedules || schedules.length === 0) {
    return { run_id: runId, status: 'skipped', skip_reason: 'no_completed_checks' };
  }

  let selectedCheck: any = null;
  for (const checkType of CHECKPOINT_PRIORITY) {
    selectedCheck = schedules.find((s: any) => s.check_type === checkType);
    if (selectedCheck) break;
  }

  if (!selectedCheck) {
    return { run_id: runId, status: 'skipped', skip_reason: 'no_completed_checks' };
  }

  const actualMetrics = selectedCheck.actual_metrics as Record<string, any> | null;
  if (!actualMetrics) {
    return { run_id: runId, status: 'failed', error: 'Selected check has no actual_metrics' };
  }

  // ── 5. Extract metrics ────────────────────────────────────────────────────
  const views = Number(actualMetrics.views) || 0;
  const likes = Number(actualMetrics.likes) || 0;
  const comments = Number(actualMetrics.comments) || 0;
  const shares = Number(actualMetrics.shares) || 0;
  const saves = Number(actualMetrics.saves) || 0;

  // ── 6. Fetch niche for cohort ─────────────────────────────────────────────
  const { data: videoFileRaw } = await supabase
    .from('video_files')
    .select('niche')
    .eq('id', run.video_id)
    .single();
  const videoFile = videoFileRaw as any;

  const niche = videoFile?.niche || 'side_hustles';

  // ── 7. Cohort freeze ──────────────────────────────────────────────────────
  const freezeCutoff = run.cohort_frozen_at;
  if (!freezeCutoff && !opts?.force) {
    return { run_id: runId, status: 'skipped', skip_reason: 'cohort_freeze_unavailable' };
  }

  // ── 8. Fetch cohort from scraped_videos with freeze filter ────────────────
  const cohortRows: ScrapedVideoRow[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    let query = supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + PAGE_SIZE - 1);

    if (freezeCutoff) {
      query = query.lte('created_at', freezeCutoff);
    }

    const { data: page, error: cohortErr } = await query;

    if (cohortErr) {
      return { run_id: runId, status: 'failed', error: `Cohort fetch failed: ${cohortErr.message}` };
    }
    if (!page || page.length === 0) break;

    for (const r of page) {
      cohortRows.push({
        views: (r as any).views_count ?? 0,
        likes: (r as any).likes_count ?? 0,
        comments: (r as any).comments_count ?? 0,
        shares: (r as any).shares_count ?? 0,
        saves: (r as any).saves_count ?? 0,
        follower_count: (r as any).creator_followers_count ?? 0,
      });
    }
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // ── 9. Compute DPS v2 ─────────────────────────────────────────────────────
  const elapsedHours = run.created_at
    ? (Date.now() - new Date(run.created_at).getTime()) / 3600000
    : 168;

  const rawMetrics: DpsV2RawMetrics = {
    views,
    likes,
    comments,
    shares,
    saves,
    follower_count: 0, // metric-attacher doesn't have follower data; v2 degrades gracefully
    hours_since_post: elapsedHours,
  };

  const v2Result = computeDpsV2FromRows(rawMetrics, cohortRows);

  // ── 10. Write via canonical v2 writer ─────────────────────────────────────
  const metricsSource = 'apify' as const;

  const writeResult = await labelPredictionRunWithDpsV2(
    supabase,
    {
      run_id: runId,
      raw_metrics: rawMetrics,
      breakdown: v2Result.breakdown,
      dps_score: v2Result.score,
      tier: v2Result.tier,
      label_trust: v2Result.dps_v2_incomplete ? 'untrusted' : 'high',
      training_weight: v2Result.dps_v2_incomplete ? 0 : 1.0,
      source_tag: 'metric_attach',
      predicted_dps: run.predicted_dps_7d,
      prediction_range_low: run.prediction_range_low,
      prediction_range_high: run.prediction_range_high,
      dps_v2_incomplete: v2Result.dps_v2_incomplete,
      dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
    },
    {
      metrics_attached_at: new Date().toISOString(),
      metrics_source: metricsSource,
      actual_checkpoint_used: selectedCheck.check_type,
    },
  );

  if (writeResult.error) {
    return { run_id: runId, status: 'failed', error: `Update failed: ${writeResult.error}` };
  }

  console.log(
    `[MetricAttacher] Attached ${selectedCheck.check_type} metrics for run ${runId}: ` +
    `DPS=${v2Result.score?.toFixed(4) ?? 'INCOMPLETE'}, tier=${v2Result.tier}, cohort=${cohortRows.length}`,
  );

  return {
    run_id: runId,
    status: v2Result.dps_v2_incomplete ? 'incomplete' : 'attached',
    check_type_used: selectedCheck.check_type,
    actual_dps: v2Result.score,
    actual_tier: v2Result.tier,
  };
}

/**
 * Batch-attach metrics for all eligible runs.
 */
export async function attachMetricsBatch(
  opts?: AttachOptions,
): Promise<MetricAttachResult> {
  const supabase = getSupabase();

  const { data: eligibleSchedules, error: schedErr } = await supabase
    .from('metric_check_schedule')
    .select('prediction_run_id')
    .eq('status', 'completed');

  if (schedErr || !eligibleSchedules) {
    return { processed: 0, attached: 0, skipped: 0, failed: 1, details: [] };
  }

  const runIds = Array.from(new Set(eligibleSchedules.map((s: any) => s.prediction_run_id)));

  if (runIds.length === 0) {
    return { processed: 0, attached: 0, skipped: 0, failed: 0, details: [] };
  }

  const { data: eligibleRuns, error: runErr } = await supabase
    .from('prediction_runs')
    .select('id')
    .in('id', runIds)
    .is('actuals_entered_at', null)
    .eq('contamination_lock', true)
    .not('contamination_proof', 'is', null);

  if (runErr || !eligibleRuns) {
    return { processed: 0, attached: 0, skipped: 0, failed: 1, details: [] };
  }

  const result: MetricAttachResult = {
    processed: eligibleRuns.length,
    attached: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const run of eligibleRuns) {
    const itemResult = await attachMetricsForRun(run.id, opts);
    result.details.push(itemResult);
    if (itemResult.status === 'attached') result.attached++;
    else if (itemResult.status === 'skipped') result.skipped++;
    else result.failed++;
  }

  console.log(
    `[MetricAttacher] Batch complete: ${result.attached} attached, ` +
    `${result.skipped} skipped, ${result.failed} failed out of ${result.processed}`,
  );

  return result;
}
