/**
 * Diagnostic: emit the TS-scaled feature vector for row 0 of the holdout,
 * and a matching Python-scaled feature vector, so we can diff them column by
 * column and find the source of the mismatch.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const HOLDOUT_CSV = join(ROOT, 'src', 'lib', 'training', 'data', 'holdout_data.csv');
const SCALER = JSON.parse(readFileSync(join(ROOT, 'models', 'xgboost-v15-scaler.json'), 'utf-8'));
const FEATURES: string[] = JSON.parse(readFileSync(join(ROOT, 'models', 'xgboost-v15-features.json'), 'utf-8'));

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  const parseLine = (l: string) => {
    const out: string[] = []; let cur = ''; let q = false;
    for (const ch of l) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    out.push(cur);
    return out;
  };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
}

function toFeatureMap(headers: string[], row: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (let i = 0; i < headers.length; i++) {
    const name = headers[i]; const raw = row[i];
    if (raw === '' || raw === 'NaN' || raw === 'nan' || raw === 'null') { out[name] = null; continue; }
    if (raw === 'True' || raw === 'true') { out[name] = true; continue; }
    if (raw === 'False' || raw === 'false') { out[name] = false; continue; }
    if (name === 'video_id' || /^\d{16,}$/.test(raw)) { out[name] = raw; continue; }
    const num = Number(raw);
    if (Number.isFinite(num) && /^-?[\d.eE+]+$/.test(raw)) { out[name] = num; continue; }
    out[name] = raw;
  }
  return out;
}

const BINARY = new Set(SCALER.binary_features as string[]);
const encoders: Record<string, string[]> = SCALER.categorical_encoders || {};

function scale(features: Record<string, any>): Record<string, number> {
  const out: Record<string, number> = {};
  const nameToIdx = new Map<string, number>();
  FEATURES.forEach((f, i) => nameToIdx.set(f, i));

  for (let i = 0; i < FEATURES.length; i++) {
    const name = FEATURES[i];
    if (SCALER.computed_features?.includes(name)) { out[name] = NaN; continue; }
    const val = features[name];
    const enc = encoders[name];
    if (enc) {
      const str = val === null || val === undefined ? '__NaN__' : String(val);
      const idx = enc.indexOf(str);
      out[name] = idx === -1 ? -1 : idx;
      continue;
    }
    if (BINARY.has(name)) {
      if (val === null || val === undefined) { out[name] = NaN; continue; }
      out[name] = typeof val === 'boolean' ? (val ? 1 : 0) : Number(val);
      continue;
    }
    if (val === null || val === undefined) { out[name] = NaN; continue; }
    const numeric = typeof val === 'boolean' ? (val ? 1 : 0) : Number(val);
    if (SCALER.constant[i]) {
      out[name] = Number.isFinite(numeric) ? 0.5 : NaN;
      continue;
    }
    const mn = SCALER.min[i], mx = SCALER.max[i];
    if (mn === null || mx === null || mn === mx) { out[name] = NaN; continue; }
    out[name] = (numeric - mn) / (mx - mn);
  }

  // Pass 2
  const cflIdx = nameToIdx.get('creator_followers_log_computed');
  if (cflIdx !== undefined) {
    const sv = out['creator_followers_count'];
    if (Number.isFinite(sv)) {
      const logged = Math.log10(Math.max(sv, 1));
      const mn = SCALER.min[cflIdx], mx = SCALER.max[cflIdx];
      out['creator_followers_log_computed'] =
        mn !== null && mx !== null && mn !== mx ? (logged - mn) / (mx - mn) : logged;
    } else {
      out['creator_followers_log_computed'] = NaN;
    }
  }
  return out;
}

const { headers, rows } = parseCsv(readFileSync(HOLDOUT_CSV, 'utf-8'));
const row = rows[0];
const feats = toFeatureMap(headers, row);
const scaled = scale(feats);
const output: Record<string, { raw: any; scaled: number }> = {};
for (const name of FEATURES) {
  output[name] = { raw: feats[name], scaled: scaled[name] };
}
writeFileSync(join(ROOT, 'src', 'lib', 'training', 'results-s7', 'smoke_ts_scaled_row0.json'),
              JSON.stringify(output, null, 2));
console.log('wrote smoke_ts_scaled_row0.json');
