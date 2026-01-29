#!/usr/bin/env node
/**
 * Find a mega-viral video for testing knowledge extraction
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function findMegaViralVideo() {
  try {
    // Get mega-viral video IDs first
    const { data: calcs, error: calcError } = await supabase
      .from('dps_calculations')
      .select('video_id, viral_score, classification')
      .eq('classification', 'mega-viral')
      .order('viral_score', { ascending: false })
      .limit(10);

    if (calcError) {
      console.error('❌ Error fetching DPS calculations:', calcError.message);
      process.exit(1);
    }

    if (!calcs || calcs.length === 0) {
      console.error('❌ No mega-viral videos found');
      process.exit(1);
    }

    // Get video details for these IDs, preferring longer transcripts
    const videoIds = calcs.map(c => c.video_id);
    const { data: videos, error: videoError } = await supabase
      .from('scraped_videos')
      .select('video_id, title, views_count, transcript')
      .in('video_id', videoIds)
      .not('transcript', 'is', null)
      .order('transcript', { ascending: false })  // Longer transcripts first
      .limit(5);

    if (videoError) {
      console.error('❌ Error fetching videos:', videoError.message);
      process.exit(1);
    }

    if (!videos || videos.length === 0) {
      console.error('❌ No mega-viral videos found with transcripts');
      process.exit(1);
    }

    // Find video with longest meaningful transcript (>500 chars)
    const bestVideo = videos.find(v => v.transcript && v.transcript.length > 500) || videos[0];
    const calc = calcs.find(c => c.video_id === bestVideo.video_id);

    console.log('✅ Found mega-viral video:\n');
    console.log(`Video ID: ${bestVideo.video_id}`);
    console.log(`Title: ${bestVideo.title || 'N/A'}`);
    console.log(`Views: ${bestVideo.views_count?.toLocaleString() || 'N/A'}`);
    console.log(`Viral Score: ${calc.viral_score}`);
    console.log(`Classification: ${calc.classification}`);
    console.log(`Transcript length: ${bestVideo.transcript?.length || 0} chars`);
    console.log(`\n📋 Use this video_id for extraction:\n${bestVideo.video_id}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

findMegaViralVideo();
