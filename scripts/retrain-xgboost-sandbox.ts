#!/usr/bin/env npx tsx
/**
 * XGBoost Retrain Sandbox Orchestrator
 *
 * Steps:
 *   1+2. Diagnostic + Extract features from prediction_runs (TypeScript)
 *   3.   Retrain XGBoost with LOOCV using v10 hyperparameters (Python)
 *   4.   Evaluate and compare with v10 baseline (Python)
 *   5.   Print recommendation (Python)
 *
 * All work goes to data/sandbox/ — production model is NOT touched.
 *
 * Usage: npx tsx scripts/retrain-xgboost-sandbox.ts
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const ROOT = path.resolve(__dirname, '..');

function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  XGBoost Retrain Sandbox Pipeline                           ║');
  console.log('║  Training on labeled prediction_runs (DPS v2 actuals)       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const inputPath = path.join(ROOT, 'data', 'xgboost-retrain-input.json');

  // Steps 1+2: Diagnostic + Extract features
  console.log('Steps 1+2: Diagnostic + Feature Extraction...\n');
  execSync('npx tsx scripts/retrain-step1-step2-sandbox.ts', {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 120_000,
  });

  if (!fs.existsSync(inputPath)) {
    console.error('\nFATAL: Feature extraction did not produce output file.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`\nFeature matrix ready: ${data.metadata.total_rows} rows x ${data.metadata.feature_count} features\n`);

  // Steps 3-5: Python retrain + evaluate + recommend
  console.log('Steps 3-5: Running Python retrain pipeline...\n');
  execSync('python scripts/retrain-xgboost-sandbox.py', {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 600_000,
  });

  // Final summary
  const evalPath = path.join(ROOT, 'data', 'sandbox', 'retrain-evaluation.json');
  if (fs.existsSync(evalPath)) {
    const evalData = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  Pipeline Complete                                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`  Spearman rho: ${evalData.v11_sandbox.loocv_spearman}`);
    console.log(`  MAE: ${evalData.v11_sandbox.loocv_mae}`);
    console.log(`  Within 10 DPS: ${evalData.v11_sandbox.loocv_within_10}%`);
  }
}

main();
