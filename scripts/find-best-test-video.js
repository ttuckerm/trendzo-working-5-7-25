#!/usr/bin/env node
/**
 * Find the best video for knowledge extraction testing:
 * - High viral score (>= 70)
 * - Long transcript (>= 500 chars for meaningful extraction)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function findBestTestVideo() {
  try {
    // Get all viral videos (viral_score >= 70)
    const { data: calcs, error: calcError } = await supabase
      .from('dps_calculations')
      .select('video_id, viral_score, classification')
      .gte('viral_score', 70)
      .order('viral_score', { ascending: false })
      .limit(50);

    if (calcError) {
      console.error('❌ Error:', calcError.message);
      process.exit(1);
    }

    if (!calcs || calcs.length === 0) {
      console.error('❌ No viral videos found');
      process.exit(1);
    }

    console.log(`📊 Found ${calcs.length} viral videos (score >= 70)`);

    // Get video details
    const videoIds = calcs.map(c => c.video_id);
    const { data: videos, error: videoError } = await supabase
      .from('scraped_videos')
      .select('video_id, title, views_count, transcript')
      .in('video_id', videoIds)
      .not('transcript', 'is', null);

    if (videoError) {
      console.error('❌ Error:', videoError.message);
      process.exit(1);
    }

    if (!videos || videos.length === 0) {
      console.error('❌ No videos with transcripts found');
      process.exit(1);
    }

    // Find best candidates (long transcripts)
    const candidates = videos
      .map(v => ({
        ...v,
        calc: calcs.find(c => c.video_id === v.video_id),
        transcriptLength: v.transcript?.length || 0
      }))
      .filter(v => v.transcriptLength >= 500)
      .sort((a, b) => b.calc.viral_score - a.calc.viral_score);

    console.log(`\n🔍 Videos with transcripts >= 500 chars: ${candidates.length}`);

    if (candidates.length === 0) {
      console.log('\n⚠️  No videos with long transcripts. Showing best available:');
      const best = videos
        .map(v => ({
          ...v,
          calc: calcs.find(c => c.video_id === v.video_id),
          transcriptLength: v.transcript?.length || 0
        }))
        .sort((a, b) => b.transcriptLength - a.transcriptLength)[0];

      console.log(`\nVideo ID: ${best.video_id}`);
      console.log(`Title: ${best.title || 'N/A'}`);
      console.log(`Viral Score: ${best.calc.viral_score}`);
      console.log(`Classification: ${best.calc.classification}`);
      console.log(`Transcript: ${best.transcriptLength} chars`);
      console.log(`\n📋 Use this video_id:\n${best.video_id}`);
      process.exit(0);
    }

    // Show top 3 candidates
    console.log('\n✅ Top candidates:\n');
    candidates.slice(0, 3).forEach((v, i) => {
      console.log(`${i + 1}. ID: ${v.video_id}`);
      console.log(`   Title: ${v.title || 'N/A'}`);
      console.log(`   Score: ${v.calc.viral_score} (${v.calc.classification})`);
      console.log(`   Transcript: ${v.transcriptLength} chars`);
      console.log('');
    });

    const best = candidates[0];
    console.log(`📋 Best video for testing:\n${best.video_id}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

findBestTestVideo();
