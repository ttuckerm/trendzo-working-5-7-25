/**
 * Backfill prediction_runs.actual_performance from scraped_videos.views_count.
 *
 * actual_performance is the primary post-publication signal VPS is predicting.
 * For TikTok data this maps to views_count (a.k.a. play_count in the API).
 * The Feedback Collector cron will keep this fresh going forward; this script
 * fills the historical backlog in one pass.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getServiceDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase service credentials not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function backfillActualPerformance(): Promise<{ updated: number; skipped: number }> {
  const db = getServiceDb();

  const pageSize = 1000;
  let offset = 0;
  const runs: Array<{ id: string; video_id: string }> = [];

  while (true) {
    const { data, error } = await db
      .from('prediction_runs')
      .select('id, video_id')
      .is('actual_performance', null)
      .not('video_id', 'is', null)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw new Error(`Failed to query prediction_runs: ${error.message}`);
    if (!data || data.length === 0) break;
    runs.push(...(data as Array<{ id: string; video_id: string }>));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  if (runs.length === 0) {
    console.log('[backfill-perf] no prediction_runs missing actual_performance');
    return { updated: 0, skipped: 0 };
  }

  // Build video_id → views_count map in chunks.
  const viewsByVideoId = new Map<string, number>();
  const videoIds = Array.from(new Set(runs.map((r) => r.video_id).filter(Boolean)));
  const chunkSize = 500;

  for (let i = 0; i < videoIds.length; i += chunkSize) {
    const chunk = videoIds.slice(i, i + chunkSize);
    const { data: videos, error: vidErr } = await db
      .from('scraped_videos')
      .select('video_id, views_count')
      .in('video_id', chunk)
      .not('views_count', 'is', null);

    if (vidErr) throw new Error(`Failed to query scraped_videos: ${vidErr.message}`);

    for (const v of (videos || []) as Array<{ video_id: string; views_count: number }>) {
      if (!viewsByVideoId.has(v.video_id)) {
        viewsByVideoId.set(v.video_id, v.views_count);
      }
    }
  }

  let updated = 0;
  let skipped = 0;

  // Group runs by views_count so we can bulk-update in batches.
  const byValue = new Map<number, string[]>();
  for (const r of runs) {
    const v = viewsByVideoId.get(r.video_id);
    if (v === undefined) { skipped++; continue; }
    if (!byValue.has(v)) byValue.set(v, []);
    byValue.get(v)!.push(r.id);
  }

  for (const [value, ids] of byValue.entries()) {
    for (let i = 0; i < ids.length; i += 200) {
      const idChunk = ids.slice(i, i + 200);
      const { error } = await db
        .from('prediction_runs')
        .update({ actual_performance: value })
        .in('id', idChunk);
      if (error) {
        console.warn(`[backfill-perf] update failed for chunk (value=${value}): ${error.message}`);
        // Fall back to best-effort per-row so a single bad row doesn't block the rest.
        for (const id of idChunk) {
          const { error: rowErr } = await db
            .from('prediction_runs')
            .update({ actual_performance: value })
            .eq('id', id);
          if (rowErr) { skipped++; continue; }
          updated++;
        }
      } else {
        updated += idChunk.length;
      }
    }
  }

  console.log(`[backfill-perf] updated=${updated} skipped=${skipped} (of ${runs.length} candidates)`);
  return { updated, skipped };
}
