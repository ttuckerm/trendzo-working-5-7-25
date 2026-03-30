/**
 * Whisper Transcription Service
 *
 * Extracts audio from video and transcribes using OpenAI Whisper API.
 * Uses verbose_json format to get native segment-level confidence
 * (avg_log_prob, no_speech_prob) instead of relying on heuristics.
 *
 * WSP-003 fix: Switched from response_format 'text' to 'verbose_json'.
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

// ============================================================================
// Types
// ============================================================================

export interface WhisperSegment {
  text: string;
  start: number;
  end: number;
  avgLogProb: number;      // Native confidence: log probability (negative, closer to 0 = more confident)
  noSpeechProb: number;    // Probability that segment contains no speech (0-1)
  confidence: number;      // Derived: Math.exp(avgLogProb), 0-1 scale
}

export interface WhisperTranscriptionResult {
  transcript: string;
  processingTimeMs: number;
  segments: WhisperSegment[];
  nativeConfidence: number;       // Weighted average of segment confidences (0-1)
  noSpeechProbability: number;    // Average no_speech_prob across segments (0-1)
  language: string | null;        // Detected language
}

// ============================================================================
// Audio Extraction
// ============================================================================

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

// ============================================================================
// Transcription
// ============================================================================

/**
 * Transcribe audio using OpenAI Whisper API with verbose_json for native confidence.
 */
export async function transcribeAudio(audioPath: string): Promise<WhisperTranscriptionResult> {
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  const startTime = Date.now();

  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    // Clean up audio file after transcription
    try {
      fs.unlinkSync(audioPath);
    } catch (cleanupError) {
      console.warn(`Failed to clean up audio file: ${audioPath}`);
    }

    // Parse verbose_json response
    const verboseResult = response as any;
    const fullText: string = verboseResult.text || '';
    const rawSegments: any[] = verboseResult.segments || [];
    const detectedLanguage: string | null = verboseResult.language || null;

    // Extract segment-level confidence data
    const segments: WhisperSegment[] = rawSegments.map((seg: any) => {
      const avgLogProb = seg.avg_log_prob ?? -1;
      return {
        text: seg.text || '',
        start: seg.start ?? 0,
        end: seg.end ?? 0,
        avgLogProb,
        noSpeechProb: seg.no_speech_prob ?? 0,
        confidence: Math.exp(avgLogProb), // Convert log prob to 0-1 scale
      };
    });

    // Compute overall native confidence: duration-weighted average of segment confidences
    let nativeConfidence = 0;
    let noSpeechProbability = 0;

    if (segments.length > 0) {
      let totalDuration = 0;
      let weightedConfidence = 0;
      let weightedNoSpeech = 0;

      for (const seg of segments) {
        const duration = Math.max(0.01, seg.end - seg.start);
        totalDuration += duration;
        weightedConfidence += seg.confidence * duration;
        weightedNoSpeech += seg.noSpeechProb * duration;
      }

      if (totalDuration > 0) {
        nativeConfidence = weightedConfidence / totalDuration;
        noSpeechProbability = weightedNoSpeech / totalDuration;
      }
    }

    return {
      transcript: fullText,
      processingTimeMs: Date.now() - startTime,
      segments,
      nativeConfidence: parseFloat(Math.min(1, Math.max(0, nativeConfidence)).toFixed(3)),
      noSpeechProbability: parseFloat(Math.min(1, Math.max(0, noSpeechProbability)).toFixed(3)),
      language: detectedLanguage,
    };
  } catch (error: any) {
    throw new Error(`Whisper transcription failed: ${error.message}`);
  }
}

// ============================================================================
// Full Pipeline
// ============================================================================

/**
 * Full pipeline: Extract audio and transcribe video.
 *
 * Returns full WhisperTranscriptionResult with native confidence data.
 */
export async function transcribeVideo(videoPath: string): Promise<WhisperTranscriptionResult> {
  // Step 1: Extract audio
  console.log(`[Whisper] Extracting audio from: ${videoPath}`);
  const audioPath = await extractAudioFromVideo(videoPath);
  console.log(`[Whisper] Audio extracted: ${(fs.statSync(audioPath).size / 1024).toFixed(1)} KB`);

  // Step 2: Transcribe with Whisper (verbose_json)
  console.log(`[Whisper] Transcribing with Whisper API (verbose_json)...`);
  const result = await transcribeAudio(audioPath);
  console.log(`[Whisper] Transcription complete: ${result.transcript.length} chars, ${result.segments.length} segments, confidence: ${result.nativeConfidence.toFixed(2)}, no_speech: ${result.noSpeechProbability.toFixed(2)}`);

  return result;
}

// ============================================================================
// Utilities
// ============================================================================

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
