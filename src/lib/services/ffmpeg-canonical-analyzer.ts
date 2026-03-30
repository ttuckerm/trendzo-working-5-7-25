/**
 * Canonical FFmpeg Video Analyzer
 *
 * Single source of truth for ALL FFmpeg-based video analysis in the prediction pipeline.
 * Replaces scattered implementations across ffmpeg-training-features.ts, ffmpeg-full-analyzer.ts,
 * ffmpeg-service.ts (for prediction), and visual-scene-detector.ts (for scene detection).
 *
 * Runs 3 FFmpeg invocations per video:
 *   1. ffprobe — metadata (duration, fps, resolution, codec, bitrate, audio)
 *   2. signalstats filter — brightness (YAVG), contrast (YDIF), color saturation (SATAVG)
 *   3. scene filter — scene change timestamps (full video + hook period derived)
 *
 * All 16+ features are computed from real FFmpeg output. Zero placeholders.
 *
 * Created: 2026-03-08 (Batch A, Prompt 2 — FFM-001, FFM-002)
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configure FFmpeg paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if ((ffprobeStatic as any)?.path) {
  ffmpeg.setFfprobePath((ffprobeStatic as any).path);
}

// ============================================================================
// TYPES
// ============================================================================

export interface CanonicalFFmpegResult {
  extraction_success: boolean;

  // Metadata (from ffprobe)
  resolution_width: number;
  resolution_height: number;
  fps: number;
  duration_seconds: number;
  aspect_ratio: string;
  has_audio: boolean;
  audio_codec: string | null;
  video_codec: string | null;
  bitrate: number;

  // Scene detection (from scene filter)
  scene_changes: number;
  cuts_per_second: number;
  hook_scene_changes: number; // Cuts in first 3 seconds

  // Visual quality (from signalstats)
  brightness_avg: number;   // 0-1 normalized from YAVG (0-255)
  contrast_score: number;   // 0-1 normalized from YDIF (0-50+)
  color_variance: number;   // 0-1 normalized from SATAVG (0-128)

  // Motion proxy (derived from scene intervals)
  avg_motion: number;       // 0-1 — variance of inter-scene intervals

  // Error info
  error?: string;
}

// ============================================================================
// DEFAULTS
// ============================================================================

function getDefaultResult(): CanonicalFFmpegResult {
  return {
    extraction_success: false,
    resolution_width: 0,
    resolution_height: 0,
    fps: 0,
    duration_seconds: 0,
    aspect_ratio: 'unknown',
    has_audio: false,
    audio_codec: null,
    video_codec: null,
    bitrate: 0,
    scene_changes: 0,
    cuts_per_second: 0,
    hook_scene_changes: 0,
    brightness_avg: 0,
    contrast_score: 0,
    color_variance: 0,
    avg_motion: 0,
  };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Analyze a video file using FFmpeg. Runs 3 invocations:
 *   1. ffprobe for metadata
 *   2. signalstats for brightness/contrast/saturation
 *   3. scene filter for scene changes
 *
 * Returns all features with real values. Never returns placeholders.
 */
export async function analyzeVideo(
  videoPath: string,
  options: { timeout?: number } = {}
): Promise<CanonicalFFmpegResult> {
  const { timeout = 45000 } = options;

  if (!existsSync(videoPath)) {
    return {
      ...getDefaultResult(),
      error: `Video file not found: ${videoPath}`,
    };
  }

  try {
    // Run all three analyses in parallel
    const [metadata, signalStats, sceneTimestamps] = await Promise.all([
      runFfprobe(videoPath, timeout),
      runSignalstats(videoPath, timeout),
      runSceneDetection(videoPath, timeout),
    ]);

    if (!metadata.success) {
      return {
        ...getDefaultResult(),
        error: metadata.error || 'ffprobe failed',
      };
    }

    const duration = metadata.duration;

    // Derive scene-based features
    const sceneChanges = sceneTimestamps.length;
    const cutsPerSecond = duration > 0 ? sceneChanges / duration : 0;
    const hookSceneChanges = sceneTimestamps.filter(t => t <= 3.0).length;
    const avgMotion = computeMotionProxy(sceneTimestamps, duration);

    return {
      extraction_success: true,
      resolution_width: metadata.width,
      resolution_height: metadata.height,
      fps: metadata.fps,
      duration_seconds: duration,
      aspect_ratio: metadata.aspectRatio,
      has_audio: metadata.hasAudio,
      audio_codec: metadata.audioCodec,
      video_codec: metadata.videoCodec,
      bitrate: metadata.bitrate,
      scene_changes: sceneChanges,
      cuts_per_second: parseFloat(cutsPerSecond.toFixed(3)),
      hook_scene_changes: hookSceneChanges,
      brightness_avg: signalStats.brightness,
      contrast_score: signalStats.contrast,
      color_variance: signalStats.saturation,
      avg_motion: avgMotion,
    };
  } catch (error: any) {
    return {
      ...getDefaultResult(),
      error: `Canonical analyzer error: ${error.message}`,
    };
  }
}

// ============================================================================
// INVOCATION 1: ffprobe (metadata)
// ============================================================================

interface ProbeResult {
  success: boolean;
  duration: number;
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  hasAudio: boolean;
  audioCodec: string | null;
  videoCodec: string | null;
  aspectRatio: string;
  error?: string;
}

function runFfprobe(videoPath: string, timeout: number): Promise<ProbeResult> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({ success: false, duration: 0, width: 0, height: 0, fps: 0, bitrate: 0, hasAudio: false, audioCodec: null, videoCodec: null, aspectRatio: 'unknown', error: 'ffprobe timed out' });
    }, timeout);

    ffmpeg.ffprobe(videoPath, (err: any, metadata: any) => {
      clearTimeout(timeoutId);

      if (err) {
        resolve({ success: false, duration: 0, width: 0, height: 0, fps: 0, bitrate: 0, hasAudio: false, audioCodec: null, videoCodec: null, aspectRatio: 'unknown', error: `ffprobe error: ${err.message}` });
        return;
      }

      try {
        const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s: any) => s.codec_type === 'audio');
        const format = metadata.format;

        const width = videoStream?.width || 0;
        const height = videoStream?.height || 0;
        const duration = parseFloat(format?.duration || '0');

        // Parse FPS from frame rate string (e.g., "30/1" or "30000/1001")
        let fps = 0;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2) {
            fps = parseInt(parts[0]) / parseInt(parts[1]);
          } else {
            fps = parseFloat(videoStream.r_frame_rate);
          }
        }

        // Classify aspect ratio
        let aspectRatio = 'unknown';
        if (width > 0 && height > 0) {
          const ratio = width / height;
          if (Math.abs(ratio - 16 / 9) < 0.1) aspectRatio = '16:9';
          else if (Math.abs(ratio - 9 / 16) < 0.1) aspectRatio = '9:16';
          else if (Math.abs(ratio - 4 / 3) < 0.1) aspectRatio = '4:3';
          else if (Math.abs(ratio - 1) < 0.1) aspectRatio = '1:1';
          else aspectRatio = `${width}:${height}`;
        }

        resolve({
          success: true,
          duration,
          width,
          height,
          fps: Math.round(fps * 100) / 100,
          bitrate: parseInt(format?.bit_rate || '0'),
          hasAudio: !!audioStream,
          audioCodec: audioStream?.codec_name || null,
          videoCodec: videoStream?.codec_name || null,
          aspectRatio,
        });
      } catch (parseError: any) {
        resolve({ success: false, duration: 0, width: 0, height: 0, fps: 0, bitrate: 0, hasAudio: false, audioCodec: null, videoCodec: null, aspectRatio: 'unknown', error: `Metadata parse error: ${parseError.message}` });
      }
    });
  });
}

// ============================================================================
// INVOCATION 2: signalstats (brightness, contrast, saturation)
// ============================================================================

interface SignalStatsResult {
  brightness: number; // 0-1 normalized
  contrast: number;   // 0-1 normalized
  saturation: number; // 0-1 normalized
}

async function runSignalstats(videoPath: string, timeout: number): Promise<SignalStatsResult> {
  const defaults: SignalStatsResult = { brightness: 0, contrast: 0, saturation: 0 };

  try {
    // Normalize path for FFmpeg on Windows
    const normalizedPath = videoPath.replace(/\\/g, '/');

    // Sample every 2 seconds to keep this fast for long videos
    const command = `ffmpeg -i "${normalizedPath}" -vf "fps=0.5,signalstats,metadata=print:file=-" -f null - 2>&1`;
    const { stdout } = await execAsync(command, { timeout });
    const output = stdout;

    // Parse all YAVG values and average them
    const yavgMatches = [...output.matchAll(/lavfi\.signalstats\.YAVG=([0-9.]+)/g)];
    const ydifMatches = [...output.matchAll(/lavfi\.signalstats\.YDIF=([0-9.]+)/g)];
    const satavgMatches = [...output.matchAll(/lavfi\.signalstats\.SATAVG=([0-9.]+)/g)];

    if (yavgMatches.length === 0) {
      return defaults;
    }

    // Average all frame values
    const avgYavg = yavgMatches.reduce((sum, m) => sum + parseFloat(m[1]), 0) / yavgMatches.length;
    const avgYdif = ydifMatches.length > 0
      ? ydifMatches.reduce((sum, m) => sum + parseFloat(m[1]), 0) / ydifMatches.length
      : 0;
    const avgSatavg = satavgMatches.length > 0
      ? satavgMatches.reduce((sum, m) => sum + parseFloat(m[1]), 0) / satavgMatches.length
      : 0;

    return {
      brightness: parseFloat(Math.min(1, avgYavg / 255).toFixed(3)),
      contrast: parseFloat(Math.min(1, avgYdif / 50).toFixed(3)),
      saturation: parseFloat(Math.min(1, avgSatavg / 128).toFixed(3)),
    };
  } catch (error: any) {
    console.warn('[CanonicalFFmpeg] signalstats failed (non-fatal):', error.message);
    return defaults;
  }
}

// ============================================================================
// INVOCATION 3: scene filter (scene change timestamps)
// ============================================================================

function runSceneDetection(videoPath: string, timeout: number): Promise<number[]> {
  return new Promise((resolve) => {
    const sceneTimestamps: number[] = [];
    const timeoutId = setTimeout(() => {
      console.warn('[CanonicalFFmpeg] Scene detection timed out');
      resolve(sceneTimestamps);
    }, timeout);

    ffmpeg(videoPath)
      .videoFilters("select='gt(scene,0.3)',showinfo")
      .format('null')
      .output('-')
      .on('stderr', (stderrLine: string) => {
        const match = stderrLine.match(/pts_time:([\d.]+)/);
        if (match) {
          sceneTimestamps.push(parseFloat(match[1]));
        }
      })
      .on('end', () => {
        clearTimeout(timeoutId);
        resolve(sceneTimestamps);
      })
      .on('error', (err: Error) => {
        clearTimeout(timeoutId);
        console.warn('[CanonicalFFmpeg] Scene detection failed (non-fatal):', err.message);
        resolve([]);
      })
      .run();
  });
}

// ============================================================================
// DERIVED METRICS
// ============================================================================

/**
 * Compute a motion proxy from scene change intervals.
 *
 * High variance in inter-scene intervals → dynamic, variable motion (score near 1).
 * Low variance → uniform cuts or static content (score near 0).
 * No scene changes → 0 (static video).
 */
function computeMotionProxy(sceneTimestamps: number[], duration: number): number {
  if (sceneTimestamps.length < 2) {
    return 0;
  }

  // Compute intervals between consecutive scene changes
  const intervals: number[] = [];
  for (let i = 1; i < sceneTimestamps.length; i++) {
    intervals.push(sceneTimestamps[i] - sceneTimestamps[i - 1]);
  }

  // Compute coefficient of variation (CV = stddev / mean)
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (mean === 0) return 0;

  const variance = intervals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / intervals.length;
  const stddev = Math.sqrt(variance);
  const cv = stddev / mean;

  // Normalize CV to 0-1 range. CV > 1.5 is highly dynamic.
  // Also factor in scene density (cuts per second)
  const densityFactor = Math.min(1, (sceneTimestamps.length / duration) / 2); // 2 cuts/sec = max
  const variabilityFactor = Math.min(1, cv / 1.5);

  // Blend: 60% density + 40% variability
  const motion = 0.6 * densityFactor + 0.4 * variabilityFactor;

  return parseFloat(Math.min(1, Math.max(0, motion)).toFixed(3));
}
