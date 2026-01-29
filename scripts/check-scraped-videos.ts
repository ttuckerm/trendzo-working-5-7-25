#!/usr/bin/env tsx
/**
 * Check what data exists in scraped_videos table
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function checkScrapedVideos() {
  console.log('🔍 Checking scraped_videos table...\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Count total videos
  const { count: totalCount, error: countError } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error counting videos:', countError.message);
    process.exit(1);
  }

  console.log(`📊 Total videos in scraped_videos: ${totalCount}\n`);

  // Count videos needing processing
  const { count: needsProcessing } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .eq('needs_processing', true);

  console.log(`🔄 Videos needing processing: ${needsProcessing}\n`);

  // Get a sample video
  const { data: sampleVideos, error: sampleError } = await supabase
    .from('scraped_videos')
    .select('*')
    .eq('needs_processing', true)
    .limit(1);

  if (sampleError) {
    console.error('❌ Error fetching sample:', sampleError.message);
    process.exit(1);
  }

  if (!sampleVideos || sampleVideos.length === 0) {
    console.log('⚠️  No videos found that need processing');
    return;
  }

  console.log('📋 Sample video data:');
  console.log(JSON.stringify(sampleVideos[0], null, 2));
  console.log('\n');

  // Check if required fields exist
  const sample = sampleVideos[0] as any;
  console.log('✅ Field Check:');
  console.log(`  video_id: ${sample.video_id ? '✓' : '✗'} (${sample.video_id})`);
  console.log(`  platform: ${sample.platform ? '✓' : '✗'} (${sample.platform})`);
  console.log(`  views_count: ${sample.views_count !== undefined ? '✓' : '✗'} (${sample.views_count})`);
  console.log(`  likes_count: ${sample.likes_count !== undefined ? '✓' : '✗'} (${sample.likes_count})`);
  console.log(`  comments_count: ${sample.comments_count !== undefined ? '✓' : '✗'} (${sample.comments_count})`);
  console.log(`  shares_count: ${sample.shares_count !== undefined ? '✓' : '✗'} (${sample.shares_count})`);
  console.log(`  creator_followers_count: ${sample.creator_followers_count !== undefined ? '✓' : '✗'} (${sample.creator_followers_count})`);
  console.log(`  upload_timestamp: ${sample.upload_timestamp ? '✓' : '✗'} (${sample.upload_timestamp})`);
  console.log(`  created_at: ${sample.created_at ? '✓' : '✗'} (${sample.created_at})`);

  // Test date parsing
  if (sample.upload_timestamp) {
    try {
      const date = new Date(sample.upload_timestamp);
      const hoursSince = (Date.now() - date.getTime()) / 3600000;
      console.log(`\n⏱️  Hours since upload: ${hoursSince.toFixed(2)}`);
      console.log(`📅 ISO format test: ${date.toISOString()}`);
    } catch (error) {
      console.log(`\n❌ Date parsing error: ${error}`);
    }
  } else if (sample.created_at) {
    console.log('\n⚠️  No upload_timestamp, will use created_at as fallback');
  }
}

checkScrapedVideos().catch(console.error);


