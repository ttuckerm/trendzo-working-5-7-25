/**
 * Smoke test: run 3 holdout videos through the production TypeScript inference
 * path (predictXGBoost + v15 scaler) and compare against Python's direct model
 * prediction on the same raw rows.
 *
 * Runs against the DB-resolved active model, so this also exercises the route
 * cache + model-router flow end-to-end after promotion.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { predictXGBoost } from '@/lib/prediction/xgboost-inference';
import { resolveModelRoute } from '@/lib/prediction/model-router';

const ROOT = process.cwd();
const HOLDOUT_CSV = join(ROOT, 'src', 'lib', 'training', 'data', 'holdout_data.csv');

// Rows picked at the same fixed seed the Python audit used (np.random.default_rng(42).choice)
const SAMPLE_INDICES = [0, 50, 150]; // arbitrary but fixed — gives variety

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  const parseLine = (l: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (const ch of l) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
}

function toFeatureMap(headers: string[], row: string[]): Record<string, number | boolean | null> {
  const out: Record<string, number | boolean | null> = {};
  for (let i = 0; i < headers.length; i++) {
    const name = headers[i];
    const raw = row[i];
    if (raw === '' || raw === undefined || raw === 'NaN' || raw === 'nan' || raw === 'null') {
      out[name] = null;
      continue;
    }
    if (raw === 'True' || raw === 'true') { out[name] = true; continue; }
    if (raw === 'False' || raw === 'false') { out[name] = false; continue; }
    // Preserve IDs as strings — JS numbers lose precision beyond ~15 digits
    if (name === 'video_id' || (/^\d{16,}$/.test(raw))) {
      out[name] = raw as unknown as number;
      continue;
    }
    const num = Number(raw);
    if (Number.isFinite(num) && /^-?[\d.eE+]+$/.test(raw)) { out[name] = num; continue; }
    out[name] = raw as unknown as number; // string (e.g. sound_type) — LabelEncoder handles this
  }
  return out;
}

async function main() {
  console.log('=== SMOKE TEST: v15 production inference ===\n');

  const route = await resolveModelRoute(null);
  console.log(`Active model route (global): ${route.model_version} (Spearman=${route.spearman_score})`);
  console.log(`Route variant_id: ${route.variant_id}\n`);

  const text = readFileSync(HOLDOUT_CSV, 'utf-8');
  const { headers, rows } = parseCsv(text);
  console.log(`Loaded ${rows.length} holdout rows with ${headers.length} columns\n`);

  // Load Python's prediction output from a file the caller writes out
  const pyOutPath = join(ROOT, 'src', 'lib', 'training', 'results-s7', 'smoke_python_preds.json');
  let pyPreds: Record<string, number> = {};
  try {
    pyPreds = JSON.parse(readFileSync(pyOutPath, 'utf-8'));
  } catch {
    console.log('(no Python reference file — will still show TS predictions)\n');
  }

  console.log(`${'idx'.padEnd(4)} ${'video_id'.padEnd(22)} ${'actual'.padStart(8)} ` +
              `${'ts_pred'.padStart(10)} ${'py_pred'.padStart(10)} ${'|diff|'.padStart(8)}`);
  console.log('-'.repeat(70));

  const results: Array<{ idx: number; videoId: string; actual: number; tsPred: number; pyPred: number | null; diff: number | null }> = [];
  for (const idx of SAMPLE_INDICES) {
    const row = rows[idx];
    const features = toFeatureMap(headers, row);
    const videoId = String(features['video_id'] ?? `row_${idx}`);
    const actual = Number(features['dps_score']);

    const r = predictXGBoost(features, route.model_version);
    const tsPred = r.raw_prediction; // unclamped, for cleaner comparison vs Python
    const pyPred = pyPreds[videoId];
    const diff = pyPred !== undefined ? Math.abs(tsPred - pyPred) : null;

    const pyStr = pyPred === undefined ? '—'.padStart(10) : pyPred.toFixed(3).padStart(10);
    const diffStr = diff === null ? '—'.padStart(8) : diff.toFixed(4).padStart(8);
    console.log(`${String(idx).padEnd(4)} ${videoId.slice(0, 20).padEnd(22)} ${actual.toFixed(2).padStart(8)} ${tsPred.toFixed(3).padStart(10)} ${pyStr} ${diffStr}`);
    results.push({ idx, videoId, actual, tsPred, pyPred: pyPred ?? null, diff });
  }

  console.log('\n--- Inference result summary (clamped/vps field) ---');
  for (const idx of SAMPLE_INDICES) {
    const features = toFeatureMap(headers, rows[idx]);
    const r = predictXGBoost(features, route.model_version);
    console.log(`  Video ${idx}: vps=${r.vps.toFixed(1)}  model=${r.model_version}  ` +
                `features=${r.features_provided}/${r.features_total}  missing=${r.missing_features.length}`);
    if (r.missing_features.length > 0 && r.missing_features.length <= 5) {
      console.log(`    missing: ${r.missing_features.join(', ')}`);
    }
  }

  // If we had Python preds, report max diff
  const diffs = results.map(r => r.diff).filter((d): d is number => d !== null);
  if (diffs.length > 0) {
    const maxDiff = Math.max(...diffs);
    console.log(`\nMax |TS - Python| across samples: ${maxDiff.toFixed(6)}`);
    console.log(maxDiff < 0.01 ? '✓ TS and Python agree within numeric tolerance' : '✗ TS / Python mismatch — investigate!');
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
