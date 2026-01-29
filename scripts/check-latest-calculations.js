const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkLatestCalculations() {
  console.log('🔍 Checking latest DPS calculations...\n');

  // Get the most recent calculations
  const { data, error } = await supabase
    .from('dps_calculations')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Query failed:', error.message);
    return;
  }

  console.log('Latest 10 calculations:');
  data.forEach((calc, i) => {
    console.log(`\n${i + 1}. Video ID: ${calc.video_id}`);
    console.log(`   Viral Score: ${calc.viral_score?.toFixed(2)}`);
    console.log(`   Classification: ${calc.classification}`);
    console.log(`   Calculated At: ${calc.calculated_at}`);
  });

  // Check for duplicate video_ids
  const { data: allCalcs, error: allError } = await supabase
    .from('dps_calculations')
    .select('video_id, calculated_at');

  if (!allError) {
    const videoCount = {};
    allCalcs.forEach(calc => {
      videoCount[calc.video_id] = (videoCount[calc.video_id] || 0) + 1;
    });

    const duplicates = Object.entries(videoCount).filter(([_, count]) => count > 1);
    console.log(`\n\n📊 Total calculations: ${allCalcs.length}`);
    console.log(`Unique videos: ${Object.keys(videoCount).length}`);
    console.log(`Videos with multiple calculations: ${duplicates.length}`);

    if (duplicates.length > 0) {
      console.log('\nExample duplicates:');
      duplicates.slice(0, 3).forEach(([videoId, count]) => {
        console.log(`  ${videoId}: ${count} calculations`);
      });
    }
  }

  // Check if there are calculations from today
  const today = new Date().toISOString().split('T')[0];
  const { data: todayCalcs, error: todayError } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, classification, calculated_at')
    .gte('calculated_at', `${today}T00:00:00`)
    .order('calculated_at', { ascending: false });

  if (!todayError) {
    console.log(`\n\n📅 Calculations from today (${today}): ${todayCalcs.length}`);
    if (todayCalcs.length > 0) {
      console.log('\nSample:');
      todayCalcs.slice(0, 5).forEach(calc => {
        console.log(`  ${calc.video_id}: ${calc.viral_score?.toFixed(2)} (${calc.classification})`);
      });
    }
  }
}

checkLatestCalculations().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
