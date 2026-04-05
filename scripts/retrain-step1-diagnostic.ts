#!/usr/bin/env npx tsx
/**
 * Step 1: Diagnostic on labeled data quality
 *
 * Queries prediction_runs for clean labeled rows and reports:
 * a) Total clean labeled rows
 * b) DPS tier distribution
 * c) View count spread
 * d) Missing metrics check
 * e) Tier concentration warning
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  STEP 1: Labeled Data Quality Diagnostic                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ── Query all labeled rows ────────────────────────────────────────────────
  const { data: allRows, error } = await supabase
    .from('prediction_runs')
    .select(`
      id, video_id, predicted_dps_7d, actual_dps, actual_tier,
      dps_formula_version, dps_label_trust, dps_training_weight,
      dps_v2_incomplete, dps_v2_incomplete_reason,
      dps_signal_confidence, dps_signal_availability,
      actual_completion_rate, actual_share_rate, actual_save_rate,
      actual_velocity_score, actual_view_to_follower_ratio, actual_comment_rate,
      score_version, created_at, raw_result,
      dps_within_cohort_percentile, dps_population_percentile,
      dps_cohort_sample_size
    `)
    .not('actual_dps', 'is', null);

  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }

  console.log(`Total rows with actual_dps: ${allRows.length}\n`);

  // ── Filter: clean rows only (dps_v2_incomplete != true) ────────────────
  const cleanRows = allRows.filter((r: any) => r.dps_v2_incomplete !== true);
  const incompleteRows = allRows.filter((r: any) => r.dps_v2_incomplete === true);

  console.log(`Incomplete (excluded): ${incompleteRows.length}`);
  if (incompleteRows.length > 0) {
    const reasons = new Map<string, number>();
    for (const r of incompleteRows) {
      const reason = (r as any).dps_v2_incomplete_reason || 'unknown';
      reasons.set(reason, (reasons.get(reason) || 0) + 1);
    }
    for (const [reason, count] of reasons) {
      console.log(`  - ${reason}: ${count}`);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`(a) TOTAL CLEAN LABELED ROWS: ${cleanRows.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (cleanRows.length < 50) {
    console.log('⛔ STOP: Fewer than 50 clean rows. Fix data before retraining.');
    console.log('  Need at least 50 for LOOCV to be meaningful.\n');

    // Still print diagnostics for debugging
    printDiagnostics(cleanRows);
    process.exit(1);
  }

  printDiagnostics(cleanRows);

  // ── Check feature availability ────────────────────────────────────────────
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`(f) FEATURE AVAILABILITY CHECK`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Check which video_ids have features in training_features
  const videoIds = cleanRows.map((r: any) => r.video_id);

  // Check run_component_results for stored features
  const { data: componentResults, error: crError } = await supabase
    .from('run_component_results')
    .select('run_id, component_id, features')
    .in('run_id', cleanRows.map((r: any) => r.id))
    .eq('component_id', 'xgboost-virality-ml');

  if (crError) {
    console.log(`  run_component_results query error: ${crError.message}`);
  } else {
    const runIdsWithFeatures = new Set(
      (componentResults || [])
        .filter((cr: any) => cr.features && Object.keys(cr.features).length > 0)
        .map((cr: any) => cr.run_id)
    );
    console.log(`  Rows with xgboost features in run_component_results: ${runIdsWithFeatures.size}/${cleanRows.length}`);
  }

  // Check raw_result for stored feature_values
  let rawResultFeatureCount = 0;
  for (const row of cleanRows) {
    const rr = (row as any).raw_result;
    if (rr && (rr.feature_values || rr.features)) {
      rawResultFeatureCount++;
    }
  }
  console.log(`  Rows with features in raw_result: ${rawResultFeatureCount}/${cleanRows.length}`);

  // Check score_version distribution (v1 vs v2 pipeline)
  const versionDist = new Map<string, number>();
  for (const row of cleanRows) {
    const v = (row as any).score_version || 'unknown';
    versionDist.set(v, (versionDist.get(v) || 0) + 1);
  }
  console.log(`\n  Score version distribution:`);
  for (const [v, count] of [...versionDist.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${v}: ${count}`);
  }

  // Check video_files for storage paths
  const { data: videoFiles } = await supabase
    .from('video_files')
    .select('id, storage_path, niche, tiktok_url')
    .in('id', videoIds);

  if (videoFiles) {
    const withPath = videoFiles.filter((v: any) => v.storage_path);
    const withUrl = videoFiles.filter((v: any) => v.tiktok_url);
    console.log(`\n  Video files found: ${videoFiles.length}/${cleanRows.length}`);
    console.log(`    With storage_path: ${withPath.length}`);
    console.log(`    With tiktok_url: ${withUrl.length}`);

    // Niche distribution from video_files
    const nicheDist = new Map<string, number>();
    for (const v of videoFiles) {
      const n = (v as any).niche || 'unknown';
      nicheDist.set(n, (nicheDist.get(n) || 0) + 1);
    }
    console.log(`\n  Niche distribution:`);
    for (const [n, count] of [...nicheDist.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${n}: ${count}`);
    }
  }

  // ── Check if video_ids exist in training_features (scraped_videos linkage) ──
  // video_files.id is UUID, training_features.video_id is TEXT (scraped_videos)
  // Check if there's a tiktok_video_id or similar column
  const { data: vfSample } = await supabase
    .from('video_files')
    .select('*')
    .in('id', videoIds.slice(0, 1))
    .limit(1);

  if (vfSample && vfSample.length > 0) {
    console.log(`\n  Sample video_files columns: ${Object.keys(vfSample[0]).join(', ')}`);
  }

  // DPS v2 label quality breakdown
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`(g) LABEL QUALITY BREAKDOWN`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const trustDist = new Map<string, number>();
  const versionDist2 = new Map<string, number>();
  for (const row of cleanRows) {
    const trust = (row as any).dps_label_trust || 'null';
    const ver = (row as any).dps_formula_version || 'null';
    trustDist.set(trust, (trustDist.get(trust) || 0) + 1);
    versionDist2.set(ver, (versionDist2.get(ver) || 0) + 1);
  }

  console.log(`  Label trust:`);
  for (const [t, c] of [...trustDist.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t}: ${c}`);
  }
  console.log(`\n  Formula version:`);
  for (const [v, c] of [...versionDist2.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${v}: ${c}`);
  }

  console.log('\n✅ Step 1 diagnostic complete.');
}

function printDiagnostics(cleanRows: any[]) {
  // ── (b) DPS tier distribution ────────────────────────────────────────────
  console.log(`(b) DPS TIER DISTRIBUTION:`);
  const tierDist = new Map<string, number>();
  for (const row of cleanRows) {
    const tier = row.actual_tier || 'unknown';
    tierDist.set(tier, (tierDist.get(tier) || 0) + 1);
  }
  const tiers = ['mega-viral', 'hyper-viral', 'viral', 'above-average', 'average', 'below-average', 'poor', 'unknown'];
  for (const tier of tiers) {
    const count = tierDist.get(tier) || 0;
    if (count > 0) {
      const pct = ((count / cleanRows.length) * 100).toFixed(1);
      const bar = '█'.repeat(Math.max(1, Math.round(count / cleanRows.length * 40)));
      console.log(`    ${tier.padEnd(16)} ${String(count).padStart(4)} (${pct.padStart(5)}%)  ${bar}`);
    }
  }
  // Check for any tiers not in the standard list
  for (const [tier, count] of tierDist) {
    if (!tiers.includes(tier)) {
      const pct = ((count / cleanRows.length) * 100).toFixed(1);
      console.log(`    ${tier.padEnd(16)} ${String(count).padStart(4)} (${pct.padStart(5)}%)`);
    }
  }

  // ── (c) View count / DPS score spread ─────────────────────────────────────
  console.log(`\n(c) DPS SCORE SPREAD:`);
  const dpsScores = cleanRows.map((r: any) => Number(r.actual_dps)).filter(v => !isNaN(v)).sort((a, b) => a - b);

  if (dpsScores.length > 0) {
    const min = dpsScores[0];
    const max = dpsScores[dpsScores.length - 1];
    const median = dpsScores[Math.floor(dpsScores.length / 2)];
    const q1 = dpsScores[Math.floor(dpsScores.length * 0.25)];
    const q3 = dpsScores[Math.floor(dpsScores.length * 0.75)];
    const mean = dpsScores.reduce((s, v) => s + v, 0) / dpsScores.length;
    const std = Math.sqrt(dpsScores.reduce((s, v) => s + (v - mean) ** 2, 0) / dpsScores.length);

    console.log(`    Min:    ${min.toFixed(2)}`);
    console.log(`    Q1:     ${q1.toFixed(2)}`);
    console.log(`    Median: ${median.toFixed(2)}`);
    console.log(`    Q3:     ${q3.toFixed(2)}`);
    console.log(`    Max:    ${max.toFixed(2)}`);
    console.log(`    Mean:   ${mean.toFixed(2)}`);
    console.log(`    Std:    ${std.toFixed(2)}`);
  }

  // Also check predicted vs actual spread
  const predicted = cleanRows.map((r: any) => Number(r.predicted_dps_7d)).filter(v => !isNaN(v));
  if (predicted.length > 0) {
    const predMin = Math.min(...predicted);
    const predMax = Math.max(...predicted);
    const predMean = predicted.reduce((s, v) => s + v, 0) / predicted.length;
    console.log(`\n    Predicted VPS range: ${predMin.toFixed(2)} - ${predMax.toFixed(2)} (mean: ${predMean.toFixed(2)})`);
  }

  // ── (d) Missing metrics check ─────────────────────────────────────────────
  console.log(`\n(d) MISSING METRICS:`);
  const metricFields = [
    'actual_completion_rate', 'actual_share_rate', 'actual_save_rate',
    'actual_velocity_score', 'actual_view_to_follower_ratio', 'actual_comment_rate',
    'dps_signal_confidence',
  ];

  for (const field of metricFields) {
    const missing = cleanRows.filter((r: any) => r[field] === null || r[field] === undefined).length;
    const pct = ((missing / cleanRows.length) * 100).toFixed(0);
    const status = missing === 0 ? '✓' : missing === cleanRows.length ? '✗' : '△';
    console.log(`    ${status} ${field.padEnd(35)} missing: ${missing}/${cleanRows.length} (${pct}%)`);
  }

  // ── (e) Tier concentration warning ─────────────────────────────────────────
  console.log(`\n(e) TIER CONCENTRATION CHECK:`);
  const tierCounts = [...tierDist.values()];
  const maxTierCount = Math.max(...tierCounts);
  const maxTier = [...tierDist.entries()].find(([, c]) => c === maxTierCount)?.[0];
  const concentration = maxTierCount / cleanRows.length;

  if (concentration > 0.5) {
    console.log(`    ⚠️  WARNING: ${(concentration * 100).toFixed(0)}% of data is in "${maxTier}" tier`);
    console.log(`    Model may struggle to learn other performance levels.`);
    console.log(`    Recommend collecting more data from underrepresented tiers.`);
  } else if (concentration > 0.35) {
    console.log(`    △ MODERATE: ${(concentration * 100).toFixed(0)}% of data is in "${maxTier}" tier`);
    console.log(`    Acceptable but not ideal — monitor per-tier accuracy.`);
  } else {
    console.log(`    ✓ Good tier spread — no single tier dominates.`);
  }

  // Print cohort info
  const cohortSizes = cleanRows
    .map((r: any) => Number(r.dps_cohort_sample_size))
    .filter(v => !isNaN(v) && v > 0);
  if (cohortSizes.length > 0) {
    const avgCohort = cohortSizes.reduce((s, v) => s + v, 0) / cohortSizes.length;
    console.log(`\n    Cohort sample sizes: min=${Math.min(...cohortSizes)}, max=${Math.max(...cohortSizes)}, avg=${avgCohort.toFixed(0)}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
