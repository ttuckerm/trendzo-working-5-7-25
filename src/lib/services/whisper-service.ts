/**
 * Whisper Transcription Service
 *
 * Extracts audio from video and transcribes using OpenAI Whisper API
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Extract audio from video using FFmpeg
 */
export async function extractAudioFromVideo(
  videoPath: string,
  outputPath?: string
): Promise<string> {
  // Generate output path if not provided
  const audioPath = outputPath || videoPath.replace(/\.(mp4|mov|avi|webm)$/i, '.mp3');

  try {
    // Use ffmpeg to extract audio as mp3 with settings optimized for speech
    const { stderr } = await execPromise(
      `ffmpeg -loglevel error -i "${videoPath}" -vn -ar 16000 -ac 1 -b:a 32k "${audioPath}" -y`
    );

    if (stderr && stderr.length > 0) {
      console.warn(`FFmpeg warning: ${stderr}`);
    }

    // Verify audio file was created and has content
    if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size < 1000) {
      throw new Error('Audio extraction failed - output file missing or too small');
    }

    return audioPath;
  } catch (error: any) {
    throw new Error(`Audio extraction failed: ${error.message}`);
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioPath: string): Promise<string> {
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'text',
    });

    // Clean up audio file after transcription
    try {
      fs.unlinkSync(audioPath);
    } catch (cleanupError) {
      console.warn(`Failed to clean up audio file: ${audioPath}`);
    }

    return transcription as unknown as string;
  } catch (error: any) {
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
}

/**
 * Full pipeline: Extract audio and transcribe video
 *
 * @param videoPath - Path to the MP4 video file
 * @returns Transcribed text
 */
export async function transcribeVideo(videoPath: string): Promise<{
  transcript: string;
  processingTimeMs: number;
}> {
  const startTime = Date.now();

  // Step 1: Extract audio
  console.log(`🎤 Extracting audio from: ${videoPath}`);
  const audioPath = await extractAudioFromVideo(videoPath);
  console.log(`✅ Audio extracted: ${(fs.statSync(audioPath).size / 1024).toFixed(1)} KB`);

  // Step 2: Transcribe with Whisper
  console.log(`📝 Transcribing with Whisper API...`);
  const transcript = await transcribeAudio(audioPath);
  console.log(`✅ Transcription complete: ${transcript.length} characters`);

  const processingTimeMs = Date.now() - startTime;

  return {
    transcript,
    processingTimeMs
  };
}

/**
 * Estimate Whisper API cost based on audio duration
 * Whisper pricing: $0.006 per minute
 */
export function estimateWhisperCost(durationSeconds: number): number {
  const durationMinutes = durationSeconds / 60;
  return durationMinutes * 0.006;
}

export default {
  extractAudioFromVideo,
  transcribeAudio,
  transcribeVideo,
  estimateWhisperCost
};
