/**
 * Backfill FFmpeg Segment Features
 *
 * Runs FFmpeg segment analysis on local video files in data/tiktok_downloads/
 * and updates the training_features table with the 5 new columns.
 *
 * Usage:
 *   npx tsx scripts/backfill-ffmpeg-segment-features.ts --limit 50
 *   npx tsx scripts/backfill-ffmpeg-segment-features.ts --limit 50 --offset 0
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
import { extractSegmentFeatures } from '../src/lib/prediction/ffmpeg-segment-features';

// ── Load env ──────────────────────────────────────────────────────────────────

config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

// ── Parse args ────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 50;
  let offset = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === '--offset' && args[i + 1]) {
      offset = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { limit, offset };
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
  const { limit, offset } = parseArgs();

  console.log('='.repeat(60));
  console.log('  FFmpeg Segment Features Backfill');
  console.log(`  Limit: ${limit} | Offset: ${offset}`);
  console.log('='.repeat(60));

  // 1. Build local file map
  const fileMap = buildVideoFileMap();
  console.log(`\n  Local video files found: ${fileMap.size}`);

  if (fileMap.size === 0) {
    console.error('  No video files found in data/tiktok_downloads/');
    process.exit(1);
  }

  // 2. Get training_features rows that have local files
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Fetch training_features that need backfilling (hook_motion_ratio is null)
  // Paginate to avoid URL limits
  let allRows: Array<{ video_id: string; hook_motion_ratio: number | null }> = [];
  let fetchOffset = 0;
  const batchSize = 500;
  while (true) {
    const { data: batch, error: batchErr } = await supabase
      .from('training_features')
      .select('video_id, hook_motion_ratio')
      .is('hook_motion_ratio', null)
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

  const pending = rowsWithFiles.slice(offset, offset + limit);

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
  let featureStats: Record<string, number> = {
    hook_motion_ratio: 0,
    audio_energy_buildup: 0,
    scene_rate_first_half_vs_second: 0,
    visual_variety_score: 0,
    hook_audio_intensity: 0,
  };

  for (let i = 0; i < pending.length; i++) {
    const row = pending[i];
    const videoPath = fileMap.get(row.video_id)!;

    process.stdout.write(`  [${i + 1}/${pending.length}] ${row.video_id}... `);

    try {
      const result = await extractSegmentFeatures(videoPath);
      const f = result.features;

      // Count non-null features
      for (const key of Object.keys(featureStats)) {
        if (f[key as keyof typeof f] !== null) {
          featureStats[key]++;
        }
      }

      // Update training_features
      const { error: updateErr } = await supabase
        .from('training_features')
        .update({
          hook_motion_ratio: f.hook_motion_ratio,
          audio_energy_buildup: f.audio_energy_buildup,
          scene_rate_first_half_vs_second: f.scene_rate_first_half_vs_second,
          visual_variety_score: f.visual_variety_score,
          hook_audio_intensity: f.hook_audio_intensity,
        })
        .eq('video_id', row.video_id);

      if (updateErr) {
        console.log(`DB ERROR: ${updateErr.message}`);
        failed++;
        continue;
      }

      const featureCount = Object.values(f).filter(v => v !== null).length;
      const errorInfo = result.errors.length > 0 ? ` (${result.errors.length} errors)` : '';
      console.log(`OK ${featureCount}/5 features in ${result.extractionTimeMs}ms${errorInfo}`);

      if (result.errors.length > 0) {
        for (const err of result.errors) {
          console.log(`    WARNING: ${err}`);
        }
      }

      succeeded++;
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`);
      failed++;
    }
  }

  // 4. Report results
  console.log('\n' + '='.repeat(60));
  console.log('  Backfill Complete');
  console.log('='.repeat(60));
  console.log(`  Processed: ${pending.length}`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Success rate: ${((succeeded / pending.length) * 100).toFixed(1)}%`);
  console.log('\n  Feature extraction rates:');
  for (const [key, count] of Object.entries(featureStats)) {
    console.log(`    ${key.padEnd(40)} ${count}/${succeeded} (${succeeded > 0 ? ((count / succeeded) * 100).toFixed(0) : 0}%)`);
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
