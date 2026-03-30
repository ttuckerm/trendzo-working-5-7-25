/**
 * Log Experiment: Phase 1 Final Cleanup
 *
 * Reads the current v7 metadata (post-cleanup) and logs the experiment
 * to the experiment_log table.
 *
 * Usage:
 *   npx tsx scripts/log-experiment-phase1-final.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

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
    console.error('ERROR: xgboost-v7-metadata.json not found. Run train-xgboost-v7-phase1-final.py first.');
    process.exit(1);
  }

  const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

  if (!metadata.phase1_final) {
    console.error('ERROR: Metadata does not have phase1_final flag. Run the cleanup training script first.');
    process.exit(1);
  }

  const perf = metadata.performance;
  const baselines = perf.baselines || {};
  const delta77 = perf.delta_vs_77 || {};

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
  };

  const metricsBefore = {
    cv_spearman_mean: baselines['77_features']?.cv_spearman,
    holdout_spearman: baselines['77_features']?.holdout_spearman,
    feature_count: 77,
  };

  const removedFeatures = metadata.features_removed || [];
  const keptNew = metadata.features_kept_new || [];

  const description = [
    `Removed ${removedFeatures.length} zero-importance features, retrained with clean set.`,
    `Kept: ${keptNew.join(', ')}.`,
    `Removed: ${removedFeatures.join(', ')}.`,
  ].join('\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { error } = await supabase
    .from('experiment_log')
    .insert({
      experiment_name: 'phase1-final-cleanup',
      experiment_type: 'model_retrain',
      description,
      model_version_before: 'v7 (77 features)',
      model_version_after: `v7 (${metadata.feature_count} features, phase1 final)`,
      metrics_before: metricsBefore,
      metrics_after: metricsAfter,
      delta: delta77,
      verdict: 'kept',
      features_changed: removedFeatures,
      created_by: 'claude-code',
    });

  if (error) {
    console.error(`ERROR inserting experiment log: ${error.message}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('  Experiment Logged Successfully');
  console.log('='.repeat(60));
  console.log(`  Name:     phase1-final-cleanup`);
  console.log(`  Type:     model_retrain`);
  console.log(`  Removed:  ${removedFeatures.join(', ')}`);
  console.log(`  Kept new: ${keptNew.join(', ')}`);
  console.log(`  Features: 77 → ${metadata.feature_count}`);
  console.log(`  CV Spearman delta:      ${delta77.cv_spearman != null ? (delta77.cv_spearman >= 0 ? '+' : '') + delta77.cv_spearman.toFixed(4) : 'N/A'}`);
  console.log(`  Holdout Spearman delta:  ${delta77.holdout_spearman != null ? (delta77.holdout_spearman >= 0 ? '+' : '') + delta77.holdout_spearman.toFixed(4) : 'N/A'}`);
  console.log(`  Verdict:  kept`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
