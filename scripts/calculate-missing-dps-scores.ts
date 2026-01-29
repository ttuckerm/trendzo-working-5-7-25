import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Calculate DPS Score
 * DPS = (Likes + Comments + Shares) / Views * 100
 */
function calculateDPS(likes: number, comments: number, shares: number, views: number): number {
  if (views === 0) return 0;
  const engagement = likes + comments + shares;
  return (engagement / views) * 100;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     CALCULATE MISSING DPS SCORES                           ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get videos without DPS scores
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, views_count, likes_count, comments_count, shares_count, dps_score')
    .not('transcript_text', 'is', null)
    .is('dps_score', null);

  if (error) {
    console.error('❌ Error fetching videos:', error.message);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log('✅ All videos already have DPS scores!');
    return;
  }

  console.log(`📊 Found ${videos.length} videos without DPS scores\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    console.log(`[${i + 1}/${videos.length}] Processing: ${video.video_id}`);

    // Check if we have the required metrics
    if (!video.views_count || video.views_count === 0) {
      console.log(`  ⚠️  Skipped: Missing views_count`);
      skipped++;
      continue;
    }

    // Calculate DPS
    const dps = calculateDPS(
      video.likes_count || 0,
      video.comments_count || 0,
      video.shares_count || 0,
      video.views_count
    );

    // Update database
    const { error: updateError } = await supabase
      .from('scraped_videos')
      .update({ dps_score: dps })
      .eq('video_id', video.video_id);

    if (updateError) {
      console.error(`  ❌ Error updating: ${updateError.message}`);
      continue;
    }

    updated++;
    console.log(`  ✅ DPS: ${dps.toFixed(2)}`);
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ DPS CALCULATION COMPLETE                            ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${videos.length}`);

  // Verify final counts
  const { count } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript_text', 'is', null)
    .not('dps_score', 'is', null);

  console.log(`\n📈 Total videos with both transcript + DPS: ${count}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
