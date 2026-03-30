#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function processScrapedVideos() {
  console.log('🔧 Processing scraped videos through viral prediction pipeline...\n');

  try {
    // Get all scraped data that hasn't been processed
    const { data: scrapedVideos, error: scrapedError } = await supabase
      .from('scraped_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (scrapedError) {
      console.error('❌ Error fetching scraped data:', scrapedError);
      return;
    }

    if (!scrapedVideos || scrapedVideos.length === 0) {
      console.log('⚠️ No scraped videos found to process');
      return;
    }

    console.log(`📊 Found ${scrapedVideos.length} scraped videos to process\n`);

    for (const scrapedVideo of scrapedVideos) {
      console.log(`🎥 Processing video ${scrapedVideo.tiktok_id}...`);
      
      try {
        // Parse the content JSON
        const content = typeof scrapedVideo.content === 'string' 
          ? JSON.parse(scrapedVideo.content) 
          : scrapedVideo.content;

        // Check if already processed
        const { data: existingVideo } = await supabase
          .from('videos')
          .select('*')
          .eq('tiktok_id', scrapedVideo.tiktok_id)
          .single();

        if (existingVideo) {
          console.log(`   ⚠️ Already processed - skipping`);
          continue;
        }

        // Calculate viral metrics from engagement data
        const viralScore = calculateViralScore(content);
        const viralProbability = viralScore / 100;

        // Create video record in the videos table
        const videoRecord = {
          tiktok_id: scrapedVideo.tiktok_id,
          creator_id: content.author?.id || 'unknown',
          creator_username: content.author?.username || 'unknown',
          creator_followers: content.author?.follower_count || 0,
          
          // Engagement metrics
          view_count: content.stats?.play_count || content.stats?.view_count || 0,
          like_count: content.stats?.digg_count || content.stats?.like_count || 0,
          comment_count: content.stats?.comment_count || 0,
          share_count: content.stats?.share_count || 0,
          save_count: content.stats?.collect_count || 0,
          
          // Video metadata
          upload_timestamp: content.create_time ? new Date(content.create_time * 1000).toISOString() : new Date().toISOString(),
          duration_seconds: content.duration || 0,
          caption: content.desc || content.description || '',
          hashtags: content.hashtags || [],
          sound_id: content.music?.id?.toString() || null,
          sound_name: content.music?.title || null,
          
          // Viral prediction data
          viral_score: viralScore,
          viral_probability: viralProbability,
          cohort_percentile: calculatePercentile(viralScore),
          prediction_confidence: 0.85, // Base confidence
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: insertedVideo, error: insertError } = await supabase
          .from('videos')
          .insert(videoRecord)
          .select()
          .single();

        if (insertError) {
          console.log(`   ❌ Error inserting video: ${insertError.message}`);
          continue;
        }

        console.log(`   ✅ Processed: ${viralScore.toFixed(1)}% viral score, ${(viralProbability * 100).toFixed(1)}% probability`);

        // Mark as processed in scraped_data
        await supabase
          .from('scraped_data')
          .update({ processed: true })
          .eq('id', scrapedVideo.id);

      } catch (error) {
        console.log(`   ❌ Error processing video: ${error.message}`);
      }
    }

    // Summary
    const { count: totalProcessed } = await supabase
      .from('videos')
      .select('*', { count: 'exact' });

    console.log(`\n✨ Processing complete!`);
    console.log(`📊 Total videos in prediction database: ${totalProcessed || 0}`);
    console.log(`🎯 Videos ready for analysis and UI display`);

  } catch (error) {
    console.error('❌ Processing error:', error.message);
  }
}

function calculateViralScore(content) {
  if (!content.stats) return 50; // Default score
  
  const views = content.stats.play_count || content.stats.view_count || 0;
  const likes = content.stats.digg_count || content.stats.like_count || 0;
  const comments = content.stats.comment_count || 0;
  const shares = content.stats.share_count || 0;
  
  // Calculate engagement rate
  const engagementRate = views > 0 ? ((likes + comments + shares) / views) * 100 : 0;
  
  // Calculate viral score based on multiple factors
  let score = 50; // Base score
  
  // High view count bonus
  if (views > 1000000) score += 20;
  else if (views > 100000) score += 15;
  else if (views > 10000) score += 10;
  
  // High engagement rate bonus
  if (engagementRate > 10) score += 15;
  else if (engagementRate > 5) score += 10;
  else if (engagementRate > 2) score += 5;
  
  // Comment-to-like ratio (high comments = viral potential)
  const commentRate = likes > 0 ? (comments / likes) * 100 : 0;
  if (commentRate > 10) score += 10;
  else if (commentRate > 5) score += 5;
  
  // Share bonus (shares are strong viral indicators)
  if (shares > likes * 0.1) score += 10;
  else if (shares > likes * 0.05) score += 5;
  
  return Math.min(Math.max(score, 0), 100);
}

function calculatePercentile(viralScore) {
  // Convert viral score to percentile ranking
  if (viralScore >= 90) return 95;
  if (viralScore >= 80) return 85;
  if (viralScore >= 70) return 75;
  if (viralScore >= 60) return 65;
  if (viralScore >= 50) return 50;
  if (viralScore >= 40) return 35;
  if (viralScore >= 30) return 25;
  return 15;
}

processScrapedVideos();