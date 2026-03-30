#!/usr/bin/env node

/**
 * Quick check: Do we have ANY videos with dps_score >= 70?
 */

const { createClient } = require('@supabase/supabase-js');

// Try multiple env file locations
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.development' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('\n🔍 Checking for videos with dps_score >= 70...\n');

  // Get all videos with their dps_score
  const { data, error } = await supabase
    .from('scraped_videos')
    .select('video_id, dps_score, dps_percentile, title, transcript, scraped_at')
    .order('dps_score', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Found ${data.length} videos total\n`);

  // Filter and show videos with dps_score >= 70
  const highScoreVideos = data.filter(v => v.dps_score !== null && v.dps_score >= 70);
  
  console.log(`✅ Videos with dps_score >= 70: ${highScoreVideos.length}\n`);

  if (highScoreVideos.length > 0) {
    console.log('Sample videos:\n');
    highScoreVideos.forEach((v, i) => {
      console.log(`[${i + 1}] Video: ${v.video_id}`);
      console.log(`    DPS Score: ${v.dps_score}`);
      console.log(`    Percentile: ${v.dps_percentile}`);
      console.log(`    Has transcript: ${!!v.transcript} (${v.transcript?.length || 0} chars)`);
      console.log(`    Title: ${v.title?.substring(0, 60)}...`);
      console.log(`    Scraped: ${v.scraped_at}`);
      console.log('');
    });

    // Check how many have transcripts
    const withTranscripts = highScoreVideos.filter(v => v.transcript && v.transcript.length > 0);
    console.log(`✅ Of these, ${withTranscripts.length} have transcripts\n`);
    
    if (withTranscripts.length > 0) {
      console.log('✅ GOOD NEWS: These videos should be extractable!');
      console.log('🔧 PROBLEM: The query is filtering by niche, but scraped_videos has NO niche column.\n');
    }
  } else {
    console.log('❌ NO videos found with dps_score >= 70\n');
    
    // Show distribution
    const scores = data.filter(v => v.dps_score !== null).map(v => v.dps_score);
    if (scores.length > 0) {
      const max = Math.max(...scores);
      const min = Math.min(...scores);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      console.log(`DPS Score distribution:`);
      console.log(`  Min: ${min.toFixed(2)}`);
      console.log(`  Max: ${max.toFixed(2)}`);
      console.log(`  Avg: ${avg.toFixed(2)}`);
      console.log(`  Count: ${scores.length}`);
    }
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});











