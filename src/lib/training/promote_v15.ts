/**
 * One-shot script: register v15-honest-with-res in model_variants, then promote it.
 *
 * Run via:
 *   npx tsx src/lib/training/promote_v15.ts
 *
 * Safe to re-run: checks if a v15 row already exists before inserting.
 * Uses promoteModelVariant() so the swap + log + cache invalidation happen
 * atomically through the same code path the Chairman dashboard uses.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { promoteModelVariant } from '@/lib/training/trainer-engine';
import { invalidateRouteCache } from '@/lib/prediction/model-router';

const ROOT = process.cwd();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');

  const db = createClient(url, key, { auth: { persistSession: false } });

  const metadata = JSON.parse(
    readFileSync(join(ROOT, 'models', 'xgboost-v15-metadata.json'), 'utf-8'),
  );
  const featureNames: string[] = JSON.parse(
    readFileSync(join(ROOT, 'models', 'xgboost-v15-features.json'), 'utf-8'),
  );
  const MODEL_VERSION = metadata.model_version as string;

  console.log(`\n=== Register & Promote ${MODEL_VERSION} ===`);
  console.log(`Holdout Spearman: ${metadata.holdout_spearman}`);
  console.log(`CV Spearman:      ${metadata.cv_spearman_mean}`);
  console.log(`Feature count:    ${metadata.feature_count}`);
  console.log(`Training rows:    ${metadata.training_rows}`);

  // ── 1. Check for existing v15 row ──────────────────────────────────────────
  const { data: existing } = await db
    .from('model_variants')
    .select('*')
    .eq('model_version', MODEL_VERSION)
    .is('niche', null)
    .limit(1)
    .maybeSingle();

  let variantId: string;

  if (existing) {
    console.log(`\nFound existing v15 row: id=${existing.id} active=${existing.is_active}`);
    variantId = existing.id;
  } else {
    console.log(`\nInserting new model_variants row…`);
    const { data: inserted, error } = await db
      .from('model_variants')
      .insert({
        niche: null,
        model_version: MODEL_VERSION,
        spearman_score: metadata.holdout_spearman,
        features: featureNames,
        hyperparams: metadata.hyperparameters,
        is_active: false,
        training_data_stats: {
          training_rows: metadata.training_rows,
          holdout_rows: metadata.holdout_rows,
          cv_spearman_mean: metadata.cv_spearman_mean,
          cv_spearman_std: metadata.cv_spearman_std,
          holdout_mae: metadata.holdout_mae,
          feature_count: metadata.feature_count,
          top_10_feature_importance: metadata.top_10_feature_importance,
          validation_status: metadata.validation_status,
          changes_from_v10: metadata.changes_from_v10,
        },
      })
      .select('id')
      .single();
    if (error || !inserted) throw new Error(`Insert failed: ${error?.message || 'no row returned'}`);
    variantId = inserted.id as string;
    console.log(`  inserted variant_id=${variantId}`);
  }

  // Refuse to promote if already active — prompt would be a no-op.
  const { data: activeRow } = await db
    .from('model_variants')
    .select('id, model_version')
    .eq('id', variantId)
    .single();

  if (activeRow?.model_version !== MODEL_VERSION) {
    throw new Error(`Resolved variant ${variantId} is not ${MODEL_VERSION}`);
  }

  const { data: currentActive } = await db
    .from('model_variants')
    .select('id, model_version, spearman_score')
    .is('niche', null)
    .eq('is_active', true)
    .maybeSingle();

  console.log(`\nCurrent active (global): ${currentActive?.model_version ?? 'none'} ` +
              `(Spearman=${currentActive?.spearman_score ?? '?'})`);

  if (currentActive?.id === variantId) {
    console.log('v15 is already the active global model. Nothing to do.');
    return;
  }

  // ── 2. Promote via the same code path the dashboard uses ───────────────────
  console.log(`\nPromoting ${MODEL_VERSION}…`);
  const result = await promoteModelVariant(
    variantId,
    'Promoted to production after S7 validation audit (Prompt 2, 2026-04-17). ' +
      'Holdout Spearman 0.6805 on 200 held-out videos from 5,645 diverse training set.',
    db,
  );

  if (!result.success) throw new Error(`Promotion failed: ${result.error}`);
  console.log(`  success=true`);
  console.log(`  promotion_log_id=${result.promotion_log_id}`);
  console.log(`  previous_variant_id=${result.previous_variant_id}`);

  invalidateRouteCache();
  console.log('Route cache invalidated.');

  // ── 3. Verify ──────────────────────────────────────────────────────────────
  const { data: verify } = await db
    .from('model_variants')
    .select('id, model_version, spearman_score, is_active, promoted_at')
    .is('niche', null)
    .eq('is_active', true)
    .single();
  console.log('\nPost-promotion verification (global active row):');
  console.log(`  model_version: ${verify?.model_version}`);
  console.log(`  spearman_score: ${verify?.spearman_score}`);
  console.log(`  is_active: ${verify?.is_active}`);
  console.log(`  promoted_at: ${verify?.promoted_at}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
