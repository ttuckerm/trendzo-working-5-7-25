#!/usr/bin/env tsx
/**
 * Process Scraped Videos to DPS
 * 
 * This script processes videos from the scraped_videos table and calculates
 * their DPS (Dynamic Percentile System) viral scores by calling the DPS API.
 * 
 * Features:
 * - Batch processing (default 100 videos at a time)
 * - Progress tracking with statistics
 * - Error handling with graceful continuation
 * - Updates scraped_videos table with DPS results
 * 
 * Usage:
 *   npm run process:scraped-videos
 *   npm run process:scraped-videos -- --batch-size 50
 *   npm run process:scraped-videos -- --limit 500
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// =====================================================
// Configuration
// =====================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const DPS_API_URL = process.env.DPS_API_URL || 'http://localhost:3002/api/dps/calculate';
const DEFAULT_BATCH_SIZE = 100;

// =====================================================
// Types
// =====================================================

interface ScrapedVideo {
  video_id: string;
  creator_username: string | null;
  creator_followers_count: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  upload_timestamp: string | null;
  created_at: string | null;
  platform: string;
}

interface DPSCalculationRequest {
  video: {
    videoId: string;
    platform: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    followerCount: number;
    hoursSinceUpload: number;
    publishedAt: string;
  };
}

interface DPSCalculationResponse {
  success: boolean;
  mode?: string;
  result?: {
    viralScore: number;
    percentileRank: number;
    classification: string;
    zScore: number;
    decayFactor: number;
    confidence: number;
  };
  error?: string;
  details?: any;
}

interface ProcessingStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  totalDpsSum: number;
  startTime: number;
}

// =====================================================
// Main Processing Logic
// =====================================================

async function processScrapedVideosToDPS() {
  console.log('🚀 Starting DPS calculation for scraped videos...\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : DEFAULT_BATCH_SIZE;
  const maxLimit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

  // Initialize Supabase client
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get total count of videos needing processing
  const { count: totalCount, error: countError } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .eq('needs_processing', true);

  if (countError) {
    console.error('❌ Error counting videos:', countError.message);
    process.exit(1);
  }

  const totalToProcess = maxLimit ? Math.min(totalCount || 0, maxLimit) : (totalCount || 0);
  
  if (totalToProcess === 0) {
    console.log('✅ No videos need processing. All done!');
    return;
  }

  console.log(`📊 Found ${totalToProcess} videos to process`);
  console.log(`📦 Batch size: ${batchSize}`);
  console.log(`🔗 DPS API: ${DPS_API_URL}\n`);

  const stats: ProcessingStats = {
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0,
    totalDpsSum: 0,
    startTime: Date.now(),
  };

  // Process videos in batches
  let offset = 0;
  let hasMore = true;

  while (hasMore && stats.totalProcessed < totalToProcess) {
    const remainingToProcess = totalToProcess - stats.totalProcessed;
    const currentBatchSize = Math.min(batchSize, remainingToProcess);

    // Fetch batch of videos needing processing
    const { data: videos, error: fetchError } = await supabase
      .from('scraped_videos')
      .select(`
        video_id,
        creator_username,
        creator_followers_count,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        upload_timestamp,
        created_at,
        platform
      `)
      .eq('needs_processing', true)
      .order('processing_priority', { ascending: false })
      .order('scraped_at', { ascending: true })
      .range(offset, offset + currentBatchSize - 1);

    if (fetchError) {
      console.error(`❌ Error fetching batch: ${fetchError.message}`);
      break;
    }

    if (!videos || videos.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`\n📦 Processing batch ${Math.floor(offset / batchSize) + 1} (${videos.length} videos)...`);

    // Process each video in the batch
    for (const video of videos as ScrapedVideo[]) {
      await processVideo(video, stats, supabase);
    }

    offset += currentBatchSize;
    
    // Print progress
    printProgress(stats, totalToProcess);
  }

  // Print final summary
  printSummary(stats, totalToProcess);
}

// =====================================================
// Video Processing Functions
// =====================================================

async function processVideo(
  video: ScrapedVideo,
  stats: ProcessingStats,
  supabase: any
): Promise<void> {
  try {
    // Determine the timestamp to use (prefer upload_timestamp, fallback to created_at)
    const timestampToUse = video.upload_timestamp || video.created_at;
    
    if (!timestampToUse) {
      throw new Error('No valid timestamp found (upload_timestamp and created_at both null)');
    }

    // Calculate hours since upload
    const uploadDate = new Date(timestampToUse);
    const hoursSinceUpload = (Date.now() - uploadDate.getTime()) / 3600000;

    // Prepare DPS calculation request
    const request: DPSCalculationRequest = {
      video: {
        videoId: video.video_id,
        platform: video.platform || 'tiktok',
        viewCount: video.views_count || 0,
        likeCount: video.likes_count || 0,
        commentCount: video.comments_count || 0,
        shareCount: video.shares_count || 0,
        followerCount: video.creator_followers_count || 0,
        hoursSinceUpload,
        publishedAt: uploadDate.toISOString(),
      },
    };

    // Call DPS API
    const response = await fetch(DPS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API returned ${response.status}: ${response.statusText}. Body: ${errorBody}`);
    }

    const result = (await response.json()) as DPSCalculationResponse;

    if (!result.success || !result.result) {
      const errorMsg = result.error 
        ? result.error 
        : (result.details ? JSON.stringify(result.details) : 'API returned unsuccessful response');
      throw new Error(`API error: ${errorMsg}`);
    }

    // Update scraped_videos table with DPS results
    const { error: updateError } = await supabase
      .from('scraped_videos')
      .update({
        dps_score: result.result.viralScore,
        dps_percentile: result.result.percentileRank,
        dps_classification: result.result.classification,
        dps_calculated_at: new Date().toISOString(),
        needs_processing: false,
      })
      .eq('video_id', video.video_id);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    // Update stats
    stats.successCount++;
    stats.totalDpsSum += result.result.viralScore;

  } catch (error) {
    console.error(`  ⚠️  Failed to process video ${video.video_id}: ${error instanceof Error ? error.message : String(error)}`);
    stats.failureCount++;
  }

  stats.totalProcessed++;
}

// =====================================================
// Progress & Reporting Functions
// =====================================================

function printProgress(stats: ProcessingStats, total: number): void {
  const percentage = ((stats.totalProcessed / total) * 100).toFixed(1);
  const avgDps = stats.successCount > 0 
    ? (stats.totalDpsSum / stats.successCount).toFixed(1) 
    : '0.0';
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rate = (stats.totalProcessed / parseFloat(elapsed)).toFixed(1);

  console.log(`\n📊 Progress: ${stats.totalProcessed}/${total} videos (${percentage}%)`);
  console.log(`   ✅ Success: ${stats.successCount} | ❌ Failed: ${stats.failureCount}`);
  console.log(`   📈 Avg DPS: ${avgDps} | ⏱️  ${elapsed}s (${rate} videos/sec)`);
}

function printSummary(stats: ProcessingStats, total: number): void {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const avgDps = stats.successCount > 0 
    ? (stats.totalDpsSum / stats.successCount).toFixed(1) 
    : '0.0';
  const successRate = ((stats.successCount / stats.totalProcessed) * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('✨ Processing Complete!');
  console.log('='.repeat(60));
  console.log(`📊 Total Processed: ${stats.totalProcessed}/${total}`);
  console.log(`✅ Successful: ${stats.successCount} (${successRate}%)`);
  console.log(`❌ Failed: ${stats.failureCount}`);
  console.log(`📈 Average DPS Score: ${avgDps}`);
  console.log(`⏱️  Total Time: ${elapsed}s`);
  console.log(`🚀 Processing Rate: ${(stats.totalProcessed / parseFloat(elapsed)).toFixed(2)} videos/sec`);
  console.log('='.repeat(60) + '\n');
}

// =====================================================
// Entry Point
// =====================================================

if (require.main === module) {
  processScrapedVideosToDPS()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { processScrapedVideosToDPS };

