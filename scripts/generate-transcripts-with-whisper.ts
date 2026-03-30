import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function downloadVideo(videoUrl: string, outputPath: string) {
  console.log(`  Downloading video...`);

  try {
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 5,
      validateStatus: (status) => status === 200
    });

    // Verify we got actual data
    if (!response.data || response.data.byteLength < 1000) {
      throw new Error('Downloaded file is too small or empty');
    }

    fs.writeFileSync(outputPath, Buffer.from(response.data));
    console.log(`  Downloaded ${(response.data.byteLength / 1024).toFixed(1)} KB`);
  } catch (error: any) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  console.log(`  Extracting audio...`);

  try {
    // Use ffmpeg to extract audio as mp3 (suppress output with -loglevel error)
    const { stderr } = await execPromise(
      `ffmpeg -loglevel error -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 32k "${audioPath}" -y`
    );

    if (stderr && stderr.length > 0) {
      throw new Error(`FFmpeg error: ${stderr}`);
    }

    // Verify audio file was created and has content
    if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size < 1000) {
      throw new Error('Audio extraction failed - output file missing or too small');
    }

    console.log(`  Extracted ${(fs.statSync(audioPath).size / 1024).toFixed(1)} KB audio`);
  } catch (error: any) {
    throw new Error(`Audio extraction failed: ${error.message}`);
  }
}

async function transcribeAudio(audioPath: string): Promise<string> {
  console.log(`  Transcribing with Whisper...`);
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'text',
  });
  return transcription as unknown as string;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     GENERATE TRANSCRIPTS WITH WHISPER API                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get videos without transcripts
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, video_url')
    .is('transcript_text', null)
    .not('video_url', 'is', null)
    .limit(50); // Process 50 at a time

  if (error || !videos) {
    console.error('❌ Error fetching videos:', error?.message);
    return;
  }

  console.log(`📊 Found ${videos.length} videos without transcripts\n`);

  if (videos.length === 0) {
    console.log('✅ All videos already have transcripts!');
    return;
  }

  // Test first video URL
  console.log('🔍 Testing first video URL...');
  console.log(`   URL: ${videos[0].video_url}\n`);

  let processed = 0;
  let failed = 0;
  let totalCost = 0;
  const tempDir = path.join(process.cwd(), 'temp_videos');

  // Create temp directory
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    const tempVideoPath = path.join(tempDir, `${video.video_id}.mp4`);
    const tempAudioPath = path.join(tempDir, `${video.video_id}.mp3`);

    console.log(`\n[${i + 1}/${videos.length}] Processing: ${video.video_id}`);

    try {
      // Download video
      await downloadVideo(video.video_url, tempVideoPath);

      // Extract audio from video
      await extractAudio(tempVideoPath, tempAudioPath);

      // Transcribe audio
      const transcript = await transcribeAudio(tempAudioPath);

      if (!transcript || transcript.length < 10) {
        throw new Error('Transcript too short or empty');
      }

      // Update database
      const { error: updateError } = await supabase
        .from('scraped_videos')
        .update({ transcript_text: transcript })
        .eq('video_id', video.video_id);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      // Calculate cost (using default 30 seconds since video_duration column not available)
      const durationMinutes = 0.5; // Default 30 seconds
      const cost = durationMinutes * 0.006;
      totalCost += cost;

      processed++;
      console.log(`  ✅ Success`);
      console.log(`  Transcript: "${transcript.substring(0, 80)}..."`);
      console.log(`  Length: ${transcript.length} characters`);
      console.log(`  Cost: $${cost.toFixed(4)}`);

    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
      failed++;
    } finally {
      // Clean up temp files
      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (fs.existsSync(tempAudioPath)) {
        fs.unlinkSync(tempAudioPath);
      }
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     ✅ BATCH COMPLETE                                      ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Processed: ${processed}/${videos.length}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${(processed / videos.length * 100).toFixed(1)}%`);
  console.log(`Total Cost: $${totalCost.toFixed(2)}`);

  if (processed > 0) {
    console.log(`\nEstimated cost for all 672 videos: $${(totalCost / processed * 672).toFixed(2)}`);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
