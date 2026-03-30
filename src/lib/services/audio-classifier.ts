/**
 * Audio Content Classifier & Fingerprinting
 *
 * Two capabilities:
 * 1. Music-vs-Speech Segmentation — classify whether audio is speech, music,
 *    speech-over-music, mixed, or silent using short-term energy variance heuristics.
 * 2. Audio Fingerprinting — generate a spectral fingerprint for sound clustering
 *    during training correlation (videos with same background music get grouped).
 *
 * Created: 2026-03-08 (Batch B, Prompt 2, Parts B1 + B3)
 */

import { createHash } from 'crypto';
import path from 'path';
import { unlink } from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Configure FFmpeg paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if ((ffprobeStatic as any)?.path) {
  ffmpeg.setFfprobePath((ffprobeStatic as any).path);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AudioType = 'speech-only' | 'music-only' | 'speech-over-music' | 'mixed' | 'silent';

export interface AudioClassification {
  success: boolean;
  musicRatio: number;                    // 0-1: estimated fraction that is music
  speechRatio: number;                   // 0-1: estimated fraction that is speech
  hasBothMusicAndSpeech: boolean;        // voiceover with background music
  audioType: AudioType;
  latencyMs: number;

  // Raw analysis data
  windowCount: number;                   // Number of 500ms windows analyzed
  avgRmsEnergy: number;                  // Average RMS across all windows
  energyVarianceNormalized: number;      // Normalized energy variance (0-1 scale)
  zeroCrossingRateAvg: number;           // Average zero-crossing rate

  error?: string;
}

export interface AudioFingerprintResult {
  success: boolean;
  fingerprint: string;                   // Hex string
  fingerprintMethod: 'spectral_centroid'; // Method used
  durationAnalyzed: number;              // Seconds of audio analyzed
  latencyMs: number;
  error?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_DURATION_MS = 500;  // 500ms analysis windows
const FINGERPRINT_DURATION = 30; // First 30 seconds for fingerprint

// Energy variance thresholds (empirical):
// Speech: high variance due to words/pauses. Music: low variance due to sustained sounds.
const SPEECH_VARIANCE_THRESHOLD = 0.15;  // Above this = likely speech
const MUSIC_VARIANCE_THRESHOLD = 0.06;   // Below this = likely music
const SILENCE_RMS_THRESHOLD = 0.005;     // Below this = silence

// Zero-crossing rate thresholds:
// Speech has higher ZCR (fricatives, plosives). Music tends lower (tonal).
const SPEECH_ZCR_THRESHOLD = 0.08;
const MUSIC_ZCR_THRESHOLD = 0.04;

// ─── B1: Music-vs-Speech Classification ───────────────────────────────────────

/**
 * Classify audio content as speech, music, speech-over-music, or silent.
 *
 * Uses FFmpeg astats filter to get per-frame RMS energy and zero-crossing rate.
 * Then applies variance-based heuristic:
 * - Speech: HIGH short-term energy variance (words, pauses create peaks/valleys)
 * - Music: LOW short-term energy variance (sustained notes, consistent beats)
 * - Speech-over-music: Moderate variance with moderate ZCR
 */
export async function classifyAudioContent(videoPath: string): Promise<AudioClassification> {
  const startTime = Date.now();

  try {
    // Run astats filter to get per-frame RMS and zero-crossing rate
    const stats = await runAstats(videoPath);

    if (stats.rmsValues.length === 0) {
      return {
        success: true,
        musicRatio: 0,
        speechRatio: 0,
        hasBothMusicAndSpeech: false,
        audioType: 'silent',
        latencyMs: Date.now() - startTime,
        windowCount: 0,
        avgRmsEnergy: 0,
        energyVarianceNormalized: 0,
        zeroCrossingRateAvg: 0,
      };
    }

    // Group RMS values into 500ms windows
    const windowSize = Math.max(1, Math.floor(stats.rmsValues.length * (WINDOW_DURATION_MS / 1000) / (stats.duration || 1)));
    const windows: Array<{ rmsValues: number[]; zcrValues: number[] }> = [];

    for (let i = 0; i < stats.rmsValues.length; i += windowSize) {
      const rmsSlice = stats.rmsValues.slice(i, i + windowSize);
      const zcrSlice = stats.zcrValues.slice(i, Math.min(i + windowSize, stats.zcrValues.length));
      if (rmsSlice.length > 0) {
        windows.push({ rmsValues: rmsSlice, zcrValues: zcrSlice });
      }
    }

    // Compute per-window average RMS energy
    const windowEnergies = windows.map((w) => mean(w.rmsValues));
    const windowZcrs = windows.map((w) => w.zcrValues.length > 0 ? mean(w.zcrValues) : 0);

    const avgRmsEnergy = mean(windowEnergies);
    const zeroCrossingRateAvg = mean(windowZcrs);

    // Check for silence
    if (avgRmsEnergy < SILENCE_RMS_THRESHOLD) {
      return {
        success: true,
        musicRatio: 0,
        speechRatio: 0,
        hasBothMusicAndSpeech: false,
        audioType: 'silent',
        latencyMs: Date.now() - startTime,
        windowCount: windows.length,
        avgRmsEnergy: round(avgRmsEnergy, 6),
        energyVarianceNormalized: 0,
        zeroCrossingRateAvg: round(zeroCrossingRateAvg, 4),
      };
    }

    // Compute normalized energy variance (divide by mean² to make scale-independent)
    const energyVar = variance(windowEnergies);
    const energyVarianceNormalized = avgRmsEnergy > 0 ? energyVar / (avgRmsEnergy * avgRmsEnergy) : 0;

    // Classify each window as speech-like or music-like
    let speechWindows = 0;
    let musicWindows = 0;
    let silentWindows = 0;

    for (let i = 0; i < windows.length; i++) {
      const energy = windowEnergies[i];
      if (energy < SILENCE_RMS_THRESHOLD) {
        silentWindows++;
        continue;
      }

      // Compute local variance (variance within the window)
      const localVar = variance(windows[i].rmsValues);
      const localNormVar = energy > 0 ? localVar / (energy * energy) : 0;
      const localZcr = windowZcrs[i];

      // Decision: speech has high local variance AND/OR high ZCR
      const isSpeechLike = localNormVar > SPEECH_VARIANCE_THRESHOLD || localZcr > SPEECH_ZCR_THRESHOLD;
      const isMusicLike = localNormVar < MUSIC_VARIANCE_THRESHOLD && localZcr < MUSIC_ZCR_THRESHOLD;

      if (isSpeechLike) {
        speechWindows++;
      } else if (isMusicLike) {
        musicWindows++;
      } else {
        // Ambiguous — could be speech-over-music
        speechWindows += 0.5;
        musicWindows += 0.5;
      }
    }

    const activeWindows = windows.length - silentWindows;
    const speechRatio = activeWindows > 0 ? speechWindows / activeWindows : 0;
    const musicRatio = activeWindows > 0 ? musicWindows / activeWindows : 0;
    const hasBothMusicAndSpeech = speechRatio > 0.2 && musicRatio > 0.2;

    // Classify overall audio type
    let audioType: AudioType;
    if (activeWindows === 0) {
      audioType = 'silent';
    } else if (hasBothMusicAndSpeech) {
      audioType = 'speech-over-music';
    } else if (speechRatio > 0.6) {
      audioType = 'speech-only';
    } else if (musicRatio > 0.6) {
      audioType = 'music-only';
    } else {
      audioType = 'mixed';
    }

    console.log(`[AudioClassifier] ${audioType}: speech=${round(speechRatio * 100, 1)}%, music=${round(musicRatio * 100, 1)}%, ${windows.length} windows`);

    return {
      success: true,
      musicRatio: round(musicRatio, 3),
      speechRatio: round(speechRatio, 3),
      hasBothMusicAndSpeech,
      audioType,
      latencyMs: Date.now() - startTime,
      windowCount: windows.length,
      avgRmsEnergy: round(avgRmsEnergy, 6),
      energyVarianceNormalized: round(energyVarianceNormalized, 4),
      zeroCrossingRateAvg: round(zeroCrossingRateAvg, 4),
    };
  } catch (err: any) {
    console.error(`[AudioClassifier] Failed: ${err.message}`);
    return {
      success: false,
      musicRatio: 0,
      speechRatio: 0,
      hasBothMusicAndSpeech: false,
      audioType: 'mixed',
      latencyMs: Date.now() - startTime,
      windowCount: 0,
      avgRmsEnergy: 0,
      energyVarianceNormalized: 0,
      zeroCrossingRateAvg: 0,
      error: err.message,
    };
  }
}

// ─── FFmpeg astats Runner ─────────────────────────────────────────────────────

interface AstatsData {
  rmsValues: number[];
  zcrValues: number[];
  duration: number;
}

async function runAstats(videoPath: string): Promise<AstatsData> {
  return new Promise((resolve, reject) => {
    const rmsValues: number[] = [];
    const zcrValues: number[] = [];
    let duration = 0;

    // astats outputs per-frame RMS level and zero crossings
    // We use metadata=print to get values in stderr
    const rmsRegex = /lavfi\.astats\.\d+\.RMS_level=([-\d.inf]+)/;
    const zcrRegex = /lavfi\.astats\.\d+\.Zero_crossings_rate=([\d.]+)/;
    const durationRegex = /Duration:\s*(\d+):(\d+):([\d.]+)/;

    ffmpeg(videoPath)
      .audioFilters('astats=metadata=1:reset=1')
      .format('null')
      .output('-')
      .on('stderr', (line: string) => {
        // Parse RMS level
        const rmsMatch = line.match(rmsRegex);
        if (rmsMatch) {
          const val = rmsMatch[1];
          if (val !== '-inf' && val !== 'inf') {
            const db = parseFloat(val);
            if (isFinite(db)) {
              // Convert dB to linear scale (0-1 range)
              const linear = Math.pow(10, db / 20);
              rmsValues.push(linear);
            }
          } else {
            rmsValues.push(0); // silence
          }
        }

        // Parse zero crossing rate
        const zcrMatch = line.match(zcrRegex);
        if (zcrMatch) {
          const zcr = parseFloat(zcrMatch[1]);
          if (isFinite(zcr)) {
            zcrValues.push(zcr);
          }
        }

        // Parse duration
        const durMatch = line.match(durationRegex);
        if (durMatch && duration === 0) {
          duration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3]);
        }
      })
      .on('end', () => {
        console.log(`[AudioClassifier] astats: ${rmsValues.length} RMS frames, ${zcrValues.length} ZCR frames`);
        resolve({ rmsValues, zcrValues, duration });
      })
      .on('error', (err: Error) => reject(new Error(`astats failed: ${err.message}`)))
      .run();
  });
}

// ─── B3: Audio Fingerprinting ─────────────────────────────────────────────────

/**
 * Generate a spectral fingerprint from the audio track.
 *
 * Computes spectral centroid time-series for the first 30 seconds via FFmpeg
 * aspectralstats, then hashes the sequence. Two videos with the same background
 * music will produce very similar spectral centroid sequences → similar hashes.
 *
 * This is NOT a perceptual hash (like Chromaprint/fpcalc) but is zero-dependency
 * and sufficient for grouping videos by sound in training correlation.
 */
export async function generateAudioFingerprint(videoPath: string): Promise<AudioFingerprintResult> {
  const startTime = Date.now();

  try {
    const centroids = await extractSpectralCentroids(videoPath);

    if (centroids.length === 0) {
      return {
        success: false,
        fingerprint: '',
        fingerprintMethod: 'spectral_centroid',
        durationAnalyzed: 0,
        latencyMs: Date.now() - startTime,
        error: 'No spectral data extracted',
      };
    }

    // Quantize centroids into bins (reduce precision for fuzzy matching)
    // Bin width: 100 Hz — close enough for same-song matching
    const binWidth = 100;
    const quantized = centroids.map((c) => Math.floor(c / binWidth));

    // Hash the quantized sequence
    const fingerprint = createHash('sha256')
      .update(quantized.join(','))
      .digest('hex')
      .substring(0, 32); // 32-char hex = 128-bit fingerprint

    const durationAnalyzed = Math.min(FINGERPRINT_DURATION, centroids.length * 0.023); // ~23ms per frame

    console.log(`[AudioClassifier] Fingerprint: ${fingerprint.substring(0, 12)}... from ${centroids.length} centroid frames (${round(durationAnalyzed, 1)}s)`);

    return {
      success: true,
      fingerprint,
      fingerprintMethod: 'spectral_centroid',
      durationAnalyzed: round(durationAnalyzed, 1),
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.error(`[AudioClassifier] Fingerprint failed: ${err.message}`);
    return {
      success: false,
      fingerprint: '',
      fingerprintMethod: 'spectral_centroid',
      durationAnalyzed: 0,
      latencyMs: Date.now() - startTime,
      error: err.message,
    };
  }
}

async function extractSpectralCentroids(videoPath: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const centroids: number[] = [];
    const centroidRegex = /lavfi\.aspectralstats\.1\.centroid=([\d.]+)/;

    ffmpeg(videoPath)
      .duration(FINGERPRINT_DURATION) // Only first 30s
      .audioFilters('aspectralstats=measure=centroid')
      .format('null')
      .output('-')
      .on('stderr', (line: string) => {
        const match = line.match(centroidRegex);
        if (match) {
          const val = parseFloat(match[1]);
          if (isFinite(val) && val > 0) {
            centroids.push(val);
          }
        }
      })
      .on('end', () => resolve(centroids))
      .on('error', (err: Error) => reject(new Error(`aspectralstats failed: ${err.message}`)))
      .run();
  });
}

// ─── Math Utilities ───────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
}

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
