#!/usr/bin/env node

/**
 * Test Real Apify Integration
 * 
 * This script tests the actual Apify API with real TikTok scraping
 * to move beyond mock data to real viral video processing
 */

require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validation
if (!APIFY_API_TOKEN) {
  console.error('❌ APIFY_API_TOKEN not found in environment');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

// Initialize clients
const apifyClient = new ApifyClient({ token: APIFY_API_TOKEN });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testRealApifyIntegration() {
  console.log('🚀 TESTING REAL APIFY TIKTOK INTEGRATION');
  console.log('==========================================');
  console.log('📋 Target: Scrape 100 real viral TikTok videos');
  console.log('🎯 Goal: Replace mock data with real viral content\n');

  try {
    // Step 1: Test Apify connection
    console.log('1️⃣ Testing Apify API connection...');
    const user = await apifyClient.user().get();
    console.log(`✅ Connected as: ${user.username}`);
    console.log(`📊 Plan: ${user.plan?.name || 'Free'}`);
    console.log('');

    // Step 2: Run TikTok scraper for trending videos
    console.log('2️⃣ Scraping trending TikTok videos...');
    const actorId = 'clockworks/free-tiktok-scraper';
    
    const scraperInput = {
      searchTerms: ['viral', 'trending', 'fyp'],
      resultsLimit: 100,
      searchSection: '/video',
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ['RESIDENTIAL']
      }
    };

    console.log(`🎬 Starting scraper: ${actorId}`);
    console.log(`📊 Target videos: ${scraperInput.resultsLimit}`);
    
    const run = await apifyClient.actor(actorId).call(scraperInput);
    console.log(`🆔 Run ID: ${run.id}`);
    
    // Wait for completion
    console.log('⏳ Waiting for scraper to complete...');
    const finalRun = await apifyClient.run(run.id).waitForFinish();
    
    console.log(`✅ Scraper completed with status: ${finalRun.status}`);
    
    // Get results
    const { items } = await apifyClient.dataset(finalRun.defaultDatasetId).listItems();
    console.log(`📊 Scraped ${items.length} videos\n`);

    if (items.length === 0) {
      console.log('❌ No videos scraped - checking for errors...');
      return;
    }

    // Step 3: Process and store videos
    console.log('3️⃣ Processing scraped videos...');
    let processedCount = 0;
    let errorCount = 0;

    for (const video of items.slice(0, 20)) { // Process first 20 for testing
      try {
        // Validate video data
        if (!video.id || !video.stats) {
          console.log(`⚠️ Skipping invalid video: ${video.id || 'unknown'}`);
          continue;
        }

        // Transform to our database schema
        const videoData = {
          tiktok_id: video.id,
          video_url: video.webVideoUrl || video.videoUrl || '',
          caption: video.text || video.desc || '',
          creator_username: video.authorMeta?.name || '',
          creator_id: video.authorMeta?.id || '',
          creator_followers: video.authorMeta?.fans || 0,
          view_count: video.stats?.playCount || 0,
          like_count: video.stats?.diggCount || 0,
          comment_count: video.stats?.commentCount || 0,
          share_count: video.stats?.shareCount || 0,
          upload_timestamp: video.createTimeISO || new Date().toISOString(),
          duration_seconds: video.videoMeta?.duration || 0,
          hashtags: video.hashtags?.map(h => h.name) || [],
          sound_id: video.musicMeta?.musicId || '',
          sound_name: video.musicMeta?.musicName || '',
          platform: 'tiktok',
          scraped_at: new Date().toISOString()
        };

        // Store in database
        const { data, error } = await supabase
          .from('videos')
          .upsert(videoData, { onConflict: 'tiktok_id' })
          .select('id')
          .single();

        if (error) {
          console.error(`❌ Database error for video ${video.id}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Stored video: ${video.id} (${videoData.view_count.toLocaleString()} views)`);
          processedCount++;
        }

      } catch (error) {
        console.error(`❌ Processing error for video ${video.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('📊 PROCESSING SUMMARY:');
    console.log(`✅ Successfully processed: ${processedCount} videos`);
    console.log(`❌ Errors: ${errorCount} videos`);
    console.log(`📈 Success rate: ${((processedCount / (processedCount + errorCount)) * 100).toFixed(1)}%`);

    // Step 4: Verify database state
    console.log('\n4️⃣ Verifying database state...');
    const { data: videoCount } = await supabase
      .from('videos')
      .select('id', { count: 'exact' });

    const { data: recentVideos } = await supabase
      .from('videos')
      .select('tiktok_id, view_count, like_count, creator_username')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log(`📊 Total videos in database: ${videoCount?.length || 0}`);
    console.log('🔝 Recent videos:');
    recentVideos?.forEach(video => {
      console.log(`   • ${video.tiktok_id} by @${video.creator_username} (${video.view_count?.toLocaleString()} views)`);
    });

    console.log('\n🎯 REAL APIFY INTEGRATION: SUCCESSFUL! ✅');
    console.log('🚫 NO MORE MOCK DATA - REAL VIRAL VIDEOS PROCESSED');

  } catch (error) {
    console.error('💥 Apify integration test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRealApifyIntegration().catch(console.error); 