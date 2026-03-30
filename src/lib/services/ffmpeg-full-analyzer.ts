// DEPRECATED: Use src/lib/services/ffmpeg-canonical-analyzer.ts instead
/**
 * FFmpeg Full Video Analyzer
 *
 * Provides comprehensive FFmpeg-based video analysis for prediction pipeline.
 * Extracts technical video metadata including resolution, duration, fps, codec info.
 *
 * @deprecated Replaced by ffmpeg-canonical-analyzer.ts (Batch A, Prompt 2 — FFM-001)
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { existsSync } from 'fs';

// Configure FFmpeg paths
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}
if (ffprobeStatic?.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

// ============================================================================
// TYPES
// ============================================================================

export interface FFmpegAnalysisResult {
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
  fileSize: number;
  format: string;
  error?: string;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Run comprehensive FFmpeg analysis on a video file path
 */
export async function runV2FFmpegAnalysisForPath(
  videoPath: string,
  options: { timeout?: number } = {}
): Promise<FFmpegAnalysisResult> {
  const { timeout = 30000 } = options;

  // Check if file exists
  if (!existsSync(videoPath)) {
    return {
      success: false,
      duration: 0,
      width: 0,
      height: 0,
      fps: 0,
      bitrate: 0,
      hasAudio: false,
      audioCodec: null,
      videoCodec: null,
      aspectRatio: 'unknown',
      fileSize: 0,
      format: 'unknown',
      error: `Video file not found: ${videoPath}`,
    };
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        duration: 0,
        width: 0,
        height: 0,
        fps: 0,
        bitrate: 0,
        hasAudio: false,
        audioCodec: null,
        videoCodec: null,
        aspectRatio: 'unknown',
        fileSize: 0,
        format: 'unknown',
        error: 'FFmpeg analysis timed out',
      });
    }, timeout);

    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      clearTimeout(timeoutId);

      if (err) {
        resolve({
          success: false,
          duration: 0,
          width: 0,
          height: 0,
          fps: 0,
          bitrate: 0,
          hasAudio: false,
          audioCodec: null,
          videoCodec: null,
          aspectRatio: 'unknown',
          fileSize: 0,
          format: 'unknown',
          error: `FFprobe error: ${err.message}`,
        });
        return;
      }

      try {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        const format = metadata.format;

        const width = videoStream?.width || 0;
        const height = videoStream?.height || 0;
        const duration = parseFloat(format?.duration || '0');

        // Parse FPS from frame rate string
        let fps = 0;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2) {
            fps = parseInt(parts[0]) / parseInt(parts[1]);
          } else {
            fps = parseFloat(videoStream.r_frame_rate);
          }
        }

        // Calculate aspect ratio
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
          fileSize: parseInt(format?.size || '0'),
          format: format?.format_name || 'unknown',
        });
      } catch (parseError: any) {
        resolve({
          success: false,
          duration: 0,
          width: 0,
          height: 0,
          fps: 0,
          bitrate: 0,
          hasAudio: false,
          audioCodec: null,
          videoCodec: null,
          aspectRatio: 'unknown',
          fileSize: 0,
          format: 'unknown',
          error: `Metadata parse error: ${parseError.message}`,
        });
      }
    });
  });
}

/**
 * Run FFmpeg analysis on a video URL (downloads and analyzes)
 */
export async function runV2FFmpegAnalysisForUrl(
  videoUrl: string,
  options: { timeout?: number } = {}
): Promise<FFmpegAnalysisResult> {
  const { timeout = 60000 } = options;

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        duration: 0,
        width: 0,
        height: 0,
        fps: 0,
        bitrate: 0,
        hasAudio: false,
        audioCodec: null,
        videoCodec: null,
        aspectRatio: 'unknown',
        fileSize: 0,
        format: 'unknown',
        error: 'FFmpeg URL analysis timed out',
      });
    }, timeout);

    ffmpeg.ffprobe(videoUrl, (err, metadata) => {
      clearTimeout(timeoutId);

      if (err) {
        resolve({
          success: false,
          duration: 0,
          width: 0,
          height: 0,
          fps: 0,
          bitrate: 0,
          hasAudio: false,
          audioCodec: null,
          videoCodec: null,
          aspectRatio: 'unknown',
          fileSize: 0,
          format: 'unknown',
          error: `FFprobe URL error: ${err.message}`,
        });
        return;
      }

      try {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        const format = metadata.format;

        const width = videoStream?.width || 0;
        const height = videoStream?.height || 0;
        const duration = parseFloat(format?.duration || '0');

        let fps = 0;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2) {
            fps = parseInt(parts[0]) / parseInt(parts[1]);
          } else {
            fps = parseFloat(videoStream.r_frame_rate);
          }
        }

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
          fileSize: parseInt(format?.size || '0'),
          format: format?.format_name || 'unknown',
        });
      } catch (parseError: any) {
        resolve({
          success: false,
          duration: 0,
          width: 0,
          height: 0,
          fps: 0,
          bitrate: 0,
          hasAudio: false,
          audioCodec: null,
          videoCodec: null,
          aspectRatio: 'unknown',
          fileSize: 0,
          format: 'unknown',
          error: `URL metadata parse error: ${parseError.message}`,
        });
      }
    });
  });
}
