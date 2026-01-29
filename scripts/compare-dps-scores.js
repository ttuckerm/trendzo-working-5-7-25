require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function compareDPSScores() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 DPS SCORE COMPARISON: scraped_videos vs dps_calculations');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Query 1: Get videos with transcripts and their dps_score from scraped_videos
  const { data: scrapedVideos, error: svError } = await supabase
    .from('scraped_videos')
    .select('video_id, dps_score, dps_classification, dps_calculated_at, views_count, likes_count')
    .not('transcript', 'is', null)
    .not('dps_score', 'is', null)
    .order('dps_score', { ascending: false })
    .limit(10);

  if (svError) {
    console.error('❌ Error fetching scraped_videos:', svError);
    return;
  }

  console.log(`📊 Found ${scrapedVideos.length} videos with transcripts AND dps_score in scraped_videos\n`);

  // For each video, get ALL calculations from dps_calculations
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📋 DETAILED COMPARISON (Top 5 Videos):\n');

  for (let i = 0; i < Math.min(5, scrapedVideos.length); i++) {
    const video = scrapedVideos[i];

    console.log(`${i + 1}. Video: ${video.video_id}`);
    console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   scraped_videos.dps_score: ${video.dps_score}`);
    console.log(`   scraped_videos.dps_classification: ${video.dps_classification}`);
    console.log(`   scraped_videos.dps_calculated_at: ${video.dps_calculated_at}`);
    console.log(`   Views: ${video.views_count}, Likes: ${video.likes_count}`);

    // Get all calculations for this video
    const { data: calculations, error: calcError } = await supabase
      .from('dps_calculations')
      .select('*')
      .eq('video_id', video.video_id)
      .order('calculated_at', { ascending: false });

    if (calcError) {
      console.log(`   ❌ Error fetching calculations: ${calcError.message}\n`);
      continue;
    }

    if (!calculations || calculations.length === 0) {
      console.log('   ⚠️  No calculations found in dps_calculations table\n');
      continue;
    }

    console.log(`\n   Found ${calculations.length} calculation(s) in dps_calculations:\n`);

    calculations.forEach((calc, idx) => {
      const scoreDiff = video.dps_score ? Math.abs(video.dps_score - calc.viral_score).toFixed(2) : 'N/A';
      const match = video.dps_score && Math.abs(video.dps_score - calc.viral_score) < 0.1 ? '✅' : '❌';

      console.log(`   Calculation #${idx + 1}:`);
      console.log(`     viral_score: ${calc.viral_score} ${match}`);
      console.log(`     classification: ${calc.classification}`);
      console.log(`     calculated_at: ${calc.calculated_at}`);
      console.log(`     views: ${calc.view_count}, likes: ${calc.like_count}`);
      console.log(`     z_score: ${calc.z_score}, decay: ${calc.decay_factor}`);
      console.log(`     Difference from scraped_videos: ${scoreDiff} points`);
      console.log('');
    });

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Query 2: Analyze the 168 calculations vs 28 videos discrepancy
  console.log('📊 ANALYZING CALCULATION VOLUME:\n');

  const { count: totalCalcs } = await supabase
    .from('dps_calculations')
    .select('*', { count: 'exact', head: true });

  const { count: totalVideos } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true });

  const { count: videosWithTranscripts } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript', 'is', null);

  const { count: videosWithDPS } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('dps_score', 'is', null);

  console.log(`   Total scraped_videos: ${totalVideos}`);
  console.log(`   Videos with transcripts: ${videosWithTranscripts}`);
  console.log(`   Videos with dps_score populated: ${videosWithDPS}`);
  console.log(`   Total dps_calculations: ${totalCalcs}`);
  console.log(`   Ratio: ${(totalCalcs / totalVideos).toFixed(2)} calculations per video`);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Query 3: Check for duplicate calculations
  console.log('🔍 CHECKING FOR DUPLICATE CALCULATIONS:\n');

  const { data: videoCalcCounts } = await supabase
    .from('dps_calculations')
    .select('video_id');

  const calcCountByVideo = {};
  videoCalcCounts?.forEach(calc => {
    calcCountByVideo[calc.video_id] = (calcCountByVideo[calc.video_id] || 0) + 1;
  });

  const duplicates = Object.entries(calcCountByVideo)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  if (duplicates.length > 0) {
    console.log(`   Found ${duplicates.length} videos with multiple calculations:\n`);
    duplicates.slice(0, 10).forEach(([videoId, count]) => {
      console.log(`   - ${videoId}: ${count} calculations`);
    });
    if (duplicates.length > 10) {
      console.log(`   ... and ${duplicates.length - 10} more`);
    }
  } else {
    console.log('   ✅ No duplicate calculations found (1:1 mapping)');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Query 4: Check for test data
  console.log('🧪 CHECKING FOR TEST DATA:\n');

  const { data: testCalcs } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, calculated_at')
    .like('video_id', 'test%')
    .order('calculated_at', { ascending: false });

  if (testCalcs && testCalcs.length > 0) {
    console.log(`   Found ${testCalcs.length} test calculations:\n`);
    testCalcs.slice(0, 5).forEach(calc => {
      console.log(`   - ${calc.video_id}: score ${calc.viral_score} (${calc.calculated_at})`);
    });
  } else {
    console.log('   No test data found');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Answer the questions
  console.log('📝 ANSWERS TO YOUR QUESTIONS:\n');

  console.log('1️⃣  Are scraped_videos.dps_score and dps_calculations.viral_score the same?\n');

  if (scrapedVideos.length > 0 && scrapedVideos[0].dps_score) {
    const firstVideo = scrapedVideos[0];
    const { data: firstCalc } = await supabase
      .from('dps_calculations')
      .select('viral_score')
      .eq('video_id', firstVideo.video_id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (firstCalc) {
      const diff = Math.abs(firstVideo.dps_score - firstCalc.viral_score);
      console.log(`   Sample comparison:`);
      console.log(`   - scraped_videos.dps_score: ${firstVideo.dps_score}`);
      console.log(`   - dps_calculations.viral_score (latest): ${firstCalc.viral_score}`);
      console.log(`   - Difference: ${diff.toFixed(4)}`);
      console.log(`   - Match: ${diff < 0.1 ? '✅ YES - Same value' : '❌ NO - Different values'}\n`);
    }
  }

  console.log('2️⃣  Why 168 dps_calculations for only 28 videos with transcripts?\n');
  console.log(`   - Total videos in database: ${totalVideos}`);
  console.log(`   - Videos with transcripts: ${videosWithTranscripts}`);
  console.log(`   - DPS calculations exist for videos WITHOUT transcripts too`);
  console.log(`   - Possible reasons:`);
  console.log(`     a) Test/synthetic data (${testCalcs?.length || 0} test calculations found)`);
  console.log(`     b) Calculations done before transcript extraction`);
  console.log(`     c) Multiple calculations per video (${duplicates.length} videos with >1 calc)`);

  console.log('\n3️⃣  Are you recalculating DPS multiple times per video?\n');
  if (duplicates.length > 0) {
    console.log(`   ✅ YES - ${duplicates.length} videos have multiple calculations`);
    console.log(`   - This is likely intentional for tracking score changes over time`);
    console.log(`   - Or due to recalculations during testing/development`);
  } else {
    console.log('   ❌ NO - Each video has only one calculation');
  }

  console.log('\n4️⃣  Which score should we trust for predictions?\n');
  console.log('   📊 RECOMMENDATION: Use dps_calculations.viral_score (latest)\n');
  console.log('   REASONING:');
  console.log('   - dps_calculations is the authoritative calculation table');
  console.log('   - Contains full audit trail (z_score, decay, engagement)');
  console.log('   - scraped_videos.dps_score may be a denormalized cache');
  console.log('   - Always join and use the LATEST calculation per video:');
  console.log('');
  console.log('   SELECT DISTINCT ON (video_id)');
  console.log('     video_id, viral_score, classification');
  console.log('   FROM dps_calculations');
  console.log('   ORDER BY video_id, calculated_at DESC');

  console.log('\n═══════════════════════════════════════════════════════════');
}

compareDPSScores().catch(console.error);
