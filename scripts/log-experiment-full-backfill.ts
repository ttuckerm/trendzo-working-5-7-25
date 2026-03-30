/**
 * Log Experiment: Phase 1 Full Backfill
 *
 * Reads the current v7 metadata (post-backfill) and:
 *   1. Runs benchmark evaluation against evaluation_benchmarks table
 *   2. Logs the experiment to experiment_log table
 *
 * Usage:
 *   npx tsx scripts/log-experiment-full-backfill.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { runBenchmarkEvaluation } from '../src/lib/evaluation/benchmark-runner';

config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function main() {
  const metadataPath = join(__dirname, '..', 'models', 'xgboost-v7-metadata.json');

  if (!existsSync(metadataPath)) {
    console.error('ERROR: xgboost-v7-metadata.json not found. Run train-xgboost-v7-full-backfill.py first.');
    process.exit(1);
  }

  const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

  if (!metadata.full_backfill) {
    console.error('ERROR: Metadata does not have full_backfill flag. Run the backfill training script first.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Step 1: Run benchmark evaluation ──────────────────────────────────────
  console.log('='.repeat(60));
  console.log('  Running benchmark evaluation...');
  console.log('='.repeat(60));

  let benchmarkResult;
  try {
    benchmarkResult = await runBenchmarkEvaluation(
      supabase,
      'Full backfill complete. Retrained 74-feature model on full dataset.',
    );

    console.log(`  Benchmark complete:`);
    console.log(`    Videos evaluated: ${benchmarkResult.predictions.length}`);
    console.log(`    Spearman rho:     ${benchmarkResult.spearman_rho}`);
    console.log(`    MAE:              ${benchmarkResult.mae}`);
    console.log(`    Within ±5%:       ${benchmarkResult.within_5_pct}%`);
    console.log(`    Within ±10%:      ${benchmarkResult.within_10_pct}%`);
    console.log(`    Tier accuracy:    ${benchmarkResult.tier_accuracy_pct}%`);
  } catch (err: any) {
    console.error(`  Benchmark evaluation failed: ${err.message}`);
    console.error('  Continuing with experiment logging...');
  }

  // ── Step 2: Log experiment ────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('  Logging experiment...');
  console.log('='.repeat(60));

  const perf = metadata.performance;
  const baselines = perf.baselines || {};
  const deltaVsPre = perf.delta_vs_pre_backfill || {};
  const preBackfill = baselines.pre_backfill_74 || {};
  const backfillCoverage = metadata.backfill_coverage || {};

  const metricsAfter = {
    cv_spearman_mean: perf.cv_5fold?.spearman_mean,
    cv_spearman_std: perf.cv_5fold?.spearman_std,
    holdout_spearman: perf.holdout?.spearman_rho,
    holdout_mae: perf.holdout?.mae,
    holdout_rmse: perf.holdout?.rmse,
    holdout_r2: perf.holdout?.r2,
    holdout_tier_accuracy: perf.holdout?.tier_accuracy_pct,
    within_10_holdout: perf.holdout?.within_10_dps_pct,
    train_spearman: perf.train?.spearman_rho,
    feature_count: metadata.feature_count,
    ...(benchmarkResult ? {
      benchmark_spearman: benchmarkResult.spearman_rho,
      benchmark_mae: benchmarkResult.mae,
      benchmark_tier_accuracy: benchmarkResult.tier_accuracy_pct,
    } : {}),
  };

  const metricsBefore = {
    cv_spearman_mean: preBackfill.cv_spearman,
    holdout_spearman: preBackfill.holdout_spearman,
    holdout_mae: preBackfill.holdout_mae,
    within_10_holdout: preBackfill.within_10_holdout,
    tier_accuracy: preBackfill.tier_accuracy,
    feature_count: 74,
  };

  const description = [
    `Full backfill complete. Retrained 74-feature model on full dataset.`,
    `FFmpeg segment features: ${backfillCoverage.hook_motion_ratio ?? '?'}/${backfillCoverage.total_rows ?? '?'} videos.`,
    `Vision hook features: ${backfillCoverage.hook_face_present ?? '?'}/${backfillCoverage.total_rows ?? '?'} videos.`,
    `Same 74 features, same hyperparameters. Model now trained on real backfilled data instead of zeros.`,
  ].join('\n');

  const { error } = await supabase
    .from('experiment_log')
    .insert({
      experiment_name: 'phase1-full-backfill',
      experiment_type: 'model_retrain',
      description,
      model_version_before: `v7 (74 features, pre-backfill)`,
      model_version_after: `v7 (74 features, full backfill)`,
      metrics_before: metricsBefore,
      metrics_after: metricsAfter,
      delta: deltaVsPre,
      verdict: 'kept',
      features_changed: [],
      created_by: 'claude-code',
    });

  if (error) {
    console.error(`ERROR inserting experiment log: ${error.message}`);
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Experiment Logged Successfully');
  console.log('='.repeat(60));
  console.log(`  Name:     phase1-full-backfill`);
  console.log(`  Type:     model_retrain`);
  console.log(`  Features: 74 (unchanged)`);
  console.log(`  Change:   Full backfill data now available`);
  console.log(`  CV Spearman delta:      ${deltaVsPre.cv_spearman != null ? (deltaVsPre.cv_spearman >= 0 ? '+' : '') + deltaVsPre.cv_spearman.toFixed(4) : 'N/A'}`);
  console.log(`  Holdout Spearman delta:  ${deltaVsPre.holdout_spearman != null ? (deltaVsPre.holdout_spearman >= 0 ? '+' : '') + deltaVsPre.holdout_spearman.toFixed(4) : 'N/A'}`);
  console.log(`  Verdict:  kept`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
