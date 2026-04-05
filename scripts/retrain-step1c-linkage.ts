#!/usr/bin/env npx tsx
/**
 * Step 1c: Check if prediction_runs can be linked to training_features
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
  console.log('━━━ LINKAGE CHECK: prediction_runs → training_features ━━━\n');

  // 1. Get clean labeled prediction_runs
  const { data: runs } = await supabase
    .from('prediction_runs')
    .select('id, video_id, actual_dps, dps_v2_display_score, actual_tier, dps_v2_incomplete')
    .not('actual_dps', 'is', null)
    .neq('dps_v2_incomplete', true);

  console.log(`Clean labeled runs: ${runs!.length}\n`);

  // 2. Get video_files for these runs
  const videoIds = runs!.map((r: any) => r.video_id).filter(Boolean);
  console.log(`  video_ids present: ${videoIds.length}/${runs!.length}`);

  if (videoIds.length === 0) {
    console.log('  ⛔ No video_ids on prediction_runs — checking if video_id is NULL...');
    const nullVids = runs!.filter((r: any) => !r.video_id);
    console.log(`  Null video_ids: ${nullVids.length}/${runs!.length}`);

    // Try alternate: check if there's a scraped_video_id column
    const { data: sample } = await supabase
      .from('prediction_runs')
      .select('*')
      .not('actual_dps', 'is', null)
      .limit(1);

    if (sample && sample.length > 0) {
      console.log(`\n  prediction_runs columns: ${Object.keys(sample[0]).join(', ')}`);
    }
    return;
  }

  const { data: vfiles } = await supabase
    .from('video_files')
    .select('id, tiktok_url, storage_path, niche')
    .in('id', videoIds);

  console.log(`  video_files found: ${(vfiles || []).length}`);

  // 3. Extract TikTok video IDs from URLs
  const tiktokIdMap = new Map<string, string>(); // vfile.id → tiktok_video_id
  for (const vf of (vfiles || [])) {
    if (vf.tiktok_url) {
      // Extract video ID from URL like https://www.tiktok.com/@user/video/7123456789
      const match = vf.tiktok_url.match(/video\/(\d+)/);
      if (match) {
        tiktokIdMap.set(vf.id, match[1]);
      }
    }
  }
  console.log(`  Extracted TikTok video IDs: ${tiktokIdMap.size}`);

  // 4. Check training_features for matching video_ids
  if (tiktokIdMap.size > 0) {
    const tiktokIds = [...tiktokIdMap.values()];
    const { data: trainingRows, error: tfErr } = await supabase
      .from('training_features')
      .select('video_id')
      .in('video_id', tiktokIds);

    if (tfErr) {
      console.log(`  training_features query error: ${tfErr.message}`);
    } else {
      const matchedIds = new Set((trainingRows || []).map((r: any) => r.video_id));
      const matchCount = tiktokIds.filter(id => matchedIds.has(id)).length;
      console.log(`\n  ✓ MATCHED in training_features: ${matchCount}/${tiktokIds.length}`);

      if (matchCount > 0) {
        console.log(`  These rows have pre-extracted features available!`);
      }
    }
  }

  // 5. Alternative: check if scraped_videos has matching entries
  console.log('\n━━━ ALTERNATIVE: scraped_videos with DPS ━━━');
  const { count: scrapedWithDps } = await supabase
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true })
    .not('dps_score', 'is', null);

  const { count: scrapedTotal } = await supabase
    .from('scraped_videos')
    .select('video_id', { count: 'exact', head: true });

  console.log(`  scraped_videos total: ${scrapedTotal}`);
  console.log(`  scraped_videos with dps_score: ${scrapedWithDps}`);

  // 6. Check training_features coverage
  const { count: tfTotal } = await supabase
    .from('training_features')
    .select('video_id', { count: 'exact', head: true });

  console.log(`  training_features total: ${tfTotal}`);

  // 7. Check how many training_features rows have corresponding scraped_videos with DPS
  // This gives us the REAL trainable dataset size
  const { data: tfWithDps, error: joinErr } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT COUNT(*) as cnt
        FROM training_features tf
        JOIN scraped_videos sv ON tf.video_id = sv.video_id
        WHERE sv.dps_score IS NOT NULL
      `
    });

  if (joinErr) {
    // Fallback: query training_features and match manually
    console.log(`  RPC error (expected): ${joinErr.message}`);

    // Get a sample of training_features video_ids
    const { data: tfSample } = await supabase
      .from('training_features')
      .select('video_id')
      .limit(5);
    console.log(`\n  Training features sample video_ids: ${(tfSample || []).map((r: any) => r.video_id).join(', ')}`);

    // Get a sample of scraped_videos
    const { data: svSample } = await supabase
      .from('scraped_videos')
      .select('video_id, dps_score, niche')
      .not('dps_score', 'is', null)
      .limit(5);
    console.log(`  Scraped videos sample: ${JSON.stringify(svSample?.map((r: any) => ({ id: r.video_id, dps: r.dps_score, niche: r.niche })))}`);
  } else {
    console.log(`  training_features with DPS: ${JSON.stringify(tfWithDps)}`);
  }

  // 8. DIRECT approach: check if training_features video_ids overlap with scraped_videos dps
  const { data: trainableScraped } = await supabase
    .from('scraped_videos')
    .select('video_id, dps_score, niche')
    .not('dps_score', 'is', null)
    .limit(1000);

  if (trainableScraped) {
    const scrapedIds = new Set(trainableScraped.map((r: any) => r.video_id));

    // Check overlap with training_features
    const { data: tfIds } = await supabase
      .from('training_features')
      .select('video_id')
      .limit(10000);

    if (tfIds) {
      const tfIdSet = new Set(tfIds.map((r: any) => r.video_id));
      const overlap = trainableScraped.filter((r: any) => tfIdSet.has(r.video_id));
      console.log(`\n  ✓ scraped_videos with DPS AND features in training_features: ${overlap.length}`);

      if (overlap.length > 0) {
        // DPS score distribution for these
        const dpsScores = overlap.map((r: any) => Number(r.dps_score)).sort((a, b) => a - b);
        console.log(`  DPS range: ${dpsScores[0].toFixed(2)} - ${dpsScores[dpsScores.length - 1].toFixed(2)}`);
        console.log(`  DPS mean: ${(dpsScores.reduce((s: number, v: number) => s + v, 0) / dpsScores.length).toFixed(2)}`);
        console.log(`  DPS median: ${dpsScores[Math.floor(dpsScores.length / 2)].toFixed(2)}`);

        // Niche distribution
        const niches = new Map<string, number>();
        for (const r of overlap) {
          const n = r.niche || 'unknown';
          niches.set(n, (niches.get(n) || 0) + 1);
        }
        console.log(`  Niches:`);
        for (const [n, c] of [...niches.entries()].sort((a, b) => b[1] - a[1])) {
          console.log(`    ${n}: ${c}`);
        }
      }
    }
  }

  console.log('\n✅ Linkage check complete.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
