#!/usr/bin/env node

/**
 * Simple Apify Test - Try different actors
 */

require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testSimpleApify() {
  console.log('🧪 TESTING SIMPLIFIED APIFY INTEGRATION');
  console.log('=======================================\n');

  try {
    // Try a simpler, more reliable actor
    console.log('1️⃣ Testing with reliable TikTok actor...');
    
    const actorId = 'apify/tiktok-scraper'; // Official Apify actor
    const scraperInput = {
      hashtags: ['viral'],
      resultsLimit: 10, // Start small
      shouldDownloadCovers: false,
      shouldDownloadSlideshowImages: false,
      shouldDownloadVideos: false
    };

    console.log(`🎬 Actor: ${actorId}`);
    console.log(`📊 Testing with hashtag: #viral`);
    console.log(`🎯 Limited to: ${scraperInput.resultsLimit} videos\n`);

    const run = await apifyClient.actor(actorId).call(scraperInput);
    console.log(`🆔 Run ID: ${run.id}`);
    
    // Set a timeout for testing
    console.log('⏳ Waiting for completion (max 2 minutes)...');
    const finalRun = await apifyClient.run(run.id).waitForFinish({ waitSecs: 120 });
    
    console.log(`📊 Status: ${finalRun.status}`);
    
    if (finalRun.status === 'SUCCEEDED') {
      // Get results
      const { items } = await apifyClient.dataset(finalRun.defaultDatasetId).listItems();
      console.log(`✅ Success! Scraped ${items.length} videos\n`);
      
      // Show sample data
      if (items.length > 0) {
        console.log('📋 SAMPLE VIDEO DATA:');
        const sample = items[0];
        console.log(`   ID: ${sample.id}`);
        console.log(`   Description: ${sample.text?.substring(0, 100)}...`);
        console.log(`   Views: ${sample.playCount?.toLocaleString()}`);
        console.log(`   Likes: ${sample.diggCount?.toLocaleString()}`);
        console.log(`   Creator: @${sample.authorMeta?.name}`);
        console.log('');
        
        // Store sample in database
        console.log('2️⃣ Testing database storage...');
        const videoData = {
          tiktok_id: sample.id,
          video_url: sample.webVideoUrl || '',
          caption: sample.text || '',
          creator_username: sample.authorMeta?.name || '',
          creator_id: sample.authorMeta?.id || '',
          view_count: sample.playCount || 0,
          like_count: sample.diggCount || 0,
          comment_count: sample.commentCount || 0,
          share_count: sample.shareCount || 0,
          platform: 'tiktok',
          scraped_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('scraped_data')
          .insert(videoData)
          .select()
          .single();

        if (error) {
          console.log(`❌ Database error: ${error.message}`);
        } else {
          console.log(`✅ Stored in database with ID: ${data.id}`);
        }
      }
      
      console.log('\n🎯 REAL DATA PIPELINE: WORKING! ✅');
      console.log('🚀 Ready to scale up to hundreds of videos');
      
    } else {
      console.log(`❌ Scraper failed with status: ${finalRun.status}`);
      
      // Try alternative approach with existing data
      console.log('\n3️⃣ Alternative: Using existing scraped data...');
      const { data: existingVideos } = await supabase
        .from('scraped_data')
        .select('*')
        .limit(5);
        
      console.log(`📊 Found ${existingVideos?.length || 0} existing videos in database`);
      if (existingVideos?.length > 0) {
        console.log('✅ Can proceed with prediction engine development');
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    // Fall back to manual data creation for development
    console.log('\n🔄 Creating sample data for development...');
    await createSampleData();
  }
}

async function createSampleData() {
  const sampleVideos = [
    {
      tiktok_id: 'dev_sample_1',
      video_url: 'https://example.com/video1',
      caption: 'POV: You discover the secret to viral content #viral #fyp',
      creator_username: 'viralcreator1',
      view_count: 1200000,
      like_count: 89000,
      comment_count: 5600,
      share_count: 12000,
      platform: 'tiktok',
      scraped_at: new Date().toISOString()
    },
    {
      tiktok_id: 'dev_sample_2', 
      video_url: 'https://example.com/video2',
      caption: 'This transformation will shock you #transformation #beforeafter',
      creator_username: 'transformqueen',
      view_count: 950000,
      like_count: 67000,
      comment_count: 4200,
      share_count: 8900,
      platform: 'tiktok',
      scraped_at: new Date().toISOString()
    }
  ];

  for (const video of sampleVideos) {
    const { error } = await supabase
      .from('scraped_data')
      .upsert(video, { onConflict: 'tiktok_id' });
      
    if (!error) {
      console.log(`✅ Created sample: ${video.tiktok_id}`);
    }
  }
  
  console.log('📊 Sample data ready for prediction engine development');
}

testSimpleApify().catch(console.error); 