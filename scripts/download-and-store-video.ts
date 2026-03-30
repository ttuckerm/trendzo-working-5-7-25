/**
 * Download and Store Video Script
 *
 * Downloads a TikTok video from its CDN URL and stores it permanently in Supabase Storage.
 * This solves the URL expiration problem for FFmpeg analysis.
 *
 * Usage:
 *   npx tsx scripts/download-and-store-video.ts --video-id=7560321608347323670
 *   npx tsx scripts/download-and-store-video.ts --limit=10 --fresh-only
 *
 * Options:
 *   --video-id=ID    Download specific video by ID
 *   --limit=N        Download N videos (default: 1)
 *   --fresh-only     Only download videos < 1 hour old (higher success rate)
 *   --force          Re-download even if already stored
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { downloadAndStoreVideo, isVideoStored } from '../src/lib/services/video-storage-service';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// MAIN LOGIC
// ============================================================================

async function processVideo(video: any, force: boolean = false): Promise<boolean> {
  console.log(`\n📹 Processing: ${video.video_id}`);
  console.log(`   Title: ${video.title?.substring(0, 50) || 'N/A'}...`);

  // Check if already stored
  if (!force) {
    const alreadyStored = await isVideoStored(video.video_id);
    if (alreadyStored) {
      console.log('   ✅ Already stored (use --force to re-download)');
      return true;
    }
  }

  // Extract CDN URL from raw_scraping_data
  let cdnUrl: string | null = null;

  if (video.raw_scraping_data?.videoMeta?.subtitleLinks?.length > 0) {
    cdnUrl = video.raw_scraping_data.videoMeta.subtitleLinks[0].tiktokLink;
  }

  if (!cdnUrl) {
    console.error('   ❌ No CDN URL found in raw_scraping_data');
    return false;
  }

  // Check URL age
  const urlTimestamp = cdnUrl.match(/l=(\d{15})/)?.[1];
  if (urlTimestamp) {
    const scrapeTime = new Date(
      parseInt(urlTimestamp.substring(0, 4)),
      parseInt(urlTimestamp.substring(4, 6)) - 1,
      parseInt(urlTimestamp.substring(6, 8)),
      parseInt(urlTimestamp.substring(8, 10)),
      parseInt(urlTimestamp.substring(10, 12)),
      parseInt(urlTimestamp.substring(12, 14))
    );
    const ageHours = (Date.now() - scrapeTime.getTime()) / (1000 * 60 * 60);

    console.log(`   ⏰ URL Age: ${Math.floor(ageHours)} hours (${Math.floor(ageHours / 24)} days)`);

    if (ageHours > 24) {
      console.warn('   ⚠️  WARNING: URL is likely expired (>24 hours old)');
      console.warn('   ⚠️  Download may fail with 403 Forbidden');
    }
  }

  console.log(`   📥 Downloading from CDN...`);

  try {
    const result = await downloadAndStoreVideo(video.video_id, cdnUrl);

    if (!result.success) {
      console.error(`   ❌ Failed: ${result.error}`);

      if (result.error?.includes('403') || result.error?.includes('expired')) {
        console.error('   💡 URL has expired. You need to re-scrape this video.');
      }

      return false;
    }

    console.log(`   ✅ Download complete: ${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   💾 Stored at: ${result.publicUrl}`);
    console.log(`   📝 Database updated: ${result.dbUpdated ? 'YES' : 'NO'}`);

    return true;
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Download and Store Videos\n');

  // Parse arguments
  const args = process.argv.slice(2);
  let videoId: string | null = null;
  let limit = 1;
  let freshOnly = false;
  let force = false;

  for (const arg of args) {
    if (arg.startsWith('--video-id=')) {
      videoId = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--fresh-only') {
      freshOnly = true;
    } else if (arg === '--force') {
      force = true;
    }
  }

  console.log('📋 Configuration:');
  console.log(`   Video ID: ${videoId || 'Not specified'}`);
  console.log(`   Limit: ${videoId ? 1 : limit}`);
  console.log(`   Fresh only: ${freshOnly}`);
  console.log(`   Force re-download: ${force}\n`);

  // Fetch videos
  let query = supabase
    .from('scraped_videos')
    .select('*');

  if (videoId) {
    query = query.eq('video_id', videoId);
  } else {
    // If not targeting specific video, prioritize videos without storage
    query = query.is('permanent_video_url', null);

    if (freshOnly) {
      // Only videos from last hour
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      query = query.gte('created_at_utc', oneHourAgo);
    }

    query = query.order('views_count', { ascending: false }).limit(limit);
  }

  const { data: videos, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch videos:', error.message);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log('⚠️  No videos found matching criteria');

    if (freshOnly) {
      console.log('\n💡 Try without --fresh-only to process older videos');
      console.log('   (Note: Older videos likely have expired URLs)');
    }

    process.exit(0);
  }

  console.log(`📊 Found ${videos.length} video(s) to process\n`);
  console.log('='.repeat(80));

  // Process videos
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    console.log(`\n[${i + 1}/${videos.length}]`);

    const success = await processVideo(video, force);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Delay between downloads
    if (i < videos.length - 1) {
      console.log('\n   ⏳ Waiting 2 seconds before next video...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Success rate: ${((successCount / videos.length) * 100).toFixed(1)}%`);

  if (failCount > 0) {
    console.log('\n💡 Common failure reasons:');
    console.log('   • URL expired (videos >1 hour old)');
    console.log('   • Network issues');
    console.log('   • Storage quota exceeded');
    console.log('\n   Try: Re-scrape failed videos to get fresh URLs');
  }

  console.log('\n✨ Done!\n');
}

main().catch(console.error);
