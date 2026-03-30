/**
 * Schedule Backfill — Create metric_check_schedule rows for old prediction runs
 *
 * Finds prediction_runs that have a TikTok URL (in source_meta) but no
 * metric_check_schedule rows, and creates schedules anchored to the run's
 * created_at timestamp so they are immediately due for collection.
 */

import { createClient } from '@supabase/supabase-js';
import { extractTikTokUrl, createMetricSchedules } from './metric-scheduler';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

export interface BackfillResult {
  processed: number;
  scheduled: number;
  skipped: number;
  failed: number;
  details: Array<{ run_id: string; status: 'scheduled' | 'skipped' | 'failed'; error?: string }>;
}

export async function backfillMetricSchedules(opts?: {
  limit?: number;
  dryRun?: boolean;
}): Promise<BackfillResult> {
  const limit = Math.min(opts?.limit ?? 100, 500);
  const dryRun = opts?.dryRun ?? false;
  const supabase = getSupabase();

  console.log(`[ScheduleBackfill] Starting (limit=${limit}, dryRun=${dryRun})`);

  // Step 1: Get run IDs that already have schedules
  const { data: existingSchedules } = await supabase
    .from('metric_check_schedule')
    .select('prediction_run_id');

  const scheduledRunIds = new Set(
    (existingSchedules || []).map((s: any) => s.prediction_run_id),
  );

  // Step 2: Get prediction_runs with source_meta (potential TikTok URLs)
  const { data: candidateRuns, error: queryErr } = await supabase
    .from('prediction_runs')
    .select('id, video_id, source_meta, created_at')
    .not('source_meta', 'is', null)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit * 3); // fetch extra to account for filtering

  if (queryErr) {
    throw new Error(`Failed to query prediction_runs: ${queryErr.message}`);
  }

  // Step 3: Filter to runs without schedules
  const runsToBackfill = (candidateRuns || [])
    .filter((r: any) => !scheduledRunIds.has(r.id))
    .slice(0, limit);

  if (runsToBackfill.length === 0) {
    console.log('[ScheduleBackfill] No runs need backfilling');
    return { processed: 0, scheduled: 0, skipped: 0, failed: 0, details: [] };
  }

  console.log(`[ScheduleBackfill] Found ${runsToBackfill.length} runs to backfill`);

  const result: BackfillResult = {
    processed: runsToBackfill.length,
    scheduled: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const run of runsToBackfill) {
    const r = run as any;

    // Extract TikTok URL from source_meta
    const tiktokUrl = extractTikTokUrl(r.source_meta);
    if (!tiktokUrl) {
      result.skipped++;
      result.details.push({ run_id: r.id, status: 'skipped', error: 'no_tiktok_url' });
      continue;
    }

    if (dryRun) {
      result.scheduled++;
      result.details.push({ run_id: r.id, status: 'scheduled' });
      console.log(`[ScheduleBackfill] [DRY RUN] Would schedule: ${r.id} → ${tiktokUrl}`);
      continue;
    }

    try {
      // Anchor schedules to run's created_at so they're immediately due
      const anchorTime = new Date(r.created_at).getTime();
      const count = await createMetricSchedules(r.id, r.video_id, {
        platformVideoId: tiktokUrl,
        anchorTime,
      });

      if (count > 0) {
        result.scheduled++;
        result.details.push({ run_id: r.id, status: 'scheduled' });
        console.log(`[ScheduleBackfill] Created ${count} schedules for run ${r.id}`);
      } else {
        result.skipped++;
        result.details.push({ run_id: r.id, status: 'skipped', error: 'no_schedules_created' });
      }
    } catch (err: any) {
      result.failed++;
      result.details.push({ run_id: r.id, status: 'failed', error: err.message });
      console.error(`[ScheduleBackfill] Failed for run ${r.id}: ${err.message}`);
    }
  }

  console.log(
    `[ScheduleBackfill] Complete: ${result.scheduled} scheduled, ${result.skipped} skipped, ${result.failed} failed`,
  );

  return result;
}
