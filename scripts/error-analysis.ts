#!/usr/bin/env npx tsx
/**
 * Error Analysis for Side Hustles — v5 vs v6
 *
 * Loads the training CSV (which has actual_dps + v5 pipeline predictions),
 * batch-predicts v6 via the Python model, then groups errors by:
 *   1. account_size
 *   2. duration bucket
 *   3. transcription_source
 *   4. 24-styles label
 *   5. hook_scorer bucket
 *
 * For each segment: count, accuracy within ±5, MAE, worst examples.
 * Prints "Top 3 segments to fix next" ranked by highest MAE.
 *
 * Run:
 *   npx tsx scripts/error-analysis.ts
 *   npx tsx scripts/error-analysis.ts --csv /path/to/custom.csv
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// ── CLI ───────────────────────────────────────────────────────────────────────

const csvArgIdx = process.argv.indexOf('--csv');
const CSV_PATH =
  csvArgIdx >= 0 && process.argv[csvArgIdx + 1]
    ? process.argv[csvArgIdx + 1]
    : path.join(os.tmpdir(), 'trendzo_side_hustles_training.csv');

// ── CSV parser (minimal, no deps) ────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ── Bucket helpers ────────────────────────────────────────────────────────────

function durationBucket(seconds: number | null): string {
  if (seconds == null || isNaN(seconds)) return 'unknown';
  if (seconds < 15) return '<15s';
  if (seconds < 30) return '15-30s';
  if (seconds < 60) return '30-60s';
  return '60s+';
}

function hookScorerBucket(pred: number | null): string {
  if (pred == null || isNaN(pred)) return 'no_score';
  if (pred >= 70) return 'strong (≥70)';
  if (pred >= 50) return 'medium (50-70)';
  return 'weak (<50)';
}

function styleLabel(pred: number | null): string {
  if (pred == null || isNaN(pred)) return 'no_style';
  // The 24-styles component returns a numeric prediction;
  // bucket into ranges since exact style IDs aren't in the CSV
  if (pred >= 80) return 'high (≥80)';
  if (pred >= 60) return 'mid (60-80)';
  if (pred >= 40) return 'low-mid (40-60)';
  return 'low (<40)';
}

function tierFromDps(dps: number): string {
  if (dps >= 90) return 'mega-viral';
  if (dps >= 70) return 'viral';
  if (dps >= 60) return 'good';
  if (dps >= 40) return 'average';
  return 'low';
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Row {
  run_id: string;
  video_id: string;
  actual_dps: number;
  v5_pred: number;
  v6_pred: number;
  account_size: string;
  duration_bucket: string;
  transcription_source: string;
  style_label: string;
  hook_bucket: string;
}

interface SegmentStats {
  segment: string;
  group: string;
  count: number;
  mae_v5: number;
  mae_v6: number;
  within5_v5: number;
  within5_v6: number;
  worst: { run_id: string; video_id: string; actual: number; v5: number; v6: number; v5_err: number; v6_err: number }[];
}

// ── v6 batch prediction via Python ────────────────────────────────────────────

// Feature names are loaded dynamically from the model's feature list.
// Fallback to the base 42 if file is missing.
function loadFeatureNames(): string[] {
  try {
    const p = path.resolve('models', 'xgboost-v6-features.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { /* ignore */ }
  return [
    'duration_seconds', 'resolution_width', 'resolution_height', 'fps',
    'motion_score', 'has_faces', 'face_time_ratio', 'has_music',
    'avg_volume', 'brightness_avg', 'contrast_ratio', 'saturation_avg',
    'visual_complexity', 'hook_scene_changes',
    'text_word_count', 'text_char_count', 'text_sentence_count',
    'text_avg_word_length', 'text_question_count', 'text_exclamation_count',
    'text_hashtag_count',
    'hook_scorer_pred', 'hook_scorer_conf', '7_legos_pred', '7_legos_conf',
    '9_attributes_pred', '9_attributes_conf', '24_styles_pred', '24_styles_conf',
    'niche_keywords_pred', 'niche_keywords_conf', 'virality_matrix_pred',
    'virality_matrix_conf', 'pattern_extraction_pred', 'pattern_extraction_conf',
    'trend_timing_pred', 'trend_timing_conf', 'posting_time_pred', 'posting_time_conf',
    'gpt4_score', 'claude_score',
    'feature_coverage_ratio',
  ];
}
const FEATURE_NAMES = loadFeatureNames();

function batchPredictV6(csvRows: Record<string, string>[]): number[] {
  // Check if v6 model exists
  const modelPath = path.resolve('models', 'xgboost-v6-model.json');
  if (!fs.existsSync(modelPath)) {
    console.log('  [WARN] v6 model not found — using v5 predictions as v6 fallback');
    return csvRows.map(r => parseFloat(r.predicted_dps_7d) || 0);
  }

  // Build feature matrix as JSON for Python
  const featureMatrix = csvRows.map(row =>
    FEATURE_NAMES.map(f => {
      const v = parseFloat(row[f]);
      return isNaN(v) ? 0 : v;
    }),
  );

  const tempIn = path.join(os.tmpdir(), `v6_batch_in_${Date.now()}.json`);
  const tempOut = path.join(os.tmpdir(), `v6_batch_out_${Date.now()}.json`);

  // Inline Python script for batch prediction
  const pyScript = `
import sys, json, os, numpy as np
os.environ['MODEL_VERSION'] = 'xgb_v6'
import xgboost as xgb, pickle
from pathlib import Path

MODEL_DIR = Path('models')
model = xgb.XGBRegressor()
model.load_model(str(MODEL_DIR / 'xgboost-v6-model.json'))

scaler_path = MODEL_DIR / 'xgboost-v6-scaler.pkl'
scaler = None
if scaler_path.exists():
    with open(scaler_path, 'rb') as f:
        scaler = pickle.load(f)

with open(sys.argv[1]) as f:
    features = json.load(f)

X = np.array(features)
if scaler is not None:
    X = scaler.transform(X)
preds = model.predict(X).clip(0, 100).tolist()

with open(sys.argv[2], 'w') as f:
    json.dump(preds, f)
`.trim();

  const pyFile = path.join(os.tmpdir(), `v6_batch_predict_${Date.now()}.py`);

  try {
    fs.writeFileSync(tempIn, JSON.stringify(featureMatrix));
    fs.writeFileSync(pyFile, pyScript);

    execSync(`python "${pyFile}" "${tempIn}" "${tempOut}"`, {
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const preds: number[] = JSON.parse(fs.readFileSync(tempOut, 'utf-8'));
    return preds;
  } catch (err: any) {
    console.log(`  [WARN] v6 batch predict failed: ${err.message?.slice(0, 100)}`);
    return csvRows.map(r => parseFloat(r.predicted_dps_7d) || 0);
  } finally {
    for (const f of [tempIn, tempOut, pyFile]) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}

// ── Analysis ──────────────────────────────────────────────────────────────────

function analyzeSegment(
  label: string,
  groupKey: string,
  rows: Row[],
): SegmentStats {
  const count = rows.length;
  const v5Errors = rows.map(r => Math.abs(r.actual_dps - r.v5_pred));
  const v6Errors = rows.map(r => Math.abs(r.actual_dps - r.v6_pred));

  const mae_v5 = v5Errors.reduce((s, e) => s + e, 0) / count;
  const mae_v6 = v6Errors.reduce((s, e) => s + e, 0) / count;
  const within5_v5 = (v5Errors.filter(e => e <= 5).length / count) * 100;
  const within5_v6 = (v6Errors.filter(e => e <= 5).length / count) * 100;

  // Worst examples by max(v5_err, v6_err) descending
  const ranked = rows
    .map(r => ({
      run_id: r.run_id,
      video_id: r.video_id,
      actual: r.actual_dps,
      v5: r.v5_pred,
      v6: r.v6_pred,
      v5_err: Math.abs(r.actual_dps - r.v5_pred),
      v6_err: Math.abs(r.actual_dps - r.v6_pred),
    }))
    .sort((a, b) => Math.max(b.v5_err, b.v6_err) - Math.max(a.v5_err, a.v6_err))
    .slice(0, 10);

  return { segment: label, group: groupKey, count, mae_v5, mae_v6, within5_v5, within5_v6, worst: ranked };
}

function groupBy(rows: Row[], key: keyof Row): Map<string, Row[]> {
  const map = new Map<string, Row[]>();
  for (const r of rows) {
    const val = String(r[key]);
    if (!map.has(val)) map.set(val, []);
    map.get(val)!.push(r);
  }
  return map;
}

// ── Printing ──────────────────────────────────────────────────────────────────

function printSegmentTable(title: string, stats: SegmentStats[]) {
  console.log(`\n  ── ${title} ${'─'.repeat(Math.max(0, 55 - title.length))}`);
  console.log(
    '  ' +
      'Group'.padEnd(20) +
      'N'.padStart(5) +
      '  MAE v5'.padStart(9) +
      '  MAE v6'.padStart(9) +
      '  ±5 v5'.padStart(8) +
      '  ±5 v6'.padStart(8),
  );
  console.log('  ' + '─'.repeat(59));

  for (const s of stats.sort((a, b) => b.mae_v5 - a.mae_v5)) {
    console.log(
      '  ' +
        s.group.padEnd(20) +
        String(s.count).padStart(5) +
        s.mae_v5.toFixed(1).padStart(9) +
        s.mae_v6.toFixed(1).padStart(9) +
        (s.within5_v5.toFixed(0) + '%').padStart(8) +
        (s.within5_v6.toFixed(0) + '%').padStart(8),
    );
  }
}

function printWorst(label: string, worst: SegmentStats['worst']) {
  if (worst.length === 0) return;
  console.log(`\n    Worst examples (${label}):`);
  for (const w of worst.slice(0, 5)) {
    const tag = w.v5_err > w.v6_err ? 'v5 worse' : w.v6_err > w.v5_err ? 'v6 worse' : 'same';
    console.log(
      `      ${w.run_id.slice(0, 8)}… actual=${w.actual.toFixed(1)} v5=${w.v5.toFixed(1)} v6=${w.v6.toFixed(1)} (${tag})`,
    );
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     Error Analysis — Side Hustles (v5 vs v6)        ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // ── 1. Load CSV ─────────────────────────────────────────────────────────

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n  ERROR: CSV not found: ${CSV_PATH}`);
    console.error('  Run first: npx tsx scripts/export-training-dataset.ts');
    process.exit(1);
  }

  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const csvRows = parseCSV(csvText);
  console.log(`\n  Loaded ${csvRows.length} rows from ${path.basename(CSV_PATH)}`);

  if (csvRows.length === 0) {
    console.log('  Nothing to analyze.');
    return;
  }

  // ── 2. Batch predict v6 ─────────────────────────────────────────────────

  console.log('  Computing v6 predictions...');
  const v6Preds = batchPredictV6(csvRows);

  // ── 3. Build typed rows ─────────────────────────────────────────────────

  const rows: Row[] = csvRows.map((r, i) => ({
    run_id: r.run_id || '',
    video_id: r.video_id || '',
    actual_dps: parseFloat(r.actual_dps) || 0,
    v5_pred: parseFloat(r.predicted_dps_7d) || 0,
    v6_pred: v6Preds[i] ?? 0,
    account_size: r.account_size || 'unknown',
    duration_bucket: durationBucket(parseFloat(r.duration_seconds)),
    transcription_source: r.transcription_source || 'unknown',
    style_label: styleLabel(parseFloat(r['24_styles_pred'])),
    hook_bucket: hookScorerBucket(parseFloat(r.hook_scorer_pred)),
  }));

  // ── 4. Overall summary ──────────────────────────────────────────────────

  const overall = analyzeSegment('Overall', 'ALL', rows);
  console.log(`\n  Overall (${rows.length} rows):`);
  console.log(`    v5 MAE: ${overall.mae_v5.toFixed(2)} DPS | ±5 accuracy: ${overall.within5_v5.toFixed(0)}%`);
  console.log(`    v6 MAE: ${overall.mae_v6.toFixed(2)} DPS | ±5 accuracy: ${overall.within5_v6.toFixed(0)}%`);

  // ── 5. Group analyses ───────────────────────────────────────────────────

  const dimensions: { title: string; key: keyof Row }[] = [
    { title: 'Account Size', key: 'account_size' },
    { title: 'Duration Bucket', key: 'duration_bucket' },
    { title: 'Transcription Source', key: 'transcription_source' },
    { title: '24-Styles Label', key: 'style_label' },
    { title: 'Hook Scorer Bucket', key: 'hook_bucket' },
  ];

  const allSegments: SegmentStats[] = [];

  for (const dim of dimensions) {
    const groups = groupBy(rows, dim.key);
    const stats: SegmentStats[] = [];

    for (const [groupVal, groupRows] of groups) {
      const s = analyzeSegment(dim.title, groupVal, groupRows);
      stats.push(s);
      allSegments.push(s);
    }

    printSegmentTable(dim.title, stats);

    // Show worst examples for the highest-MAE group
    const worstGroup = stats.sort((a, b) => b.mae_v5 - a.mae_v5)[0];
    if (worstGroup) {
      printWorst(`${dim.title}: ${worstGroup.group}`, worstGroup.worst);
    }
  }

  // ── 6. Top 3 segments to fix next ───────────────────────────────────────

  // Rank by v6 MAE (what the new model still gets wrong), weighted by count
  const ranked = allSegments
    .filter(s => s.count >= 1)
    .sort((a, b) => {
      // Primary: highest v6 MAE. Secondary: larger count (more impact)
      const scoreDiff = b.mae_v6 - a.mae_v6;
      if (Math.abs(scoreDiff) > 0.5) return scoreDiff;
      return b.count - a.count;
    });

  console.log('\n\n  ══════════════════════════════════════════════════');
  console.log('  TOP 3 SEGMENTS TO FIX NEXT (highest v6 MAE):');
  console.log('  ──────────────────────────────────────────────────');

  for (let i = 0; i < Math.min(3, ranked.length); i++) {
    const s = ranked[i];
    console.log(
      `  ${i + 1}. [${s.segment}] ${s.group}` +
        `  — N=${s.count}, v6 MAE=${s.mae_v6.toFixed(1)}, ±5=${s.within5_v6.toFixed(0)}%`,
    );
  }

  // ── 7. Worst 10 overall ─────────────────────────────────────────────────

  console.log('\n  ──────────────────────────────────────────────────');
  console.log('  WORST 10 EXAMPLES (by max error):');
  console.log('  ──────────────────────────────────────────────────');
  console.log(
    '  ' +
      'run_id'.padEnd(12) +
      'actual'.padStart(8) +
      '  v5'.padStart(7) +
      '  v6'.padStart(7) +
      '  v5_err'.padStart(8) +
      '  v6_err'.padStart(8) +
      '  acct_size'.padStart(16),
  );

  for (const w of overall.worst) {
    const row = rows.find(r => r.run_id === w.run_id);
    console.log(
      '  ' +
        w.run_id.slice(0, 10).padEnd(12) +
        w.actual.toFixed(1).padStart(8) +
        w.v5.toFixed(1).padStart(7) +
        w.v6.toFixed(1).padStart(7) +
        w.v5_err.toFixed(1).padStart(8) +
        w.v6_err.toFixed(1).padStart(8) +
        (row?.account_size ?? '').padStart(16),
    );
  }

  console.log('\nDone.');
}

main();
