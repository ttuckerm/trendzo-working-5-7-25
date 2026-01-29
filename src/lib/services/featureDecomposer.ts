import ffmpeg from 'fluent-ffmpeg';
// OCR temporarily optional to avoid WASM bundling issues; enabled via FEATURE_OCR_ENABLED=true
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { supabaseClient } from '@/lib/supabase/client';
// Use static, cross-platform binaries for ffmpeg/ffprobe
// These packages provide prebuilt binaries for Windows/Mac/Linux
// and avoid hardcoding a Linux-only path.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - ffmpeg-static has no default types in some setups
import ffmpegStatic from 'ffmpeg-static';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - ffprobe-static exports .path
import ffprobeStatic from 'ffprobe-static';

const RESOLVED_FFMPEG_PATH = (ffmpegStatic as unknown as string) || 'ffmpeg';
// ffprobe-static may export { path: string } or a string depending on version
const RESOLVED_FFPROBE_PATH =
  (ffprobeStatic as any)?.path || (ffprobeStatic as unknown as string) || 'ffprobe';

ffmpeg.setFfmpegPath(RESOLVED_FFMPEG_PATH);
ffmpeg.setFfprobePath(RESOLVED_FFPROBE_PATH);

const OCR_ENABLED = process.env.FEATURE_OCR_ENABLED === 'true';

// Initialize OpenAI client for Whisper API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Types for the decomposer
interface VideoFeature {
  id: string;
  frames_path: string;
  audio_path: string;
  ocr_text: string;
  transcript: string;
  duration_sec: number;
}

interface DecomposeArgs {
  id: string;
  filepath: string;
  caption: string;
}

// Constants
const MAX_DURATION_SEC = 120; // 2 minutes
const FRAME_INTERVAL = 0.5; // Extract frame every 0.5 seconds
const AUDIO_SAMPLE_RATE = 16000; // 16 kHz
const AUDIO_CHANNELS = 1; // Mono

/**
 * Main function to decompose video into machine-readable features
 * @param args Object containing id, filepath, and caption
 */
export async function decomposeVideo(args: DecomposeArgs): Promise<void> {
  const { id, filepath, caption } = args;
  
  console.log(`Starting video decomposition for ID: ${id}`);
  
  // Validate input file exists
  if (!fs.existsSync(filepath)) {
    throw new Error(`Video file not found: ${filepath}`);
  }

  // Create output directories
  const framesDir = path.join(process.cwd(), 'data', 'frames', id);
  const audioDir = path.join(process.cwd(), 'data', 'audio');
  
  await ensureDirectoryExists(framesDir);
  await ensureDirectoryExists(audioDir);

  try {
    // Step 1: Get video duration and validate
    const duration = await getVideoDuration(filepath);
    
    if (duration > MAX_DURATION_SEC) {
      throw new Error(`Video duration ${duration}s exceeds maximum ${MAX_DURATION_SEC}s`);
    }

    // Step 2: Extract frames (every 0.5s)
    console.log(`Extracting frames for video ${id}...`);
    await extractFrames(filepath, framesDir);

    // Step 3: Extract audio (mono, 16kHz WAV)
    console.log(`Extracting audio for video ${id}...`);
    const audioPath = path.join(audioDir, `${id}.wav`);
    await extractAudio(filepath, audioPath);

    // Step 4: OCR text extraction from frames
    console.log(`Performing OCR for video ${id}...`);
    const ocrText = await extractOCRText(framesDir);

    // Step 5: Speech-to-text transcription using OpenAI Whisper API
    console.log(`Transcribing audio for video ${id}...`);
    const transcript = await transcribeAudioWithOpenAI(audioPath);

    // Step 6: Save to Supabase
    const videoFeature: VideoFeature = {
      id,
      frames_path: framesDir,
      audio_path: audioPath,
      ocr_text: ocrText,
      transcript,
      duration_sec: duration,
    };

    await saveToSupabase(videoFeature);

    console.log(`Video decomposition completed for ID: ${id}`);

  } catch (error) {
    console.error(`Error decomposing video ${id}:`, error);
    throw error;
  }
}

/**
 * Get video duration using ffmpeg
 */
async function getVideoDuration(filepath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filepath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video duration: ${err.message}`));
        return;
      }
      
      const duration = metadata.format.duration;
      if (!duration) {
        reject(new Error('Unable to determine video duration'));
        return;
      }
      
      resolve(duration);
    });
  });
}

/**
 * Extract frames from video every 0.5 seconds
 */
async function extractFrames(videoPath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        '-vf', `fps=1/${FRAME_INTERVAL}`, // Extract frame every 0.5 seconds
        '-q:v', '2', // High quality JPEG
      ])
      .output(path.join(outputDir, '%04d.jpg'))
      .on('end', () => {
        console.log('Frame extraction completed');
        resolve();
      })
      .on('error', (err) => {
        reject(new Error(`Frame extraction failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Extract audio as mono 16kHz WAV
 */
async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .addOption('-y') // overwrite if exists
      .addOption('-vn') // no video
      .audioChannels(AUDIO_CHANNELS)
      .audioFrequency(AUDIO_SAMPLE_RATE)
      .audioCodec('pcm_s16le')
      .format('wav')
      .output(audioPath)
      .on('end', () => {
        console.log('Audio extraction completed');
        resolve();
      })
      .on('error', async (err) => {
        try {
          console.warn('Primary audio extraction failed, generating silent fallback WAV:', err.message);
          await generateSilentAudio(audioPath);
          resolve();
        } catch (fallbackErr) {
          const help = `ffmpeg failed converting to wav at ${AUDIO_SAMPLE_RATE}Hz mono. Check file and codec support.`;
          reject(new Error(`Audio extraction failed: ${err.message}. ${help}`));
        }
      })
      .run();
  });
}

/**
 * Generate a short silent WAV so the rest of the pipeline can proceed
 */
async function generateSilentAudio(audioPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=16000:cl=mono')
      .inputFormat('lavfi')
      .addOption('-t', '1') // 1 second
      .audioCodec('pcm_s16le')
      .format('wav')
      .output(audioPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Extract text from frames using Tesseract OCR
 */
async function extractOCRText(framesDir: string): Promise<string> {
  if (!OCR_ENABLED) {
    return '';
  }
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  
  try {
    const frameFiles = fs.readdirSync(framesDir)
      .filter(file => file.endsWith('.jpg'))
      .sort();

    const ocrResults: string[] = [];

    // Process each frame for OCR
    for (const frameFile of frameFiles) {
      try {
        const framePath = path.join(framesDir, frameFile);
        const { data: { text } } = await worker.recognize(framePath);
        
        if (text.trim()) {
          ocrResults.push(text.trim());
        }
      } catch (err) {
        console.warn(`OCR failed for frame ${frameFile}:`, err);
        // Continue processing other frames
      }
    }

    await worker.terminate();

    // Combine and deduplicate OCR text
    const combinedText = [...new Set(ocrResults)]
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return combinedText;

  } catch (error) {
    await worker.terminate();
    console.error('OCR processing failed:', error);
    return ''; // Return empty string on OCR failure
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudioWithOpenAI(audioPath: string): Promise<string> {
  try {
    if (process.env.FEATURE_TRANSCRIPTION_ENABLED !== 'true') {
      return '';
    }
    // Check if audio file has content (not silent)
    const audioStats = fs.statSync(audioPath);
    if (audioStats.size < 1000) { // Very small file likely silent
      return '';
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, skipping transcription');
      return '';
    }

    // Create a readable stream from the audio file
    const audioStream = fs.createReadStream(audioPath);

    // Use OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text.trim();

  } catch (error) {
    console.warn('OpenAI Whisper transcription failed:', error);
    return ''; // Return empty string for silent videos or transcription failures
  }
}

/**
 * Save video features to Supabase
 */
async function saveToSupabase(feature: VideoFeature): Promise<void> {
  try {
    // Best-effort write; if table/schema missing, do not fail processing
    await ensureVideoFeaturesTable().catch(() => {});

    const { error } = await supabaseClient
      .from('video_features')
      .insert({
        id: feature.id,
        frames_path: feature.frames_path,
        audio_path: feature.audio_path,
        ocr_text: feature.ocr_text,
        transcript: feature.transcript,
        duration_sec: feature.duration_sec,
      });

    if (error) {
      // Handle duplicate entries or schema cache errors without breaking the flow
      if (error.code === '23505') {
        console.log(`Video features for ${feature.id} already exist in database`);
        return;
      }
      console.warn('Non-fatal DB error saving video_features:', error);
      return;
    }

    console.log(`Saved video features for ${feature.id} to database`);
  } catch (error) {
    console.error(`Error saving video features for ${feature.id}:`, error);
    throw error;
  }
}

/**
 * Ensure directory exists, create if not
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Create the video_features table if it doesn't exist
 */
async function ensureVideoFeaturesTable(): Promise<void> {
  try {
    // Check if table exists
    const { error } = await supabaseClient
      .from('video_features')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      console.log('Creating video_features table...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS video_features (
          id TEXT PRIMARY KEY,
          frames_path TEXT NOT NULL,
          audio_path TEXT NOT NULL,
          ocr_text TEXT DEFAULT '',
          transcript TEXT DEFAULT '',
          duration_sec REAL NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_video_features_duration ON video_features(duration_sec);
      `;

      const { error: createError } = await supabaseClient.rpc('exec_sql', {
        query: createTableSQL
      });

      if (createError) {
        throw createError;
      }

      console.log('video_features table created successfully');
    }
  } catch (error) {
    console.error('Error ensuring video_features table:', error);
    throw error;
  }
}