/**
 * One-off migration: Re-score all scraped_videos rows with DPS v2.
 *
 * Fixes three problems:
 *   1. 857 rows have old-format display scores (0-100) in dps_score instead of z-scores
 *   2. 2,352 rows have null dps_score (never scored)
 *   3. 3,217 rows have dps_classification = 'normal' (collapsed from real v2 tiers)
 *
 * After this runs, every row will have:
 *   - dps_score = z-score (from computeDpsV2FromRows)
 *   - dps_classification = real 7-tier value (or 'incomplete')
 *   - dps_breakdown = full v2 breakdown JSONB with formula_version
 *
 * Usage: npx tsx scripts/fix-dps-score-column.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import {
  computeDpsV2FromRows,
  buildCohortStatsFromRows,
  classifyDpsV2,
  zScoreToDisplayDps,
  DPS_V2_FORMULA_VERSION,
  type ScrapedVideoRow,
  type DpsV2RawMetrics,
} from '../src/lib/training/dps-v2';

const NICHE = 'side-hustles';
const BATCH_SIZE = 100;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function fetchFullCohort(supabase: any): Promise<ScrapedVideoRow[]> {
  const cohort: ScrapedVideoRow[] = [];
  let offset = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', NICHE)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + PAGE - 1);

    if (error || !data || data.length === 0) break;

    for (const r of data) {
      cohort.push({
        views: r.views_count ?? 0,
        likes: r.likes_count ?? 0,
        comments: r.comments_count ?? 0,
        shares: r.shares_count ?? 0,
        saves: r.saves_count ?? 0,
        follower_count: r.creator_followers_count ?? 0,
      });
    }

    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return cohort;
}

async function fetchRowsToRescore(supabase: any): Promise<any[]> {
  // Fetch ALL rows — we'll re-score everything to ensure consistency
  const rows: any[] = [];
  let offset = 0;
  const PAGE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('video_id, views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count, dps_score, dps_classification, dps_breakdown')
      .eq('niche', NICHE)
      .range(offset, offset + PAGE - 1);

    if (error || !data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  return rows;
}

function isOldFormatRow(row: any): boolean {
  if (row.dps_score == null) return false;
  // Old rows have no formula_version in breakdown, or have the old {real_tier, reachScore, ...} format
  const bd = row.dps_breakdown;
  if (!bd) return true;
  if (bd.formula_version && (bd.formula_version === 'dps_v2' || bd.formula_version.startsWith('2.'))) return false;
  // Old format has keys like 'real_tier', 'reachScore', 'engPercentile'
  if (bd.real_tier || bd.reachScore || bd.engPercentile) return true;
  return false;
}

function isV2Row(row: any): boolean {
  const bd = row.dps_breakdown;
  if (!bd) return false;
  return bd.formula_version === 'dps_v2' || (bd.formula_version && bd.formula_version.startsWith('2.'));
}

async function main() {
  const supabase = getSupabase();

  // ── STEP 2: Identify old-format rows ──
  console.log('=== Step 2: Identify old-format vs v2 rows ===\n');

  const allRows = await fetchRowsToRescore(supabase);
  console.log(`Total rows in ${NICHE}: ${allRows.length}`);

  const oldFormat = allRows.filter(r => isOldFormatRow(r));
  const v2Format = allRows.filter(r => isV2Row(r));
  const unscored = allRows.filter(r => r.dps_score == null && !isV2Row(r) && !isOldFormatRow(r));
  const normalTier = allRows.filter(r => r.dps_classification === 'normal');

  console.log(`Old-format (display scores): ${oldFormat.length}`);
  console.log(`V2 format (z-scores):        ${v2Format.length}`);
  console.log(`Unscored (null):             ${unscored.length}`);
  console.log(`dps_classification='normal': ${normalTier.length}`);

  if (oldFormat.length > 0) {
    console.log('\nSample old-format rows:');
    for (const r of oldFormat.slice(0, 3)) {
      console.log(`  video_id=${r.video_id} dps_score=${r.dps_score} class=${r.dps_classification} breakdown_keys=${Object.keys(r.dps_breakdown || {}).join(',')}`);
    }
  }
  if (v2Format.length > 0) {
    console.log('\nSample v2 rows:');
    for (const r of v2Format.slice(0, 3)) {
      console.log(`  video_id=${r.video_id} dps_score=${r.dps_score} class=${r.dps_classification} z=${r.dps_breakdown?.time_adjusted_score?.toFixed(4)}`);
    }
  }

  // ── STEP 3: Build cohort and re-score everything ──
  console.log('\n=== Step 3: Re-score ALL rows with DPS v2 ===\n');

  console.log('Building cohort stats...');
  const cohort = await fetchFullCohort(supabase);
  console.log(`Cohort size (views > 0): ${cohort.length}`);

  // Determine which rows need re-scoring:
  // - Old format rows (wrong score type)
  // - Unscored rows (null)
  // - Even v2 rows with 'normal' classification need their classification fixed
  // For consistency, re-score ALL rows
  const toRescore = allRows;
  console.log(`Rows to re-score: ${toRescore.length} (all rows for consistency)\n`);

  let scored = 0;
  let incomplete = 0;
  let errors = 0;
  let skippedNoViews = 0;

  for (let i = 0; i < toRescore.length; i += BATCH_SIZE) {
    const batch = toRescore.slice(i, i + BATCH_SIZE);
    const updates: Promise<any>[] = [];

    for (const row of batch) {
      const views = row.views_count ?? 0;
      const likes = row.likes_count ?? 0;
      const comments = row.comments_count ?? 0;
      const shares = row.shares_count ?? 0;
      const saves = row.saves_count ?? 0;
      const followers = row.creator_followers_count ?? 0;

      if (views <= 0) {
        skippedNoViews++;
        continue;
      }

      const rawMetrics: DpsV2RawMetrics = {
        views,
        likes,
        comments,
        shares,
        saves,
        follower_count: followers,
        hours_since_post: 0,
      };

      const v2Result = computeDpsV2FromRows(rawMetrics, cohort);

      if (v2Result.tier === 'incomplete' || v2Result.score == null) {
        // Mark as incomplete
        const update = supabase
          .from('scraped_videos')
          .update({
            dps_score: null,
            dps_z_score: null,
            dps_classification: 'incomplete',
            dps_breakdown: {
              formula_version: DPS_V2_FORMULA_VERSION,
              incomplete: true,
              reason: v2Result.dps_v2_incomplete_reason || 'Missing follower count',
            },
          })
          .eq('video_id', row.video_id)
          .then(({ error }: any) => {
            if (error) { errors++; } else { incomplete++; }
          });
        updates.push(update);
      } else {
        const update = supabase
          .from('scraped_videos')
          .update({
            dps_score: v2Result.display_score,
            dps_z_score: v2Result.score,
            dps_classification: v2Result.tier,
            dps_breakdown: { ...v2Result.breakdown, formula_version: DPS_V2_FORMULA_VERSION },
          })
          .eq('video_id', row.video_id)
          .then(({ error }: any) => {
            if (error) {
              console.error(`  Error updating ${row.video_id}: ${error.message}`);
              errors++;
            } else {
              scored++;
            }
          });
        updates.push(update);
      }
    }

    await Promise.all(updates);

    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= toRescore.length) {
      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, toRescore.length)}/${toRescore.length} (scored=${scored}, incomplete=${incomplete}, errors=${errors}, skipped=${skippedNoViews})`);
    }
  }

  console.log(`\nStep 3 complete:`);
  console.log(`  Scored successfully: ${scored}`);
  console.log(`  Marked incomplete:   ${incomplete}`);
  console.log(`  Skipped (no views):  ${skippedNoViews}`);
  console.log(`  Errors:              ${errors}`);

  // ── STEP 4: Verify no 'normal' classifications remain ──
  console.log('\n=== Step 4: Verify no "normal" classifications remain ===\n');

  const { count: normalCount } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .eq('niche', NICHE)
    .eq('dps_classification', 'normal');

  console.log(`Rows with dps_classification='normal': ${normalCount}`);
  if (normalCount && normalCount > 0) {
    console.log('WARNING: Some "normal" rows remain — they should have been re-scored above.');
  } else {
    console.log('PASS: Zero "normal" classifications.');
  }

  // ── STEP 5: Final diagnostic ──
  console.log('\n=== Step 5: Final Diagnostic ===\n');

  // 5a: Count by tier
  const tierRows: any[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('scraped_videos')
      .select('dps_score, dps_z_score, dps_classification')
      .eq('niche', NICHE)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    tierRows.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  const tierCounts: Record<string, number> = {};
  const tierZScores: Record<string, number[]> = {};
  const tierDisplayScores: Record<string, number[]> = {};
  for (const r of tierRows) {
    const t = r.dps_classification || '(null)';
    tierCounts[t] = (tierCounts[t] || 0) + 1;
    if (r.dps_z_score != null) {
      if (!tierZScores[t]) tierZScores[t] = [];
      tierZScores[t].push(r.dps_z_score);
    }
    if (r.dps_score != null) {
      if (!tierDisplayScores[t]) tierDisplayScores[t] = [];
      tierDisplayScores[t].push(r.dps_score);
    }
  }

  const total = tierRows.length;
  const tierOrder = ['mega-viral', 'hyper-viral', 'viral', 'above-average', 'average', 'below-average', 'poor', 'incomplete', '(null)'];

  console.log('(a) Tier distribution:');
  console.log(`${'Tier'.padEnd(16)} ${'Count'.padStart(6)} ${'%'.padStart(8)}`);
  console.log('-'.repeat(32));
  for (const t of tierOrder) {
    if (!tierCounts[t]) continue;
    const pct = ((tierCounts[t] / total) * 100).toFixed(2);
    console.log(`${t.padEnd(16)} ${String(tierCounts[t]).padStart(6)} ${(pct + '%').padStart(8)}`);
  }
  // Unexpected
  for (const t of Object.keys(tierCounts)) {
    if (!tierOrder.includes(t)) {
      console.log(`[UNEXPECTED] ${t}: ${tierCounts[t]}`);
    }
  }

  // 5b: Min/max per tier (z-scores from dps_z_score column)
  console.log('\n(b) Z-score ranges per tier (dps_z_score):');
  console.log(`${'Tier'.padEnd(16)} ${'Min z'.padStart(8)} ${'Max z'.padStart(8)} ${'Min dps'.padStart(8)} ${'Max dps'.padStart(8)} ${'Count'.padStart(6)}`);
  console.log('-'.repeat(56));
  for (const t of tierOrder) {
    const zs = tierZScores[t];
    const ds = tierDisplayScores[t];
    if ((!zs || zs.length === 0) && (!ds || ds.length === 0)) continue;
    const zSorted = zs ? zs.sort((a, b) => a - b) : [];
    const dSorted = ds ? ds.sort((a, b) => a - b) : [];
    const minZ = zSorted.length > 0 ? zSorted[0].toFixed(4) : 'n/a';
    const maxZ = zSorted.length > 0 ? zSorted[zSorted.length - 1].toFixed(4) : 'n/a';
    const minD = dSorted.length > 0 ? dSorted[0].toFixed(1) : 'n/a';
    const maxD = dSorted.length > 0 ? dSorted[dSorted.length - 1].toFixed(1) : 'n/a';
    const count = zSorted.length || dSorted.length;
    console.log(`${t.padEnd(16)} ${minZ.padStart(8)} ${maxZ.padStart(8)} ${minD.padStart(8)} ${maxD.padStart(8)} ${String(count).padStart(6)}`);
  }

  // 5c: Verify dps_score is in 0-100 range (display score), dps_z_score is in reasonable range
  const allDisplayScores = tierRows.filter(r => r.dps_score != null).map(r => r.dps_score);
  const outOfRange = allDisplayScores.filter(s => s < 0 || s > 100);
  console.log(`\n(c) dps_score values outside 0-100 range: ${outOfRange.length}`);
  if (outOfRange.length > 0) {
    console.log('WARNING: Some dps_score values are outside display score range!');
  } else {
    console.log('PASS: All dps_score values are in 0-100 display range.');
  }

  const allZScores = tierRows.filter(r => r.dps_z_score != null).map(r => r.dps_z_score);
  const badZScores = allZScores.filter(s => s > 10 || s < -10);
  console.log(`dps_z_score values outside -10..10 range: ${badZScores.length}`);
  if (badZScores.length > 0) {
    console.log('WARNING: Some z-scores seem extreme!');
  } else {
    console.log('PASS: All dps_z_score values are in reasonable z-score range.');
  }

  // 5d: Confirm zero 'normal'
  console.log(`\n(d) Rows with dps_classification='normal': ${tierCounts['normal'] || 0}`);
  if (tierCounts['normal']) {
    console.log('FAIL: Still have "normal" classifications!');
  } else {
    console.log('PASS: Zero "normal" classifications.');
  }

  // ── STEP 6: Recalc labeled prediction_runs ──
  console.log('\n=== Step 6: Recalc labeled prediction_runs ===\n');

  // Fetch prediction_runs with actuals
  const { data: labeledRuns } = await supabase
    .from('prediction_runs')
    .select('id, actual_views, actual_likes, actual_comments, actual_shares, actual_saves, actual_follower_count, actual_hours_since_post, dps_z_score, dps_category, actual_dps, actual_tier, predicted_dps_7d')
    .not('actual_views', 'is', null)
    .gt('actual_views', 0);

  if (!labeledRuns || labeledRuns.length === 0) {
    console.log('No labeled prediction_runs found with actual_views > 0.');
  } else {
    console.log(`Found ${labeledRuns.length} labeled prediction_runs. Rescoring against clean cohort...\n`);

    console.log(`${'ID (short)'.padEnd(12)} ${'Views'.padStart(10)} ${'Old z'.padStart(8)} ${'New z'.padStart(8)} ${'Display'.padStart(8)} ${'Old tier'.padEnd(14)} ${'New tier'.padEnd(14)}`);
    console.log('-'.repeat(78));

    let prScored = 0;
    let prIncomplete = 0;
    let prErrors = 0;

    for (const run of labeledRuns) {
      const rawMetrics: DpsV2RawMetrics = {
        views: run.actual_views,
        likes: run.actual_likes ?? 0,
        comments: run.actual_comments ?? 0,
        shares: run.actual_shares ?? 0,
        saves: run.actual_saves ?? 0,
        follower_count: run.actual_follower_count ?? 0,
        hours_since_post: run.actual_hours_since_post ?? 0,
      };

      const v2Result = computeDpsV2FromRows(rawMetrics, cohort);

      const oldZ = run.dps_z_score != null ? run.dps_z_score.toFixed(4) : '(null)';
      const oldTier = run.actual_tier || run.dps_category || '(null)';

      if (v2Result.tier === 'incomplete' || v2Result.score == null) {
        console.log(`${run.id.slice(0, 10).padEnd(12)} ${String(run.actual_views).padStart(10)} ${oldZ.padStart(8)} ${'(null)'.padStart(8)} ${'(null)'.padStart(8)} ${oldTier.padEnd(14)} ${'incomplete'.padEnd(14)}`);

        const { error } = await supabase
          .from('prediction_runs')
          .update({
            dps_z_score: null,
            dps_category: 'incomplete',
            actual_dps: null,
            actual_tier: 'incomplete',
            dps_formula_version: DPS_V2_FORMULA_VERSION,
            dps_v2_incomplete: true,
            dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
            dps_v2_display_score: null,
            dps_v2_breakdown: null,
            dps_cohort_sample_size: cohort.length,
          })
          .eq('id', run.id);

        if (error) { prErrors++; console.error(`  Error: ${error.message}`); }
        else prIncomplete++;
      } else {
        const newZ = v2Result.score!.toFixed(4);
        const display = v2Result.display_score!.toFixed(1);

        console.log(`${run.id.slice(0, 10).padEnd(12)} ${String(run.actual_views).padStart(10)} ${oldZ.padStart(8)} ${newZ.padStart(8)} ${display.padStart(8)} ${oldTier.padEnd(14)} ${v2Result.tier.padEnd(14)}`);

        const { error } = await supabase
          .from('prediction_runs')
          .update({
            dps_z_score: v2Result.score,
            dps_category: v2Result.tier,
            actual_dps: v2Result.score,
            actual_tier: v2Result.tier,
            dps_formula_version: DPS_V2_FORMULA_VERSION,
            dps_v2_incomplete: false,
            dps_v2_incomplete_reason: null,
            dps_v2_display_score: v2Result.display_score,
            dps_v2_breakdown: v2Result.breakdown,
            dps_v2_weight_tier: v2Result.breakdown?.weight_tier,
            dps_cohort_sample_size: cohort.length,
            dps_threshold_version: v2Result.breakdown?.threshold_version,
          })
          .eq('id', run.id);

        if (error) { prErrors++; console.error(`  Error: ${error.message}`); }
        else prScored++;
      }
    }

    console.log(`\nStep 6 complete:`);
    console.log(`  Scored:     ${prScored}`);
    console.log(`  Incomplete: ${prIncomplete}`);
    console.log(`  Errors:     ${prErrors}`);
  }

  console.log('\n=== Migration complete ===');
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
