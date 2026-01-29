/**
 * Build Creator Baseline from Existing Scraped Videos (Real Data)
 */

import { createClient } from '@supabase/supabase-js';
import { CreatorBaseline, CreatorProfile } from '@/lib/components/creator-baseline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  console.log('=== BUILDING BASELINE FROM EXISTING SCRAPED DATA ===\n');

  // Get all scraped videos
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(200);

  if (error || !videos || videos.length === 0) {
    console.log('❌ No scraped videos found in database');
    console.log('Error:', error?.message);
    return;
  }

  console.log(`Found ${videos.length} scraped videos\n`);

  // Calculate DPS for each video using data from raw_scraping_data
  const videosWithDPS = videos.map(v => {
    const raw = v.raw_scraping_data;
    if (!raw) return null;

    const views = raw.playCount || v.views_count || 0;
    const likes = raw.diggCount || v.likes_count || 0;
    const comments = raw.commentCount || v.comments_count || 0;
    const shares = raw.shareCount || v.shares_count || 0;
    const saves = raw.collectCount || 0;

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
      creator: v.creator_username,
      views,
      likes,
      comments,
      shares,
      saves,
      dps,
      engagement: engagementRate,
      posted_at: v.upload_timestamp
    };
  }).filter(Boolean) as any[];

  if (videosWithDPS.length === 0) {
    console.log('❌ No videos with valid metrics found');
    return;
  }

  // Calculate baseline
  const avgDPS = videosWithDPS.reduce((sum, v) => sum + v.dps, 0) / videosWithDPS.length;
  const avgViews = videosWithDPS.reduce((sum, v) => sum + v.views, 0) / videosWithDPS.length;
  const avgLikes = videosWithDPS.reduce((sum, v) => sum + v.likes, 0) / videosWithDPS.length;

  const sortedDPS = videosWithDPS.map(v => v.dps).sort((a, b) => a - b);
  const p25 = sortedDPS[Math.floor(sortedDPS.length * 0.25)];
  const p50 = sortedDPS[Math.floor(sortedDPS.length * 0.50)];
  const p75 = sortedDPS[Math.floor(sortedDPS.length * 0.75)];
  const p90 = sortedDPS[Math.floor(sortedDPS.length * 0.90)];

  console.log('📊 AGGREGATE BASELINE METRICS (From All Scraped Videos)\n');
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
    console.log(`  ${i+1}. ${v.dps.toFixed(1)} DPS - @${v.creator} - ${v.views.toLocaleString()} views, ${v.likes.toLocaleString()} likes`);
  });

  console.log('\n📉 Bottom 5 Performing Videos:\n');
  videosWithDPS.sort((a, b) => a.dps - b.dps).slice(0, 5).forEach((v, i) => {
    console.log(`  ${i+1}. ${v.dps.toFixed(1)} DPS - @${v.creator} - ${v.views.toLocaleString()} views, ${v.likes.toLocaleString()} likes`);
  });

  // Now test personalization with these real metrics
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 TESTING CREATOR PERSONALIZATION WITH REAL BASELINE\n');

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

  // Test with various predictions
  const testScenarios = [
    { prediction: 30, description: 'Low performance video' },
    { prediction: 50, description: 'Average performance video' },
    { prediction: 70, description: 'Above average video' },
    { prediction: 85, description: 'Excellent performance video' }
  ];

  for (const scenario of testScenarios) {
    console.log(`\nScenario: Kai predicts ${scenario.prediction} DPS for NEW content`);
    console.log(`Context: ${scenario.description}\n`);

    const analysis = CreatorBaseline.analyze(scenario.prediction, realBaseline);

    console.log('Personalized Analysis:');
    console.log(`  Relative Score: ${analysis.relativeScore}/10`);
    console.log(`  Improvement Factor: ${analysis.improvementFactor}x`);
    console.log(`  Percentile Rank: ${analysis.percentileRank}`);
    console.log(`\n  ${analysis.contextualizedPrediction}\n`);

    console.log('Insights:');
    for (const insight of analysis.insights) {
      console.log(`  • ${insight}`);
    }

    const adjustedDPS = CreatorBaseline.adjustPrediction(scenario.prediction, analysis);
    console.log(`\nDPS Adjustment: ${scenario.prediction} → ${adjustedDPS} (${adjustedDPS - scenario.prediction > 0 ? '+' : ''}${(adjustedDPS - scenario.prediction).toFixed(1)})\n`);
    console.log('-'.repeat(80));
  }

  console.log('\n✅ REAL BASELINE TEST COMPLETE\n');
}

main().catch(console.error);
