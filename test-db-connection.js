// Quick test to check if FEAT-003 tables exist
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔍 Testing Supabase connection...\n');

  // Check if FEAT-003 tables exist
  const tables = [
    'viral_patterns',
    'pattern_video_associations',
    'pattern_extraction_jobs',
    'pattern_extraction_errors'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  // Check scraped_videos table structure
  console.log('\n🔍 Checking scraped_videos table...');
  try {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('video_id, dps_score, dps_percentile, description')
      .limit(1);

    if (error) {
      console.log(`❌ scraped_videos: ${error.message}`);
    } else {
      console.log(`✅ scraped_videos: Table exists`);
      if (data && data.length > 0) {
        console.log(`   Sample record found:`, data[0]);
      } else {
        console.log(`   Table is empty (no videos yet)`);
      }
    }
  } catch (err) {
    console.log(`❌ scraped_videos: ${err.message}`);
  }
}

testConnection().catch(console.error);

