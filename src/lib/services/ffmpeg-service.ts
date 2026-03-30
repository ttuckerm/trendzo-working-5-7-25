// DEPRECATED: Use src/lib/services/ffmpeg-canonical-analyzer.ts instead
/**
 * FFmpeg Video Intelligence Service
 *
 * Core service for video processing, frame extraction, and visual analysis.
 * Transforms CleanCopy from prediction-only to prediction + optimization.
 *
 * Key Features:
 * - Thumbnail extraction at precise timestamps
 * - Video metadata analysis (duration, resolution, bitrate, fps)
 * - Frame extraction for visual pattern analysis
 *
 * @deprecated For prediction pipeline analysis, use ffmpeg-canonical-analyzer.ts (Batch A, Prompt 2 — FFM-001).
 *   Frame extraction and thumbnail functions in this file are still used by other components.
 * @author CleanCopy Engineering
 * @date 2025-10-28
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

// Configure FFmpeg paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

// ============================================================================
// TYPES
// ============================================================================

export interface VideoMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  fps: number;
  aspectRatio: string; // e.g., "16:9", "9:16"
  bitrate: number; // bits per second
  codec: string;
  format: string;
  fileSize?: number; // bytes
  hasAudio: boolean;
  audioCodec?: string;
  totalFrames?: number;
}

export interface ThumbnailOptions {
  timestamps: number[]; // Array of seconds
  width?: number;
  height?: number;
  quality?: number; // 1-31, lower is better (default: 2)
  format?: 'png' | 'jpg';
}

export interface FrameExtractionOptions {
  fps?: number; // Frames per second to extract (default: 1)
  startTime?: number; // Start extraction at this time (seconds)
  endTime?: number; // Stop extraction at this time (seconds)
  width?: number;
  height?: number;
  format?: 'png' | 'jpg';
}

export interface ColorPalette {
  dominant: string[]; // Hex colors, sorted by prevalence
  average: string; // Average color
  vibrant?: string; // Most saturated color
  muted?: string; // Most muted color
}

export interface AudioExtractionOptions {
  format?: 'mp3' | 'wav' | 'aac';
  bitrate?: string; // e.g., '128k'
  sampleRate?: number; // e.g., 44100
}

export interface FFmpegProgress {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique temp filename
 */
function getTempFilePath(prefix: string, extension: string): string {
  const hash = createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex').substring(0, 8);
  // Use OS temp directory - works on Windows and Unix
  const tempDir = process.env.TEMP || process.env.TMP || '/tmp';
  return path.join(tempDir, `${prefix}_${hash}.${extension}`);
}

/**
 * Clean up temp files after processing
 */
async function cleanupTempFiles(files: string[]): Promise<void> {
  await Promise.all(
    files.map(file =>
      fs.unlink(file).catch(err =>
        console.warn(`[FFmpeg] Failed to cleanup ${file}:`, err.message)
      )
    )
  );
}

/**
 * Download video from URL to temp file (if needed)
 */
async function ensureLocalFile(videoUrl: string): Promise<{ path: string; isTemp: boolean }> {
  // If already a local file path, return as-is
  if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
    return { path: videoUrl, isTemp: false };
  }

  // TODO: Implement video download logic
  // For now, FFmpeg can handle HTTP(S) URLs directly
  return { path: videoUrl, isTemp: false };
}

// ============================================================================
// CORE FFMPEG FUNCTIONS
// ============================================================================

/**
 * Extract video metadata using ffprobe
 *
 * Usage:
 * const metadata = await analyzeVideoMetrics('https://example.com/video.mp4');
 * console.log(metadata.duration, metadata.fps, metadata.resolution);
 */
export async function analyzeVideoMetrics(videoUrl: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      if (err) {
        return reject(new Error(`FFprobe failed: ${err.message}`));
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      if (!videoStream) {
        return reject(new Error('No video stream found'));
      }

      const duration = metadata.format.duration || 0;
      const fps = videoStream.r_frame_rate
        ? eval(videoStream.r_frame_rate) // e.g., "30000/1001" → 29.97
        : 30;

      const width = videoStream.width || 0;
      const height = videoStream.height || 0;
      const aspectRatio = width && height
        ? `${Math.round((width / height) * 100) / 100}:1`
        : 'unknown';

      resolve({
        duration,
        width,
        height,
        fps,
        aspectRatio,
        bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
        codec: videoStream.codec_name || 'unknown',
        format: metadata.format.format_name || 'unknown',
        fileSize: metadata.format.size ? parseInt(metadata.format.size) : undefined,
        hasAudio: !!audioStream,
        audioCodec: audioStream?.codec_name,
        totalFrames: videoStream.nb_frames ? parseInt(videoStream.nb_frames) : Math.floor(duration * fps),
      });
    });
  });
}

/**
 * Extract thumbnails at specific timestamps
 *
 * Example FFmpeg command generated:
 * ffmpeg -ss 1.5 -i video.mp4 -vframes 1 -q:v 2 -s 640x360 thumbnail_1.5s.jpg
 *
 * Usage:
 * const thumbs = await extractThumbnails('https://video.mp4', {
 *   timestamps: [1.5, 10, 20], // Extract at 1.5s, 10s, 20s
 *   width: 640,
 *   quality: 2
 * });
 */
export async function extractThumbnails(
  videoUrl: string,
  options: ThumbnailOptions
): Promise<{ timestamp: number; path: string }[]> {
  const { timestamps, width, height, quality = 2, format = 'jpg' } = options;

  if (!timestamps || timestamps.length === 0) {
    throw new Error('At least one timestamp required');
  }

  const results: { timestamp: number; path: string }[] = [];

  for (const timestamp of timestamps) {
    const outputPath = getTempFilePath(`thumbnail_${timestamp}s`, format);

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(videoUrl)
        .seekInput(timestamp) // Seek to timestamp before reading
        .outputOptions([
          `-vframes 1`, // Extract only 1 frame
          `-q:v ${quality}`, // Quality (lower = better)
        ]);

      // Add size if specified
      if (width || height) {
        command.size(`${width || '?'}x${height || '?'}`);
      }

      command
        .output(outputPath)
        .on('end', () => {
          results.push({ timestamp, path: outputPath });
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(`Thumbnail extraction failed at ${timestamp}s: ${err.message}`));
        })
        .run();
    });
  }

  return results;
}

/**
 * Extract frames from video at specified FPS
 *
 * Example FFmpeg command:
 * ffmpeg -i video.mp4 -vf "fps=1,scale=320:-1" -q:v 2 frame_%04d.jpg
 *
 * Usage:
 * const frames = await extractFrames('video.mp4', {
 *   fps: 2,  // 2 frames per second
 *   startTime: 0,
 *   endTime: 5,  // First 5 seconds only
 *   width: 320
 * });
 */
export async function extractFrames(
  videoUrl: string,
  options: FrameExtractionOptions = {}
): Promise<{ frameNumber: number; timestamp: number; path: string }[]> {
  const { fps = 1, startTime = 0, endTime, width, height, format = 'jpg' } = options;

  // Create output pattern for numbered frames
  const outputPattern = getTempFilePath('frame_%04d', format);
  const outputDir = path.dirname(outputPattern);

  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg(videoUrl);

    // Set start time if specified
    if (startTime > 0) {
      command.seekInput(startTime);
    }

    // Set duration if endTime specified
    if (endTime) {
      command.duration(endTime - startTime);
    }

    // Build filter string
    const filters: string[] = [`fps=${fps}`];
    if (width || height) {
      filters.push(`scale=${width || -1}:${height || -1}`);
    }

    command
      .outputOptions([
        `-vf ${filters.join(',')}`,
        `-q:v 2`, // Quality
      ])
      .output(outputPattern)
      .on('end', resolve)
      .on('error', (err) => {
        reject(new Error(`Frame extraction failed: ${err.message}`));
      })
      .run();
  });

  // Read generated files
  const files = await fs.readdir(outputDir);
  const frameFiles = files
    .filter(f => f.startsWith('frame_') && f.endsWith(`.${format}`))
    .sort();

  return frameFiles.map((file, index) => ({
    frameNumber: index + 1,
    timestamp: startTime + (index / fps),
    path: path.join(outputDir, file),
  }));
}

/**
 * Extract audio track from video
 *
 * Example FFmpeg command:
 * ffmpeg -i video.mp4 -vn -acodec libmp3lame -b:a 128k output.mp3
 *
 * Usage:
 * const audioPath = await extractAudio('video.mp4', { format: 'mp3', bitrate: '128k' });
 */
export async function extractAudio(
  videoUrl: string,
  options: AudioExtractionOptions = {}
): Promise<string> {
  const { format = 'mp3', bitrate = '128k', sampleRate = 44100 } = options;
  const outputPath = getTempFilePath('audio', format);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoUrl)
      .noVideo() // Strip video
      .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'wav' ? 'pcm_s16le' : 'aac')
      .audioBitrate(bitrate)
      .audioFrequency(sampleRate)
      .output(outputPath)
      .on('end', resolve)
      .on('error', (err) => {
        reject(new Error(`Audio extraction failed: ${err.message}`));
      })
      .run();
  });

  return outputPath;
}

/**
 * Get color palette from an image/frame
 *
 * Note: This uses a simple pixel sampling approach.
 * For production, consider using libraries like 'node-vibrant' or 'sharp'
 *
 * Usage:
 * const palette = await getColorPalette('./thumbnail.jpg');
 */
export async function getColorPalette(imagePath: string): Promise<ColorPalette> {
  // Placeholder implementation
  // TODO: Integrate with Sharp or node-vibrant for proper color analysis

  return {
    dominant: ['#FF5733', '#33FF57', '#3357FF'],
    average: '#7F7F7F',
    vibrant: '#FF5733',
    muted: '#CCCCCC',
  };
}

/**
 * Get detailed video information (wrapper combining multiple analyses)
 *
 * Usage:
 * const info = await getVideoInfo('https://video.mp4');
 * console.log(info);
 */
export async function getVideoInfo(videoUrl: string) {
  const metadata = await analyzeVideoMetrics(videoUrl);

  // Extract thumbnails at key points
  const hookTime = 1.5; // Typical hook moment
  const midTime = metadata.duration / 2;
  const endTime = Math.max(0, metadata.duration - 1);

  const thumbnails = await extractThumbnails(videoUrl, {
    timestamps: [hookTime, midTime, endTime],
    width: 640,
  });

  return {
    metadata,
    thumbnails,
  };
}

/**
 * Cleanup helper - delete all generated temp files
 */
export async function cleanupVideoAssets(paths: string[]): Promise<void> {
  await cleanupTempFiles(paths);
}

// ============================================================================
// ADVANCED FEATURES (Phase 2)
// ============================================================================

/**
 * Analyze hook timing - extract first 3 seconds for pattern analysis
 *
 * Returns frames from the hook period for ML analysis
 */
export async function analyzeHookPattern(videoUrl: string): Promise<{
  frames: { frameNumber: number; timestamp: number; path: string }[];
  metadata: VideoMetadata;
}> {
  const metadata = await analyzeVideoMetrics(videoUrl);

  // Extract first 3 seconds at 10fps (30 frames)
  const frames = await extractFrames(videoUrl, {
    fps: 10,
    startTime: 0,
    endTime: 3,
    width: 320, // Smaller size for faster processing
  });

  return { frames, metadata };
}

/**
 * Calculate video scene changes (cuts/transitions)
 *
 * Returns timestamps where scene changes occur
 */
export async function detectSceneChanges(videoUrl: string): Promise<number[]> {
  // Placeholder - requires ffmpeg scene detection filter
  // Command: ffmpeg -i video.mp4 -filter:v "select='gt(scene,0.4)',showinfo" -f null -

  // TODO: Implement scene change detection
  return [];
}

// ============================================================================
// EXPORT DEFAULT SERVICE
// ============================================================================

export default {
  analyzeVideoMetrics,
  extractThumbnails,
  extractFrames,
  extractAudio,
  getColorPalette,
  getVideoInfo,
  cleanupVideoAssets,
  analyzeHookPattern,
  detectSceneChanges,
};
