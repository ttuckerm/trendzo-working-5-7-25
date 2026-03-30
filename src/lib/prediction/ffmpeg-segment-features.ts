/**
 * FFmpeg Segment-Based Features
 *
 * Analyzes temporal segments of the actual VIDEO FILE to extract features
 * about what the viewer sees and hears over time.
 *
 * 5 features:
 *   1. hook_motion_ratio — motion intensity in first 3s vs rest
 *   2. audio_energy_buildup — loudness slope across 4 quarters
 *   3. scene_rate_first_half_vs_second — pacing comparison
 *   4. visual_variety_score — scene diversity (0-100)
 *   5. hook_audio_intensity — audio intensity in first 3s vs overall
 *
 * Created: 2026-03-15
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

// On Windows, null output must use NUL; on Unix, /dev/null
const NULL_OUTPUT = process.platform === 'win32' ? 'NUL' : '/dev/null';

// ============================================================================
// TYPES
// ============================================================================

export interface SegmentFeatures {
  hook_motion_ratio: number | null;
  audio_energy_buildup: number | null;
  scene_rate_first_half_vs_second: number | null;
  visual_variety_score: number | null;
  hook_audio_intensity: number | null;
}

export interface SegmentFeaturesResult {
  features: SegmentFeatures;
  errors: string[];
  extractionTimeMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FFMPEG_TIMEOUT = 30_000; // 30s per FFmpeg pass
const OVERALL_TIMEOUT = 120_000; // 120s total

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Extract all 5 segment-based features from a video file.
 * Each feature runs independently; failed features return null.
 */
export async function extractSegmentFeatures(
  videoPath: string,
): Promise<SegmentFeaturesResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const features: SegmentFeatures = {
    hook_motion_ratio: null,
    audio_energy_buildup: null,
    scene_rate_first_half_vs_second: null,
    visual_variety_score: null,
    hook_audio_intensity: null,
  };

  if (!existsSync(videoPath)) {
    return {
      features,
      errors: [`Video file not found: ${videoPath}`],
      extractionTimeMs: Date.now() - startTime,
    };
  }

  // Get video duration first
  let duration: number;
  try {
    duration = await getVideoDuration(videoPath);
    if (duration <= 0) {
      return {
        features,
        errors: ['Could not determine video duration'],
        extractionTimeMs: Date.now() - startTime,
      };
    }
  } catch (err: any) {
    return {
      features,
      errors: [`Duration probe failed: ${err.message}`],
      extractionTimeMs: Date.now() - startTime,
    };
  }

  // Run all features in parallel with overall timeout
  const timeoutPromise = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('Overall timeout exceeded')), OVERALL_TIMEOUT),
  );

  const normalizedPath = videoPath.replace(/\\/g, '/');

  try {
    await Promise.race([
      Promise.allSettled([
        extractHookMotionRatio(normalizedPath, duration).then(v => { features.hook_motion_ratio = v; }).catch(e => errors.push(`hook_motion_ratio: ${e.message}`)),
        extractAudioEnergyBuildup(normalizedPath, duration).then(v => { features.audio_energy_buildup = v; }).catch(e => errors.push(`audio_energy_buildup: ${e.message}`)),
        extractSceneRateComparison(normalizedPath, duration).then(result => {
          features.scene_rate_first_half_vs_second = result.ratio;
          features.visual_variety_score = result.varietyScore;
        }).catch(e => errors.push(`scene_rate: ${e.message}`)),
        extractHookAudioIntensity(normalizedPath, duration).then(v => { features.hook_audio_intensity = v; }).catch(e => errors.push(`hook_audio_intensity: ${e.message}`)),
      ]),
      timeoutPromise,
    ]);
  } catch {
    errors.push('Overall extraction timeout (120s)');
  }

  return {
    features,
    errors,
    extractionTimeMs: Date.now() - startTime,
  };
}

// ============================================================================
// HELPER: Video Duration
// ============================================================================

async function getVideoDuration(videoPath: string): Promise<number> {
  const normalizedPath = videoPath.replace(/\\/g, '/');
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${normalizedPath}"`,
    { timeout: FFMPEG_TIMEOUT },
  );
  return parseFloat(stdout.trim()) || 0;
}

// ============================================================================
// FEATURE 1: hook_motion_ratio
// ============================================================================

/**
 * Ratio of motion intensity in first 3 seconds vs rest of video.
 * Uses signalstats YDIF (temporal difference) as a motion proxy.
 * Values > 1.0 = hook has more motion than the rest.
 */
async function extractHookMotionRatio(
  videoPath: string,
  duration: number,
): Promise<number | null> {
  // For very short videos (under 6s), compare first half vs second half
  const hookEnd = duration < 6 ? duration / 2 : 3;
  const restStart = hookEnd;

  // Extract YDIF (temporal difference) for hook segment
  // Hook: process all frames (short segment). Rest: subsample to 2fps to keep it fast.
  const hookCmd = `ffmpeg -v error -ss 0 -t ${hookEnd} -i "${videoPath}" -vf "signalstats,metadata=print:file=-" -f null ${NULL_OUTPUT} 2>&1`;
  const restCmd = `ffmpeg -v error -ss ${restStart} -i "${videoPath}" -vf "fps=2,signalstats,metadata=print:file=-" -f null ${NULL_OUTPUT} 2>&1`;

  const execOpts = { timeout: FFMPEG_TIMEOUT, maxBuffer: 10 * 1024 * 1024 };
  const safeExecSignal = async (cmd: string): Promise<string> => {
    try {
      const result = await execAsync(cmd, execOpts);
      return result.stdout;
    } catch (err: any) {
      // Process may be killed by timeout but still have useful partial output
      return err.stdout || err.stderr || '';
    }
  };

  const [hookOutput, restOutput] = await Promise.all([
    safeExecSignal(hookCmd),
    safeExecSignal(restCmd),
  ]);

  const hookYdif = parseYdifValues(hookOutput);
  const restYdif = parseYdifValues(restOutput);

  if (hookYdif.length === 0 || restYdif.length === 0) return null;

  const hookMean = hookYdif.reduce((a, b) => a + b, 0) / hookYdif.length;
  const restMean = restYdif.reduce((a, b) => a + b, 0) / restYdif.length;

  if (restMean === 0) return hookMean > 0 ? 2.0 : 1.0;

  return parseFloat((hookMean / restMean).toFixed(4));
}

function parseYdifValues(output: string): number[] {
  const matches = [...output.matchAll(/lavfi\.signalstats\.YDIF=([0-9.]+)/g)];
  return matches.map(m => parseFloat(m[1])).filter(v => !isNaN(v));
}

// ============================================================================
// FEATURE 2: audio_energy_buildup
// ============================================================================

/**
 * Linear regression slope of loudness across 4 equal quarters.
 * Positive = energy builds. Negative = energy drops.
 * Uses ebur128 momentary loudness per quarter.
 */
async function extractAudioEnergyBuildup(
  videoPath: string,
  duration: number,
): Promise<number | null> {
  const quarterDuration = duration / 4;
  if (quarterDuration < 0.5) return null;

  const quarterLoudness: number[] = [];

  for (let q = 0; q < 4; q++) {
    const start = q * quarterDuration;
    // ebur128 writes to stderr — do NOT use -v error (it suppresses the output)
    const cmd = `ffmpeg -hide_banner -ss ${start.toFixed(2)} -t ${quarterDuration.toFixed(2)} -i "${videoPath}" -af "ebur128=peak=none" -f null ${NULL_OUTPUT} 2>&1`;

    try {
      const { stdout } = await execAsync(cmd, { timeout: FFMPEG_TIMEOUT });
      const loudness = parseEbur128Loudness(stdout);
      if (loudness !== null) {
        quarterLoudness.push(loudness);
      }
    } catch (err: any) {
      // execAsync throws on non-zero exit but still has stdout/stderr
      const output = err.stdout || err.stderr || '';
      const loudness = parseEbur128Loudness(output);
      if (loudness !== null) {
        quarterLoudness.push(loudness);
      }
    }
  }

  if (quarterLoudness.length < 3) return null;

  // Linear regression: slope of loudness vs quarter index
  const n = quarterLoudness.length;
  const xMean = (n - 1) / 2;
  const yMean = quarterLoudness.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (quarterLoudness[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }

  if (den === 0) return 0;

  return parseFloat((num / den).toFixed(4));
}

/**
 * Parse ebur128 summary loudness from FFmpeg output.
 * Looks for "I:" (integrated loudness) in the summary.
 */
function parseEbur128Loudness(output: string): number | null {
  // The summary section appears after "Summary:" and contains the FINAL integrated loudness.
  // Per-frame lines also have "I:" but those are running values (often -70 initially).
  // Match the summary section specifically.
  const summaryMatch = output.match(/Summary:[\s\S]*?Integrated loudness:\s*\n\s*I:\s+(-?[\d.]+)\s+LUFS/);
  if (summaryMatch) {
    const val = parseFloat(summaryMatch[1]);
    if (!isNaN(val) && isFinite(val)) return val;
  }

  // Fallback: get the LAST "I:" value in the output (closest to summary)
  const allI = [...output.matchAll(/\bI:\s+(-?[\d.]+)\s+LUFS/g)];
  if (allI.length > 0) {
    const lastVal = parseFloat(allI[allI.length - 1][1]);
    if (!isNaN(lastVal) && isFinite(lastVal) && lastVal > -70) return lastVal;
  }

  return null;
}

// ============================================================================
// FEATURES 3 & 4: scene_rate_first_half_vs_second + visual_variety_score
// ============================================================================

/**
 * Scene detection on the full video, then split results into halves.
 * Returns both the half-comparison ratio AND the visual variety score.
 */
async function extractSceneRateComparison(
  videoPath: string,
  duration: number,
): Promise<{ ratio: number | null; varietyScore: number | null }> {
  // Run scene detection on full video
  // showinfo writes to stderr; capture via 2>&1
  const cmd = `ffmpeg -hide_banner -i "${videoPath}" -vf "select='gt(scene,0.3)',showinfo" -f null ${NULL_OUTPUT} 2>&1`;

  let output: string;
  try {
    const result = await execAsync(cmd, { timeout: FFMPEG_TIMEOUT, maxBuffer: 10 * 1024 * 1024 });
    output = result.stdout;
  } catch (err: any) {
    // Process may be killed by timeout but still have useful partial output
    output = err.stdout || err.stderr || '';
    if (!output) throw err;
  }

  const sceneTimestamps: number[] = [];
  const matches = output.matchAll(/pts_time:([\d.]+)/g);
  for (const match of matches) {
    sceneTimestamps.push(parseFloat(match[1]));
  }

  const totalScenes = sceneTimestamps.length;

  // Feature 3: scene rate comparison
  let ratio: number | null = null;
  const halfPoint = duration / 2;

  const firstHalfScenes = sceneTimestamps.filter(t => t <= halfPoint).length;
  const secondHalfScenes = sceneTimestamps.filter(t => t > halfPoint).length;

  if (secondHalfScenes > 0) {
    ratio = parseFloat((firstHalfScenes / secondHalfScenes).toFixed(4));
  } else if (firstHalfScenes > 0) {
    ratio = 2.0; // Cap: all scenes in first half
  } else {
    ratio = 1.0; // No scenes at all — neutral
  }

  // Feature 4: visual variety score
  // formula: min(100, (scene_changes * 5) + (duration_variance_normalized * 50))
  let varietyScore: number | null = null;

  if (totalScenes === 0) {
    varietyScore = 0;
  } else {
    // Compute scene duration variance
    const sceneDurations: number[] = [];
    let prevTime = 0;
    for (const t of sceneTimestamps) {
      sceneDurations.push(t - prevTime);
      prevTime = t;
    }
    // Add last segment
    sceneDurations.push(duration - prevTime);

    const meanDuration = sceneDurations.reduce((a, b) => a + b, 0) / sceneDurations.length;
    const variance = sceneDurations.reduce((sum, d) => sum + Math.pow(d - meanDuration, 2), 0) / sceneDurations.length;

    // Normalize variance: higher variance = more variety (cap at reasonable value)
    // Use coefficient of variation for normalization
    const cv = meanDuration > 0 ? Math.sqrt(variance) / meanDuration : 0;
    const durationVarianceNormalized = Math.min(1, cv);

    varietyScore = Math.min(100, (totalScenes * 5) + (durationVarianceNormalized * 50));
    varietyScore = parseFloat(varietyScore.toFixed(2));
  }

  return { ratio, varietyScore };
}

// ============================================================================
// FEATURE 5: hook_audio_intensity
// ============================================================================

/**
 * Audio intensity in first 3 seconds vs overall.
 * Uses ebur128 integrated loudness.
 * Output: ratio (first_3s_loudness / overall_loudness).
 * Since LUFS is negative (dB scale), we convert to linear for ratio.
 */
async function extractHookAudioIntensity(
  videoPath: string,
  duration: number,
): Promise<number | null> {
  const hookEnd = duration < 6 ? duration / 2 : 3;

  const hookCmd = `ffmpeg -hide_banner -ss 0 -t ${hookEnd.toFixed(2)} -i "${videoPath}" -af "ebur128=peak=none" -f null ${NULL_OUTPUT} 2>&1`;
  const overallCmd = `ffmpeg -hide_banner -i "${videoPath}" -af "ebur128=peak=none" -f null ${NULL_OUTPUT} 2>&1`;

  const safeExec = async (cmd: string) => {
    try {
      return (await execAsync(cmd, { timeout: FFMPEG_TIMEOUT })).stdout;
    } catch (err: any) {
      return err.stdout || err.stderr || '';
    }
  };

  const [hookOutput, overallOutput] = await Promise.all([
    safeExec(hookCmd),
    safeExec(overallCmd),
  ]);

  const hookLoudness = parseEbur128Loudness(hookOutput);
  const overallLoudness = parseEbur128Loudness(overallOutput);

  if (hookLoudness === null || overallLoudness === null) return null;

  // Convert LUFS (dB) to linear power for meaningful ratio
  // LUFS of -70 means silence — treat as floor
  const hookLinear = Math.pow(10, Math.max(hookLoudness, -70) / 10);
  const overallLinear = Math.pow(10, Math.max(overallLoudness, -70) / 10);

  if (overallLinear === 0) return null;

  return parseFloat((hookLinear / overallLinear).toFixed(4));
}
