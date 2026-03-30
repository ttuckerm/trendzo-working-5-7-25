#!/usr/bin/env npx tsx
/**
 * DPS v2 Rescore / Backfill — Rescue Legacy Labels
 *
 * Finds legacy_v1 rows (archived by Step 6) and attempts to rescore them
 * through the canonical DPS v2 pipeline using stored raw metric data.
 *
 * Metric source priority (first match wins):
 *   1. prediction_run_outcome_snapshots (best checkpoint)
 *   2. metric_check_schedule.actual_metrics (Apify checkpoint JSONB)
 *   3. prediction_runs.actual_* columns (raw engagement counts from legacy labeling)
 *   4. bulk_download_items (joined by prediction_id)
 *   5. scraped_videos / scraped_video_metrics (matched by video_id)
 *
 * Behaviour:
 *   - Dry-run mode (default): reports what would be rescored, writes nothing.
 *   - Force mode (--force): writes v2 labels. Rows already rescored are skipped
 *     unless --re-rescore is passed.
 *   - Idempotent: rescored rows get dps_formula_version='2.0.0' and
 *     labeling_mode='rescore_backfill'. Re-running skips them automatically.
 *   - Resumable: processes in created_at order; can be stopped and restarted.
 *   - Legacy columns (legacy_actual_dps, legacy_actual_tier,
 *     legacy_dps_formula_version) are NEVER overwritten.
 *
 * Usage:
 *   npx tsx scripts/rescore-legacy-to-v2.ts                     # dry-run, all niches
 *   npx tsx scripts/rescore-legacy-to-v2.ts --force              # write rescored labels
 *   npx tsx scripts/rescore-legacy-to-v2.ts --dry-run --limit 10 # preview 10 rows
 *   npx tsx scripts/rescore-legacy-to-v2.ts --force --niche gaming
 *   npx tsx scripts/rescore-legacy-to-v2.ts --force --re-rescore # re-rescore already-rescored rows
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
  DPS_V2_FORMULA_VERSION,
} from '../src/lib/training/dps-v2';

// ── Env ────────────────────────────────────────────────────────────────────────
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

// ── CLI flags ──────────────────────────────────────────────────────────────────

function getCliArg(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=')[1];
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}

const DRY_RUN = !process.argv.includes('--force');
const RE_RESCORE = process.argv.includes('--re-rescore');
const LIMIT = parseInt(getCliArg('--limit') || '0', 10) || 0;
const NICHE_FILTER = getCliArg('--niche')?.toLowerCase().replace(/_/g, '-') || null;

const CHECKPOINT_PRIORITY = ['7d', '48h', '24h', '4h', '3h', '30d'] as const;
const COHORT_PAGE_SIZE = 1000;
const SOURCE_TAG = 'rescore_backfill';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LegacyRow {
  id: string;
  video_id: string;
  created_at: string;
  predicted_dps_7d: number | null;
  prediction_range_low: number | null;
  prediction_range_high: number | null;
  actual_views: number | null;
  actual_likes: number | null;
  actual_comments: number | null;
  actual_shares: number | null;
  actual_saves: number | null;
  actual_hours_since_post: number | null;
  actual_posted_at: string | null;
  actual_collected_at: string | null;
  source_meta: Record<string, any> | null;
  labeling_mode: string | null;
  dps_formula_version: string | null;
}

interface ResolvedMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  follower_count: number;
  hours_since_post: number;
  posted_at: string | null;
  collected_at: string | null;
  source: string;
  checkpoint?: string;
}

interface RescoreResult {
  run_id: string;
  status: 'rescored' | 'insufficient_signal' | 'failed';
  source?: string;
  checkpoint?: string;
  dps_score?: number;
  tier?: string;
  confidence_level?: string;
  available_signals?: number;
  error?: string;
}

// ── Metric Resolution (5 sources, priority order) ──────────────────────────────

/**
 * Source 1: prediction_run_outcome_snapshots
 * Best-quality source — structured checkpoint data from the v2 schema.
 */
async function tryOutcomeSnapshots(
  runId: string,
): Promise<ResolvedMetrics | null> {
  const { data: snapshots } = await supabase
    .from('prediction_run_outcome_snapshots')
    .select('checkpoint, views, likes, comments, shares, saves, follower_count, hours_since_post, posted_at, collected_at')
    .eq('run_id', runId)
    .order('collected_at', { ascending: false });

  if (!snapshots || snapshots.length === 0) return null;

  // Pick best checkpoint by priority
  for (const cp of CHECKPOINT_PRIORITY) {
    const snap = snapshots.find((s: any) => s.checkpoint === cp);
    if (snap && snap.views != null && Number(snap.views) > 0) {
      return {
        views: Number(snap.views),
        likes: Number(snap.likes) || 0,
        comments: Number(snap.comments) || 0,
        shares: Number(snap.shares) || 0,
        saves: Number(snap.saves) || 0,
        follower_count: Number(snap.follower_count) || 0,
        hours_since_post: Number(snap.hours_since_post) || 168,
        posted_at: snap.posted_at ?? null,
        collected_at: snap.collected_at ?? null,
        source: 'outcome_snapshot',
        checkpoint: cp,
      };
    }
  }

  // Fallback: use the most recent snapshot regardless of checkpoint
  const best = snapshots[0] as any;
  if (best.views != null && Number(best.views) > 0) {
    return {
      views: Number(best.views),
      likes: Number(best.likes) || 0,
      comments: Number(best.comments) || 0,
      shares: Number(best.shares) || 0,
      saves: Number(best.saves) || 0,
      follower_count: Number(best.follower_count) || 0,
      hours_since_post: Number(best.hours_since_post) || 168,
      posted_at: best.posted_at ?? null,
      collected_at: best.collected_at ?? null,
      source: 'outcome_snapshot',
      checkpoint: best.checkpoint,
    };
  }

  return null;
}

/**
 * Source 2: metric_check_schedule.actual_metrics (Apify JSONB)
 */
async function tryMetricCheckSchedule(
  runId: string,
): Promise<ResolvedMetrics | null> {
  const { data: schedules } = await supabase
    .from('metric_check_schedule')
    .select('check_type, actual_metrics, completed_at')
    .eq('prediction_run_id', runId)
    .eq('status', 'completed');

  if (!schedules || schedules.length === 0) return null;

  for (const checkType of CHECKPOINT_PRIORITY) {
    const sched = schedules.find((s: any) => s.check_type === checkType);
    if (!sched) continue;

    const m = (sched as any).actual_metrics;
    if (!m || m.error) continue;

    const views = Number(m.views) || 0;
    if (views === 0) continue;

    return {
      views,
      likes: Number(m.likes) || 0,
      comments: Number(m.comments) || 0,
      shares: Number(m.shares) || 0,
      saves: Number(m.saves) || 0,
      follower_count: Number(m.follower_count) || 0,
      hours_since_post: Number(m.hours_since_post) || 168,
      posted_at: m.posted_at ?? null,
      collected_at: (sched as any).completed_at ?? null,
      source: 'metric_check_schedule',
      checkpoint: checkType,
    };
  }

  return null;
}

/**
 * Source 3: prediction_runs.actual_* columns (from legacy labeling)
 */
function tryRunActualColumns(row: LegacyRow): ResolvedMetrics | null {
  const views = row.actual_views;
  if (!views || views <= 0) return null;

  return {
    views,
    likes: row.actual_likes || 0,
    comments: row.actual_comments || 0,
    shares: row.actual_shares || 0,
    saves: row.actual_saves || 0,
    follower_count: 0, // not stored on prediction_runs directly
    hours_since_post: row.actual_hours_since_post || 168,
    posted_at: row.actual_posted_at ?? null,
    collected_at: row.actual_collected_at ?? null,
    source: 'prediction_runs_actual',
  };
}

/**
 * Source 4: bulk_download_items (joined by prediction_id)
 */
async function tryBulkDownloadItems(
  runId: string,
): Promise<ResolvedMetrics | null> {
  const { data: items } = await supabase
    .from('bulk_download_items')
    .select('actual_views, actual_likes, actual_comments, actual_shares, actual_saves, views, likes, comments, shares, follower_count')
    .eq('prediction_id', runId)
    .limit(1);

  if (!items || items.length === 0) return null;

  const item = items[0] as any;
  // bulk_download_items has two sets: actual_* columns and inline columns
  const views = Number(item.actual_views) || Number(item.views) || 0;
  if (views <= 0) return null;

  return {
    views,
    likes: Number(item.actual_likes) || Number(item.likes) || 0,
    comments: Number(item.actual_comments) || Number(item.comments) || 0,
    shares: Number(item.actual_shares) || Number(item.shares) || 0,
    saves: Number(item.actual_saves) || 0,
    follower_count: Number(item.follower_count) || 0,
    hours_since_post: 168, // bulk downloads don't track timing
    posted_at: null,
    collected_at: null,
    source: 'bulk_download_items',
  };
}

/**
 * Source 5: scraped_videos / scraped_video_metrics
 * Uses video_id to find the scraped equivalent. Prefers time-series metrics
 * closest to +7d, falls back to inline scraped_videos counts.
 */
async function tryScrapedData(
  videoId: string,
): Promise<ResolvedMetrics | null> {
  // 5a: scraped_video_metrics time-series
  const { data: metricRows } = await supabase
    .from('scraped_video_metrics')
    .select('views, likes, comments, shares, saves, collected_at')
    .eq('video_id', videoId)
    .order('collected_at', { ascending: false })
    .limit(5);

  if (metricRows && metricRows.length > 0) {
    // Use the latest snapshot (most data has accumulated)
    const best = metricRows[0] as any;
    if (best.views != null && Number(best.views) > 0) {
      return {
        views: Number(best.views),
        likes: Number(best.likes) || 0,
        comments: Number(best.comments) || 0,
        shares: Number(best.shares) || 0,
        saves: Number(best.saves) || 0,
        follower_count: 0,
        hours_since_post: 168,
        posted_at: null,
        collected_at: best.collected_at ?? null,
        source: 'scraped_video_metrics',
      };
    }
  }

  // 5b: scraped_videos inline
  const { data: svRows } = await supabase
    .from('scraped_videos')
    .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count, upload_timestamp')
    .eq('video_id', videoId)
    .limit(1);

  if (svRows && svRows.length > 0) {
    const sv = svRows[0] as any;
    if (sv.views_count != null && Number(sv.views_count) > 0) {
      return {
        views: Number(sv.views_count),
        likes: Number(sv.likes_count) || 0,
        comments: Number(sv.comments_count) || 0,
        shares: Number(sv.shares_count) || 0,
        saves: Number(sv.saves_count) || 0,
        follower_count: Number(sv.creator_followers_count) || 0,
        hours_since_post: 168,
        posted_at: sv.upload_timestamp ?? null,
        collected_at: null,
        source: 'scraped_videos_inline',
      };
    }
  }

  return null;
}

/**
 * Try all 5 sources in priority order. Return first successful resolution.
 */
async function resolveMetrics(
  row: LegacyRow,
): Promise<ResolvedMetrics | null> {
  // Source 1: outcome snapshots
  const s1 = await tryOutcomeSnapshots(row.id);
  if (s1) return s1;

  // Source 2: metric_check_schedule
  const s2 = await tryMetricCheckSchedule(row.id);
  if (s2) return s2;

  // Source 3: prediction_runs.actual_* columns
  const s3 = tryRunActualColumns(row);
  if (s3) return s3;

  // Source 4: bulk_download_items
  const s4 = await tryBulkDownloadItems(row.id);
  if (s4) return s4;

  // Source 5: scraped data
  const s5 = await tryScrapedData(row.video_id);
  if (s5) return s5;

  return null;
}

// ── Follower enrichment ────────────────────────────────────────────────────────

/**
 * Try to enrich follower count if the resolved metrics don't have one.
 * Checks metric_check_schedule and scraped_videos.
 */
async function enrichFollowerCount(
  runId: string,
  videoId: string,
  currentCount: number,
): Promise<number> {
  if (currentCount > 0) return currentCount;

  // Try metric_check_schedule
  try {
    const { data: schedules } = await supabase
      .from('metric_check_schedule')
      .select('actual_metrics')
      .eq('prediction_run_id', runId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    const fc = schedules?.[0]?.actual_metrics?.follower_count;
    if (fc && Number(fc) > 0) return Number(fc);
  } catch {}

  // Try scraped_videos by video_id
  try {
    const { data: sv } = await supabase
      .from('scraped_videos')
      .select('creator_followers_count')
      .eq('video_id', videoId)
      .limit(1)
      .maybeSingle();

    if (sv?.creator_followers_count && Number(sv.creator_followers_count) > 0) {
      return Number(sv.creator_followers_count);
    }
  } catch {}

  return 0;
}

// ── Cohort fetching (cached) ───────────────────────────────────────────────────

const cohortCache = new Map<string, ScrapedVideoRow[]>();

async function getCohort(niche: string): Promise<ScrapedVideoRow[]> {
  if (cohortCache.has(niche)) return cohortCache.get(niche)!;

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
      console.error(`  Cohort fetch error for ${niche}: ${error.message}`);
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

  cohortCache.set(niche, cohort);
  return cohort;
}

// ── Niche resolution ───────────────────────────────────────────────────────────

const nicheCache = new Map<string, string>();

async function resolveNiche(videoId: string): Promise<string> {
  if (nicheCache.has(videoId)) return nicheCache.get(videoId)!;

  const { data } = await supabase
    .from('video_files')
    .select('niche')
    .eq('id', videoId)
    .maybeSingle();

  const raw = (data as any)?.niche || 'side-hustles';
  // Canonical niche keys are hyphenated (system-registry.ts convention)
  const niche = raw.toLowerCase().replace(/_/g, '-');
  nicheCache.set(videoId, niche);
  return niche;
}

// ── Trust/weight assignment ────────────────────────────────────────────────────

/**
 * Assign label_trust and training_weight based on metric source quality
 * and signal completeness.
 */
function assignTrustAndWeight(
  source: string,
  availableSignals: number,
  totalSignals: number,
): { trust: 'low' | 'medium' | 'high'; weight: number } {
  // Source quality tier
  const sourceQuality =
    source === 'outcome_snapshot' ? 'high' :
    source === 'metric_check_schedule' ? 'high' :
    source === 'prediction_runs_actual' ? 'medium' :
    source === 'bulk_download_items' ? 'medium' :
    'low'; // scraped_video_metrics, scraped_videos_inline

  // Signal completeness ratio
  const signalRatio = availableSignals / totalSignals;

  if (sourceQuality === 'high' && signalRatio >= 0.7) {
    return { trust: 'medium', weight: 0.6 };
  }
  if (sourceQuality === 'high' || (sourceQuality === 'medium' && signalRatio >= 0.5)) {
    return { trust: 'low', weight: 0.4 };
  }
  // Low-quality source or very few signals: still eligible but low weight
  if (signalRatio >= 0.3) {
    return { trust: 'low', weight: 0.2 };
  }
  // Bare minimum signals (views + at least one engagement metric)
  return { trust: 'low', weight: 0.1 };
}

// ── Rescore a single row ───────────────────────────────────────────────────────

async function rescoreSingleRow(row: LegacyRow): Promise<RescoreResult> {
  try {
    // 1. Resolve metrics from the 5 priority sources
    const resolved = await resolveMetrics(row);
    if (!resolved) {
      return { run_id: row.id, status: 'insufficient_signal' };
    }

    // 2. Resolve niche for cohort lookup
    const niche = await resolveNiche(row.video_id);

    // 3. Enrich follower count if missing
    const followerCount = await enrichFollowerCount(
      row.id, row.video_id, resolved.follower_count,
    );

    // 4. Fetch cohort
    const cohort = await getCohort(niche);
    if (cohort.length === 0) {
      return {
        run_id: row.id,
        status: 'failed',
        error: `Empty cohort for niche '${niche}'`,
      };
    }

    // 5. Build raw metrics for v2 computation
    const rawMetrics: DpsV2RawMetrics = {
      views: resolved.views,
      likes: resolved.likes,
      comments: resolved.comments,
      shares: resolved.shares,
      saves: resolved.saves,
      follower_count: followerCount,
      hours_since_post: resolved.hours_since_post,
      posted_at: resolved.posted_at,
      collected_at: resolved.collected_at,
    };

    // 6. Compute DPS v2 through canonical module
    const v2Result = computeDpsV2FromRows(rawMetrics, cohort);

    if (v2Result.dps_v2_incomplete) {
      return { run_id: row.id, status: 'incomplete', error: v2Result.dps_v2_incomplete_reason };
    }

    // 7. Determine trust and weight based on source quality
    const availableSignals = v2Result.breakdown!.confidence.available_signal_count;
    const totalSignals = v2Result.breakdown!.confidence.total_signal_count;
    const { trust, weight } = assignTrustAndWeight(
      resolved.source, availableSignals, totalSignals,
    );

    // 8. Write (or preview in dry-run)
    if (DRY_RUN) {
      return {
        run_id: row.id,
        status: 'rescored',
        source: resolved.source,
        checkpoint: resolved.checkpoint,
        dps_score: v2Result.score,
        tier: v2Result.tier,
        confidence_level: v2Result.breakdown!.confidence.level,
        available_signals: availableSignals,
      };
    }

    // Write via canonical v2 writer
    const writeResult = await labelPredictionRunWithDpsV2(
      supabase,
      {
        run_id: row.id,
        raw_metrics: rawMetrics,
        breakdown: v2Result.breakdown,
        dps_score: v2Result.score,
        tier: v2Result.tier,
        label_trust: trust,
        training_weight: weight,
        source_tag: SOURCE_TAG,
        predicted_dps: row.predicted_dps_7d,
        prediction_range_low: row.prediction_range_low,
        prediction_range_high: row.prediction_range_high,
      },
      {
        source_meta: {
          ...(row.source_meta ?? {}),
          rescore_metrics_source: resolved.source,
          rescore_checkpoint_used: resolved.checkpoint ?? null,
          rescore_follower_count: followerCount || null,
          rescore_niche: niche,
          rescore_cohort_size: cohort.length,
        },
      },
    );

    if (!writeResult.success) {
      return {
        run_id: row.id,
        status: 'failed',
        error: `DB write failed: ${writeResult.error}`,
      };
    }

    return {
      run_id: row.id,
      status: 'rescored',
      source: resolved.source,
      checkpoint: resolved.checkpoint,
      dps_score: v2Result.score,
      tier: v2Result.tier,
      confidence_level: v2Result.breakdown!.confidence.level,
      available_signals: availableSignals,
    };
  } catch (err: any) {
    return {
      run_id: row.id,
      status: 'failed',
      error: err.message,
    };
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║       DPS v2 Rescore / Backfill — Legacy Labels         ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  mode       : ${DRY_RUN ? 'DRY RUN (pass --force to write)' : 'FORCE (writing to DB)'}`);
  console.log(`  re-rescore : ${RE_RESCORE}`);
  console.log(`  limit      : ${LIMIT || 'none'}`);
  console.log(`  niche      : ${NICHE_FILTER || 'all'}`);
  console.log(`  target ver : ${DPS_V2_FORMULA_VERSION}`);
  console.log();

  // ── Step 1: Fetch legacy rows ──────────────────────────────────────────────

  let query = supabase
    .from('prediction_runs')
    .select(
      'id, video_id, created_at, predicted_dps_7d, prediction_range_low, prediction_range_high, ' +
      'actual_views, actual_likes, actual_comments, actual_shares, actual_saves, ' +
      'actual_hours_since_post, actual_posted_at, actual_collected_at, ' +
      'source_meta, labeling_mode, dps_formula_version',
    )
    .not('actual_dps', 'is', null) // must have a label (even if legacy)
    .order('created_at', { ascending: true });

  if (RE_RESCORE) {
    // Re-rescore: include rows already rescored (labeling_mode = 'rescore_backfill')
    query = query.or(
      'dps_formula_version.eq.legacy_v1,labeling_mode.eq.rescore_backfill',
    );
  } else {
    // Normal: only legacy_v1 rows not yet rescored
    query = query.eq('dps_formula_version', 'legacy_v1');
  }

  if (LIMIT > 0) {
    query = query.limit(LIMIT);
  }

  const { data: legacyRows, error: fetchErr } = await query;
  if (fetchErr) {
    console.error('Failed to fetch legacy rows:', fetchErr.message);
    process.exit(1);
  }

  if (!legacyRows || legacyRows.length === 0) {
    console.log('  No legacy rows found to rescore. Done.');
    return;
  }

  // If niche filter is set, resolve niches and filter
  let rows = legacyRows as unknown as LegacyRow[];
  if (NICHE_FILTER) {
    const filtered: LegacyRow[] = [];
    for (const row of rows) {
      const niche = await resolveNiche(row.video_id);
      if (niche === NICHE_FILTER) filtered.push(row);
    }
    rows = filtered;
    console.log(`  Filtered to ${rows.length} rows in niche '${NICHE_FILTER}'`);
    if (rows.length === 0) {
      console.log('  Nothing to rescore after niche filter. Done.');
      return;
    }
  }

  console.log(`  Legacy rows to process: ${rows.length}\n`);

  // ── Step 2: Process each row ──────────────────────────────────────────────

  const results: RescoreResult[] = [];
  const sourceCounts: Record<string, number> = {};
  const tierCounts: Record<string, number> = {};
  let rescored = 0;
  let insufficient = 0;
  let failed = 0;

  // Progress header
  console.log('  ┌──────────┬────────────────────────────┬──────────┬──────────┬───────┬──────┐');
  console.log('  │  run_id  │  source                    │ dps_score│   tier   │ conf  │ sigs │');
  console.log('  ├──────────┼────────────────────────────┼──────────┼──────────┼───────┼──────┤');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = await rescoreSingleRow(row);
    results.push(result);

    if (result.status === 'rescored') {
      rescored++;
      sourceCounts[result.source!] = (sourceCounts[result.source!] || 0) + 1;
      tierCounts[result.tier!] = (tierCounts[result.tier!] || 0) + 1;

      const scoreStr = result.dps_score != null ? result.dps_score.toFixed(4) : 'N/A';
      console.log(
        `  │ ${row.id.slice(0, 8).padEnd(8)} │` +
        ` ${(result.source ?? '').padEnd(26)} │` +
        ` ${scoreStr.padStart(8)} │` +
        ` ${(result.tier ?? '').padEnd(8)} │` +
        ` ${(result.confidence_level ?? '').padEnd(5)} │` +
        ` ${String(result.available_signals ?? '').padStart(4)} │`,
      );
    } else if (result.status === 'insufficient_signal') {
      insufficient++;
      console.log(
        `  │ ${row.id.slice(0, 8).padEnd(8)} │` +
        ` ${'(no metrics found)'.padEnd(26)} │` +
        ` ${'—'.padStart(8)} │` +
        ` ${'—'.padEnd(8)} │` +
        ` ${'—'.padEnd(5)} │` +
        ` ${'—'.padStart(4)} │`,
      );
    } else {
      failed++;
      console.log(
        `  │ ${row.id.slice(0, 8).padEnd(8)} │` +
        ` ${'FAILED'.padEnd(26)} │` +
        ` ${'—'.padStart(8)} │` +
        ` ${'—'.padEnd(8)} │` +
        ` ${'—'.padEnd(5)} │` +
        ` ${'—'.padStart(4)} │`,
      );
    }

    // Progress indicator every 25 rows
    if ((i + 1) % 25 === 0) {
      console.log(`  │ ... processed ${i + 1}/${rows.length} ...`.padEnd(89) + '│');
    }
  }

  console.log('  └──────────┴────────────────────────────┴──────────┴──────────┴───────┴──────┘');

  // ── Step 3: Summary report ────────────────────────────────────────────────

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                  Rescore Summary                          ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Mode                : ${DRY_RUN ? 'DRY RUN' : 'FORCE (written)'}`.padEnd(60) + '║');
  console.log(`║  Total processed     : ${rows.length}`.padEnd(60) + '║');
  console.log(`║  Rescored            : ${rescored}`.padEnd(60) + '║');
  console.log(`║  Insufficient signal : ${insufficient}`.padEnd(60) + '║');
  console.log(`║  Failed              : ${failed}`.padEnd(60) + '║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  Metric source breakdown (rescored rows):                 ║');
  for (const [src, count] of Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.min(count, 20));
    console.log(`║    ${src.padEnd(26)}: ${String(count).padStart(4)}  ${bar}`.padEnd(60) + '║');
  }
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log('║  Tier distribution (rescored rows):                       ║');
  for (const tier of ['mega-viral', 'hyper-viral', 'viral', 'normal']) {
    const count = tierCounts[tier] || 0;
    const bar = '█'.repeat(Math.min(count, 20));
    console.log(`║    ${tier.padEnd(14)}: ${String(count).padStart(4)}  ${bar}`.padEnd(60) + '║');
  }
  console.log('╠═══════════════════════════════════════════════════════════╣');

  // Salvage rate
  const salvageRate = rows.length > 0
    ? Math.round((rescored / rows.length) * 1000) / 10
    : 0;
  console.log(`║  Salvage rate        : ${salvageRate}%`.padEnd(60) + '║');
  console.log(`║  New v2 formula ver  : ${DPS_V2_FORMULA_VERSION}`.padEnd(60) + '║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Log failures if any
  const failures = results.filter(r => r.status === 'failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures.slice(0, 20)) {
      console.log(`  ${f.run_id.slice(0, 8)}: ${f.error}`);
    }
    if (failures.length > 20) {
      console.log(`  ... and ${failures.length - 20} more`);
    }
  }

  console.log(`\nDone.${DRY_RUN ? ' (DRY RUN — no writes. Pass --force to apply.)' : ''}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
