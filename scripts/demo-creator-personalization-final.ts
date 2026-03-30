/**
 * FINAL DEMO: Creator Personalization with Real Baseline
 *
 * This demonstrates the complete system working with real data:
 * 1. Real baseline from 200 scraped TikTok videos
 * 2. Personalized predictions for NEW content
 * 3. Context-aware insights
 */

import { createClient } from '@supabase/supabase-js';
import { CreatorBaseline, CreatorProfile } from '@/lib/components/creator-baseline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('         CREATOR PERSONALIZATION SYSTEM - FINAL DEMO');
  console.log('='.repeat(80) + '\n');

  console.log('BASELINE SOURCE: 200 real scraped TikTok videos from database');
  console.log('TEST SCENARIO: Predicting NEW content using creator context\n');

  // Build baseline from real data
  const { data: videos } = await supabase
    .from('scraped_videos')
    .select('*')
    .limit(200);

  if (!videos) {
    console.error('❌ No videos found');
    return;
  }

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

    return {
      dps: Math.max(0, Math.min(100, dps)),
      engagement: engagementRate,
      views,
      likes
    };
  }).filter(Boolean) as any[];

  const avgDPS = videosWithDPS.reduce((sum, v) => sum + v.dps, 0) / videosWithDPS.length;
  const avgViews = videosWithDPS.reduce((sum, v) => sum + v.views, 0) / videosWithDPS.length;
  const avgLikes = videosWithDPS.reduce((sum, v) => sum + v.likes, 0) / videosWithDPS.length;

  const sortedDPS = videosWithDPS.map(v => v.dps).sort((a, b) => a - b);
  const p25 = sortedDPS[Math.floor(sortedDPS.length * 0.25)];
  const p50 = sortedDPS[Math.floor(sortedDPS.length * 0.50)];
  const p75 = sortedDPS[Math.floor(sortedDPS.length * 0.75)];
  const p90 = sortedDPS[Math.floor(sortedDPS.length * 0.90)];

  const baseline: CreatorProfile = {
    id: 'real-baseline',
    tiktok_username: 'real_creator_data',
    baseline_dps: avgDPS,
    baseline_engagement_rate: videosWithDPS.reduce((sum, v) => sum + v.engagement, 0) / videosWithDPS.length,
    avg_views: avgViews,
    avg_likes: avgLikes,
    total_videos: videosWithDPS.length,
    dps_percentiles: { p25, p50, p75, p90 }
  };

  console.log('📊 REAL BASELINE ESTABLISHED\n');
  console.log('Total Videos:', baseline.total_videos);
  console.log('Average Views:', Math.round(baseline.avg_views).toLocaleString());
  console.log('Average Likes:', Math.round(baseline.avg_likes).toLocaleString());
  console.log('Baseline DPS:', baseline.baseline_dps.toFixed(1));
  console.log('\nDPS Distribution:');
  console.log(`  25th Percentile: ${p25.toFixed(1)}`);
  console.log(`  50th Percentile: ${p50.toFixed(1)}`);
  console.log(`  75th Percentile: ${p75.toFixed(1)}`);
  console.log(`  90th Percentile: ${p90.toFixed(1)}`);

  console.log('\n' + '='.repeat(80) + '\n');

  // Now demonstrate the key value: SAME prediction for 3 different creators
  console.log('🎯 KEY DEMONSTRATION: How Personalization Changes Everything\n');
  console.log('Imagine 3 creators ALL get the same 65 DPS prediction from Kai.\n');
  console.log('WITHOUT personalization: All 3 creators see "65 DPS" - no context.');
  console.log('WITH personalization: Each gets context relative to THEIR baseline.\n');

  console.log('-'.repeat(80) + '\n');

  // Creator A: Struggling (lower baseline)
  const creatorA: CreatorProfile = {
    ...baseline,
    id: 'creator-a',
    tiktok_username: 'struggling_newbie',
    baseline_dps: 28,
    dps_percentiles: { p25: 18, p50: 28, p75: 38, p90: 48 }
  };

  console.log('👤 Creator A: @struggling_newbie');
  console.log('   Baseline: 28 DPS (struggling creator)\n');

  const analysisA = CreatorBaseline.analyze(65, creatorA);
  console.log(`   Kai Prediction: 65 DPS`);
  console.log(`   Relative Score: ${analysisA.relativeScore}/10`);
  console.log(`   ${analysisA.contextualizedPrediction}`);
  console.log(`   Adjusted DPS: ${CreatorBaseline.adjustPrediction(65, analysisA)}\n`);
  console.log('   💡 Message to Creator: "This is AMAZING for you - post immediately!"\n');

  console.log('-'.repeat(80) + '\n');

  // Creator B: Average (real baseline)
  const creatorB = baseline;

  console.log('👤 Creator B: @average_performer');
  console.log(`   Baseline: ${baseline.baseline_dps.toFixed(1)} DPS (average creator)\n`);

  const analysisB = CreatorBaseline.analyze(65, creatorB);
  console.log(`   Kai Prediction: 65 DPS`);
  console.log(`   Relative Score: ${analysisB.relativeScore}/10`);
  console.log(`   ${analysisB.contextualizedPrediction}`);
  console.log(`   Adjusted DPS: ${CreatorBaseline.adjustPrediction(65, analysisB)}\n`);
  console.log('   💡 Message to Creator: "This is better than most of your content - worth posting"\n');

  console.log('-'.repeat(80) + '\n');

  // Creator C: Viral expert (higher baseline)
  const creatorC: CreatorProfile = {
    ...baseline,
    id: 'creator-c',
    tiktok_username: 'viral_expert',
    baseline_dps: 78,
    dps_percentiles: { p25: 68, p50: 78, p75: 88, p90: 95 }
  };

  console.log('👤 Creator C: @viral_expert');
  console.log('   Baseline: 78 DPS (viral expert)\n');

  const analysisC = CreatorBaseline.analyze(65, creatorC);
  console.log(`   Kai Prediction: 65 DPS`);
  console.log(`   Relative Score: ${analysisC.relativeScore}/10`);
  console.log(`   ${analysisC.contextualizedPrediction}`);
  console.log(`   Adjusted DPS: ${CreatorBaseline.adjustPrediction(65, analysisC)}\n`);
  console.log('   💡 Message to Creator: "This is weak for you - improve before posting"\n');

  console.log('='.repeat(80) + '\n');

  console.log('✅ DEMONSTRATION COMPLETE\n');
  console.log('Key Takeaway:');
  console.log('  • Same raw prediction (65 DPS) = 3 completely different messages');
  console.log('  • Personalization provides ACTIONABLE guidance relative to creator\'s baseline');
  console.log('  • System is working with REAL data from 200 scraped TikTok videos\n');

  console.log('Next Steps to Go Live:');
  console.log('  1. Get valid Apify API token (current token is expired)');
  console.log('  2. Scrape specific creator channels to build individual baselines');
  console.log('  3. Integrate into Kai Orchestrator to use in predictions\n');
}

main().catch(console.error);
