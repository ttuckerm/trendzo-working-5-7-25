require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Verify env vars loaded
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function extractTestVideos() {
  console.log('📊 Extracting 10 diverse test videos from scraped_videos...\n');

  // Get videos from different classifications
  const classifications = ['mega-viral', 'viral', 'normal'];
  const testVideos = [];

  for (const classification of classifications) {
    console.log(`Finding ${classification} videos...`);

    const { data, error } = await supabase
      .from('scraped_videos')
      .select('video_id, transcript, caption, dps_score, dps_classification, creator_followers_count, creator_username, views_count, likes_count')
      .eq('dps_classification', classification)
      .not('transcript', 'is', null)
      .not('dps_score', 'is', null)
      .order('views_count', { ascending: false })
      .limit(classification === 'mega-viral' ? 4 : (classification === 'viral' ? 3 : 3));

    if (error) {
      console.error(`Error fetching ${classification} videos:`, error);
      continue;
    }

    console.log(`  Found ${data.length} ${classification} videos`);
    testVideos.push(...data);
  }

  if (testVideos.length === 0) {
    console.error('\n❌ No test videos found!');
    console.log('Check that scraped_videos table has:');
    console.log('  - Videos with dps_score');
    console.log('  - Videos with dps_classification');
    console.log('  - Videos with transcript (length > 300)');
    return;
  }

  console.log(`\n✅ Extracted ${testVideos.length} test videos`);

  // Show distribution
  const distribution = testVideos.reduce((acc, v) => {
    acc[v.dps_classification] = (acc[v.dps_classification] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📈 DISTRIBUTION:');
  Object.entries(distribution).forEach(([classification, count]) => {
    console.log(`  ${classification}: ${count} videos`);
  });

  // Show DPS range
  const dpsScores = testVideos.map(v => v.dps_score);
  console.log('\n📊 DPS RANGE:');
  console.log(`  Min: ${Math.min(...dpsScores).toFixed(1)}`);
  console.log(`  Max: ${Math.max(...dpsScores).toFixed(1)}`);
  console.log(`  Avg: ${(dpsScores.reduce((a, b) => a + b, 0) / dpsScores.length).toFixed(1)}`);

  // Save to file
  fs.writeFileSync(
    'test_videos.json',
    JSON.stringify(testVideos, null, 2)
  );

  console.log('\n💾 Saved to: test_videos.json');
  console.log('\n✅ Ready for validation! Run: node scripts/validate-predictions.js');
}

extractTestVideos();
