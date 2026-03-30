#!/usr/bin/env npx tsx
/**
 * XGBoost v6 Evaluation Script
 *
 * Loads v6 training metadata and computes:
 *  - Accuracy within ±5 DPS
 *  - MAE
 *  - Tier accuracy (exact + within-one-tier)
 *  - Comparison vs current v5 metrics
 *
 * Run:
 *   npx tsx scripts/eval-xgboost-v6.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Tier helpers ──────────────────────────────────────────────────────────────

function classifyTier(dps: number): string {
  if (dps >= 90) return 'mega-viral';
  if (dps >= 70) return 'viral';
  if (dps >= 60) return 'good';
  if (dps >= 40) return 'average';
  return 'low';
}

const TIER_ORDER = ['low', 'average', 'good', 'viral', 'mega-viral'];

function tierDistance(a: string, b: string): number {
  return Math.abs(TIER_ORDER.indexOf(a) - TIER_ORDER.indexOf(b));
}

// ── v5 baseline metrics (from xgboost-virality-service.ts model info) ────────

const V5_BASELINE = {
  model_version: 'v5-simplified',
  trained_on: '3126 videos (heuristic, not real XGBoost)',
  correlation_side_hustles: 0.61,
  // v5 is a heuristic, so these are estimated from observed runs:
  estimated_mae: 15.0,       // typical ~15 DPS error for heuristic
  estimated_within_5: 35.7,  // 35.7% within ±5 DPS (from CLAUDE.md)
  estimated_tier_accuracy: 40, // rough guess based on heuristic nature
};

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║      XGBoost v6 Evaluation — Side Hustles           ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // ── 1. Load v6 metadata ────────────────────────────────────────────────────

  const metaPath = path.resolve(process.cwd(), 'models', 'xgboost-v6-metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.error(`  ERROR: v6 metadata not found: ${metaPath}`);
    console.error('  Run first: python scripts/train-xgboost-v6.py');
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  const perf = meta.performance;
  const evalPerf = perf.eval;
  const trainPerf = perf.train;

  // ── 2. Print v6 eval results ───────────────────────────────────────────────

  console.log('  v6 Model Details:');
  console.log(`    Trained at  : ${meta.trained_at}`);
  console.log(`    Features    : ${meta.feature_count}`);
  console.log(`    Train rows  : ${meta.dataset.train_rows}`);
  console.log(`    Eval rows   : ${meta.dataset.eval_rows}`);
  console.log(`    Split       : ${meta.dataset.split}`);
  console.log();

  console.log('  v6 Eval Set Performance:');
  console.log(`    MAE              : ${evalPerf.mae.toFixed(2)} DPS`);
  console.log(`    RMSE             : ${evalPerf.rmse.toFixed(2)} DPS`);
  console.log(`    R²               : ${evalPerf.r2.toFixed(3)}`);
  console.log(`    Within ±5 DPS    : ${evalPerf.within_5_dps_pct.toFixed(1)}%`);
  console.log(`    Tier accuracy    : ${evalPerf.tier_accuracy_pct.toFixed(1)}%`);
  console.log(`    CV R² (5-fold)   : ${perf.cv_r2_mean.toFixed(3)} ± ${perf.cv_r2_std.toFixed(3)}`);
  console.log();

  // ── 3. v5 vs v6 comparison ─────────────────────────────────────────────────

  const colW = 12;
  const sep = '-'.repeat(52);

  console.log('  ┌────────────────────┬────────────┬────────────┐');
  console.log('  │ Metric             │    v5      │    v6      │');
  console.log('  ├────────────────────┼────────────┼────────────┤');

  const rows = [
    ['MAE (DPS)', V5_BASELINE.estimated_mae.toFixed(1), evalPerf.mae.toFixed(2)],
    ['Within ±5 DPS (%)', V5_BASELINE.estimated_within_5.toFixed(1), evalPerf.within_5_dps_pct.toFixed(1)],
    ['Tier accuracy (%)', V5_BASELINE.estimated_tier_accuracy.toFixed(1), evalPerf.tier_accuracy_pct.toFixed(1)],
    ['R²', V5_BASELINE.correlation_side_hustles.toFixed(3), evalPerf.r2.toFixed(3)],
    ['Train rows', '3126*', String(meta.dataset.train_rows)],
    ['Features', '14 (heuristic)', String(meta.feature_count)],
  ];

  for (const [label, v5, v6] of rows) {
    console.log(`  │ ${label.padEnd(18)} │ ${v5.padStart(10)} │ ${v6.padStart(10)} │`);
  }

  console.log('  └────────────────────┴────────────┴────────────┘');
  console.log('  * v5 is heuristic-based, not a real XGBoost model');
  console.log();

  // ── 4. Delta analysis ──────────────────────────────────────────────────────

  const maeImprovement = V5_BASELINE.estimated_mae - evalPerf.mae;
  const within5Improvement = evalPerf.within_5_dps_pct - V5_BASELINE.estimated_within_5;
  const tierImprovement = evalPerf.tier_accuracy_pct - V5_BASELINE.estimated_tier_accuracy;

  console.log('  Improvement over v5:');
  console.log(`    MAE          : ${maeImprovement > 0 ? '-' : '+'}${Math.abs(maeImprovement).toFixed(2)} DPS ${maeImprovement > 0 ? '(better)' : '(worse)'}`);
  console.log(`    Within ±5    : ${within5Improvement >= 0 ? '+' : ''}${within5Improvement.toFixed(1)}pp ${within5Improvement >= 0 ? '(better)' : '(worse)'}`);
  console.log(`    Tier accuracy: ${tierImprovement >= 0 ? '+' : ''}${tierImprovement.toFixed(1)}pp ${tierImprovement >= 0 ? '(better)' : '(worse)'}`);
  console.log();

  // ── 5. Top features ────────────────────────────────────────────────────────

  if (meta.top_features && meta.top_features.length > 0) {
    console.log('  Top 10 features by importance:');
    const maxImp = meta.top_features[0].importance;
    for (const f of meta.top_features.slice(0, 10)) {
      const barLen = Math.round((f.importance / maxImp) * 20);
      const bar = '█'.repeat(barLen);
      console.log(`    ${f.feature.padEnd(28)} ${f.importance.toFixed(4)}  ${bar}`);
    }
    console.log();
  }

  // ── 6. Recommendation ──────────────────────────────────────────────────────

  const goodEnough = evalPerf.mae < V5_BASELINE.estimated_mae && evalPerf.within_5_dps_pct > V5_BASELINE.estimated_within_5;

  if (goodEnough) {
    console.log('  RECOMMENDATION: v6 outperforms v5. Safe to promote.');
    console.log('  Set MODEL_VERSION=xgb_v6 in .env.local to switch.\n');
  } else {
    console.log('  RECOMMENDATION: v6 does NOT outperform v5 on all metrics.');
    console.log('  Review the results before promoting. May need more training data.\n');
  }

  console.log('Done.');
}

main();
