#!/usr/bin/env npx tsx
/**
 * DPS v2.1.0 Historical Migration — Re-score All Labeled Rows
 *
 * Re-scores all prediction_runs with actual_dps IS NOT NULL through the
 * v2.1.0 formula so they get:
 *   - reach_score + view_percentile_within_cohort (two new signals)
 *   - display_score (0-100 CDF-mapped)
 *   - weight_tier (adaptive 3-tier weights)
 *   - Consistent scoring across all labeled rows
 *
 * Behaviour:
 *   - Dry-run mode (default): computes everything, prints before/after, writes nothing.
 *   - Execute mode (--execute): writes v2.1.0 labels to the database.
 *   - Preserves existing dps_label_trust and dps_training_weight (human judgment).
 *   - Preserves labeling_mode with '+rescore-v2.1' appended.
 *   - Handles errors per-row — one bad row does not abort the migration.
 *   - Batches DB operations (10 rows per batch for updates).
 *
 * Usage:
 *   npx tsx scripts/rescore-to-v2-1.ts                # dry-run (default)
 *   npx tsx scripts/rescore-to-v2-1.ts --execute      # write to DB
 */

import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  computeFollowerTierBounds,
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

// ── CLI ────────────────────────────────────────────────────────────────────────
const EXECUTE = process.argv.includes('--execute');
const DRY_RUN = !EXECUTE;
const BATCH_SIZE = 10;

// ── Types ──────────────────────────────────────────────────────────────────────

interface LabeledRow {
  id: string;
  actual_views: number | null;
  actual_likes: number | null;
  actual_comments: number | null;
  actual_shares: number | null;
  actual_saves: number | null;
  actual_follower_count: number | null;
  actual_avg_watch_time_seconds: number | null;
  actual_video_duration_seconds: number | null;
  actual_interactions_first_3h: number | null;
  actual_hours_since_post: number | null;
  actual_posted_at: string | null;
  actual_collected_at: string | null;
  actual_dps: number | null;
  dps_formula_version: string | null;
  video_id: string | null;
  predicted_dps_7d: number | null;
  prediction_range_low: number | null;
  prediction_range_high: number | null;
  dps_label_trust: string | null;
  dps_training_weight: number | null;
  labeling_mode: string | null;
}

interface RescoreResult {
  run_id: string;
  status: 'rescored' | 'skipped' | 'failed';
  old_version: string | null;
  old_score: number | null;
  new_score?: number;
  display_score?: number;
  tier?: string;
  weight_tier?: number;
  error?: string;
}

// ── Niche Resolution ───────────────────────────────────────────────────────────

const nicheCache = new Map<string, string>();

async function resolveNiche(videoId: string | null): Promise<string> {
  if (!videoId) return 'unknown';
  if (nicheCache.has(videoId)) return nicheCache.get(videoId)!;

  const { data } = await supabase
    .from('video_files')
    .select('niche')
    .eq('id', videoId)
    .maybeSingle();

  const raw = (data as any)?.niche || 'unknown';
  const niche = raw.toLowerCase().replace(/_/g, '-');
  nicheCache.set(videoId, niche);
  return niche;
}

// ── Cohort Cache ───────────────────────────────────────────────────────────────

// Cache: niche → follower_band_key → ScrapedVideoRow[]
const cohortCache = new Map<string, ScrapedVideoRow[]>();

function cohortKey(niche: string, followerCount: number): string {
  if (followerCount <= 0) return `${niche}|all`;
  const bounds = computeFollowerTierBounds(followerCount);
  return `${niche}|${bounds.min}-${bounds.max}`;
}

async function getCohortRows(niche: string, followerCount: number): Promise<ScrapedVideoRow[]> {
  const key = cohortKey(niche, followerCount);
  if (cohortCache.has(key)) return cohortCache.get(key)!;

  // Paginated fetch from scraped_videos
  const rows: ScrapedVideoRow[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  let done = false;

  while (!done) {
    let query = supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .gt('views_count', 0);

    // When follower count is unknown (0), use entire niche as cohort
    if (followerCount > 0) {
      const bounds = computeFollowerTierBounds(followerCount);
      query = query
        .gte('creator_followers_count', Math.floor(bounds.min))
        .lte('creator_followers_count', Math.ceil(bounds.max));
    }

    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error(`  [cohort] Error fetching cohort for ${key}: ${error.message}`);
      break;
    }

    if (!data || data.length === 0) {
      done = true;
      break;
    }

    for (const r of data) {
      rows.push({
        views: r.views_count ?? 0,
        likes: r.likes_count ?? 0,
        comments: r.comments_count ?? 0,
        shares: r.shares_count ?? 0,
        saves: r.saves_count ?? 0,
        follower_count: r.creator_followers_count ?? 0,
      });
    }

    if (data.length < PAGE_SIZE) {
      done = true;
    } else {
      offset += PAGE_SIZE;
    }
  }

  cohortCache.set(key, rows);
  return rows;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== DPS v2.1.0 Historical Migration ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (use --execute to write)' : 'EXECUTE (writing to DB)'}\n`);

  // Step 1: Fetch all labeled prediction_runs
  console.log('Step 1: Fetching labeled prediction_runs...');

  const selectColumns = [
    'id',
    'actual_views', 'actual_likes', 'actual_comments', 'actual_shares', 'actual_saves',
    'actual_follower_count',
    'actual_avg_watch_time_seconds', 'actual_video_duration_seconds',
    'actual_interactions_first_3h',
    'actual_hours_since_post',
    'actual_posted_at', 'actual_collected_at',
    'actual_dps',
    'dps_formula_version',
    'video_id',
    'predicted_dps_7d', 'prediction_range_low', 'prediction_range_high',
    'dps_label_trust', 'dps_training_weight',
    'labeling_mode',
  ].join(', ');

  const { data: rows, error: fetchError } = await supabase
    .from('prediction_runs')
    .select(selectColumns)
    .not('actual_dps', 'is', null)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error(`Fatal: Failed to fetch prediction_runs: ${fetchError.message}`);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No labeled rows found. Nothing to do.');
    process.exit(0);
  }

  const labeledRows = rows as LabeledRow[];
  console.log(`  Found ${labeledRows.length} labeled rows.\n`);

  // Step 2 & 3: Process each row
  console.log('Step 2-3: Re-scoring rows...');

  const results: RescoreResult[] = [];
  let processed = 0;

  // Collect rows to write in batches
  const pendingWrites: Array<{
    row: LabeledRow;
    rawMetrics: DpsV2RawMetrics;
    v2Result: ReturnType<typeof computeDpsV2FromRows>;
  }> = [];

  for (const row of labeledRows) {
    processed++;

    // Skip rows with no views
    if (!row.actual_views || row.actual_views === 0) {
      results.push({
        run_id: row.id,
        status: 'skipped',
        old_version: row.dps_formula_version,
        old_score: row.actual_dps,
        error: 'no views',
      });
      continue;
    }

    try {
      // Reconstruct raw metrics
      const rawMetrics: DpsV2RawMetrics = {
        views: row.actual_views,
        likes: row.actual_likes ?? 0,
        comments: row.actual_comments ?? 0,
        shares: row.actual_shares ?? 0,
        saves: row.actual_saves ?? 0,
        follower_count: row.actual_follower_count ?? 0,
        avg_watch_time_seconds: row.actual_avg_watch_time_seconds,
        video_duration_seconds: row.actual_video_duration_seconds,
        interactions_first_3h: row.actual_interactions_first_3h,
        hours_since_post: row.actual_hours_since_post ?? 24,
        posted_at: row.actual_posted_at,
        collected_at: row.actual_collected_at,
      };

      // Resolve niche via video_files join
      const niche = await resolveNiche(row.video_id);
      const cohortRows = await getCohortRows(niche, rawMetrics.follower_count);

      // Compute v2.1.0 score
      const v2Result = computeDpsV2FromRows(rawMetrics, cohortRows);

      if (v2Result.dps_v2_incomplete) {
        console.log(`[${row.id}] SKIPPED — incomplete: ${v2Result.dps_v2_incomplete_reason}`);
        results.push({ run_id: row.id, status: 'incomplete', old_version: row.dps_formula_version, old_score: row.actual_dps, new_score: null, display_score: null, tier: 'incomplete', weight_tier: null });
        continue;
      }

      // Dry-run output
      if (DRY_RUN) {
        console.log(
          `[${row.id}] ${row.dps_formula_version ?? 'legacy'} z-score: ${(row.actual_dps ?? 0).toFixed(2)}` +
          ` → v2.1.0 z-score: ${v2Result.score!.toFixed(2)}, display: ${v2Result.display_score!.toFixed(1)}, tier: ${v2Result.tier}`
        );
      }

      results.push({
        run_id: row.id,
        status: 'rescored',
        old_version: row.dps_formula_version,
        old_score: row.actual_dps,
        new_score: v2Result.score,
        display_score: v2Result.display_score,
        tier: v2Result.tier,
        weight_tier: v2Result.breakdown!.weight_tier,
      });

      // Queue for write if executing
      if (!DRY_RUN) {
        pendingWrites.push({ row, rawMetrics, v2Result });

        // Flush batch
        if (pendingWrites.length >= BATCH_SIZE) {
          await writeBatch(pendingWrites);
          pendingWrites.length = 0;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  [${row.id}] ERROR: ${message}`);
      results.push({
        run_id: row.id,
        status: 'failed',
        old_version: row.dps_formula_version,
        old_score: row.actual_dps,
        error: message,
      });
    }

    // Progress logging
    if (processed % 10 === 0) {
      console.log(`  Progress: ${processed}/${labeledRows.length}`);
    }
  }

  // Flush remaining writes
  if (!DRY_RUN && pendingWrites.length > 0) {
    await writeBatch(pendingWrites);
  }

  // Step 4: Summary report
  printSummary(results);
}

// ── Batch Writer ───────────────────────────────────────────────────────────────

async function writeBatch(
  batch: Array<{
    row: LabeledRow;
    rawMetrics: DpsV2RawMetrics;
    v2Result: ReturnType<typeof computeDpsV2FromRows>;
  }>,
): Promise<void> {
  const writePromises = batch.map(async ({ row, rawMetrics, v2Result }) => {
    // Build appended labeling_mode
    const existingMode = row.labeling_mode ?? '';
    const newMode = existingMode.includes('rescore-v2.1')
      ? existingMode  // Already rescored, don't double-append
      : existingMode
        ? `${existingMode}+rescore-v2.1`
        : 'rescore-v2.1';

    const writeResult = await labelPredictionRunWithDpsV2(
      supabase,
      {
        run_id: row.id,
        raw_metrics: rawMetrics,
        breakdown: v2Result.breakdown,
        dps_score: v2Result.score,
        tier: v2Result.tier,
        label_trust: (row.dps_label_trust as 'untrusted' | 'low' | 'medium' | 'high') ?? 'low',
        training_weight: row.dps_training_weight ?? 0.3,
        source_tag: newMode,
        predicted_dps: row.predicted_dps_7d,
        prediction_range_low: row.prediction_range_low,
        prediction_range_high: row.prediction_range_high,
      },
    );

    if (!writeResult.success) {
      console.error(`  [${row.id}] Write failed: ${writeResult.error}`);
    }
  });

  await Promise.all(writePromises);
}

// ── Summary ────────────────────────────────────────────────────────────────────

function printSummary(results: RescoreResult[]): void {
  const rescored = results.filter(r => r.status === 'rescored');
  const skipped = results.filter(r => r.status === 'skipped');
  const failed = results.filter(r => r.status === 'failed');

  const prevV2 = rescored.filter(r => r.old_version === '2.0.0').length;
  const prevLegacy = rescored.filter(r => r.old_version !== '2.0.0').length;

  // Tier distribution
  const tiers: Record<string, number> = {};
  for (const r of rescored) {
    if (r.tier) tiers[r.tier] = (tiers[r.tier] ?? 0) + 1;
  }

  // Display score stats
  const displayScores = rescored.map(r => r.display_score!).filter(d => d != null);
  const minDisplay = displayScores.length > 0 ? Math.min(...displayScores) : 0;
  const maxDisplay = displayScores.length > 0 ? Math.max(...displayScores) : 0;
  const meanDisplay = displayScores.length > 0
    ? displayScores.reduce((a, b) => a + b, 0) / displayScores.length
    : 0;

  // Weight tier distribution
  const weightTiers: Record<number, number> = {};
  for (const r of rescored) {
    if (r.weight_tier) weightTiers[r.weight_tier] = (weightTiers[r.weight_tier] ?? 0) + 1;
  }

  console.log(`\n=== DPS v2.1.0 Historical Migration ===`);
  console.log(`Total rows found: ${results.length}`);
  console.log(`Skipped (no views): ${skipped.length}`);
  console.log(`Re-scored: ${rescored.length}`);
  console.log(`  - Previously v2.0.0: ${prevV2}`);
  console.log(`  - Previously legacy/null: ${prevLegacy}`);
  console.log(`Errors: ${failed.length}`);
  if (failed.length > 0) {
    for (const f of failed.slice(0, 10)) {
      console.log(`  [${f.run_id}] ${f.error}`);
    }
    if (failed.length > 10) console.log(`  ... and ${failed.length - 10} more`);
  }
  console.log(`Score distribution:`);
  console.log(`  mega-viral: ${tiers['mega-viral'] ?? 0}`);
  console.log(`  hyper-viral: ${tiers['hyper-viral'] ?? 0}`);
  console.log(`  viral: ${tiers['viral'] ?? 0}`);
  console.log(`  normal: ${tiers['normal'] ?? 0}`);
  console.log(`Display score range: ${minDisplay.toFixed(1)} - ${maxDisplay.toFixed(1)} (mean: ${meanDisplay.toFixed(1)})`);
  console.log(`Weight tiers used: Tier 1: ${weightTiers[1] ?? 0}, Tier 2: ${weightTiers[2] ?? 0}, Tier 3: ${weightTiers[3] ?? 0}`);

  if (DRY_RUN) {
    console.log(`\n⚠ DRY RUN — no changes written. Use --execute to apply.`);
  } else {
    console.log(`\n✓ Migration complete. ${rescored.length} rows updated to v${DPS_V2_FORMULA_VERSION}.`);
  }
}

// ── Run ────────────────────────────────────────────────────────────────────────

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
