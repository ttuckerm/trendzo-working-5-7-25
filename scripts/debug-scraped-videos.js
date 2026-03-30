#!/usr/bin/env node

/**
 * Debug script to check scraped_videos table
 * Shows actual niche values and viral_score distribution
 */

const { createClient } = require('@supabase/supabase-js');

// Try multiple env file locations
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env.development' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔑 Environment check:');
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set (' + supabaseUrl.substring(0, 30) + '...)' : '❌ Missing'}`);
console.log(`   SUPABASE_KEY: ${supabaseKey ? '✅ Set (length: ' + supabaseKey.length + ')' : '❌ Missing'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Or set them as environment variables before running this script');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SCRAPED_VIDEOS TABLE DIAGNOSTIC');
  console.log('='.repeat(80) + '\n');

  // 1. Count total videos
  const { count: totalCount } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Total videos in scraped_videos: ${totalCount}\n`);

  // 2. Get ALL videos first to see what we have
  console.log('📹 Fetching all videos from table...');
  const { data: allVideos, error: allError } = await supabase
    .from('scraped_videos')
    .select('video_id, niche, viral_score, title, transcript, scraped_at')
    .limit(100);
  
  if (allError) {
    console.error('   ❌ Error:', allError);
  } else {
    console.log(`   Retrieved ${allVideos?.length || 0} videos\n`);

    if (allVideos && allVideos.length > 0) {
      // Show first 10
      console.log('📋 Sample videos (first 10):');
      allVideos.slice(0, 10).forEach((v, i) => {
        console.log(`   [${i + 1}] Video: ${v.video_id}`);
        console.log(`       Niche: "${v.niche}" (type: ${typeof v.niche})`);
        console.log(`       Score: ${v.viral_score} (type: ${typeof v.viral_score})`);
        console.log(`       Has transcript: ${!!v.transcript} (length: ${v.transcript?.length || 0})`);
        console.log(`       Scraped: ${v.scraped_at}`);
        console.log(`       Title: ${v.title?.substring(0, 60)}...`);
        console.log('');
      });

      // Unique niches
      const uniqueNiches = [...new Set(allVideos.map(v => v.niche).filter(n => n))];
      console.log('🏷️  Unique niches in table:');
      uniqueNiches.forEach(niche => {
        const count = allVideos.filter(v => v.niche === niche).length;
        console.log(`   - "${niche}" (${count} videos)`);
      });
      console.log('');

      // Videos with high scores
      const highScoreVideos = allVideos.filter(v => v.viral_score && v.viral_score >= 70);
      console.log(`🎯 Videos with viral_score >= 70: ${highScoreVideos.length}`);
      if (highScoreVideos.length > 0) {
        highScoreVideos.slice(0, 5).forEach((v, i) => {
          console.log(`   [${i + 1}] ${v.video_id} - Niche: "${v.niche}" - Score: ${v.viral_score}`);
        });
      }
      console.log('');

      // Videos with transcripts
      const withTranscripts = allVideos.filter(v => v.transcript && v.transcript.length > 0);
      console.log(`📝 Videos with transcripts: ${withTranscripts.length}`);
      if (withTranscripts.length > 0) {
        withTranscripts.slice(0, 3).forEach((v, i) => {
          console.log(`   [${i + 1}] ${v.video_id} - Has ${v.transcript.length} chars`);
        });
      }
      console.log('');
    }
  }

  // 4. Check what columns exist
  console.log('🔍 Checking table schema...');
  const { data: schemaCheck, error: schemaError } = await supabase
    .from('scraped_videos')
    .select('*')
    .limit(1);
  
  if (schemaError) {
    console.error('   ❌ Error:', schemaError);
  } else if (schemaCheck && schemaCheck.length > 0) {
    console.log('   Available columns:', Object.keys(schemaCheck[0]).join(', '));
  }
  console.log('');

  console.log('='.repeat(80) + '\n');
  
  // Summary
  if (allVideos && allVideos.length > 0) {
    const highScoreVideos = allVideos.filter(v => v.viral_score && v.viral_score >= 70);
    const withTranscriptsAndHighScore = allVideos.filter(v => 
      v.transcript && 
      v.transcript.length > 0 && 
      v.viral_score && 
      v.viral_score >= 70
    );
    
    console.log('📊 SUMMARY:');
    console.log(`   Total videos: ${allVideos.length}`);
    console.log(`   Videos with score >= 70: ${highScoreVideos.length}`);
    console.log(`   Videos with transcript: ${allVideos.filter(v => v.transcript).length}`);
    console.log(`   Videos with BOTH (score >= 70 AND transcript): ${withTranscriptsAndHighScore.length}`);
    console.log('');
    
    if (withTranscriptsAndHighScore.length > 0) {
      console.log('✅ These videos should be picked up by the extraction script:');
      withTranscriptsAndHighScore.forEach((v, i) => {
        console.log(`   [${i + 1}] ${v.video_id}`);
        console.log(`       Niche: "${v.niche}"`);
        console.log(`       Score: ${v.viral_score}`);
        console.log(`       Transcript: ${v.transcript.length} chars`);
        console.log('');
      });
    } else {
      console.log('❌ NO videos found with both viral_score >= 70 AND transcript!');
      console.log('');
      console.log('Possible issues:');
      console.log('   1. Viral scores might not be calculated yet');
      console.log('   2. Transcripts might be in a different column or format');
      console.log('   3. The data needs to be reprocessed');
    }
  }

  console.log('='.repeat(80) + '\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

