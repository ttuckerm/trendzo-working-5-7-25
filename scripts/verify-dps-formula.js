require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function verifyDPSFormula() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔬 DPS FORMULA VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get the highest viral score calculation with all raw data
  const { data: topCalc, error } = await supabase
    .from('dps_calculations')
    .select('*')
    .order('viral_score', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error fetching data:', error);
    return;
  }

  console.log('📊 TOP VIDEO WITH HIGHEST VIRAL SCORE:\n');
  console.log('Video ID:', topCalc.video_id);
  console.log('Stored Viral Score:', topCalc.viral_score);
  console.log('Classification:', topCalc.classification);
  console.log('Calculated at:', topCalc.calculated_at);
  console.log('\n═══════════════════════════════════════════════════════════\n');

  // 1. Show raw metrics
  console.log('1️⃣  RAW METRICS:\n');
  console.log('   views_count:', topCalc.view_count?.toLocaleString() || 'N/A');
  console.log('   likes_count:', topCalc.like_count?.toLocaleString() || 'N/A');
  console.log('   comments_count:', topCalc.comment_count?.toLocaleString() || 'N/A');
  console.log('   shares_count:', topCalc.share_count?.toLocaleString() || 'N/A');
  console.log('   follower_count:', topCalc.follower_count?.toLocaleString() || 'N/A');
  console.log('   hours_since_upload:', topCalc.hours_since_upload);
  console.log('   cohort_median:', topCalc.cohort_median?.toLocaleString() || 'N/A');
  console.log('   platform:', topCalc.platform);
  console.log('   platform_weight:', topCalc.platform_weight);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Get cohort data for z-score calculation
  console.log('2️⃣  CALCULATING Z-SCORE:\n');

  // Calculate cohort standard deviation
  const { data: cohortVideos } = await supabase
    .from('dps_calculations')
    .select('view_count, follower_count')
    .eq('platform', topCalc.platform)
    .gte('follower_count', topCalc.follower_count * 0.5)
    .lte('follower_count', topCalc.follower_count * 2);

  let cohortStddev = 0;
  if (cohortVideos && cohortVideos.length > 0) {
    const views = cohortVideos.map(v => v.view_count).filter(v => v != null);
    const mean = views.reduce((a, b) => a + b, 0) / views.length;
    const variance = views.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / views.length;
    cohortStddev = Math.sqrt(variance);
    console.log('   Cohort size:', views.length, 'videos');
    console.log('   Cohort mean views:', mean.toFixed(0));
    console.log('   Cohort median views:', topCalc.cohort_median);
    console.log('   Cohort stddev:', cohortStddev.toFixed(0));
  } else {
    // Fallback: estimate stddev as 50% of median
    cohortStddev = topCalc.cohort_median * 0.5;
    console.log('   ⚠️  Using estimated stddev (50% of median):', cohortStddev.toFixed(0));
  }

  const z_score = (topCalc.view_count - topCalc.cohort_median) / cohortStddev;
  console.log('\n   Formula: z_score = (views - cohort_median) / cohort_stddev');
  console.log(`   z_score = (${topCalc.view_count} - ${topCalc.cohort_median}) / ${cohortStddev.toFixed(0)}`);
  console.log(`   z_score = ${z_score.toFixed(4)}`);
  console.log('   Stored z_score:', topCalc.z_score);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // 3. Calculate engagement_rate
  console.log('3️⃣  CALCULATING ENGAGEMENT RATE:\n');

  const total_engagement = (
    topCalc.like_count +
    (topCalc.comment_count * 2) +
    (topCalc.share_count * 3)
  );
  const engagement_rate = total_engagement / topCalc.view_count;

  console.log('   Formula: engagement_rate = (likes + comments*2 + shares*3) / views');
  console.log(`   engagement_rate = (${topCalc.like_count} + ${topCalc.comment_count}*2 + ${topCalc.share_count}*3) / ${topCalc.view_count}`);
  console.log(`   engagement_rate = ${total_engagement} / ${topCalc.view_count}`);
  console.log(`   engagement_rate = ${engagement_rate.toFixed(6)}`);
  console.log(`   engagement_rate (%) = ${(engagement_rate * 100).toFixed(2)}%`);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // 4. Calculate velocity_score
  console.log('4️⃣  CALCULATING VELOCITY SCORE:\n');

  const velocity_score = topCalc.view_count / topCalc.hours_since_upload;

  console.log('   Formula: velocity_score = views / hours_since_upload');
  console.log(`   velocity_score = ${topCalc.view_count} / ${topCalc.hours_since_upload}`);
  console.log(`   velocity_score = ${velocity_score.toFixed(2)} views/hour`);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // 5. Calculate decay_factor
  console.log('5️⃣  CALCULATING DECAY FACTOR:\n');

  const decay_factor = Math.exp(-0.5 * topCalc.hours_since_upload / 24); // Decay per day

  console.log('   Formula: decay_factor = e^(-0.5 * hours_since_upload / 24)');
  console.log(`   decay_factor = e^(-0.5 * ${topCalc.hours_since_upload} / 24)`);
  console.log(`   decay_factor = ${decay_factor.toFixed(6)}`);
  console.log('   Stored decay_factor:', topCalc.decay_factor);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // 6. Calculate final DPS score
  console.log('6️⃣  CALCULATING FINAL DPS SCORE:\n');

  const platform_weight = topCalc.platform_weight || 1.0;

  // Normalize components to 0-100 scale
  const z_normalized = Math.min(100, Math.max(0, (z_score + 3) / 6 * 100)); // z-score typically -3 to +3
  const engagement_normalized = Math.min(100, engagement_rate * 1000); // Scale up small percentages
  const velocity_normalized = Math.min(100, Math.log10(velocity_score + 1) * 20); // Log scale

  console.log('   Normalized components (0-100 scale):');
  console.log(`     z_score_normalized: ${z_normalized.toFixed(2)}`);
  console.log(`     engagement_normalized: ${engagement_normalized.toFixed(2)}`);
  console.log(`     velocity_normalized: ${velocity_normalized.toFixed(2)}`);
  console.log(`     platform_weight: ${platform_weight}`);

  const viral_score = (
    z_normalized * 0.4 +
    engagement_normalized * 0.3 +
    velocity_normalized * 0.2 +
    platform_weight * 10 * 0.1  // Scale platform weight to match
  ) * decay_factor;

  console.log('\n   Formula: viral_score = (z*0.4 + eng*0.3 + vel*0.2 + plat*0.1) * decay');
  console.log(`   viral_score = (${z_normalized.toFixed(2)}*0.4 + ${engagement_normalized.toFixed(2)}*0.3 + ${velocity_normalized.toFixed(2)}*0.2 + ${platform_weight * 10}*0.1) * ${decay_factor.toFixed(4)}`);
  console.log(`   viral_score = ${viral_score.toFixed(2)}`);

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // 7. Compare results
  console.log('7️⃣  COMPARISON:\n');

  const stored_score = topCalc.viral_score;
  const calculated_score = viral_score;
  const difference = Math.abs(stored_score - calculated_score);
  const matches = difference <= 2;

  console.log(`   Stored Viral Score:     ${stored_score.toFixed(2)}`);
  console.log(`   Calculated Viral Score: ${calculated_score.toFixed(2)}`);
  console.log(`   Difference:             ${difference.toFixed(2)} points`);
  console.log(`   Within ±2 points?       ${matches ? '✅ YES' : '❌ NO'}`);

  if (!matches) {
    console.log('\n   📋 DISCREPANCY ANALYSIS:\n');
    console.log('   Possible reasons for difference:');
    console.log('   1. Normalization formulas may differ in actual implementation');
    console.log('   2. Cohort stddev calculation may use different sample');
    console.log('   3. Decay factor formula might have different time units');
    console.log('   4. Platform weight scaling might differ');
    console.log('   5. The actual implementation may use a different formula version');

    // Let's check the actual implementation
    console.log('\n   Let me check the actual DPS calculation implementation...');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
}

verifyDPSFormula().catch(console.error);
