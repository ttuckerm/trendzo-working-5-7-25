/**
 * Log Experiment: Vision Hook Features
 *
 * Reads the current and previous v7 metadata, computes deltas,
 * and logs the experiment to the experiment_log table.
 *
 * Usage:
 *   npx tsx scripts/log-experiment-vision-hooks.ts
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
    console.error('ERROR: xgboost-v7-metadata.json not found. Run training first.');
    process.exit(1);
  }

  const metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));

  const perf = metadata.performance;
  const baseline = perf.baseline_73_features || perf.baseline_68_features || {};

  const metricsAfter = {
    cv_spearman_mean: perf.cv_5fold?.spearman_mean,
    cv_spearman_std: perf.cv_5fold?.spearman_std,
    holdout_spearman: perf.holdout?.spearman_rho,
    holdout_mae: perf.holdout?.mae,
    holdout_rmse: perf.holdout?.rmse,
    holdout_r2: perf.holdout?.r2,
    holdout_tier_accuracy: perf.holdout?.tier_accuracy_pct,
    train_spearman: perf.train?.spearman_rho,
    feature_count: metadata.feature_count,
  };

  const metricsBefore = {
    cv_spearman_mean: baseline.cv_spearman,
    holdout_spearman: baseline.holdout_spearman,
    feature_count: (metadata.feature_count || 77) - 4, // before adding 4 vision features
  };

  const delta = {
    cv_spearman: perf.delta?.cv_spearman,
    holdout_spearman: perf.delta?.holdout_spearman,
  };

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { error } = await supabase
    .from('experiment_log')
    .insert({
      experiment_name: 'phase1-vision-hook-features-subset50',
      experiment_type: 'feature_added',
      description: 'Added 4 Gemini Vision features on 50-video subset: hook_face_present, hook_text_overlay, hook_composition_score, hook_emotion_intensity.',
      model_version_before: 'v7 (73 features)',
      model_version_after: `v7 (${metadata.feature_count} features)`,
      metrics_before: metricsBefore,
      metrics_after: metricsAfter,
      delta,
      verdict: 'inconclusive',
      features_changed: [
        'hook_face_present',
        'hook_text_overlay',
        'hook_composition_score',
        'hook_emotion_intensity',
      ],
      created_by: 'claude-code',
    });

  if (error) {
    console.error(`ERROR inserting experiment log: ${error.message}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('  Experiment Logged Successfully');
  console.log('='.repeat(60));
  console.log(`  Name:    phase1-vision-hook-features-subset50`);
  console.log(`  Type:    feature_added`);
  console.log(`  Features: hook_face_present, hook_text_overlay, hook_composition_score, hook_emotion_intensity`);
  console.log(`  CV Spearman delta:      ${delta.cv_spearman != null ? (delta.cv_spearman >= 0 ? '+' : '') + delta.cv_spearman.toFixed(4) : 'N/A'}`);
  console.log(`  Holdout Spearman delta:  ${delta.holdout_spearman != null ? (delta.holdout_spearman >= 0 ? '+' : '') + delta.holdout_spearman.toFixed(4) : 'N/A'}`);
  console.log(`  Verdict: inconclusive (50-video subset only)`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
