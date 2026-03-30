#!/usr/bin/env tsx
/**
 * Verify DPS calculation results
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function verifyResults() {
  console.log('🔍 Verifying DPS calculation results...\n');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY must be set');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Count videos needing processing
  const { count: needsProcessing } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .eq('needs_processing', true);

  console.log(`🔄 Videos still needing processing: ${needsProcessing}`);

  // Count videos with DPS scores
  const { count: withDPS } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('dps_score', 'is', null);

  console.log(`✅ Videos with DPS scores: ${withDPS}`);

  // Get DPS statistics
  const { data: stats } = await supabase
    .from('scraped_videos')
    .select('dps_score, dps_percentile, dps_classification')
    .not('dps_score', 'is', null);

  if (stats && stats.length > 0) {
    const scores = stats.map(s => s.dps_score).filter(Boolean);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    // Classification breakdown
    const classifications = stats.reduce((acc: any, s) => {
      acc[s.dps_classification] = (acc[s.dps_classification] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 DPS Statistics:');
    console.log(`   Average Score: ${avgScore.toFixed(2)}`);
    console.log(`   Min Score: ${minScore.toFixed(2)}`);
    console.log(`   Max Score: ${maxScore.toFixed(2)}`);
    
    console.log('\n🏷️  Classification Breakdown:');
    Object.entries(classifications).forEach(([classification, count]) => {
      console.log(`   ${classification}: ${count}`);
    });
  }

  // Show sample of top scoring videos
  const { data: topVideos } = await supabase
    .from('scraped_videos')
    .select('video_id, creator_username, views_count, dps_score, dps_percentile, dps_classification')
    .not('dps_score', 'is', null)
    .order('dps_score', { ascending: false })
    .limit(5);

  if (topVideos && topVideos.length > 0) {
    console.log('\n🏆 Top 5 Videos by DPS Score:');
    topVideos.forEach((video, idx) => {
      console.log(`   ${idx + 1}. @${video.creator_username || 'unknown'} (${video.video_id})`);
      console.log(`      Views: ${video.views_count.toLocaleString()} | DPS: ${video.dps_score.toFixed(2)} | Percentile: ${video.dps_percentile.toFixed(1)}% | ${video.dps_classification}`);
    });
  }

  console.log('\n✨ Verification complete!\n');
}

verifyResults().catch(console.error);


