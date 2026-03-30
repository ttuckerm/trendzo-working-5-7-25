/**
 * Speaking Rate Variance Analyzer
 *
 * Computes actual words-per-minute per Whisper segment and its variance
 * throughout the video. High WPM variance = dynamic speaker (speeds up
 * for excitement, slows for emphasis). Low variance = monotone pacing.
 *
 * Requires Whisper verbose_json segments (WSP-003).
 *
 * Created: 2026-03-08 (Batch B, Prompt 2, Part A)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Matches the WhisperSegment type from whisper-service.ts (verbose_json format).
 * Defined locally to avoid coupling — the caller maps from their Whisper result.
 */
export interface WhisperSegment {
  start: number;         // seconds
  end: number;           // seconds
  text: string;
  avg_log_prob?: number;
  no_speech_prob?: number;
}

export interface SegmentWpm {
  start: number;
  end: number;
  wpm: number;
  wordCount: number;
}

export interface SpeakingRateResult {
  success: boolean;

  // Core metrics
  overallWpm: number;           // Total words / total speech duration * 60
  segmentWpms: SegmentWpm[];    // Per-segment WPM

  // Statistical measures
  wpmMean: number;              // Average of segment WPMs
  wpmVariance: number;          // Variance — THE key signal
  wpmStdDev: number;            // Standard deviation
  wpmRange: number;             // Max - min segment WPM

  // Dynamics
  wpmAcceleration: number;      // Linear regression slope over segment index (+= speeding up)
  hookWpm: number;              // Ratio: WPM in first 3s / overall WPM (>1.0 = fast hook)

  // Emphasis detection
  wpmPeakCount: number;         // Segments > 1 std dev above mean
  slowSegments: number;         // Segments below 100 WPM
  fastSegments: number;         // Segments above 180 WPM

  // Classification
  paceCategory: 'dynamic' | 'consistently-fast' | 'consistently-slow' | 'accelerating' | 'decelerating';

  // Metadata
  totalWords: number;
  totalSpeechDuration: number;  // Excludes silence/empty segments
  segmentsAnalyzed: number;
  segmentsSkipped: number;      // Empty/no-word segments excluded
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOOK_DURATION = 3; // seconds
const SLOW_WPM_THRESHOLD = 100;
const FAST_WPM_THRESHOLD = 180;
const MIN_SEGMENT_DURATION = 0.1; // seconds — ignore sub-100ms segments

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Analyze speaking rate dynamics from Whisper verbose_json segments.
 *
 * @param segments - Whisper segments with start, end, text
 * @param totalDuration - Total video duration in seconds (for context, not for WPM calc)
 */
export function analyzeSpeakingRate(
  segments: WhisperSegment[],
  totalDuration: number
): SpeakingRateResult {
  if (!segments || segments.length === 0) {
    return emptyResult();
  }

  // Filter to segments with actual words and valid duration
  const validSegments: Array<WhisperSegment & { wordCount: number; duration: number }> = [];
  let skipped = 0;

  for (const seg of segments) {
    const words = countWords(seg.text);
    const duration = Math.max(0, seg.end - seg.start);

    if (words === 0 || duration < MIN_SEGMENT_DURATION) {
      skipped++;
      continue;
    }

    validSegments.push({ ...seg, wordCount: words, duration });
  }

  if (validSegments.length === 0) {
    return emptyResult(skipped);
  }

  // Compute per-segment WPM
  const segmentWpms: SegmentWpm[] = validSegments.map((seg) => ({
    start: round(seg.start, 3),
    end: round(seg.end, 3),
    wpm: round((seg.wordCount / seg.duration) * 60, 1),
    wordCount: seg.wordCount,
  }));

  const wpmValues = segmentWpms.map((s) => s.wpm);

  // Overall WPM: total words / total speech duration
  const totalWords = validSegments.reduce((sum, s) => sum + s.wordCount, 0);
  const totalSpeechDuration = validSegments.reduce((sum, s) => sum + s.duration, 0);
  const overallWpm = totalSpeechDuration > 0 ? round((totalWords / totalSpeechDuration) * 60, 1) : 0;

  // Statistical measures
  const wpmMean = mean(wpmValues);
  const wpmVar = validSegments.length >= 3 ? variance(wpmValues, wpmMean) : 0;
  const wpmStdDev = Math.sqrt(wpmVar);
  const wpmRange = wpmValues.length > 0 ? Math.max(...wpmValues) - Math.min(...wpmValues) : 0;

  // Acceleration: linear regression slope of WPM over segment index
  const wpmAcceleration = validSegments.length >= 3
    ? linearRegressionSlope(
        wpmValues.map((_, i) => i),
        wpmValues
      )
    : 0;

  // Hook WPM: ratio of WPM in first 3s vs overall
  const hookSegments = segmentWpms.filter((s) => s.start < HOOK_DURATION);
  let hookWpm = 1.0;
  if (hookSegments.length > 0 && overallWpm > 0) {
    const hookWords = hookSegments.reduce((sum, s) => sum + s.wordCount, 0);
    // Duration of hook segments, capped at HOOK_DURATION
    const hookDuration = hookSegments.reduce((sum, s) => {
      const segEnd = Math.min(s.end, HOOK_DURATION);
      const segStart = Math.max(s.start, 0);
      return sum + Math.max(0, segEnd - segStart);
    }, 0);
    const hookWpmValue = hookDuration > 0 ? (hookWords / hookDuration) * 60 : 0;
    hookWpm = hookWpmValue / overallWpm;
  }

  // Peak detection
  const peakThreshold = wpmMean + wpmStdDev;
  const wpmPeakCount = wpmStdDev > 0 ? wpmValues.filter((w) => w > peakThreshold).length : 0;

  // Speed segment counts
  const slowSegments = wpmValues.filter((w) => w < SLOW_WPM_THRESHOLD).length;
  const fastSegments = wpmValues.filter((w) => w > FAST_WPM_THRESHOLD).length;

  // Classify pace
  const paceCategory = classifyPace(wpmMean, wpmVar, wpmStdDev, wpmAcceleration, slowSegments, fastSegments, validSegments.length);

  return {
    success: true,
    overallWpm,
    segmentWpms,
    wpmMean: round(wpmMean, 1),
    wpmVariance: round(wpmVar, 2),
    wpmStdDev: round(wpmStdDev, 1),
    wpmRange: round(wpmRange, 1),
    wpmAcceleration: round(wpmAcceleration, 3),
    hookWpm: round(hookWpm, 3),
    wpmPeakCount,
    slowSegments,
    fastSegments,
    paceCategory,
    totalWords,
    totalSpeechDuration: round(totalSpeechDuration, 2),
    segmentsAnalyzed: validSegments.length,
    segmentsSkipped: skipped,
  };
}

// ─── Pace Classification ──────────────────────────────────────────────────────

function classifyPace(
  wpmMean: number,
  wpmVariance: number,
  wpmStdDev: number,
  acceleration: number,
  slowCount: number,
  fastCount: number,
  totalSegments: number
): SpeakingRateResult['paceCategory'] {
  // Coefficient of variation: stddev / mean — measures relative variability
  const cv = wpmMean > 0 ? wpmStdDev / wpmMean : 0;

  // Strong acceleration/deceleration overrides other categories
  // Threshold: >2 WPM change per segment index
  if (totalSegments >= 3 && Math.abs(acceleration) > 2) {
    if (acceleration > 2) return 'accelerating';
    if (acceleration < -2) return 'decelerating';
  }

  // High variability with mix of fast and slow = dynamic
  if (cv > 0.25 && slowCount > 0 && fastCount > 0) return 'dynamic';
  if (cv > 0.3) return 'dynamic'; // High CV alone = dynamic

  // Low variability = consistent
  if (cv <= 0.25) {
    if (wpmMean >= 160) return 'consistently-fast';
    if (wpmMean <= 120) return 'consistently-slow';
  }

  // Default: dynamic if high variance, otherwise based on mean
  if (cv > 0.2) return 'dynamic';
  if (wpmMean >= 150) return 'consistently-fast';
  return 'consistently-slow';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  if (!text) return 0;
  // Strip common Whisper artifacts before counting
  const cleaned = text
    .replace(/\[.*?\]/g, '')           // [music], [applause], etc.
    .replace(/[♪🎵🎶]/g, '')           // music symbols
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length === 0) return 0;
  return cleaned.split(/\s+/).length;
}

function emptyResult(skipped = 0): SpeakingRateResult {
  return {
    success: false,
    overallWpm: 0,
    segmentWpms: [],
    wpmMean: 0,
    wpmVariance: 0,
    wpmStdDev: 0,
    wpmRange: 0,
    wpmAcceleration: 0,
    hookWpm: 1.0,
    wpmPeakCount: 0,
    slowSegments: 0,
    fastSegments: 0,
    paceCategory: 'consistently-slow',
    totalWords: 0,
    totalSpeechDuration: 0,
    segmentsAnalyzed: 0,
    segmentsSkipped: skipped,
  };
}

// ─── Math Utilities ───────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function variance(values: number[], avg?: number): number {
  if (values.length < 2) return 0;
  const m = avg ?? mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
}

function linearRegressionSlope(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const xMean = mean(x);
  const yMean = mean(y);

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - xMean;
    numerator += dx * (y[i] - yMean);
    denominator += dx * dx;
  }

  return denominator === 0 ? 0 : numerator / denominator;
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
