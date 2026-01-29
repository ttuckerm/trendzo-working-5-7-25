/**
 * View FFmpeg Visual Analysis Data
 * Shows a visual table of all analyzed videos
 *
 * Run: npx tsx scripts/view-ffmpeg-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function viewFFmpegData() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     FFMPEG VISUAL ANALYSIS DATA VIEWER                     ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Fetch all videos with FFmpeg data
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select(`
      video_id,
      title,
      views_count,
      dps_score,
      video_visual_analysis!left (
        resolution_width,
        resolution_height,
        fps,
        bitrate,
        hook_scene_changes,
        quality_score,
        extraction_status,
        processed_at
      )
    `)
    .order('views_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching data:', error.message);
    return;
  }

  if (!videos || videos.length === 0) {
    console.log('⚠️  No videos found in database.');
    console.log('   Run the scraper first to populate data.\n');
    return;
  }

  // Count videos with FFmpeg data
  const withFFmpeg = videos.filter(v => {
    const ffmpeg = Array.isArray(v.video_visual_analysis)
      ? v.video_visual_analysis[0]
      : v.video_visual_analysis;
    return ffmpeg && ffmpeg.resolution_width;
  }).length;

  console.log(`📊 Database Summary:`);
  console.log(`   Total Videos: ${videos.length}`);
  console.log(`   With FFmpeg Analysis: ${withFFmpeg}`);
  console.log(`   Without FFmpeg Analysis: ${videos.length - withFFmpeg}\n`);

  console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');

  // Display each video
  videos.forEach((video, index) => {
    const ffmpeg = Array.isArray(video.video_visual_analysis)
      ? video.video_visual_analysis[0]
      : video.video_visual_analysis;

    console.log(`${index + 1}. ${video.title?.substring(0, 60) || 'Untitled'}...`);
    console.log(`   Video ID: ${video.video_id}`);
    console.log(`   Views: ${video.views_count?.toLocaleString() || 'N/A'}`);
    console.log(`   DPS Score: ${video.dps_score?.toFixed(2) || 'Not calculated'}`);

    if (ffmpeg && ffmpeg.resolution_width) {
      console.log(`\n   ✅ FFmpeg Analysis:`);
      console.log(`      Resolution:        ${ffmpeg.resolution_width}x${ffmpeg.resolution_height}`);
      console.log(`      FPS:               ${ffmpeg.fps}`);
      console.log(`      Bitrate:           ${ffmpeg.bitrate ? (ffmpeg.bitrate / 1000).toFixed(0) + ' kbps' : 'N/A'}`);
      console.log(`      Hook Cuts:         ${ffmpeg.hook_scene_changes || 'N/A'}`);
      console.log(`      Quality Score:     ${ffmpeg.quality_score ? (ffmpeg.quality_score * 100).toFixed(0) + '%' : 'N/A'}`);
      console.log(`      Status:            ${ffmpeg.extraction_status}`);
      console.log(`      Processed:         ${new Date(ffmpeg.processed_at).toLocaleString()}`);

      // Calculate visual score
      const visualScore = calculateVisualScore(ffmpeg);
      console.log(`\n      📊 Visual Intelligence Score: ${visualScore.toFixed(2)}/100`);

      if (video.dps_score) {
        const visualContribution = visualScore * 0.05;
        console.log(`      💡 DPS Contribution: +${visualContribution.toFixed(2)} points (5%)`);
      }
    } else {
      console.log(`\n   ⚠️  No FFmpeg analysis data`);
      console.log(`      Run FFmpeg analysis on this video`);
    }

    console.log('\n───────────────────────────────────────────────────────────────────────────────────────\n');
  });

  console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
  console.log(`💡 Tip: Videos with FFmpeg analysis get a +5% boost to their DPS score!\n`);
}

function calculateVisualScore(ffmpeg: any): number {
  let score = 0;

  // Resolution (30 points)
  const minDim = Math.min(ffmpeg.resolution_width || 0, ffmpeg.resolution_height || 0);
  if (minDim >= 1080) score += 30;
  else if (minDim >= 720) score += 22;
  else if (minDim >= 480) score += 14;
  else score += 7;

  // FPS (25 points)
  if (ffmpeg.fps >= 60) score += 25;
  else if (ffmpeg.fps >= 30) score += 18;
  else score += 12;

  // Bitrate (20 points)
  const bitrateMbps = (ffmpeg.bitrate || 0) / 1000000;
  if (bitrateMbps >= 5) score += 20;
  else if (bitrateMbps >= 3) score += 15;
  else if (bitrateMbps >= 1.5) score += 10;
  else score += 8;

  // Hook cuts (15 points)
  const hookCuts = ffmpeg.hook_scene_changes || 0;
  if (hookCuts >= 2 && hookCuts <= 4) score += 15;
  else if (hookCuts === 1 || hookCuts === 5) score += 10;
  else if (hookCuts >= 6) score += 5;
  else score += 2;

  // Quality (10 points)
  score += (ffmpeg.quality_score || 0) * 10;

  return Math.min(100, score);
}

// Run
viewFFmpegData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
