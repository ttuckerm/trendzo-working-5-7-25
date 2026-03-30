#!/usr/bin/env npx tsx
/**
 * Backfill Creator + Distribution Signal Features
 *
 * Populates 5 new columns in training_features by joining to scraped_videos:
 *   - creator_followers_count (raw)
 *   - creator_followers_log (log10(count + 1))
 *   - post_hour_utc (0-23)
 *   - post_day_of_week (0=Monday, 6=Sunday)
 *   - is_original_sound (0 or 1)
 *
 * Fast — no video download, just DB reads + writes.
 *
 * Usage:
 *   npx tsx scripts/backfill-creator-distribution-features.ts
 *   npx tsx scripts/backfill-creator-distribution-features.ts --dry-run
 *   npx tsx scripts/backfill-creator-distribution-features.ts --limit 10
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 0;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('  Backfill Creator + Distribution Signal Features');
  console.log('  5 columns from scraped_videos → training_features');
  if (dryRun) console.log('  ** DRY RUN — no database writes **');
  console.log('='.repeat(60));

  // 1. Fetch all training_features video_ids
  console.log('\n  Fetching training_features video_ids...');
  const allFeatureIds: string[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('training_features')
      .select('video_id')
      .range(offset, offset + batchSize - 1);

    if (error) throw new Error(`Failed to fetch training_features: ${error.message}`);
    if (!data || data.length === 0) break;
    allFeatureIds.push(...data.map(r => r.video_id));
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Found ${allFeatureIds.length} training_features rows`);

  // 2. Fetch source data from scraped_videos
  console.log('  Fetching scraped_videos (followers, timestamp, sound)...');
  const videoMap = new Map<string, {
    creator_followers_count: number | null;
    upload_timestamp: string | null;
    is_original_sound: boolean | null;
  }>();

  // Check if is_original_sound column exists on scraped_videos
  const { error: soundCheckErr } = await supabase
    .from('scraped_videos')
    .select('is_original_sound')
    .limit(1);
  const hasOriginalSound = !soundCheckErr;
  if (!hasOriginalSound) {
    console.log('  NOTE: scraped_videos.is_original_sound column not found — skipping');
  }

  const selectCols = hasOriginalSound
    ? 'video_id, creator_followers_count, upload_timestamp, is_original_sound'
    : 'video_id, creator_followers_count, upload_timestamp';

  offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select(selectCols)
      .range(offset, offset + batchSize - 1);

    if (error) throw new Error(`Failed to fetch scraped_videos: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      videoMap.set(row.video_id, {
        creator_followers_count: row.creator_followers_count,
        upload_timestamp: row.upload_timestamp,
        is_original_sound: hasOriginalSound ? (row as any).is_original_sound : null,
      });
    }
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Found ${videoMap.size} scraped_videos`);

  // 3. Process each training_features row
  let videoIds = allFeatureIds;
  if (limit > 0) videoIds = videoIds.slice(0, limit);

  console.log(`\n  Processing ${videoIds.length} videos...`);

  let updated = 0;
  let skipped = 0;
  const nullCounts = {
    creator_followers_count: 0,
    upload_timestamp: 0,
    is_original_sound: 0,
  };

  const WRITE_BATCH = 50;
  const updates: Array<{ video_id: string; [key: string]: any }> = [];

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    const source = videoMap.get(videoId);

    if (!source) {
      skipped++;
      continue;
    }

    const update: Record<string, any> = { video_id: videoId };
    let hasAnyValue = false;

    // Creator followers
    const followers = source.creator_followers_count;
    if (followers != null && followers >= 0) {
      update.creator_followers_count = followers;
      update.creator_followers_log = Math.log10(followers + 1);
      hasAnyValue = true;
    } else {
      nullCounts.creator_followers_count++;
    }

    // Post timing
    if (source.upload_timestamp) {
      const dt = new Date(source.upload_timestamp);
      if (!isNaN(dt.getTime())) {
        update.post_hour_utc = dt.getUTCHours();
        update.post_day_of_week = (dt.getUTCDay() + 6) % 7; // Sun=0 → Mon=0
        hasAnyValue = true;
      } else {
        nullCounts.upload_timestamp++;
      }
    } else {
      nullCounts.upload_timestamp++;
    }

    // Original sound
    if (source.is_original_sound != null) {
      update.is_original_sound = source.is_original_sound ? 1 : 0;
      hasAnyValue = true;
    } else {
      nullCounts.is_original_sound++;
    }

    if (!hasAnyValue) {
      skipped++;
      continue;
    }

    updates.push(update);

    // Flush batch
    if (updates.length >= WRITE_BATCH) {
      if (!dryRun) {
        await flushUpdates(updates);
      }
      updated += updates.length;
      updates.length = 0;

      if (updated % 200 === 0 || i === videoIds.length - 1) {
        console.log(`    ${updated}/${videoIds.length} updated...`);
      }
    }
  }

  // Final flush
  if (updates.length > 0) {
    if (!dryRun) {
      await flushUpdates(updates);
    }
    updated += updates.length;
    updates.length = 0;
  }

  // 4. Report
  console.log('\n' + '='.repeat(60));
  console.log('  RESULTS');
  console.log('='.repeat(60));
  console.log(`  Total rows:           ${videoIds.length}`);
  console.log(`  Updated:              ${updated}`);
  console.log(`  Skipped (no match):   ${skipped}`);
  console.log('\n  Source data NULL counts (rows where source was missing):');
  console.log('  ' + '-'.repeat(55));
  for (const [signal, count] of Object.entries(nullCounts)) {
    const pct = videoIds.length > 0 ? ((count / videoIds.length) * 100).toFixed(1) : '0.0';
    const flag = videoIds.length > 0 && (count / videoIds.length) > 0.5 ? ' ⚠️  >50% NULL' : '';
    console.log(`    ${signal.padEnd(30)} ${String(count).padStart(5)} nulls (${pct.padStart(5)}%)${flag}`);
  }
  console.log('='.repeat(60));
}

async function flushUpdates(
  updates: Array<Record<string, any>>
): Promise<void> {
  const { error } = await supabase
    .from('training_features')
    .upsert(updates, { onConflict: 'video_id' });

  if (error) {
    console.error(`  DB upsert error: ${error.message}`);
    throw error;
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
