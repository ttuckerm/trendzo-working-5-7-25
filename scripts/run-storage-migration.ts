/**
 * Run Storage Migration
 * Sets up Supabase Storage bucket and adds permanent_video_url field
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function runMigration() {
  console.log('🚀 Running Storage Migration...\n');

  // Step 1: Create storage bucket
  console.log('1️⃣ Creating storage bucket: tiktok-videos');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  const bucketExists = buckets?.some(b => b.name === 'tiktok-videos');

  if (bucketExists) {
    console.log('   ✅ Bucket already exists\n');
  } else {
    const { data, error } = await supabase.storage.createBucket('tiktok-videos', {
      public: true,
      fileSizeLimit: 52428800, // 50MB max (TikTok videos are usually 5-30MB)
      allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'application/octet-stream']
    });

    if (error) {
      console.error('   ❌ Error creating bucket:', error.message);
      console.log('   💡 You may need to create the bucket manually in Supabase dashboard');
    } else {
      console.log('   ✅ Bucket created successfully\n');
    }
  }

  // Step 2: Add database columns
  console.log('2️⃣ Adding database columns to scraped_videos');

  const sql = `
    ALTER TABLE scraped_videos
    ADD COLUMN IF NOT EXISTS permanent_video_url TEXT,
    ADD COLUMN IF NOT EXISTS video_stored_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS video_file_size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS video_storage_path TEXT;

    CREATE INDEX IF NOT EXISTS idx_scraped_videos_permanent_url
    ON scraped_videos(permanent_video_url)
    WHERE permanent_video_url IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_scraped_videos_stored_at
    ON scraped_videos(video_stored_at)
    WHERE video_stored_at IS NOT NULL;

    COMMENT ON COLUMN scraped_videos.permanent_video_url IS 'Permanent Supabase Storage URL for the video file';
    COMMENT ON COLUMN scraped_videos.video_stored_at IS 'Timestamp when video was uploaded to permanent storage';
    COMMENT ON COLUMN scraped_videos.video_file_size_bytes IS 'Size of stored video file in bytes';
    COMMENT ON COLUMN scraped_videos.video_storage_path IS 'Storage path in bucket';
  `;

  // Use Supabase SQL editor or try querying to verify
  try {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('permanent_video_url, video_stored_at, video_file_size_bytes, video_storage_path')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('   ⚠️  Columns do not exist yet');
      console.log('   📝 Please run this SQL in Supabase SQL Editor:');
      console.log('\n' + sql.trim() + '\n');
    } else {
      console.log('   ✅ Columns verified successfully\n');
    }
  } catch (e: any) {
    console.log('   ⚠️  Could not verify columns. Manual SQL execution may be needed.\n');
  }

  // Step 3: Verify setup
  console.log('3️⃣ Verifying setup');

  const { data: testBuckets } = await supabase.storage.listBuckets();
  const bucketReady = testBuckets?.some(b => b.name === 'tiktok-videos');

  if (bucketReady) {
    console.log('   ✅ Storage bucket: READY');
  } else {
    console.log('   ❌ Storage bucket: NOT FOUND');
  }

  // Test bucket access
  const { data: testList, error: testError } = await supabase.storage
    .from('tiktok-videos')
    .list();

  if (!testError) {
    console.log('   ✅ Bucket access: WORKING');
  } else {
    console.log('   ⚠️  Bucket access: ' + testError.message);
  }

  console.log('\n✨ Migration complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify bucket in Supabase dashboard: Storage > tiktok-videos');
  console.log('   2. Run: npx tsx scripts/download-and-store-video.ts --video-id=<ID>');
}

runMigration().catch(console.error);
