/**
 * Build Creator Baseline from Existing Scraped Videos
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  console.log('=== BUILDING BASELINE FROM EXISTING DATA ===\n');

  // Get all scraped videos
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(100);

  if (error || !videos || videos.length === 0) {
    console.log('❌ No scraped videos found in database');
    console.log('Error:', error?.message);
    return;
  }

  console.log(`Found ${videos.length} scraped videos\n`);

  // Calculate DPS for each
  const videosWithDPS = videos.map(v => {
    const views = v.play_count || 0;
    const likes = v.digg_count || 0;
    const comments = v.comment_count || 0;
    const shares = v.share_count || 0;
    const saves = v.collect_count || 0;

    if (views === 0) return null;

    const engagementRate = (likes + comments + shares + saves) / views;

    let dps = 0;
    if (engagementRate >= 0.20) {
      dps = 80 + (engagementRate - 0.20) * 100;
    } else if (engagementRate >= 0.10) {
      dps = 60 + (engagementRate - 0.10) * 200;
    } else if (engagementRate >= 0.05) {
      dps = 40 + (engagementRate - 0.05) * 400;
    } else if (engagementRate >= 0.03) {
      dps = 30 + (engagementRate - 0.03) * 500;
    } else {
      dps = engagementRate * 1000;
    }

    dps = Math.max(0, Math.min(100, dps));

    return {
      video_id: v.video_id,
      views,
      likes,
      comments,
      shares,
      saves,
      dps,
      engagement: engagementRate
    };
  }).filter(Boolean) as any[];

  // Calculate baseline
  const avgDPS = videosWithDPS.reduce((sum, v) => sum + v.dps, 0) / videosWithDPS.length;
  const avgViews = videosWithDPS.reduce((sum, v) => sum + v.views, 0) / videosWithDPS.length;
  const avgLikes = videosWithDPS.reduce((sum, v) => sum + v.likes, 0) / videosWithDPS.length;

  const sortedDPS = videosWithDPS.map(v => v.dps).sort((a, b) => a - b);
  const p25 = sortedDPS[Math.floor(sortedDPS.length * 0.25)];
  const p50 = sortedDPS[Math.floor(sortedDPS.length * 0.50)];
  const p75 = sortedDPS[Math.floor(sortedDPS.length * 0.75)];
  const p90 = sortedDPS[Math.floor(sortedDPS.length * 0.90)];

  console.log('📊 AGGREGATE BASELINE METRICS\n');
  console.log('Total Videos Analyzed:', videosWithDPS.length);
  console.log('Average Views:', Math.round(avgViews).toLocaleString());
  console.log('Average Likes:', Math.round(avgLikes).toLocaleString());
  console.log('Baseline DPS:', avgDPS.toFixed(1));
  console.log('\nDPS Distribution (Percentiles):');
  console.log('  25th Percentile:', p25.toFixed(1), 'DPS');
  console.log('  50th Percentile (Median):', p50.toFixed(1), 'DPS');
  console.log('  75th Percentile:', p75.toFixed(1), 'DPS');
  console.log('  90th Percentile:', p90.toFixed(1), 'DPS');

  console.log('\n📈 Top 10 Performing Videos:\n');
  videosWithDPS.sort((a, b) => b.dps - a.dps).slice(0, 10).forEach((v, i) => {
    console.log(`  ${i+1}. ${v.dps.toFixed(1)} DPS - ${v.views.toLocaleString()} views, ${v.likes.toLocaleString()} likes`);
  });

  console.log('\n📉 Bottom 5 Performing Videos:\n');
  videosWithDPS.sort((a, b) => a.dps - b.dps).slice(0, 5).forEach((v, i) => {
    console.log(`  ${i+1}. ${v.dps.toFixed(1)} DPS - ${v.views.toLocaleString()} views, ${v.likes.toLocaleString()} likes`);
  });

  // Now test personalization with these real metrics
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 TESTING CREATOR PERSONALIZATION WITH REAL BASELINE\n');

  const { CreatorBaseline, CreatorProfile } = await import('@/lib/components/creator-baseline');

  const realBaseline: CreatorProfile = {
    id: 'real-data',
    tiktok_username: 'aggregate_creator',
    baseline_dps: avgDPS,
    baseline_engagement_rate: videosWithDPS.reduce((sum, v) => sum + v.engagement, 0) / videosWithDPS.length,
    avg_views: avgViews,
    avg_likes: avgLikes,
    total_videos: videosWithDPS.length,
    dps_percentiles: { p25, p50, p75, p90 }
  };

  // Test with a new prediction
  const testPrediction = 65;
  console.log(`Scenario: Kai predicts ${testPrediction} DPS for NEW content\n`);

  const analysis = CreatorBaseline.analyze(testPrediction, realBaseline);

  console.log('Personalized Analysis:');
  console.log(`  Relative Score: ${analysis.relativeScore}/10`);
  console.log(`  Improvement Factor: ${analysis.improvementFactor}x`);
  console.log(`  Percentile Rank: ${analysis.percentileRank}`);
  console.log(`\n  ${analysis.contextualizedPrediction}\n`);

  console.log('Insights:');
  for (const insight of analysis.insights) {
    console.log(`  • ${insight}`);
  }

  const adjustedDPS = CreatorBaseline.adjustPrediction(testPrediction, analysis);
  console.log(`\nDPS Adjustment: ${testPrediction} → ${adjustedDPS} (${adjustedDPS - testPrediction > 0 ? '+' : ''}${(adjustedDPS - testPrediction).toFixed(1)})\n`);

  console.log('='.repeat(80));
  console.log('\n✅ REAL BASELINE TEST COMPLETE\n');
}

main().catch(console.error);
