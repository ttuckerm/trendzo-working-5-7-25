#!/usr/bin/env node

/**
 * Batch DPS Calculation Script
 * Calculates DPS scores for all scraped videos with transcripts
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:3000/api/dps/calculate';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchVideosForDPS() {
  console.log('\n📊 Fetching videos from database...\n');

  const { data, error } = await supabase
    .from('scraped_videos')
    .select('video_id, title, platform, views_count, likes_count, shares_count, comments_count, creator_followers_count, upload_timestamp')
    .not('transcript', 'is', null)
    .order('views_count', { ascending: false });

  if (error) {
    throw new Error(`Database query failed: ${error.message}`);
  }

  console.log(`✅ Found ${data.length} videos with transcripts\n`);

  // Show sample
  if (data.length > 0) {
    console.log('Sample videos:');
    data.slice(0, 3).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.title?.substring(0, 50) || 'No title'}...`);
      console.log(`     Platform: ${v.platform}, Views: ${v.views_count?.toLocaleString() || 'N/A'}`);
    });
    console.log('');
  }

  return data;
}

async function batchCalculateDPS(videos) {
  console.log(`🔄 Calculating DPS for ${videos.length} videos...\n`);

  const videoInputs = videos.map(v => {
    const uploadDate = new Date(v.upload_timestamp || Date.now());
    const hoursSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60);

    return {
      videoId: v.video_id,
      platform: v.platform || 'tiktok',
      viewCount: parseInt(v.views_count) || 0,
      likeCount: parseInt(v.likes_count) || 0,
      commentCount: parseInt(v.comments_count) || 0,
      shareCount: parseInt(v.shares_count) || 0,
      followerCount: parseInt(v.creator_followers_count) || 10000,
      hoursSinceUpload: Math.max(1, hoursSinceUpload),
      publishedAt: uploadDate.toISOString(),
      caption: v.title || '',
    };
  });

  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videos: videoInputs }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    console.log(`✅ DPS Calculation Completed in ${(duration / 1000).toFixed(2)}s\n`);
    console.log('📊 Results:');
    console.log(`  - Total Videos: ${result.totalVideos}`);
    console.log(`  - Successful: ${result.successCount}`);
    console.log(`  - Failed: ${result.failureCount}`);
    console.log(`  - Processing Time: ${result.processingTimeMs}ms`);

    // Log full result for debugging
    console.log('\n📝 Full Response:', JSON.stringify(result, null, 2).substring(0, 500));

    if (result.results && result.results.length > 0) {
      console.log('\n🏆 Top Viral Scores:');
      const topScores = result.results
        .sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0))
        .slice(0, 10);

      topScores.forEach((r, i) => {
        const video = videos.find(v => v.video_id === r.videoId);
        const title = video?.title || 'No title';

        console.log(`  ${i + 1}. Viral Score: ${r.viralScore?.toFixed(2)} (${r.classification || 'N/A'})`);
        console.log(`     Video: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);
        console.log(`     Views: ${video?.views_count?.toLocaleString() || 'N/A'} | Percentile: ${r.percentileRank}%`);
        console.log('');
      });
    }

    if (result.failures && result.failures.length > 0) {
      console.log('\n⚠️  Failures:');
      result.failures.forEach(f => {
        console.log(`  - ${f.video_id}: ${f.error}`);
      });
    }

    console.log('\n✨ DPS scores are now available for pattern extraction!\n');

    return result;

  } catch (error) {
    console.error('\n❌ Batch DPS calculation failed:', error.message);
    throw error;
  }
}

async function verifyDPSInDatabase() {
  console.log('🔍 Verifying calculations in database...\n');

  // Check dps_calculations table
  const { data, error } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, virality_classification, percentile_rank, created_at')
    .order('viral_score', { ascending: false })
    .limit(5);

  if (error) {
    console.warn('⚠️  Could not verify:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log(`✅ Latest ${data.length} calculations verified in database\n`);
  } else {
    console.log('ℹ️  No calculations found in database');
  }
}

async function main() {
  console.log('🚀 BATCH DPS CALCULATION SCRIPT\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Fetch videos
    const videos = await fetchVideosForDPS();

    if (videos.length === 0) {
      console.log('ℹ️  No videos with transcripts found. Nothing to calculate.');
      return;
    }

    // Step 2: Calculate DPS
    const result = await batchCalculateDPS(videos);

    // Step 3: Verify
    await verifyDPSInDatabase();

    console.log('=' .repeat(60));
    console.log('✅ BATCH DPS CALCULATION COMPLETE\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('  1. Make sure dev server is running (npm run dev)');
    console.error('  2. Check API endpoint: POST /api/dps/calculate/batch');
    console.error('  3. Verify Supabase connection');
    process.exit(1);
  }
}

main();
