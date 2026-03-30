#!/usr/bin/env npx tsx
/**
 * Backfill Content Strategy Features
 *
 * Re-extracts the 7 new content strategy features for all existing
 * training_features rows using transcript_text + caption from scraped_videos.
 *
 * Fast — text analysis only, no video download needed.
 *
 * Usage:
 *   npx tsx scripts/backfill-content-strategy-features.ts
 *   npx tsx scripts/backfill-content-strategy-features.ts --dry-run
 *   npx tsx scripts/backfill-content-strategy-features.ts --limit 10
 */

import { createClient } from '@supabase/supabase-js';
import { extractContentStrategyFeatures } from '../src/lib/prediction/content-strategy-features';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env
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
  console.log('  Backfill Content Strategy Features');
  console.log('  7 text-based features from transcript + caption');
  if (dryRun) console.log('  ** DRY RUN — no database writes **');
  console.log('='.repeat(60));

  // 1. Fetch all training_features video_ids
  console.log('\n  Fetching training_features...');
  const allFeatureRows: Array<{ video_id: string }> = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('training_features')
      .select('video_id')
      .range(offset, offset + batchSize - 1);

    if (error) throw new Error(`Failed to fetch training_features: ${error.message}`);
    if (!data || data.length === 0) break;
    allFeatureRows.push(...data);
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Found ${allFeatureRows.length} training_features rows`);

  // 2. Fetch transcript + caption from scraped_videos
  console.log('  Fetching scraped_videos (transcript + caption)...');
  const videoMap = new Map<string, { transcript_text: string | null; caption: string | null }>();
  offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('video_id, transcript_text, caption')
      .range(offset, offset + batchSize - 1);

    if (error) throw new Error(`Failed to fetch scraped_videos: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      videoMap.set(row.video_id, {
        transcript_text: row.transcript_text,
        caption: row.caption,
      });
    }
    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Found ${videoMap.size} scraped_videos`);

  // 3. Process each training_features row
  let videoIds = allFeatureRows.map(r => r.video_id);
  if (limit > 0) videoIds = videoIds.slice(0, limit);

  console.log(`\n  Processing ${videoIds.length} videos...`);

  let updated = 0;
  let skipped = 0;
  let noText = 0;
  const featureStats: Record<string, { nonNull: number; sum: number }> = {
    retention_open_loop_count: { nonNull: 0, sum: 0 },
    share_relatability_score: { nonNull: 0, sum: 0 },
    share_utility_score: { nonNull: 0, sum: 0 },
    psych_curiosity_gap_score: { nonNull: 0, sum: 0 },
    psych_power_word_density: { nonNull: 0, sum: 0 },
    psych_direct_address_ratio: { nonNull: 0, sum: 0 },
    psych_social_proof_count: { nonNull: 0, sum: 0 },
  };

  const WRITE_BATCH = 50;
  const updates: Array<{ video_id: string; features: Record<string, number> }> = [];

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    const video = videoMap.get(videoId);

    if (!video) {
      skipped++;
      continue;
    }

    const transcript = video.transcript_text;
    const caption = video.caption;

    if (!transcript && !caption) {
      noText++;
      continue;
    }

    const features = extractContentStrategyFeatures(transcript, caption);

    // Track stats
    for (const [key, value] of Object.entries(features)) {
      if (value !== 0) {
        featureStats[key].nonNull++;
      }
      featureStats[key].sum += value;
    }

    updates.push({ video_id: videoId, features });

    // Flush batch
    if (updates.length >= WRITE_BATCH) {
      if (!dryRun) {
        await flushUpdates(updates);
      }
      updated += updates.length;
      updates.length = 0;

      if ((updated % 200 === 0) || i === videoIds.length - 1) {
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
  console.log(`  Total rows:   ${videoIds.length}`);
  console.log(`  Updated:      ${updated}`);
  console.log(`  Skipped (not in scraped_videos): ${skipped}`);
  console.log(`  No text:      ${noText}`);

  console.log('\n  Feature coverage (non-zero values):');
  console.log('  ' + '-'.repeat(55));
  for (const [feature, stats] of Object.entries(featureStats)) {
    const pct = updated > 0 ? ((stats.nonNull / updated) * 100).toFixed(1) : '0.0';
    const avg = updated > 0 ? (stats.sum / updated).toFixed(2) : '0.00';
    console.log(`    ${feature.padEnd(30)} ${String(stats.nonNull).padStart(5)} (${pct.padStart(5)}%)  avg=${avg}`);
  }
  console.log('='.repeat(60));
}

async function flushUpdates(
  updates: Array<{ video_id: string; features: Record<string, number> }>
): Promise<void> {
  // Supabase upsert with onConflict
  const rows = updates.map(u => ({
    video_id: u.video_id,
    ...u.features,
  }));

  const { error } = await supabase
    .from('training_features')
    .upsert(rows, { onConflict: 'video_id' });

  if (error) {
    console.error(`  DB upsert error: ${error.message}`);
    throw error;
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
