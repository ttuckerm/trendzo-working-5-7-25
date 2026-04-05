#!/usr/bin/env npx tsx
/**
 * Step 1d: Audit the actual trainable data
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

async function main() {
  console.log('━━━ DATA AUDIT ━━━\n');

  // 1. Check video_files table size
  const { count: vfTotal } = await supabase
    .from('video_files')
    .select('id', { count: 'exact', head: true });
  console.log(`video_files total rows: ${vfTotal}`);

  // 2. Sample prediction_runs video_ids
  const { data: prSample } = await supabase
    .from('prediction_runs')
    .select('id, video_id')
    .not('actual_dps', 'is', null)
    .limit(3);
  console.log(`\nSample prediction_runs video_ids:`);
  for (const r of prSample || []) {
    console.log(`  run=${r.id} → video_id=${r.video_id}`);
  }

  // 3. Sample video_files ids
  if (vfTotal && vfTotal > 0) {
    const { data: vfSample } = await supabase
      .from('video_files')
      .select('id, tiktok_url, niche')
      .limit(3);
    console.log(`\nSample video_files ids:`);
    for (const v of vfSample || []) {
      console.log(`  id=${v.id} url=${v.tiktok_url} niche=${v.niche}`);
    }
  }

  // 4. Check if prediction_runs reference a different video table
  // Maybe video_id references scraped_videos directly?
  if (prSample && prSample.length > 0) {
    const sampleVid = prSample[0].video_id;

    // Try scraped_videos
    const { data: svMatch } = await supabase
      .from('scraped_videos')
      .select('video_id, url, niche, dps_score')
      .eq('video_id', sampleVid)
      .limit(1);
    console.log(`\nMatch in scraped_videos for ${sampleVid}: ${svMatch?.length || 0}`);
  }

  // 5. THE REAL QUESTION: Can we build training data from training_features + scraped_videos?
  console.log('\n━━━ TRAINING_FEATURES + SCRAPED_VIDEOS ANALYSIS ━━━\n');

  // Count training_features with various feature coverage
  const { data: tfAll } = await supabase
    .from('training_features')
    .select('video_id, ffmpeg_scene_changes, audio_pitch_mean_hz, text_word_count, hook_score, creator_followers_log, specificity_score')
    .limit(10000);

  if (tfAll) {
    let withV10Features = 0;
    let withCreatorLog = 0;
    for (const row of tfAll) {
      if ((row as any).creator_followers_log != null) withCreatorLog++;
      if ((row as any).ffmpeg_scene_changes != null && (row as any).audio_pitch_mean_hz != null && (row as any).text_word_count != null) {
        withV10Features++;
      }
    }
    console.log(`training_features rows: ${tfAll.length}`);
    console.log(`  With core features (ffmpeg+audio+text): ${withV10Features}`);
    console.log(`  With creator_followers_log: ${withCreatorLog}`);
  }

  // scraped_videos with DPS — what kind of DPS scores?
  const { data: svDps } = await supabase
    .from('scraped_videos')
    .select('video_id, dps_score, niche, views, likes, follower_count')
    .not('dps_score', 'is', null)
    .limit(5000);

  if (svDps) {
    const scores = svDps.map((r: any) => Number(r.dps_score)).filter(v => !isNaN(v)).sort((a, b) => a - b);
    console.log(`\nscraped_videos with dps_score: ${svDps.length}`);
    console.log(`  DPS range: ${scores[0]?.toFixed(2)} - ${scores[scores.length - 1]?.toFixed(2)}`);
    console.log(`  DPS mean: ${(scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(2)}`);
    console.log(`  DPS median: ${scores[Math.floor(scores.length / 2)].toFixed(2)}`);

    // Is this z-score or display score?
    const negative = scores.filter(s => s < 0).length;
    const above100 = scores.filter(s => s > 100).length;
    console.log(`  Negative values: ${negative}`);
    console.log(`  Values > 100: ${above100}`);
    console.log(`  → ${negative > 0 ? 'Likely z-scores' : above100 > 0 ? 'Unknown scale' : 'Likely display scores (0-100)'}`);

    // Followers
    const withFollowers = svDps.filter((r: any) => r.follower_count > 0);
    console.log(`  With follower_count: ${withFollowers.length}/${svDps.length}`);

    // Niches
    const niches = new Map<string, number>();
    for (const r of svDps) {
      niches.set(r.niche || 'unknown', (niches.get(r.niche || 'unknown') || 0) + 1);
    }
    console.log(`  Niches: ${[...niches.entries()].map(([n, c]) => `${n}:${c}`).join(', ')}`);
  }

  // 6. The v10 training used DPS from scraped_videos. Check if it's display_score or z-score
  // v10 target: min=11.58, max=91.44 → looks like display scores
  // scraped_videos.dps_score range: check above

  // 7. FINAL: How many rows can we train on?
  if (tfAll && svDps) {
    const svDpsMap = new Map(svDps.map((r: any) => [r.video_id, r]));
    const trainable = tfAll.filter((r: any) => svDpsMap.has(r.video_id));
    console.log(`\n━━━ FINAL COUNT ━━━`);
    console.log(`training_features rows with scraped DPS: ${trainable.length}`);
    console.log(`This is the maximum trainable dataset.`);

    // Of these, how many have creator_followers_log (v10 feature)?
    const withCreator = trainable.filter((r: any) => (r as any).creator_followers_log != null);
    console.log(`  With creator_followers_log: ${withCreator.length}`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
