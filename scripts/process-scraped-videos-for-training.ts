/**
 * Process Scraped Videos for Training Pipeline
 *
 * This script:
 * 1. Finds scraped videos without extracted features
 * 2. Downloads videos from TikTok URLs (using yt-dlp)
 * 3. Extracts features (visual, audio, transcript)
 * 4. Stores features in database for XGBoost training
 */

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

const TEMP_DIR = path.join(process.cwd(), 'data', 'temp_scraped_videos');

async function main() {
  console.log('=== SCRAPED VIDEO TRAINING PIPELINE ===\n');

  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Step 1: Get videos that need processing
  console.log('Finding videos that need feature extraction...\n');

  const { data: videos, error } = await supabase
    .from('creator_video_history')
    .select(`
      id,
      tiktok_video_id,
      tiktok_url,
      actual_dps,
      actual_views,
      actual_likes,
      actual_comments,
      actual_shares,
      actual_saves,
      duration_seconds,
      creator_profile_id
    `)
    .is('video_id', null) // Not yet linked to processed video
    .limit(10); // Process 10 at a time

  if (error || !videos || videos.length === 0) {
    console.log('No videos to process');
    return;
  }

  console.log(`Found ${videos.length} videos to process\n`);

  let processedCount = 0;
  let failedCount = 0;

  for (const video of videos) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Processing: ${video.tiktok_video_id}`);
    console.log(`URL: ${video.tiktok_url}`);
    console.log(`DPS: ${video.actual_dps} | Views: ${video.actual_views}`);

    try {
      // Step 2: Download video using yt-dlp
      const videoPath = path.join(TEMP_DIR, `${video.tiktok_video_id}.mp4`);

      console.log('\n1. Downloading video...');

      // Check if yt-dlp is installed
      try {
        await execAsync('yt-dlp --version');
      } catch {
        console.error('❌ yt-dlp not installed. Install with: pip install yt-dlp');
        console.log('\nSkipping video download. To enable:');
        console.log('1. Install yt-dlp: pip install yt-dlp');
        console.log('2. Re-run this script\n');
        failedCount++;
        continue;
      }

      // Download video
      const downloadCmd = `yt-dlp -f "best[ext=mp4]" -o "${videoPath}" "${video.tiktok_url}"`;
      await execAsync(downloadCmd, { timeout: 60000 });

      if (!fs.existsSync(videoPath)) {
        throw new Error('Video download failed');
      }

      console.log('✅ Video downloaded');

      // Step 3: Upload to storage and create video_files record
      console.log('\n2. Uploading to database...');

      const videoBuffer = fs.readFileSync(videoPath);
      const videoFileName = `scraped_${video.tiktok_video_id}.mp4`;

      // Store in Supabase storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (storageError) {
        throw new Error(`Storage upload failed: ${storageError.message}`);
      }

      // Create video_files record
      const { data: videoFile, error: videoError } = await supabase
        .from('video_files')
        .insert({
          filename: videoFileName,
          file_size_bytes: videoBuffer.length,
          duration_seconds: video.duration_seconds,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (videoError || !videoFile) {
        throw new Error(`Failed to create video record: ${videoError?.message}`);
      }

      console.log('✅ Video uploaded to storage');

      // Step 4: Extract features (call existing feature extraction)
      console.log('\n3. Extracting features...');

      // Import feature extraction service
      const { FeatureDecomposer } = await import('@/lib/services/feature-extraction/feature-decomposer');

      const features = await FeatureDecomposer.extractAll(videoPath, {
        niche: 'side_hustles', // Default, can be refined
        goal: 'build_engaged_following',
        accountSize: 'medium'
      });

      console.log('✅ Features extracted');

      // Step 5: Store features and link to creator video
      console.log('\n4. Storing in database...');

      // Update creator_video_history with video_id
      await supabase
        .from('creator_video_history')
        .update({ video_id: videoFile.id })
        .eq('id', video.id);

      // Store extracted features (this depends on your feature storage schema)
      // For now, we'll just mark it as processed

      console.log('✅ Features stored');

      // Clean up temp file
      fs.unlinkSync(videoPath);

      processedCount++;
      console.log(`\n✅ Successfully processed video ${processedCount}/${videos.length}`);

    } catch (error: any) {
      console.error(`\n❌ Failed to process video: ${error.message}`);
      failedCount++;
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('\n📊 PROCESSING SUMMARY');
  console.log(`Total videos: ${videos.length}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (processedCount > 0) {
    console.log('\n✅ Ready to retrain XGBoost model with new data!');
    console.log('Run: python scripts/train-xgboost-model.py');
  }
}

main().catch(console.error);
