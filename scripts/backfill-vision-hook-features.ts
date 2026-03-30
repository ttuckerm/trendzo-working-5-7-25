/**
 * Backfill Vision Hook Features
 *
 * Runs Gemini Vision analysis on local video files in data/tiktok_downloads/
 * and updates the training_features table with 4 new columns.
 *
 * Rate limited: max 10 Gemini API calls per minute.
 *
 * Usage:
 *   npx tsx scripts/backfill-vision-hook-features.ts --limit 50
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { extractVisionHookFeatures } from '../src/lib/prediction/vision-hook-features';

// ── Load env ──────────────────────────────────────────────────────────────────

config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const API_KEY = process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: Missing GOOGLE_AI_API_KEY (or GOOGLE_GEMINI_AI_API_KEY or GEMINI_API_KEY) in .env.local');
  process.exit(1);
}

// ── Rate limiting: max 10 calls per minute ────────────────────────────────────

const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const callTimestamps: number[] = [];

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  // Remove timestamps older than 1 minute
  while (callTimestamps.length > 0 && callTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    callTimestamps.shift();
  }
  if (callTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
    const waitMs = callTimestamps[0] + RATE_LIMIT_WINDOW_MS - now + 100;
    console.log(`  [Rate limit] Waiting ${(waitMs / 1000).toFixed(1)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  callTimestamps.push(Date.now());
}

// ── Parse args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 50;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { limit };
}

// ── Build video_id → file path map ───────────────────────────────────────────

function buildVideoFileMap(): Map<string, string> {
  const downloadDir = join(__dirname, '..', 'data', 'tiktok_downloads');
  const map = new Map<string, string>();

  if (!existsSync(downloadDir)) {
    console.error(`ERROR: ${downloadDir} does not exist`);
    return map;
  }

  const files = readdirSync(downloadDir).filter(f => f.endsWith('.mp4'));

  for (const file of files) {
    // Format: tiktok_[VIDEO_ID]_[TIMESTAMP].mp4
    const match = file.match(/^tiktok_(\d+)_\d+\.mp4$/);
    if (match) {
      map.set(match[1], join(downloadDir, file));
    }
  }

  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { limit } = parseArgs();

  console.log('='.repeat(60));
  console.log('  Vision Hook Features Backfill (Gemini Vision)');
  console.log(`  Limit: ${limit} | Rate limit: ${RATE_LIMIT_PER_MINUTE}/min`);
  console.log('='.repeat(60));

  // 1. Build local file map
  const fileMap = buildVideoFileMap();
  console.log(`\n  Local video files found: ${fileMap.size}`);

  if (fileMap.size === 0) {
    console.error('  No video files found in data/tiktok_downloads/');
    process.exit(1);
  }

  // 2. Get training_features rows that need backfilling
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  let allRows: Array<{ video_id: string; hook_face_present: number | null }> = [];
  let fetchOffset = 0;
  const batchSize = 500;
  while (true) {
    const { data: batch, error: batchErr } = await supabase
      .from('training_features')
      .select('video_id, hook_face_present')
      .is('hook_face_present', null)
      .range(fetchOffset, fetchOffset + batchSize - 1);

    if (batchErr) {
      console.error(`  ERROR fetching training_features: ${batchErr.message}`);
      process.exit(1);
    }
    if (!batch || batch.length === 0) break;
    allRows.push(...batch);
    if (batch.length < batchSize) break;
    fetchOffset += batchSize;
  }

  // Filter to rows that have local video files
  const rowsWithFiles = allRows.filter(r => fileMap.has(r.video_id));
  const pending = rowsWithFiles.slice(0, limit);

  console.log(`  Training features needing backfill: ${allRows.length}`);
  console.log(`  With local video files: ${rowsWithFiles.length}`);
  console.log(`  Pending (this run): ${pending.length}`);

  if (pending.length === 0) {
    console.log('\n  Nothing to backfill. Done.');
    return;
  }

  // 3. Process each video
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  let featureStats = {
    hook_face_present: 0,
    hook_text_overlay: 0,
    hook_composition_score: 0,
    hook_emotion_intensity: 0,
  };
  let facePresentCount = 0;
  let textOverlayCount = 0;

  const startTime = Date.now();

  for (let i = 0; i < pending.length; i++) {
    const row = pending[i];
    const videoPath = fileMap.get(row.video_id)!;

    process.stdout.write(`  [${i + 1}/${pending.length}] ${row.video_id}... `);

    try {
      await waitForRateLimit();

      const result = await extractVisionHookFeatures(videoPath);

      if (!result) {
        console.log('SKIPPED (no result)');
        skipped++;
        continue;
      }

      // Count features
      for (const key of Object.keys(featureStats) as Array<keyof typeof featureStats>) {
        if (result[key] !== null && result[key] !== undefined) {
          featureStats[key]++;
        }
      }
      if (result.hook_face_present === 1) facePresentCount++;
      if (result.hook_text_overlay === 1) textOverlayCount++;

      // Update training_features
      const { error: updateErr } = await supabase
        .from('training_features')
        .update({
          hook_face_present: result.hook_face_present,
          hook_text_overlay: result.hook_text_overlay,
          hook_composition_score: result.hook_composition_score,
          hook_emotion_intensity: result.hook_emotion_intensity,
        })
        .eq('video_id', row.video_id);

      if (updateErr) {
        console.log(`DB ERROR: ${updateErr.message}`);
        failed++;
        continue;
      }

      console.log(`OK face=${result.hook_face_present} text=${result.hook_text_overlay} comp=${result.hook_composition_score} emo=${result.hook_emotion_intensity}`);
      succeeded++;
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }
  }

  const elapsedMs = Date.now() - startTime;
  const elapsedMin = (elapsedMs / 60_000).toFixed(1);

  // Estimate API cost: Gemini 2.5 Flash input ~$0.15/1M tokens, ~1K tokens/image * 2 images + prompt
  // Roughly $0.0005 per call (2 images + prompt + output)
  const estimatedCost = succeeded * 0.0005;

  // 4. Report results
  console.log('\n' + '='.repeat(60));
  console.log('  Backfill Complete');
  console.log('='.repeat(60));
  console.log(`  Processed: ${pending.length} in ${elapsedMin} minutes`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log(`  Success rate: ${pending.length > 0 ? ((succeeded / pending.length) * 100).toFixed(1) : 0}%`);
  console.log(`\n  Feature extraction rates:`);
  for (const [key, count] of Object.entries(featureStats)) {
    console.log(`    ${key.padEnd(30)} ${count}/${succeeded} (${succeeded > 0 ? ((count / succeeded) * 100).toFixed(0) : 0}%)`);
  }
  console.log(`\n  Value distributions (of ${succeeded} succeeded):`);
  console.log(`    Face present:   ${facePresentCount}/${succeeded} (${succeeded > 0 ? ((facePresentCount / succeeded) * 100).toFixed(0) : 0}%)`);
  console.log(`    Text overlay:   ${textOverlayCount}/${succeeded} (${succeeded > 0 ? ((textOverlayCount / succeeded) * 100).toFixed(0) : 0}%)`);
  console.log(`\n  Estimated API cost: ~$${estimatedCost.toFixed(4)}`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
