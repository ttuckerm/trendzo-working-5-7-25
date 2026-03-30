#!/usr/bin/env node

/**
 * Direct DPS Re-calculation Script
 * Recalculates DPS scores directly using the database (no API required)
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Import the DPS calculation engine
const { DPSCalculationEngine } = require('../src/lib/services/dps/dps-calculation-engine.ts');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const dpsEngine = new DPSCalculationEngine();

async function recalculateDPS() {
  console.log('🔄 Starting DPS recalculation...\n');

  // Fetch all videos with transcripts
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .not('transcript', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch videos: ${error.message}`);
  }

  console.log(`Found ${videos.length} videos with transcripts\n`);

  let updated = 0;
  const classifications = { 'mega-viral': 0, 'viral': 0, 'normal': 0 };

  for (const video of videos) {
    const uploadDate = new Date(video.upload_timestamp || Date.now());
    const hoursSinceUpload = Math.max(1, (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60));

    const input = {
      videoId: video.video_id,
      platform: video.platform || 'tiktok',
      viewCount: parseInt(video.views_count) || 0,
      likeCount: parseInt(video.likes_count) || 0,
      commentCount: parseInt(video.comments_count) || 0,
      shareCount: parseInt(video.shares_count) || 0,
      followerCount: parseInt(video.creator_followers_count) || 10000,
      hoursSinceUpload,
      publishedAt: uploadDate.toISOString(),
      caption: video.title || '',
    };

    // Calculate DPS
    const result = await dpsEngine.calculateDPS(input);

    // Update scraped_videos table
    const { error: updateVideoError } = await supabase
      .from('scraped_videos')
      .update({
        viral_score: result.viralScore,
        classification: result.classification,
        percentile_rank: result.percentileRank,
      })
      .eq('video_id', video.video_id);

    if (updateVideoError) {
      console.error(`❌ Failed to update video ${video.video_id}:`, updateVideoError.message);
      continue;
    }

    // Insert into dps_calculations table
    const { error: insertError } = await supabase
      .from('dps_calculations')
      .insert({
        video_id: video.video_id,
        viral_score: result.viralScore,
        virality_classification: result.classification,
        percentile_rank: result.percentileRank,
        engagement_rate: result.engagementRate,
        velocity_score: result.velocityScore,
        viral_coefficient: result.viralCoefficient,
        platform: video.platform || 'tiktok',
        calculated_at: new Date().toISOString(),
      });

    if (insertError && !insertError.message.includes('duplicate')) {
      console.error(`⚠️  Failed to insert calculation for ${video.video_id}:`, insertError.message);
    }

    classifications[result.classification] = (classifications[result.classification] || 0) + 1;
    updated++;

    if (updated % 10 === 0) {
      console.log(`Progress: ${updated}/${videos.length} videos recalculated`);
    }
  }

  console.log(`\n✅ Recalculation complete!\n`);
  console.log('📊 Classification Summary:');
  console.log(`  Mega-viral: ${classifications['mega-viral']}`);
  console.log(`  Viral: ${classifications['viral']}`);
  console.log(`  Normal: ${classifications['normal']}`);
  console.log(`\nTotal updated: ${updated} videos\n`);
}

recalculateDPS().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
