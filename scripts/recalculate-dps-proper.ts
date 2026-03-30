/**
 * Recalculate DPS for 152 Training Videos using Proper DPS Formula
 *
 * This script fixes the data leakage issue by:
 * 1. Calculating proper DPS using the Dynamic Percentile System
 * 2. NOT using dps_score as an input feature (it's the target)
 *
 * DPS Formula: viralScore based on z-score within cohort, engagement quality,
 * platform weight, and time decay
 */

import { createClient } from '@supabase/supabase-js';
import {
  calculateZScore,
  zScoreToPercentile,
  calculateEngagementScore,
  calculateDecayFactor,
  calculateMasterViralScore,
  PLATFORM_WEIGHTS
} from '../src/lib/services/dps/dps-calculation-engine';

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface VideoData {
  video_id: string;  // Primary key
  platform: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  creator_followers_count?: number;
  created_at_utc?: string;
  dps_score?: number;
}

interface CohortStats {
  median: number;
  mean: number;
  stdDev: number;
  sampleSize: number;
}

/**
 * Calculate cohort statistics for a given follower band
 * Groups creators by similar follower counts (±20%)
 */
async function calculateCohortStats(
  allVideos: VideoData[],
  followerCount: number
): Promise<CohortStats> {
  // Define cohort bounds (±20% of follower count)
  const lowerBound = Math.floor(followerCount * 0.8);
  const upperBound = Math.ceil(followerCount * 1.2);

  // Filter videos in this cohort
  const cohortVideos = allVideos.filter(v => {
    const followers = v.creator_followers_count || 50000; // Default to 50K if missing
    return followers >= lowerBound && followers <= upperBound;
  });

  // If cohort is too small, use all videos
  const videosToAnalyze = cohortVideos.length >= 10 ? cohortVideos : allVideos;

  // Calculate statistics
  const viewCounts = videosToAnalyze.map(v => v.views_count);
  const sorted = viewCounts.sort((a, b) => a - b);

  const median = sorted[Math.floor(sorted.length / 2)];
  const mean = viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length;
  const variance = viewCounts.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / viewCounts.length;
  const stdDev = Math.sqrt(variance);

  return {
    median,
    mean,
    stdDev,
    sampleSize: videosToAnalyze.length
  };
}

/**
 * Calculate proper DPS for a single video
 */
function calculateProperDPS(
  video: VideoData,
  cohortStats: CohortStats
): number {
  // 1. Calculate z-score (how many standard deviations from cohort mean)
  const zScore = calculateZScore(video.views_count, cohortStats.mean, cohortStats.stdDev);

  // 2. Calculate engagement score (quality of interactions)
  const platform = (video.platform || 'tiktok').toLowerCase() as 'tiktok' | 'instagram' | 'youtube';
  const engagementScore = calculateEngagementScore(
    video.views_count,
    video.likes_count,
    video.comments_count,
    video.shares_count,
    platform
  );

  // 3. Calculate time decay (older videos penalized)
  // Estimate hours since upload from created_at_utc or default to 24 hours
  let hoursSinceUpload = 24;
  if (video.created_at_utc) {
    const createdAt = new Date(video.created_at_utc);
    hoursSinceUpload = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  }
  const decayFactor = calculateDecayFactor(hoursSinceUpload, platform);

  // 4. Get platform weight
  const platformWeight = PLATFORM_WEIGHTS[platform] || 1.0;

  // 5. Calculate master viral score (0-100)
  const viralScore = calculateMasterViralScore({
    zScore,
    engagementScore,
    platformWeight,
    decayFactor,
    platform
  });

  return Math.round(viralScore * 100) / 100; // Round to 2 decimals
}

async function main() {
  console.log('='.repeat(60));
  console.log('DPS Recalculation: Fixing Training Data');
  console.log('='.repeat(60));
  console.log('');

  // 1. Fetch all videos from scraped_videos table
  console.log('📥 Fetching videos from database...');
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, platform, views_count, likes_count, comments_count, shares_count, creator_followers_count, created_at_utc, dps_score')
    .order('created_at_utc', { ascending: false });

  if (error) {
    console.error('❌ Error fetching videos:', error.message);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.error('❌ No videos found in scraped_videos table');
    process.exit(1);
  }

  console.log(`✅ Found ${videos.length} videos`);
  console.log('');

  // 2. Show current DPS statistics (the WRONG values)
  const currentDPS = videos.filter(v => v.dps_score != null).map(v => v.dps_score!);
  if (currentDPS.length > 0) {
    console.log('📊 Current DPS Statistics (WRONG formula):');
    console.log(`   Min: ${Math.min(...currentDPS).toFixed(2)}`);
    console.log(`   Max: ${Math.max(...currentDPS).toFixed(2)}`);
    console.log(`   Mean: ${(currentDPS.reduce((a, b) => a + b, 0) / currentDPS.length).toFixed(2)}`);
    console.log('');
  }

  // 3. Calculate proper DPS for each video
  console.log('🔄 Recalculating DPS with proper formula...');
  console.log('');

  const results: { id: string; oldDPS: number | null; newDPS: number }[] = [];

  for (const video of videos) {
    // Get cohort stats for this video's creator size
    const cohortStats = await calculateCohortStats(
      videos as VideoData[],
      video.creator_followers_count || 50000
    );

    // Calculate proper DPS
    const newDPS = calculateProperDPS(video as VideoData, cohortStats);

    results.push({
      id: video.video_id,
      oldDPS: video.dps_score,
      newDPS
    });
  }

  // 4. Show new DPS statistics
  const newDPSValues = results.map(r => r.newDPS);
  console.log('📊 New DPS Statistics (PROPER formula):');
  console.log(`   Min: ${Math.min(...newDPSValues).toFixed(2)}`);
  console.log(`   Max: ${Math.max(...newDPSValues).toFixed(2)}`);
  console.log(`   Mean: ${(newDPSValues.reduce((a, b) => a + b, 0) / newDPSValues.length).toFixed(2)}`);
  console.log('');

  // 5. Show comparison for first 10 videos
  console.log('📋 Sample Comparison (first 10):');
  console.log('-'.repeat(50));
  console.log('Video ID | Old DPS | New DPS | Change');
  console.log('-'.repeat(50));

  for (const result of results.slice(0, 10)) {
    const oldStr = result.oldDPS?.toFixed(1) || 'N/A';
    const newStr = result.newDPS.toFixed(1);
    const change = result.oldDPS
      ? (result.newDPS - result.oldDPS).toFixed(1)
      : 'N/A';
    console.log(`${result.id.substring(0, 8)} | ${oldStr.padStart(7)} | ${newStr.padStart(7)} | ${change}`);
  }
  console.log('-'.repeat(50));
  console.log('');

  // 6. Prompt for confirmation before updating
  console.log('⚠️  READY TO UPDATE DATABASE');
  console.log(`   This will update ${results.length} videos with new DPS values.`);
  console.log('');

  // Check for --dry-run flag
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    console.log('🔍 DRY RUN - No changes will be made to the database.');
    console.log('   Remove --dry-run flag to apply changes.');
    return;
  }

  // 7. Update database
  console.log('💾 Updating database...');

  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    const { error: updateError } = await supabase
      .from('scraped_videos')
      .update({ dps_score: result.newDPS })
      .eq('video_id', result.id);

    if (updateError) {
      errorCount++;
      console.error(`   ❌ Error updating ${result.id}: ${updateError.message}`);
    } else {
      successCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ DPS RECALCULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. Update models/feature-names.json (remove dps_score) ✅ DONE');
  console.log('   2. Run: npx tsx scripts/train-xgboost-model.py');
  console.log('   3. Test predictions with corrected model');
  console.log('');
}

main().catch(console.error);
