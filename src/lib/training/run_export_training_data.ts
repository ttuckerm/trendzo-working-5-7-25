/**
 * S9 Phase 2D — standalone tsx runner for exportScrapedTrainingData().
 *
 * Runs the same export logic the admin API route uses, then compares the
 * newly-written CSVs against a pre-existing snapshot to verify:
 *   1. Row counts unchanged (training=5645, holdout=200)
 *   2. Holdout video_ids identical (locked set)
 *   3. Previously-dead feature columns now have variance
 *
 * Usage: npx tsx src/lib/training/run_export_training_data.ts [--pre-snapshot-dir=DIR]
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

for (const envFile of ['.env.local', '.env']) {
  const full = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(full)) dotenv.config({ path: full });
}

import { exportScrapedTrainingData } from '@/lib/training/export-scraped-training-data';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'src/lib/training/data');
const TRAINING_PATH = path.join(DATA_DIR, 'training_data.csv');
const HOLDOUT_PATH = path.join(DATA_DIR, 'holdout_data.csv');

const BANNED_COLS = new Set([
  'views_count', 'likes_count', 'comments_count', 'shares_count', 'saves_count',
  'like_rate', 'comment_rate', 'share_rate', 'save_rate',
  'engagement_total', 'engagement_rate', 'views_per_follower',
  'views_at_1h', 'views_at_24h', 'shares_at_24h',
  'dps_cohort',
]);

const TARGET_COLS = [
  'audio_music_ratio', 'audio_speech_ratio', 'audio_type_encoded', 'audio_energy_variance',
  'hook_audio_score', 'hook_visual_score', 'hook_pace_score', 'hook_tone_score',
];

function parseCsv(csvPath: string): { header: string[]; rows: string[][] } {
  const text = fs.readFileSync(csvPath, 'utf-8');
  const lines = text.split(/\r?\n/).filter(l => l.length > 0);
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(l => l.split(','));
  return { header, rows };
}

function columnStats(header: string[], rows: string[][], col: string): { nonNull: number; uniqueVals: number; fillPct: number } {
  const idx = header.indexOf(col);
  if (idx < 0) return { nonNull: 0, uniqueVals: 0, fillPct: 0 };
  const vals = new Set<string>();
  let nonNull = 0;
  for (const r of rows) {
    const v = (r[idx] || '').trim();
    if (v !== '' && v !== 'null' && v !== 'NaN') {
      vals.add(v);
      nonNull++;
    }
  }
  return {
    nonNull,
    uniqueVals: vals.size,
    fillPct: rows.length > 0 ? Math.round((nonNull / rows.length) * 1000) / 10 : 0,
  };
}

async function main() {
  const arg = process.argv.find(a => a.startsWith('--pre-snapshot-dir='));
  const preDir = arg ? arg.split('=')[1] : null;

  // Snapshot pre-export CSVs so we can compare video_ids + fill rates.
  const snapshotDir = preDir || path.join(PROJECT_ROOT, 'results-autoresearch/bootstrap_validation_s9/pre_export_snapshot');
  fs.mkdirSync(snapshotDir, { recursive: true });
  const preTrainingPath = path.join(snapshotDir, 'training_data.csv');
  const preHoldoutPath = path.join(snapshotDir, 'holdout_data.csv');
  if (!preDir) {
    fs.copyFileSync(TRAINING_PATH, preTrainingPath);
    fs.copyFileSync(HOLDOUT_PATH, preHoldoutPath);
    console.log(`[snapshot] pre-export CSVs copied to ${snapshotDir}`);
  }

  const pre = {
    training: parseCsv(preTrainingPath),
    holdout: parseCsv(preHoldoutPath),
  };

  console.log('[export] Running exportScrapedTrainingData()…');
  const result = await exportScrapedTrainingData();
  console.log(`[export] wrote ${result.training_rows} training + ${result.holdout_rows} holdout`);

  const post = {
    training: parseCsv(TRAINING_PATH),
    holdout: parseCsv(HOLDOUT_PATH),
  };

  console.log('\n=== Verification ===');

  // 1. Row counts
  console.log(`Training rows: ${pre.training.rows.length} -> ${post.training.rows.length} ` +
              (pre.training.rows.length === post.training.rows.length ? '(OK)' : '(CHANGED)'));
  console.log(`Holdout rows:  ${pre.holdout.rows.length} -> ${post.holdout.rows.length} ` +
              (pre.holdout.rows.length === post.holdout.rows.length ? '(OK)' : '(CHANGED)'));

  // 2. Holdout video_ids locked
  const vidIdx = pre.holdout.header.indexOf('video_id');
  const preHoldIds = new Set(pre.holdout.rows.map(r => r[vidIdx]));
  const postHoldIds = new Set(post.holdout.rows.map(r => r[vidIdx]));
  const holdoutAdded = [...postHoldIds].filter(id => !preHoldIds.has(id));
  const holdoutRemoved = [...preHoldIds].filter(id => !postHoldIds.has(id));
  if (holdoutAdded.length === 0 && holdoutRemoved.length === 0) {
    console.log(`Holdout video_ids: IDENTICAL (${preHoldIds.size} IDs)`);
  } else {
    console.log(`Holdout video_ids: DRIFT — added=${holdoutAdded.length} removed=${holdoutRemoved.length}`);
    if (holdoutAdded.length > 0) console.log(`  added: ${holdoutAdded.slice(0, 10).join(', ')}${holdoutAdded.length > 10 ? '...' : ''}`);
    if (holdoutRemoved.length > 0) console.log(`  removed: ${holdoutRemoved.slice(0, 10).join(', ')}${holdoutRemoved.length > 10 ? '...' : ''}`);
  }

  // 3. Previously-dead features now have variance
  console.log('\n=== Fill-rate comparison on target columns ===');
  console.log('col                           pre -> post (unique pre -> post)');
  for (const col of TARGET_COLS) {
    const preS = columnStats(pre.training.header, pre.training.rows, col);
    const postS = columnStats(post.training.header, post.training.rows, col);
    const marker = (postS.uniqueVals > 1 && postS.fillPct > 5) ? '  LIVE' : '  DEAD';
    console.log(`  ${col.padEnd(28)}  ${String(preS.fillPct).padStart(5)}% -> ${String(postS.fillPct).padStart(5)}%  ` +
                `(unique ${preS.uniqueVals} -> ${postS.uniqueVals})${marker}`);
  }

  // 4. Banned columns still excluded
  console.log('\n=== Banned column check (must be excluded from honest feature set) ===');
  // The CSV contains them but retrain_s7 excludes them. Just confirm column presence vs absence.
  const bannedPresent: string[] = [];
  for (const col of BANNED_COLS) {
    if (post.training.header.includes(col)) bannedPresent.push(col);
  }
  if (bannedPresent.length > 0) {
    console.log(`  banned columns present in CSV (OK — retrain_s7.BANNED_COLS excludes them): ${bannedPresent.join(', ')}`);
  } else {
    console.log('  no banned columns in CSV (unusual — check export schema)');
  }
}

main().catch(err => {
  console.error('FATAL:', err.message, err.stack);
  process.exit(1);
});
