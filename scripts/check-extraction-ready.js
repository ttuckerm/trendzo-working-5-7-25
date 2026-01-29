#!/usr/bin/env node

/**
 * Check if everything is ready for enhanced pattern extraction
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('\n' + '='.repeat(80));
console.log('🔍 CHECKING EXTRACTION READINESS');
console.log('='.repeat(80) + '\n');

async function checkReadiness() {
  // Step 1: Check environment variables
  console.log('📋 Step 1: Environment Variables\n');
  
  const checks = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_KEY': process.env.SUPABASE_SERVICE_KEY,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  };
  
  let envOk = true;
  for (const [key, value] of Object.entries(checks)) {
    if (value) {
      console.log(`  ✅ ${key}: SET`);
    } else {
      console.log(`  ❌ ${key}: MISSING`);
      envOk = false;
    }
  }
  
  if (!envOk) {
    console.log('\n❌ Missing required environment variables');
    console.log('   Check your .env.local file\n');
    process.exit(1);
  }
  
  // Step 2: Check database connection
  console.log('\n📋 Step 2: Database Connection\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  
  try {
    const { data, error } = await supabase
      .from('video_patterns_detailed')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('  ❌ Table video_patterns_detailed does NOT exist');
        console.log('\n📝 Action Required:');
        console.log('   Go to Supabase Studio → SQL Editor');
        console.log('   Copy and run: supabase/migrations/20251006_enhanced_video_patterns.sql\n');
        process.exit(1);
      }
      throw error;
    }
    
    console.log('  ✅ Database connection: OK');
    console.log('  ✅ Table video_patterns_detailed: EXISTS');
    
  } catch (err) {
    console.log(`  ❌ Database error: ${err.message}`);
    process.exit(1);
  }
  
  // Step 3: Check for videos with transcripts
  console.log('\n📋 Step 3: Available Videos\n');
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365);
    
    // Get videos with transcripts and DPS scores
    const { data: videos, error } = await supabase
      .from('scraped_videos')
      .select('video_id, title, transcript, views_count, platform, dps_score, dps_percentile, scraped_at')
      .gte('scraped_at', cutoffDate.toISOString())
      .not('transcript', 'is', null)
      .not('dps_score', 'is', null)
      .order('dps_score', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    if (!videos || videos.length === 0) {
      console.log('  ⚠️  No videos with transcripts and DPS scores found');
      console.log('\n💡 Try querying all videos:');
      console.log('   SELECT COUNT(*) FROM scraped_videos WHERE transcript IS NOT NULL;\n');
      process.exit(1);
    }
    
    // Filter by DPS >= 70
    const highDpsVideos = videos.filter(v => v.dps_score >= 70);
    
    console.log(`  ✅ Total videos with transcripts and DPS: ${videos.length}`);
    console.log(`  ✅ Videos with DPS >= 70: ${highDpsVideos.length}`);
    
    if (highDpsVideos.length === 0) {
      console.log('\n  ⚠️  No videos with DPS >= 70');
      console.log('  💡 Try lowering minDPSScore to 50 in the extraction request\n');
    } else {
      console.log('\n  📊 Top Videos Ready for Extraction:\n');
      highDpsVideos.slice(0, 5).forEach((v, i) => {
        console.log(`     ${i + 1}. Video: ${v.video_id}`);
        console.log(`        DPS: ${v.dps_score.toFixed(2)} (${v.dps_percentile.toFixed(1)}th percentile)`);
        console.log(`        Title: ${(v.title || 'No title').substring(0, 60)}...`);
        console.log(`        Transcript: ${v.transcript.length} chars`);
        console.log(`        Platform: ${v.platform}`);
        console.log('');
      });
    }
    
  } catch (err) {
    console.log(`  ❌ Error querying videos: ${err.message}`);
    process.exit(1);
  }
  
  // Step 4: Final summary
  console.log('='.repeat(80));
  console.log('✅ SYSTEM READY FOR EXTRACTION');
  console.log('='.repeat(80));
  console.log('\n📝 Next Steps:\n');
  console.log('  1. Make sure dev server is running: npm run dev');
  console.log('  2. Run extraction: node scripts/run-enhanced-pattern-extraction.js');
  console.log('\n  Or manually extract patterns for the videos listed above\n');
}

checkReadiness().catch(err => {
  console.error('\n❌ Check failed:', err.message);
  process.exit(1);
});

