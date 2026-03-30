/**
 * Quick FFmpeg Test - Single Video
 *
 * Tests FFmpeg integration with a single video to verify everything works.
 *
 * Usage:
 *   npx tsx scripts/test-ffmpeg-single.ts
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { analyzeVideoMetrics, analyzeHookPattern } from '../src/lib/services/ffmpeg-service';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? 'Found' : 'Missing');
  console.error('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testSingleVideo() {
  console.log('🧪 FFmpeg Single Video Test\n');

  // Fetch one video
  console.log('📊 Fetching a video from database...');
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .limit(1);

  if (error || !videos || videos.length === 0) {
    console.error('❌ No videos found:', error?.message);
    process.exit(1);
  }

  const video = videos[0];
  console.log('✅ Found video:');
  console.log(`   ID: ${video.video_id}`);
  console.log(`   Title: ${video.title}`);

  // Extract actual video file URL from raw_scraping_data
  let videoFileUrl: string | null = null;
  const pageUrl = video.video_url || video.url;

  // Check if we have subtitle links with actual video URLs
  if (video.raw_scraping_data?.videoMeta?.subtitleLinks && video.raw_scraping_data.videoMeta.subtitleLinks.length > 0) {
    // Use the first subtitle's tiktokLink - this is an actual .mp4 file URL
    videoFileUrl = video.raw_scraping_data.videoMeta.subtitleLinks[0].tiktokLink;
  }

  console.log(`   Page URL: ${pageUrl}`);
  console.log(`   Video File URL: ${videoFileUrl || 'NOT FOUND'}\n`);

  if (!videoFileUrl) {
    console.error('❌ No direct video file URL found in raw_scraping_data.');
    console.error('💡 Expected raw_scraping_data.videoMeta.subtitleLinks[0].tiktokLink');
    process.exit(1);
  }

  // Check if URL is likely expired
  const urlTimestamp = videoFileUrl.match(/l=(\d{15})/)?.[1];
  if (urlTimestamp) {
    const scrapeTime = new Date(
      parseInt(urlTimestamp.substring(0, 4)), // year
      parseInt(urlTimestamp.substring(4, 6)) - 1, // month (0-indexed)
      parseInt(urlTimestamp.substring(6, 8)), // day
      parseInt(urlTimestamp.substring(8, 10)), // hour
      parseInt(urlTimestamp.substring(10, 12)), // minute
      parseInt(urlTimestamp.substring(12, 14)) // second
    );
    const ageHours = (Date.now() - scrapeTime.getTime()) / (1000 * 60 * 60);

    console.log(`   URL Age: ${Math.floor(ageHours)} hours (${Math.floor(ageHours / 24)} days)`);

    if (ageHours > 1) {
      console.warn('   ⚠️  WARNING: URL is likely EXPIRED (>1 hour old)');
      console.warn('   ⚠️  TikTok CDN URLs expire within minutes/hours');
      console.warn('   📖 See: docs/ARCHITECTURAL-LIMITATION-ffmpeg.md\n');
    }
  }

  const testUrl = videoFileUrl;

  console.log('🔍 Analyzing video metadata...');
  try {
    const metadata = await analyzeVideoMetrics(testUrl);
    console.log('✅ Metadata retrieved:');
    console.log(`   Resolution: ${metadata.width}x${metadata.height}`);
    console.log(`   FPS: ${metadata.fps}`);
    console.log(`   Duration: ${metadata.duration}s`);
    console.log(`   Codec: ${metadata.codec}`);
    console.log(`   Has Audio: ${metadata.hasAudio}\n`);

    console.log('🎬 Analyzing hook pattern (first 3 seconds)...');
    const hookAnalysis = await analyzeHookPattern(testUrl);
    console.log('✅ Hook analysis complete:');
    console.log(`   Scene changes: ${hookAnalysis.sceneChanges}`);
    console.log(`   Avg brightness: ${hookAnalysis.avgBrightness}`);
    console.log(`   Frames extracted: ${hookAnalysis.frames.length}\n`);

    console.log('💾 Storing in database...');
    const { error: insertError } = await supabase
      .from('video_visual_analysis')
      .upsert({
        video_id: video.video_id,
        duration_seconds: metadata.duration,
        resolution_width: metadata.width,
        resolution_height: metadata.height,
        fps: metadata.fps,
        aspect_ratio: metadata.aspectRatio,
        bitrate: metadata.bitrate,
        codec: metadata.codec,
        has_audio: metadata.hasAudio,
        hook_scene_changes: hookAnalysis.sceneChanges,
        hook_avg_brightness: hookAnalysis.avgBrightness,
        saturation_avg: 0.7, // Placeholder
        analyzed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('❌ Database error:', insertError.message);
    } else {
      console.log('✅ Successfully stored in video_visual_analysis table\n');
    }

    console.log('🎉 Test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npx tsx scripts/populate-ffmpeg-data.ts --limit=10');
    console.log('   2. Or process specific video: npx tsx scripts/populate-ffmpeg-data.ts --video-id=YOUR_VIDEO_ID');

  } catch (error: any) {
    console.error('❌ Error during analysis:', error.message);

    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      console.error('\n🚨 ROOT CAUSE: TikTok CDN URL has EXPIRED');
      console.error('\n📋 Understanding the Problem:');
      console.error('   • TikTok CDN URLs contain time-limited tokens');
      console.error('   • URLs expire within minutes/hours after scraping');
      console.error('   • FFmpeg cannot analyze expired URLs (HTTP 403)');
      console.error('\n✅ SOLUTIONS:');
      console.error('   1. RE-SCRAPE: Run Apify scraper again to get fresh URLs');
      console.error('   2. IMMEDIATE ANALYSIS: Run FFmpeg within 1 hour of scraping');
      console.error('   3. STORAGE: Modify scraper to download/store videos permanently');
      console.error('\n📖 Full details: docs/ARCHITECTURAL-LIMITATION-ffmpeg.md');
    } else {
      console.error('\n🔧 Troubleshooting:');
      console.error('   1. Check if video URL is accessible');
      console.error('   2. Verify FFmpeg is installed (it should be via ffmpeg-static)');
      console.error('   3. Check temp directory permissions');
    }

    process.exit(1);
  }
}

testSingleVideo();
