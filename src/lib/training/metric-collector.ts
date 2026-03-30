/**
 * Phase 83: Metric Collection v1 — Batch Metric Collector
 *
 * Processes due metric_check_schedule rows by fetching actual TikTok metrics
 * and writing them to the actual_metrics JSONB column.
 *
 * CONTAMINATION SAFETY:
 * - All post-execution data is stored ONLY in metric_check_schedule.actual_metrics
 * - Nothing is written to prediction_runs, video_files, or any feature column
 * - The Phase 81 contamination validator would flag any leak
 */

import { createClient } from '@supabase/supabase-js';
import { fetchTikTokMetrics } from './tiktok-metric-fetcher';
import { extractTikTokUrl } from './metric-scheduler';
import type {
  MetricCollectorResult,
  MetricCollectorItemResult,
} from './training-ingest-types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false },
  }
);

interface CollectorOptions {
  /** Only process schedules for this specific run */
  runId?: string;
  /** Max schedules to process in one batch (default 10) */
  limit?: number;
  /** If true, query + log but don't fetch metrics or update rows */
  dryRun?: boolean;
}

/**
 * Run the metric collector: query due schedules, fetch metrics, update rows.
 */
export async function runMetricCollector(
  opts: CollectorOptions = {}
): Promise<MetricCollectorResult> {
  const limit = Math.min(opts.limit ?? 10, 50);
  const dryRun = opts.dryRun ?? false;

  console.log(
    `[MetricCollector] Starting batch (limit=${limit}, dryRun=${dryRun}` +
      (opts.runId ? `, runId=${opts.runId}` : '') +
      ')'
  );

  // 1. Query due schedules (include rows with null platform_video_id so we can fail them explicitly)
  let query = supabase
    .from('metric_check_schedule')
    .select('id, prediction_run_id, video_id, platform, platform_video_id, check_type, scheduled_at, status')
    .in('status', ['pending', 'failed'])
    .lte('scheduled_at', new Date().toISOString())
    .eq('platform', 'tiktok')
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (opts.runId) {
    query = query.eq('prediction_run_id', opts.runId);
  }

  const { data: schedules, error: queryError } = await query;

  if (queryError) {
    throw new Error(`Failed to query schedules: ${queryError.message || JSON.stringify(queryError)}`);
  }

  if (!schedules || schedules.length === 0) {
    console.log('[MetricCollector] No due schedules found');
    return { processed: 0, succeeded: 0, failed: 0, skipped: 0, dry_run: dryRun, details: [] };
  }

  console.log(`[MetricCollector] Found ${schedules.length} due schedule(s)`);

  const details: MetricCollectorItemResult[] = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  const CHECKPOINT_PRIORITY = ['7d', '48h', '24h', '4h'];

  // 2. Process each schedule
  for (let i = 0; i < schedules.length; i++) {
    const sched = schedules[i] as any;
    const item: MetricCollectorItemResult = {
      schedule_id: sched.id,
      prediction_run_id: sched.prediction_run_id,
      check_type: sched.check_type,
      platform_video_id: sched.platform_video_id || '',
      status: 'completed',
    };

    // 2a. Resolve a usable TikTok URL
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let tiktokUrl: string | null = null;

    const rawPvid = (sched.platform_video_id || '').trim();
    if (rawPvid && !UUID_RE.test(rawPvid)) {
      // Looks like a real URL or numeric ID — use it
      tiktokUrl = rawPvid;
    }

    // Fallback: resolve from prediction_runs.source_meta
    if (!tiktokUrl) {
      const { data: prRun } = await supabase
        .from('prediction_runs')
        .select('source_meta')
        .eq('id', sched.prediction_run_id)
        .single();
      tiktokUrl = extractTikTokUrl((prRun as any)?.source_meta);

      // If we resolved a URL, backfill the schedule row so future runs don't need the lookup
      if (tiktokUrl) {
        console.log(`[MetricCollector] Backfilled platform_video_id for schedule ${sched.id}: ${tiktokUrl}`);
        await supabase
          .from('metric_check_schedule')
          .update({ platform_video_id: tiktokUrl })
          .eq('id', sched.id);
      }
    }

    if (!tiktokUrl) {
      item.status = 'failed';
      item.error = 'missing_tiktok_url';
      item.platform_video_id = rawPvid || '';
      failed++;

      await supabase
        .from('metric_check_schedule')
        .update({
          status: 'failed',
          actual_metrics: { error: 'missing_tiktok_url', raw_platform_video_id: rawPvid, attempted_at: new Date().toISOString() },
        })
        .eq('id', sched.id);

      console.warn(`[MetricCollector] Failed ${sched.id} (${sched.check_type}): no TikTok URL (platform_video_id=${rawPvid})`);
      details.push(item);
      continue;
    }

    item.platform_video_id = tiktokUrl;

    if (dryRun) {
      item.status = 'skipped';
      skipped++;
      details.push(item);
      console.log(`[MetricCollector] [DRY RUN] Would process: ${sched.check_type} for ${tiktokUrl}`);
      continue;
    }

    // Diagnostic log: schedule_id, check_type, resolved URL, Apify input
    console.log(
      `[MetricCollector] schedule_id=${sched.id} check_type=${sched.check_type} ` +
      `resolved_url=${tiktokUrl} apify_input=${JSON.stringify({ postURLs: [tiktokUrl], resultsPerPage: 1 })}`
    );

    try {
      // 3. Fetch metrics from TikTok via Apify
      const metrics = await fetchTikTokMetrics(tiktokUrl);

      if (!metrics) {
        // Video not found / no data — mark failed
        item.status = 'failed';
        item.error = 'No data returned from Apify';
        failed++;

        await supabase
          .from('metric_check_schedule')
          .update({
            status: 'failed',
            actual_metrics: { error: item.error, attempted_at: new Date().toISOString() },
          })
          .eq('id', sched.id);
      } else {
        // 4. Write metrics to actual_metrics JSONB + mark completed
        item.status = 'completed';
        item.metrics = metrics;
        succeeded++;

        await supabase
          .from('metric_check_schedule')
          .update({
            status: 'completed',
            actual_metrics: metrics,
            completed_at: new Date().toISOString(),
          })
          .eq('id', sched.id);

        console.log(
          `[MetricCollector] Completed ${sched.check_type} for run ${sched.prediction_run_id}: ` +
            `${metrics.views} views`
        );

        // 5. Update prediction_runs with metrics_source + best checkpoint
        try {
          // Find the best completed checkpoint for this run (7d > 48h > 24h > 4h)
          const { data: completedChecks } = await supabase
            .from('metric_check_schedule')
            .select('check_type')
            .eq('prediction_run_id', sched.prediction_run_id)
            .eq('status', 'completed');

          const completedTypes = new Set((completedChecks || []).map((c: any) => c.check_type));
          const bestCheckpoint = CHECKPOINT_PRIORITY.find((t) => completedTypes.has(t)) || sched.check_type;

          // Only set actual_checkpoint_used if currently NULL (don't downgrade)
          const { data: currentRun } = await supabase
            .from('prediction_runs')
            .select('actual_checkpoint_used')
            .eq('id', sched.prediction_run_id)
            .single();

          const updatePayload: Record<string, any> = {
            metrics_source: 'apify',
            metrics_attached_at: new Date().toISOString(),
          };
          if (!(currentRun as any)?.actual_checkpoint_used) {
            updatePayload.actual_checkpoint_used = bestCheckpoint;
          }

          await supabase
            .from('prediction_runs')
            .update(updatePayload)
            .eq('id', sched.prediction_run_id);
        } catch (prErr: any) {
          // Non-fatal — log but don't fail the schedule
          console.error(`[MetricCollector] Failed to update prediction_runs for ${sched.prediction_run_id}: ${prErr.message}`);
        }
      }
    } catch (err: any) {
      // 6. On error: mark failed, store error
      const errMsg = err.message || String(err);
      item.status = 'failed';
      item.error = errMsg;
      failed++;

      console.error(`[MetricCollector] Failed ${sched.check_type} for ${sched.platform_video_id}: ${errMsg}`);

      await supabase
        .from('metric_check_schedule')
        .update({
          status: 'failed',
          actual_metrics: { error: errMsg, attempted_at: new Date().toISOString() },
        })
        .eq('id', sched.id);
    }

    details.push(item);

    // Rate limit: 2s pause between Apify calls to avoid hammering
    if (i < schedules.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(
    `[MetricCollector] Batch complete: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped`
  );

  return {
    processed: schedules.length,
    succeeded,
    failed,
    skipped,
    dry_run: dryRun,
    details,
  };
}
