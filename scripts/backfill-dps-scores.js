#!/usr/bin/env node
/**
 * Backfill dps_score from dps_calculations to scraped_videos table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function backfillDPSScores() {
  try {
    console.log('🔄 Backfilling DPS scores to scraped_videos...\n');

    // Get all DPS calculations
    const { data: calculations, error: calcError } = await supabase
      .from('dps_calculations')
      .select('video_id, viral_score, percentile_rank, classification, calculated_at')
      .order('calculated_at', { ascending: false });

    if (calcError) {
      console.error('❌ Error fetching calculations:', calcError.message);
      process.exit(1);
    }

    if (!calculations || calculations.length === 0) {
      console.log('⚠️  No DPS calculations found');
      process.exit(0);
    }

    console.log(`📊 Found ${calculations.length} DPS calculations`);

    // Group by video_id and take the latest
    const latestByVideo = new Map();
    calculations.forEach(calc => {
      const existing = latestByVideo.get(calc.video_id);
      if (!existing || new Date(calc.calculated_at) > new Date(existing.calculated_at)) {
        latestByVideo.set(calc.video_id, calc);
      }
    });

    console.log(`🎯 ${latestByVideo.size} unique videos to update\n`);

    let updated = 0;
    let failed = 0;

    // Update in batches
    for (const [video_id, calc] of latestByVideo.entries()) {
      const { error: updateError } = await supabase
        .from('scraped_videos')
        .update({
          dps_score: calc.viral_score,
          dps_percentile: calc.percentile_rank,
          dps_classification: calc.classification,
          dps_calculated_at: calc.calculated_at
        })
        .eq('video_id', video_id);

      if (updateError) {
        console.error(`❌ Failed to update ${video_id}:`, updateError.message);
        failed++;
      } else {
        updated++;
        if (updated % 10 === 0) {
          process.stdout.write(`\r✅ Updated: ${updated}/${latestByVideo.size}`);
        }
      }
    }

    console.log(`\n\n🎉 Backfill complete!`);
    console.log(`✅ Updated: ${updated}`);
    if (failed > 0) {
      console.log(`❌ Failed: ${failed}`);
    }

    // Verify a sample
    const { data: sample } = await supabase
      .from('scraped_videos')
      .select('video_id, dps_score, dps_classification')
      .not('dps_score', 'is', null)
      .limit(3);

    if (sample && sample.length > 0) {
      console.log('\n📋 Sample of updated records:');
      sample.forEach(v => {
        console.log(`  ${v.video_id}: ${v.dps_score} (${v.dps_classification})`);
      });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

backfillDPSScores();
