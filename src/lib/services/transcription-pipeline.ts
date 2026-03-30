/**
 * Transcription Pipeline Service
 *
 * Handles automatic transcript generation with fallback strategies:
 * 1. Use provided transcript if available
 * 2. Run Whisper transcription on video
 * 3. Fall back to pseudo-transcript from title/captions/scene summary
 * 4. Skip text-dependent components if no transcript possible
 */

import { transcribeVideo, type WhisperTranscriptionResult } from './whisper-service';
import * as fs from 'fs';

// ============================================================================
// Types
// ============================================================================

export type TranscriptSource =
  | 'user_provided'
  | 'whisper'
  | 'fallback_title'
  | 'fallback_captions'
  | 'fallback_scene'
  | 'none';

export interface TranscriptionResult {
  transcript: string | null;
  source: TranscriptSource;
  confidence: number; // 0-1: how reliable is this transcript
  processingTimeMs: number;
  skipped: boolean;
  skipped_reason?: string;
  whisperRaw?: string; // Original Whisper output before processing
  fallbackComponents?: string[]; // What was used to build fallback
  // Native Whisper confidence (WSP-003): available when source === 'whisper'
  nativeConfidence?: number;       // Duration-weighted avg of segment Math.exp(avg_log_prob)
  noSpeechProbability?: number;    // Duration-weighted avg of segment no_speech_prob
  // Whisper segments for downstream analysis (speaking rate variance)
  whisperSegments?: Array<{ start: number; end: number; text: string; avg_log_prob?: number; no_speech_prob?: number }>;
}

export interface TranscriptionPipelineOptions {
  videoPath?: string | null;
  userTranscript?: string | null;
  title?: string | null;
  description?: string | null;
  captions?: string | null;
  minTranscriptLength?: number; // Minimum chars for valid transcript (default: 10)
  minWhisperConfidence?: number; // Min confidence threshold (default: 0.3)
}

// ============================================================================
// Constants
// ============================================================================

const MIN_TRANSCRIPT_LENGTH = 10;
const MIN_WHISPER_WORD_COUNT = 3;
const WHISPER_EMPTY_THRESHOLD = 5; // chars

// ============================================================================
// Main Pipeline
// ============================================================================

/**
 * Run the transcription pipeline to obtain a transcript for video analysis.
 *
 * Priority order:
 * 1. User-provided transcript (if valid)
 * 2. Whisper transcription (if video available)
 * 3. Fallback from title/description
 * 4. Skip with reason
 */
export async function runTranscriptionPipeline(
  options: TranscriptionPipelineOptions
): Promise<TranscriptionResult> {
  const startTime = Date.now();
  const minLength = options.minTranscriptLength ?? MIN_TRANSCRIPT_LENGTH;

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1: Check user-provided transcript
  // ─────────────────────────────────────────────────────────────────────────
  if (options.userTranscript && options.userTranscript.trim().length >= minLength) {
    console.log('[TranscriptionPipeline] Using user-provided transcript');
    return {
      transcript: options.userTranscript.trim(),
      source: 'user_provided',
      confidence: 1.0,
      processingTimeMs: Date.now() - startTime,
      skipped: false,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2: Try Whisper transcription if video available
  // ─────────────────────────────────────────────────────────────────────────
  if (options.videoPath && fs.existsSync(options.videoPath)) {
    console.log('[TranscriptionPipeline] Running Whisper transcription...');

    try {
      const whisperResult = await transcribeVideo(options.videoPath);
      const whisperText = whisperResult.transcript?.trim() || '';

      // Check if Whisper produced valid output
      const wordCount = whisperText.split(/\s+/).filter(Boolean).length;

      if (whisperText.length >= WHISPER_EMPTY_THRESHOLD && wordCount >= MIN_WHISPER_WORD_COUNT) {
        console.log(`[TranscriptionPipeline] Whisper success: ${whisperText.length} chars, ${wordCount} words, native_confidence: ${whisperResult.nativeConfidence}, no_speech: ${whisperResult.noSpeechProbability}`);

        // Use native confidence from verbose_json when available, fall back to heuristic
        const confidence = whisperResult.nativeConfidence > 0
          ? whisperResult.nativeConfidence
          : calculateWhisperConfidence(whisperText, wordCount);

        return {
          transcript: whisperText,
          source: 'whisper',
          confidence,
          processingTimeMs: Date.now() - startTime,
          skipped: false,
          whisperRaw: whisperResult.transcript,
          nativeConfidence: whisperResult.nativeConfidence,
          noSpeechProbability: whisperResult.noSpeechProbability,
          // Pass segments for downstream speaking rate analysis (Batch B)
          whisperSegments: whisperResult.segments.map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text,
            avg_log_prob: seg.avgLogProb,
            no_speech_prob: seg.noSpeechProb,
          })),
        };
      }

      console.log('[TranscriptionPipeline] Whisper returned empty/low-content, trying fallback');
    } catch (error: any) {
      console.error('[TranscriptionPipeline] Whisper failed:', error.message);
      // Continue to fallback
    }
  } else if (options.videoPath) {
    console.log('[TranscriptionPipeline] Video path provided but file not found:', options.videoPath);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3: Build fallback pseudo-transcript from available signals
  // ─────────────────────────────────────────────────────────────────────────
  const fallbackResult = buildFallbackTranscript(options);

  if (fallbackResult.transcript && fallbackResult.transcript.length >= minLength) {
    console.log(`[TranscriptionPipeline] Using fallback transcript from: ${fallbackResult.sources.join(', ')}`);
    return {
      transcript: fallbackResult.transcript,
      source: fallbackResult.primarySource,
      confidence: 0.3, // Low confidence for fallback
      processingTimeMs: Date.now() - startTime,
      skipped: false,
      fallbackComponents: fallbackResult.sources,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step 4: No transcript available - skip text-dependent components
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[TranscriptionPipeline] No transcript available, skipping text-dependent analysis');

  const reason = !options.videoPath
    ? 'no_video_file'
    : !options.userTranscript && !options.title && !options.description
    ? 'no_text_signals'
    : 'silent_video_no_fallback';

  return {
    transcript: null,
    source: 'none',
    confidence: 0,
    processingTimeMs: Date.now() - startTime,
    skipped: true,
    skipped_reason: reason,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate confidence score for Whisper transcription based on output quality
 */
function calculateWhisperConfidence(text: string, wordCount: number): number {
  // Base confidence
  let confidence = 0.7;

  // Adjust based on word count (more words = more confident)
  if (wordCount >= 50) {
    confidence += 0.2;
  } else if (wordCount >= 20) {
    confidence += 0.1;
  } else if (wordCount < 10) {
    confidence -= 0.2;
  }

  // Adjust based on text patterns
  // If text has mostly punctuation or repeated chars, lower confidence
  const alphaRatio = (text.match(/[a-zA-Z]/g)?.length || 0) / text.length;
  if (alphaRatio < 0.5) {
    confidence -= 0.2;
  }

  // Check for common Whisper artifacts (repeated phrases, music notations)
  if (/(\[music\]|\[applause\]|♪|🎵)/i.test(text)) {
    confidence -= 0.1;
  }

  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Build a fallback transcript from title, description, and captions
 */
function buildFallbackTranscript(options: TranscriptionPipelineOptions): {
  transcript: string | null;
  sources: string[];
  primarySource: TranscriptSource;
} {
  const parts: string[] = [];
  const sources: string[] = [];

  // Use captions first if available (most reliable for speech content)
  if (options.captions && options.captions.trim().length > 0) {
    parts.push(options.captions.trim());
    sources.push('captions');
  }

  // Add title
  if (options.title && options.title.trim().length > 0) {
    parts.push(options.title.trim());
    sources.push('title');
  }

  // Add description (often contains the script for planned content)
  if (options.description && options.description.trim().length > 0) {
    // Clean up hashtags and mentions from description
    const cleanDesc = options.description
      .replace(/#\w+/g, '')
      .replace(/@\w+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanDesc.length > 20) {
      parts.push(cleanDesc);
      sources.push('description');
    }
  }

  if (parts.length === 0) {
    return { transcript: null, sources: [], primarySource: 'none' };
  }

  // Combine parts into pseudo-transcript
  const transcript = parts.join('\n\n');

  // Determine primary source
  let primarySource: TranscriptSource = 'none';
  if (sources.includes('captions')) {
    primarySource = 'fallback_captions';
  } else if (sources.includes('title')) {
    primarySource = 'fallback_title';
  } else {
    primarySource = 'fallback_scene';
  }

  return { transcript, sources, primarySource };
}

/**
 * Check if a transcript is valid for text-dependent analysis
 */
export function isTranscriptValid(result: TranscriptionResult): boolean {
  return !result.skipped && result.transcript !== null && result.transcript.length >= MIN_TRANSCRIPT_LENGTH;
}

/**
 * Get human-readable source description
 */
export function getTranscriptSourceLabel(source: TranscriptSource): string {
  switch (source) {
    case 'user_provided':
      return 'Manual Input';
    case 'whisper':
      return 'Whisper AI';
    case 'fallback_title':
      return 'Title/Description';
    case 'fallback_captions':
      return 'Captions';
    case 'fallback_scene':
      return 'Scene Analysis';
    case 'none':
      return 'None';
  }
}
