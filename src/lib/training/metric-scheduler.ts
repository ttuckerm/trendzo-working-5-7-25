/**
 * Phase 82: Training Ingest v1 — Metric Schedule Creator
 *
 * Creates metric collection schedule rows for a prediction run.
 * Schedules are at fixed intervals: 4h, 24h, 48h, 7d from NOW().
 * Actual metric collection is a future phase — this only creates the schedule.
 *
 * Uses UPSERT with (prediction_run_id, check_type) unique constraint
 * to prevent duplicate rows on retry.
 */

import { createClient } from '@supabase/supabase-js';
import type { MetricCheckType } from './training-ingest-types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false },
  }
);

/** Schedule offsets from NOW() in milliseconds */
const SCHEDULE_OFFSETS: { checkType: MetricCheckType; offsetMs: number }[] = [
  { checkType: '4h',  offsetMs: 4 * 60 * 60 * 1000 },
  { checkType: '24h', offsetMs: 24 * 60 * 60 * 1000 },
  { checkType: '48h', offsetMs: 48 * 60 * 60 * 1000 },
  { checkType: '7d',  offsetMs: 7 * 24 * 60 * 60 * 1000 },
];

/** UUID v4 pattern — used to detect internal IDs that are NOT TikTok URLs */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extract the best TikTok URL from source_meta, checking multiple keys.
 * Returns null if nothing usable is found.
 */
export function extractTikTokUrl(sourceMeta: Record<string, any> | null | undefined): string | null {
  if (!sourceMeta) return null;
  // Priority order: post_url > platform_url > platformVideoId (only if it looks like a URL)
  for (const key of ['post_url', 'platform_url', 'platformVideoId', 'tiktok_url']) {
    const val = sourceMeta[key];
    if (typeof val === 'string' && val.trim() && !UUID_RE.test(val.trim())) {
      // Must look like a URL or a raw TikTok numeric ID
      const trimmed = val.trim();
      if (trimmed.startsWith('http') || /^\d{15,25}$/.test(trimmed)) {
        return trimmed;
      }
    }
  }
  return null;
}

interface CreateScheduleOptions {
  platform?: string;
  platformVideoId?: string;
  /** Override the anchor time for schedule offsets (default: Date.now()). Use run.created_at for backfill. */
  anchorTime?: number;
  /** Source of this schedule (e.g., 'discovery_scan', 'creator_predict', 'training_ingest', 'backfill'). Defaults to 'manual'. */
  source?: string;
}

/**
 * Create metric collection schedules for a prediction run.
 * UPSERTS 4 rows (4h, 24h, 48h, 7d) into metric_check_schedule.
 *
 * Resolves the TikTok URL for platform_video_id:
 *  1. Use opts.platformVideoId if it looks like a real URL / numeric ID
 *  2. Fall back to source_meta keys (post_url, platform_url, etc.)
 *  3. Store null if nothing usable found (collector will fail explicitly)
 *
 * @returns Count of rows created/updated
 */
export async function createMetricSchedules(
  runId: string,
  videoId: string,
  opts?: CreateScheduleOptions
): Promise<number> {
  const now = opts?.anchorTime ?? Date.now();

  // Resolve a real TikTok URL — reject internal UUIDs
  let resolvedUrl: string | null = null;

  if (opts?.platformVideoId && !UUID_RE.test(opts.platformVideoId.trim())) {
    const pv = opts.platformVideoId.trim();
    if (pv.startsWith('http') || /^\d{15,25}$/.test(pv)) {
      resolvedUrl = pv;
    }
  }

  // If caller didn't provide a usable URL, look up source_meta from prediction_runs
  if (!resolvedUrl) {
    const { data: run } = await supabase
      .from('prediction_runs')
      .select('source_meta')
      .eq('id', runId)
      .single();
    resolvedUrl = extractTikTokUrl((run as any)?.source_meta);
  }

  if (!resolvedUrl) {
    console.warn(`[MetricScheduler] No TikTok URL found for run ${runId} — refusing to create schedules. Attach a TikTok URL first.`);
    return 0;
  }

  console.log(`[MetricScheduler] Resolved TikTok URL for run ${runId}: ${resolvedUrl}`);

  const rows = SCHEDULE_OFFSETS.map(({ checkType, offsetMs }) => ({
    prediction_run_id: runId,
    video_id: videoId,
    platform: opts?.platform || 'tiktok',
    platform_video_id: resolvedUrl,
    check_type: checkType,
    scheduled_at: new Date(now + offsetMs).toISOString(),
    status: 'pending' as const,
    source: opts?.source || 'manual',
  }));

  const { data, error } = await supabase
    .from('metric_check_schedule')
    .upsert(rows, { onConflict: 'prediction_run_id,check_type' })
    .select('id');

  if (error) {
    const msg = error.message || error.details || error.hint || JSON.stringify(error);
    console.error('[MetricScheduler] Failed to create schedules:', msg, error);
    throw new Error(`Failed to create metric schedules: ${msg}`);
  }

  const count = data?.length ?? 0;
  const insertedIds = (data || []).map((r: any) => r.id);
  console.log(
    `[MetricScheduler] Created/updated ${count} schedule rows for run ${runId}` +
    ` | resolved_url=${resolvedUrl}` +
    ` | video_id=${videoId} (type=${typeof videoId})` +
    ` | ids=${JSON.stringify(insertedIds)}`
  );
  return count;
}
