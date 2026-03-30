#!/usr/bin/env npx tsx
/**
 * Check Creator + Distribution Signal Coverage
 *
 * Verifies how many scraped_videos (side-hustles training set) have
 * the source columns populated before adding them to training_features.
 *
 * Usage: npx tsx scripts/check-creator-distribution-coverage.ts
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

async function main() {
  console.log('='.repeat(60));
  console.log('  Creator + Distribution Signal Coverage Check');
  console.log('='.repeat(60));

  // Total training videos (those with training_features rows)
  const { count: totalTraining } = await supabase
    .from('training_features')
    .select('video_id', { count: 'exact', head: true });

  console.log(`\n  Total training_features rows: ${totalTraining}`);

  // Get all training video_ids
  const allIds: string[] = [];
  let offset = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from('training_features')
      .select('video_id')
      .range(offset, offset + batchSize - 1);
    if (!data || data.length === 0) break;
    allIds.push(...data.map(r => r.video_id));
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  // Fetch scraped_videos in small batches (avoid URL length limit with .in())
  const signals = {
    creator_followers_count: 0,
    upload_timestamp: 0,
  };

  // Note: sound_id and is_original_sound columns don't exist in live DB yet
  // (migration 20260308_sound_metadata.sql not applied). Skipping those checks.

  let checked = 0;
  const IN_BATCH = 100; // small batches to avoid URL length issues

  for (let i = 0; i < allIds.length; i += IN_BATCH) {
    const batch = allIds.slice(i, i + IN_BATCH);
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('video_id, creator_followers_count, upload_timestamp')
      .in('video_id', batch);

    if (error) {
      console.error(`  Query error at offset ${i}: ${error.message}`);
      continue;
    }

    for (const row of data || []) {
      checked++;
      if (row.creator_followers_count != null && row.creator_followers_count > 0) signals.creator_followers_count++;
      if (row.upload_timestamp != null) signals.upload_timestamp++;
    }

    if ((i + IN_BATCH) % 500 === 0) {
      console.log(`    checked ${Math.min(i + IN_BATCH, allIds.length)}/${allIds.length}...`);
    }
  }

  console.log(`\n  Matched in scraped_videos: ${checked}`);
  console.log('\n  Signal Coverage:');
  console.log('  ' + '-'.repeat(55));

  const total = checked;
  for (const [signal, count] of Object.entries(signals)) {
    const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    const flag = total > 0 && (count / total) < 0.5 ? ' ⚠️  BELOW 50%' : '';
    console.log(`    ${signal.padEnd(30)} ${String(count).padStart(5)} / ${total} (${pct.padStart(5)}%)${flag}`);
  }

  console.log('\n  NOTE: sound_id and is_original_sound columns do not exist');
  console.log('  in live DB yet (migration 20260308 not applied).');
  console.log('  is_original_sound will be NULL for all rows until that');
  console.log('  migration is run and the data is populated.');

  console.log('\n' + '='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
