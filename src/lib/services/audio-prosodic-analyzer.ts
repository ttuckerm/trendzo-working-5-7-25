/**
 * Prosodic Analysis Engine
 *
 * Extracts research-backed audio intelligence signals from video audio tracks:
 * 1. Volume Dynamics (temporal loudness via ebur128)
 * 2. Pitch Range & Variability (F0 detection via pitchfinder YIN)
 * 3. Silence Pattern Mapping (temporal silencedetect)
 *
 * Does NOT score or classify — purely measurement. Scoring is the audio-analyzer's job.
 *
 * Created: 2026-03-08 (Batch B, Prompt 1)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import { createHash } from 'crypto';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

const execAsync = promisify(exec);

// Configure FFmpeg paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if ((ffprobeStatic as any)?.path) {
  ffmpeg.setFfprobePath((ffprobeStatic as any).path);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoudnessDataPoint {
  timestamp: number;
  loudness: number; // LUFS
}

export interface PitchDataPoint {
  timestamp: number;
  pitchHz: number;
}

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
}

export interface VolumeDynamics {
  loudnessMean: number;          // Average momentary loudness (LUFS)
  loudnessRange: number;         // LRA — difference between soft and loud passages
  loudnessVariance: number;      // Statistical variance of momentary loudness
  loudnessRateOfChange: number;  // Avg absolute diff between consecutive measurements
  hookLoudness: number;          // Ratio: avg loudness first 3s vs rest (>1.0 = hook louder)
  loudnessPeakCount: number;     // Local maxima above 1 stddev from mean
  dynamicRange: number;          // Max - min loudness (LUFS)
  loudnessTimeSeries: LoudnessDataPoint[];
}

export interface PitchAnalysis {
  pitchMean: number;             // Average detected pitch (Hz)
  pitchRange: number;            // Max - min pitch (Hz)
  pitchVariance: number;         // Statistical variance of pitch values
  pitchStdDev: number;           // Standard deviation (Hz)
  pitchContourSlope: number;     // Linear regression slope (positive = rising energy)
  hookPitchMean: number;         // Ratio: avg pitch first 3s vs rest
  pitchPeakCount: number;        // Local maxima count
  pitchTimeSeries: PitchDataPoint[];
  voicedRatio: number;           // 0-1: fraction of frames with detected pitch
  method: 'yin' | 'spectral_centroid'; // Which method was used
}

export interface SilencePatternAnalysis {
  silenceSegments: SilenceSegment[];
  silenceCount: number;
  silenceTotalDuration: number;
  silenceRatio: number;          // Total silence / video duration
  silenceMeanGap: number;        // Average silence gap length (seconds)
  silenceMaxGap: number;         // Longest silence gap (seconds)
  silenceVariance: number;       // Variance of gap lengths
  hookSilenceRatio: number;      // Silence in first 3s / 3
  silencePattern: 'rhythmic' | 'front-loaded' | 'back-loaded' | 'scattered' | 'minimal';
  speechToSilenceTransitions: number;
}

export interface ProsodicAnalysisResult {
  success: boolean;
  latencyMs: number;
  videoDuration: number;         // seconds

  volumeDynamics: VolumeDynamics | null;
  pitchAnalysis: PitchAnalysis | null;
  silencePatterns: SilencePatternAnalysis | null;

  errors: string[];              // Per-section errors (partial results possible)
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SAMPLE_RATE = 16000;
const HOOK_DURATION = 3; // seconds
const SILENCE_THRESHOLD_DB = -40;
const SILENCE_MIN_DURATION = 0.5;
const PITCH_WINDOW_SIZE = 2048;  // ~128ms at 16kHz
const PITCH_HOP_SIZE = 512;     // ~32ms at 16kHz

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Analyze prosodic features of a video's audio track.
 *
 * Runs 2-3 FFmpeg commands:
 * 1. ebur128 on video directly (volume dynamics)
 * 2. Extract audio as 16-bit PCM WAV (shared for pitch + silence)
 * 3. silencedetect on extracted WAV
 *
 * Pitch detection uses pitchfinder YIN on the extracted WAV buffer.
 */
export async function analyzeProsody(videoPath: string): Promise<ProsodicAnalysisResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let wavPath: string | null = null;

  let volumeDynamics: VolumeDynamics | null = null;
  let pitchAnalysis: PitchAnalysis | null = null;
  let silencePatterns: SilencePatternAnalysis | null = null;
  let videoDuration = 0;

  try {
    // Get video duration first (needed for ratios)
    videoDuration = await getVideoDuration(videoPath);

    // Run ebur128 and WAV extraction in parallel — they're independent
    const [ebur128Result, extractedWavPath] = await Promise.all([
      runEbur128(videoPath).catch((err) => {
        errors.push(`Volume dynamics failed: ${err.message}`);
        return null;
      }),
      extractWav(videoPath).catch((err) => {
        errors.push(`WAV extraction failed: ${err.message}`);
        return null;
      }),
    ]);

    wavPath = extractedWavPath;

    // Process ebur128 results
    if (ebur128Result) {
      try {
        volumeDynamics = computeVolumeDynamics(ebur128Result, videoDuration);
      } catch (err: any) {
        errors.push(`Volume dynamics computation failed: ${err.message}`);
      }
    }

    // Run pitch and silence analysis on the extracted WAV (sequentially — both read the file)
    if (wavPath) {
      // Pitch analysis
      try {
        pitchAnalysis = await analyzePitch(wavPath, videoDuration);
      } catch (err: any) {
        errors.push(`Pitch analysis failed: ${err.message}`);
        // Fallback to spectral centroid
        try {
          console.log('[ProsodicAnalyzer] Falling back to spectral centroid for pitch');
          pitchAnalysis = await analyzePitchSpectralFallback(videoPath, videoDuration);
        } catch (fallbackErr: any) {
          errors.push(`Pitch spectral fallback also failed: ${fallbackErr.message}`);
        }
      }

      // Silence analysis
      try {
        silencePatterns = await analyzeSilencePatterns(wavPath, videoDuration);
      } catch (err: any) {
        errors.push(`Silence analysis failed: ${err.message}`);
      }
    }

    const latencyMs = Date.now() - startTime;
    console.log(`[ProsodicAnalyzer] Complete in ${latencyMs}ms — volume: ${volumeDynamics ? 'OK' : 'FAILED'}, pitch: ${pitchAnalysis ? 'OK' : 'FAILED'}, silence: ${silencePatterns ? 'OK' : 'FAILED'}`);

    return {
      success: volumeDynamics !== null || pitchAnalysis !== null || silencePatterns !== null,
      latencyMs,
      videoDuration,
      volumeDynamics,
      pitchAnalysis,
      silencePatterns,
      errors,
    };
  } catch (err: any) {
    errors.push(`Fatal error: ${err.message}`);
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      videoDuration,
      volumeDynamics,
      pitchAnalysis,
      silencePatterns,
      errors,
    };
  } finally {
    // Always clean up temp WAV
    if (wavPath) {
      await unlink(wavPath).catch(() => {});
    }
  }
}

// ─── Video Duration ───────────────────────────────────────────────────────────

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err: Error | null, metadata: any) => {
      if (err) return reject(new Error(`ffprobe failed: ${err.message}`));
      resolve(metadata.format.duration || 0);
    });
  });
}

// ─── WAV Extraction ───────────────────────────────────────────────────────────

function getTempPath(prefix: string, ext: string): string {
  const hash = createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8);
  const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
  return path.join(tempDir, `${prefix}_${hash}.${ext}`);
}

async function extractWav(videoPath: string): Promise<string> {
  const outputPath = getTempPath('prosodic', 'wav');
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioFrequency(SAMPLE_RATE)
      .audioChannels(1)
      .format('wav')
      .output(outputPath)
      .on('end', () => {
        console.log('[ProsodicAnalyzer] WAV extracted');
        resolve(outputPath);
      })
      .on('error', (err: Error) => reject(new Error(`WAV extraction failed: ${err.message}`)))
      .run();
  });
}

// ─── Section 1: Volume Dynamics (ebur128) ─────────────────────────────────────

interface Ebur128RawData {
  momentaryLoudness: LoudnessDataPoint[];
  shortTermLoudness: LoudnessDataPoint[];
}

async function runEbur128(videoPath: string): Promise<Ebur128RawData> {
  return new Promise((resolve, reject) => {
    const momentary: LoudnessDataPoint[] = [];
    const shortTerm: LoudnessDataPoint[] = [];

    // ebur128 regex: matches lines like:
    // [Parsed_ebur128_0 @ 0x...] t: 0.4     TARGET:-23 LUFS    M: -22.3 S: -24.1     I: -23.0 LUFS     LRA:   5.2 LU
    const ebur128Regex = /\[Parsed_ebur128_0\s+@\s+\S+\]\s+t:\s*([\d.]+)\s+.*?M:\s*([-\d.]+)\s+S:\s*([-\d.]+)/;

    ffmpeg(videoPath)
      .audioFilters('ebur128=peak=true')
      .format('null')
      .output('-')
      .on('start', (cmd: string) => {
        console.log('[ProsodicAnalyzer] ebur128 command:', cmd);
      })
      .on('stderr', (line: string) => {
        const match = line.match(ebur128Regex);
        if (match) {
          const timestamp = parseFloat(match[1]);
          const m = parseFloat(match[2]);
          const s = parseFloat(match[3]);

          // Filter out -inf or absurd values
          if (isFinite(m) && m > -120) {
            momentary.push({ timestamp, loudness: m });
          }
          if (isFinite(s) && s > -120) {
            shortTerm.push({ timestamp, loudness: s });
          }
        }
      })
      .on('end', () => {
        console.log(`[ProsodicAnalyzer] ebur128 parsed ${momentary.length} momentary, ${shortTerm.length} short-term readings`);
        resolve({ momentaryLoudness: momentary, shortTermLoudness: shortTerm });
      })
      .on('error', (err: Error) => reject(new Error(`ebur128 failed: ${err.message}`)))
      .run();
  });
}

function computeVolumeDynamics(raw: Ebur128RawData, videoDuration: number): VolumeDynamics {
  const series = raw.momentaryLoudness;

  if (series.length === 0) {
    throw new Error('No momentary loudness data from ebur128');
  }

  const values = series.map((p) => p.loudness);

  // Basic statistics
  const loudnessMean = mean(values);
  const loudnessVariance = variance(values, loudnessMean);
  const stdDev = Math.sqrt(loudnessVariance);
  const minLoudness = Math.min(...values);
  const maxLoudness = Math.max(...values);
  const dynamicRange = maxLoudness - minLoudness;

  // LRA approximation: difference between 95th and 10th percentile
  const sorted = [...values].sort((a, b) => a - b);
  const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? minLoudness;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? maxLoudness;
  const loudnessRange = p95 - p10;

  // Rate of change: average absolute difference between consecutive measurements
  let rateOfChangeSum = 0;
  for (let i = 1; i < values.length; i++) {
    rateOfChangeSum += Math.abs(values[i] - values[i - 1]);
  }
  const loudnessRateOfChange = values.length > 1 ? rateOfChangeSum / (values.length - 1) : 0;

  // Hook loudness ratio: first 3s vs rest
  const hookPoints = series.filter((p) => p.timestamp <= HOOK_DURATION);
  const restPoints = series.filter((p) => p.timestamp > HOOK_DURATION);
  let hookLoudness = 1.0; // default: equal
  if (hookPoints.length > 0 && restPoints.length > 0) {
    const hookMean = mean(hookPoints.map((p) => p.loudness));
    const restMean = mean(restPoints.map((p) => p.loudness));
    // Convert LUFS difference to ratio — LUFS are logarithmic, so we use dB-to-ratio
    // A 10 LUFS difference = 10x power. hookLoudness > 1 means hook is louder.
    // Simple approach: ratio of linear values. 10^(LUFS/20) for amplitude.
    if (restMean < -100) {
      hookLoudness = hookMean > -100 ? 2.0 : 1.0; // rest is near-silent
    } else {
      hookLoudness = Math.pow(10, (hookMean - restMean) / 20);
    }
  }

  // Peak count: local maxima above 1 stddev from mean
  const threshold = loudnessMean + stdDev;
  let loudnessPeakCount = 0;
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] > threshold && values[i] > values[i - 1] && values[i] > values[i + 1]) {
      loudnessPeakCount++;
    }
  }

  return {
    loudnessMean: round(loudnessMean, 2),
    loudnessRange: round(loudnessRange, 2),
    loudnessVariance: round(loudnessVariance, 2),
    loudnessRateOfChange: round(loudnessRateOfChange, 2),
    hookLoudness: round(hookLoudness, 3),
    loudnessPeakCount,
    dynamicRange: round(dynamicRange, 2),
    loudnessTimeSeries: series,
  };
}

// ─── Section 2: Pitch Analysis (pitchfinder YIN) ─────────────────────────────

async function analyzePitch(wavPath: string, videoDuration: number): Promise<PitchAnalysis> {
  // Dynamically import pitchfinder (it may not be installed)
  let YIN: typeof import('pitchfinder').YIN;
  try {
    const pitchfinder = await import('pitchfinder');
    YIN = pitchfinder.YIN;
  } catch {
    throw new Error('pitchfinder not available — install with: npm install pitchfinder');
  }

  console.log('[ProsodicAnalyzer] Reading WAV for pitch analysis...');
  const wavBuffer = await readFile(wavPath);

  // Parse WAV: skip 44-byte header, read as Int16Array, normalize to Float32
  const headerSize = 44;
  if (wavBuffer.length <= headerSize) {
    throw new Error('WAV file too small — no audio data');
  }

  const int16Data = new Int16Array(
    wavBuffer.buffer,
    wavBuffer.byteOffset + headerSize,
    Math.floor((wavBuffer.length - headerSize) / 2)
  );

  const float32Data = new Float32Array(int16Data.length);
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }

  console.log(`[ProsodicAnalyzer] PCM samples: ${float32Data.length} (${(float32Data.length / SAMPLE_RATE).toFixed(1)}s at ${SAMPLE_RATE}Hz)`);

  // Create YIN detector
  const detector = YIN({ sampleRate: SAMPLE_RATE, threshold: 0.15 });

  // Process in overlapping windows
  const timeSeries: PitchDataPoint[] = [];
  let totalFrames = 0;
  let voicedFrames = 0;

  for (let offset = 0; offset + PITCH_WINDOW_SIZE <= float32Data.length; offset += PITCH_HOP_SIZE) {
    const window = float32Data.subarray(offset, offset + PITCH_WINDOW_SIZE);
    const pitch = detector(window);
    totalFrames++;

    if (pitch !== null && pitch > 50 && pitch < 600) {
      // Human speech range: ~50-600 Hz
      voicedFrames++;
      const timestamp = offset / SAMPLE_RATE;
      timeSeries.push({ timestamp, pitchHz: round(pitch, 1) });
    }
  }

  if (timeSeries.length < 3) {
    throw new Error(`Insufficient pitch data: only ${timeSeries.length} voiced frames detected`);
  }

  const pitchValues = timeSeries.map((p) => p.pitchHz);
  const pitchMean = mean(pitchValues);
  const pitchVar = variance(pitchValues, pitchMean);
  const pitchStdDev = Math.sqrt(pitchVar);
  const minPitch = Math.min(...pitchValues);
  const maxPitch = Math.max(...pitchValues);
  const pitchRange = maxPitch - minPitch;

  // Linear regression slope of pitch over time
  const pitchContourSlope = linearRegressionSlope(
    timeSeries.map((p) => p.timestamp),
    pitchValues
  );

  // Hook pitch ratio: first 3s vs rest
  const hookPitchPoints = timeSeries.filter((p) => p.timestamp <= HOOK_DURATION);
  const restPitchPoints = timeSeries.filter((p) => p.timestamp > HOOK_DURATION);
  let hookPitchMean = 1.0;
  if (hookPitchPoints.length > 0 && restPitchPoints.length > 0) {
    const hookMean = mean(hookPitchPoints.map((p) => p.pitchHz));
    const restMean = mean(restPitchPoints.map((p) => p.pitchHz));
    hookPitchMean = restMean > 0 ? hookMean / restMean : 1.0;
  }

  // Peak count: local maxima in pitch
  let pitchPeakCount = 0;
  for (let i = 1; i < pitchValues.length - 1; i++) {
    if (pitchValues[i] > pitchValues[i - 1] && pitchValues[i] > pitchValues[i + 1]) {
      pitchPeakCount++;
    }
  }

  const voicedRatio = totalFrames > 0 ? voicedFrames / totalFrames : 0;

  console.log(`[ProsodicAnalyzer] Pitch: ${timeSeries.length} voiced frames, mean=${round(pitchMean, 1)}Hz, range=${round(pitchRange, 1)}Hz, voiced=${round(voicedRatio * 100, 1)}%`);

  return {
    pitchMean: round(pitchMean, 1),
    pitchRange: round(pitchRange, 1),
    pitchVariance: round(pitchVar, 2),
    pitchStdDev: round(pitchStdDev, 1),
    pitchContourSlope: round(pitchContourSlope, 4),
    hookPitchMean: round(hookPitchMean, 3),
    pitchPeakCount,
    pitchTimeSeries: timeSeries,
    voicedRatio: round(voicedRatio, 3),
    method: 'yin',
  };
}

/**
 * Fallback: Use FFmpeg aspectralstats centroid as a pitch proxy.
 * Less accurate than YIN but zero external dependencies.
 */
async function analyzePitchSpectralFallback(videoPath: string, videoDuration: number): Promise<PitchAnalysis> {
  console.log('[ProsodicAnalyzer] Using spectral centroid fallback for pitch');

  const timeSeries: PitchDataPoint[] = [];

  await new Promise<void>((resolve, reject) => {
    // aspectralstats outputs metadata per audio frame
    const centroidRegex = /lavfi\.aspectralstats\.1\.centroid=([\d.]+)/;
    let frameTime = 0;
    const frameStep = 0.023; // ~23ms per audio frame at default settings

    ffmpeg(videoPath)
      .audioFilters('aspectralstats=measure=centroid')
      .format('null')
      .output('-')
      .on('stderr', (line: string) => {
        const match = line.match(centroidRegex);
        if (match) {
          const centroid = parseFloat(match[1]);
          // Spectral centroid for speech is typically 500-4000 Hz
          // Map to rough F0 proxy: centroid/4 puts it in speech F0 range
          if (isFinite(centroid) && centroid > 100) {
            timeSeries.push({ timestamp: round(frameTime, 3), pitchHz: round(centroid, 1) });
          }
          frameTime += frameStep;
        }
      })
      .on('end', resolve)
      .on('error', (err: Error) => reject(new Error(`aspectralstats failed: ${err.message}`)))
      .run();
  });

  if (timeSeries.length < 3) {
    throw new Error(`Insufficient spectral data: only ${timeSeries.length} frames`);
  }

  const pitchValues = timeSeries.map((p) => p.pitchHz);
  const pitchMean = mean(pitchValues);
  const pitchVar = variance(pitchValues, pitchMean);
  const pitchStdDev = Math.sqrt(pitchVar);
  const minPitch = Math.min(...pitchValues);
  const maxPitch = Math.max(...pitchValues);
  const pitchRange = maxPitch - minPitch;

  const pitchContourSlope = linearRegressionSlope(
    timeSeries.map((p) => p.timestamp),
    pitchValues
  );

  const hookPitchPoints = timeSeries.filter((p) => p.timestamp <= HOOK_DURATION);
  const restPitchPoints = timeSeries.filter((p) => p.timestamp > HOOK_DURATION);
  let hookPitchMean = 1.0;
  if (hookPitchPoints.length > 0 && restPitchPoints.length > 0) {
    hookPitchMean = mean(hookPitchPoints.map((p) => p.pitchHz)) / mean(restPitchPoints.map((p) => p.pitchHz));
  }

  let pitchPeakCount = 0;
  for (let i = 1; i < pitchValues.length - 1; i++) {
    if (pitchValues[i] > pitchValues[i - 1] && pitchValues[i] > pitchValues[i + 1]) {
      pitchPeakCount++;
    }
  }

  // voicedRatio not meaningful for spectral centroid — set to 1.0 (all frames analyzed)
  return {
    pitchMean: round(pitchMean, 1),
    pitchRange: round(pitchRange, 1),
    pitchVariance: round(pitchVar, 2),
    pitchStdDev: round(pitchStdDev, 1),
    pitchContourSlope: round(pitchContourSlope, 4),
    hookPitchMean: round(hookPitchMean, 3),
    pitchPeakCount,
    pitchTimeSeries: timeSeries,
    voicedRatio: 1.0,
    method: 'spectral_centroid',
  };
}

// ─── Section 3: Silence Pattern Mapping ───────────────────────────────────────

async function analyzeSilencePatterns(wavPath: string, videoDuration: number): Promise<SilencePatternAnalysis> {
  const segments: SilenceSegment[] = [];
  let speechToSilenceTransitions = 0;

  await new Promise<void>((resolve, reject) => {
    // Track silence_start and silence_end events to build complete segments
    let currentSilenceStart: number | null = null;

    const silenceStartRegex = /silence_start:\s*([\d.]+)/;
    const silenceEndRegex = /silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/;

    ffmpeg(wavPath)
      .audioFilters(`silencedetect=n=${SILENCE_THRESHOLD_DB}dB:d=${SILENCE_MIN_DURATION}`)
      .format('null')
      .output('-')
      .on('start', (cmd: string) => {
        console.log('[ProsodicAnalyzer] silencedetect command:', cmd);
      })
      .on('stderr', (line: string) => {
        const startMatch = line.match(silenceStartRegex);
        if (startMatch) {
          currentSilenceStart = parseFloat(startMatch[1]);
          speechToSilenceTransitions++;
        }

        const endMatch = line.match(silenceEndRegex);
        if (endMatch) {
          const end = parseFloat(endMatch[1]);
          const duration = parseFloat(endMatch[2]);
          const start = currentSilenceStart ?? (end - duration);
          segments.push({
            start: round(start, 3),
            end: round(end, 3),
            duration: round(duration, 3),
          });
          currentSilenceStart = null;
        }
      })
      .on('end', () => {
        // Handle trailing silence (started but never ended)
        if (currentSilenceStart !== null && videoDuration > 0) {
          const duration = videoDuration - currentSilenceStart;
          if (duration >= SILENCE_MIN_DURATION) {
            segments.push({
              start: round(currentSilenceStart, 3),
              end: round(videoDuration, 3),
              duration: round(duration, 3),
            });
          }
        }
        console.log(`[ProsodicAnalyzer] silencedetect found ${segments.length} segments`);
        resolve();
      })
      .on('error', (err: Error) => reject(new Error(`silencedetect failed: ${err.message}`)))
      .run();
  });

  // Compute metrics
  const silenceCount = segments.length;
  const durations = segments.map((s) => s.duration);
  const silenceTotalDuration = durations.reduce((sum, d) => sum + d, 0);
  const silenceRatio = videoDuration > 0 ? silenceTotalDuration / videoDuration : 0;
  const silenceMeanGap = silenceCount > 0 ? silenceTotalDuration / silenceCount : 0;
  const silenceMaxGap = silenceCount > 0 ? Math.max(...durations) : 0;
  const silenceVar = silenceCount > 1 ? variance(durations, silenceMeanGap) : 0;

  // Hook silence: how much of first 3s is silent
  const hookSilence = segments.reduce((sum, s) => {
    if (s.start >= HOOK_DURATION) return sum;
    const overlapStart = Math.max(s.start, 0);
    const overlapEnd = Math.min(s.end, HOOK_DURATION);
    return sum + Math.max(0, overlapEnd - overlapStart);
  }, 0);
  const hookSilenceRatio = HOOK_DURATION > 0 ? hookSilence / HOOK_DURATION : 0;

  // Classify silence pattern
  const silencePattern = classifySilencePattern(segments, silenceRatio, silenceVar, videoDuration);

  return {
    silenceSegments: segments,
    silenceCount,
    silenceTotalDuration: round(silenceTotalDuration, 3),
    silenceRatio: round(silenceRatio, 4),
    silenceMeanGap: round(silenceMeanGap, 3),
    silenceMaxGap: round(silenceMaxGap, 3),
    silenceVariance: round(silenceVar, 4),
    hookSilenceRatio: round(hookSilenceRatio, 4),
    silencePattern,
    speechToSilenceTransitions,
  };
}

function classifySilencePattern(
  segments: SilenceSegment[],
  silenceRatio: number,
  silenceVariance: number,
  videoDuration: number
): SilencePatternAnalysis['silencePattern'] {
  if (silenceRatio < 0.05) return 'minimal';
  if (segments.length === 0) return 'minimal';

  // Check front-loaded vs back-loaded
  const midpoint = videoDuration / 2;
  const firstHalfSilence = segments
    .filter((s) => s.start < midpoint)
    .reduce((sum, s) => sum + Math.min(s.duration, midpoint - s.start), 0);
  const secondHalfSilence = segments
    .filter((s) => s.end > midpoint)
    .reduce((sum, s) => sum + Math.min(s.duration, s.end - Math.max(s.start, midpoint)), 0);
  const totalSilence = firstHalfSilence + secondHalfSilence;

  if (totalSilence > 0) {
    const firstHalfRatio = firstHalfSilence / totalSilence;
    if (firstHalfRatio > 0.7) return 'front-loaded';
    if (firstHalfRatio < 0.3) return 'back-loaded';
  }

  // Rhythmic: low variance in gap lengths (coefficient of variation < 0.5)
  const meanGap = segments.reduce((s, seg) => s + seg.duration, 0) / segments.length;
  if (meanGap > 0) {
    const cv = Math.sqrt(silenceVariance) / meanGap;
    if (cv < 0.5 && segments.length >= 3) return 'rhythmic';
  }

  return 'scattered';
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
