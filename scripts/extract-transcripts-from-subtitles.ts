import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseVTT(vttContent: string): string {
  // Remove VTT header
  let content = vttContent.replace(/^WEBVTT.*?\n\n/s, '');

  // Remove timestamps and numbers
  content = content.replace(/\d+:\d+:\d+\.\d+ --> \d+:\d+:\d+\.\d+/g, '');
  content = content.replace(/^\d+$/gm, '');

  // Remove empty lines and trim
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Join and remove duplicates
  return lines.join(' ').trim();
}

async function extractTranscript(videoId: string, rawData: any): Promise<string | null> {
  try {
    if (!rawData || !rawData.videoMeta || !rawData.videoMeta.subtitleLinks) {
      return null;
    }

    // Find English ASR subtitle
    const englishSubtitle = rawData.videoMeta.subtitleLinks.find(
      (sub: any) => sub.language === 'eng-US' && sub.source === 'ASR'
    );

    if (!englishSubtitle || !englishSubtitle.downloadLink) {
      return null;
    }

    // Download VTT file
    const response = await axios.get(englishSubtitle.downloadLink, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!response.data) {
      return null;
    }

    // Parse VTT to plain text
    const transcript = parseVTT(response.data);

    if (transcript.length < 10) {
      return null;
    }

    return transcript;
  } catch (error: any) {
    console.error(`  ⚠️  Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     EXTRACT TRANSCRIPTS FROM EXISTING SUBTITLES            ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get videos without transcripts that have raw_scraping_data
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, raw_scraping_data')
    .is('transcript_text', null)
    .not('raw_scraping_data', 'is', null)
    .limit(100); // Process 100 at a time

  if (error || !videos) {
    console.error('❌ Error fetching videos:', error?.message);
    return;
  }

  console.log(`📊 Found ${videos.length} videos to process\n`);

  if (videos.length === 0) {
    console.log('✅ All videos already have transcripts!');
    return;
  }

  let processed = 0;
  let failed = 0;
  let noSubtitles = 0;

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    console.log(`[${i + 1}/${videos.length}] Processing: ${video.video_id}`);

    try {
      const transcript = await extractTranscript(video.video_id, video.raw_scraping_data);

      if (!transcript) {
        noSubtitles++;
        console.log(`  ⚠️  No subtitles available`);
        continue;
      }

      // Update database
      const { error: updateError } = await supabase
        .from('scraped_videos')
        .update({ transcript_text: transcript })
        .eq('video_id', video.video_id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      processed++;
      console.log(`  ✅ Success (${transcript.length} chars)`);
      console.log(`     "${transcript.substring(0, 60)}..."\n`);

    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}\n`);
      failed++;
    }
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ BATCH COMPLETE                                      ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Successfully extracted: ${processed}`);
  console.log(`⚠️  No subtitles found:     ${noSubtitles}`);
  console.log(`❌ Failed:                 ${failed}`);
  console.log(`📊 Total processed:        ${videos.length}`);
  console.log(`\n🎯 Success Rate: ${((processed / videos.length) * 100).toFixed(1)}%`);

  // Check total progress
  const { count } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript_text', 'is', null);

  console.log(`\n📈 Total videos with transcripts: ${count}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
