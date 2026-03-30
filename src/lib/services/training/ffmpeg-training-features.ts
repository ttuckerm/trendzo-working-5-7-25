// DEPRECATED: Use src/lib/services/ffmpeg-canonical-analyzer.ts instead
/**
 * FFmpeg Training Features Extraction
 *
 * Extracts video features for training and prediction using FFmpeg.
 * Provides structured feature data for the ML pipeline.
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
if (ffprobeStatic.path) {
  ffmpeg.setFfprobePath(ffprobeStatic.path);
}

export interface FFmpegTrainingFeatures {
  extraction_success: boolean;
  resolution_width: number;
  resolution_height: number;
  fps: number;
  duration_seconds: number;
  aspect_ratio: string;
  has_audio: boolean;
  audio_codec: string | null;
  video_codec: string | null;
  bitrate: number;
  scene_changes: number;
  cuts_per_second: number;
  avg_motion: number;
  color_variance: number;
  brightness_avg: number;
  contrast_score: number;
}

export interface FFmpegExtractionResult {
  features: FFmpegTrainingFeatures;
  rawMetadata?: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    bitrate: number;
    format: string;
  };
  error?: string;
}

export interface FFmpegExtractionOptions {
  includeSceneDetection?: boolean;
  timeout?: number;
}

/**
 * Get default feature values for when extraction fails or video is unavailable
 */
export function getDefaultFFmpegFeatures(): FFmpegTrainingFeatures {
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
    avg_motion: 0,
    color_variance: 0,
    brightness_avg: 0,
    contrast_score: 0,
  };
}

/**
 * Extract FFmpeg features from a video file for training/prediction
 */
export async function extractFFmpegTrainingFeatures(
  videoPath: string,
  options: FFmpegExtractionOptions = {}
): Promise<FFmpegExtractionResult> {
  const { timeout = 30000 } = options;

  // Check if file exists
  if (!existsSync(videoPath)) {
    return {
      features: getDefaultFFmpegFeatures(),
      error: `Video file not found: ${videoPath}`,
    };
  }

  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({
        features: getDefaultFFmpegFeatures(),
        error: 'FFmpeg extraction timed out',
      });
    }, timeout);

    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      clearTimeout(timeoutId);

      if (err) {
        resolve({
          features: getDefaultFFmpegFeatures(),
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
        
        // Parse FPS from frame rate string (e.g., "30/1" or "29.97")
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
          if (Math.abs(ratio - 16/9) < 0.1) aspectRatio = '16:9';
          else if (Math.abs(ratio - 9/16) < 0.1) aspectRatio = '9:16';
          else if (Math.abs(ratio - 4/3) < 0.1) aspectRatio = '4:3';
          else if (Math.abs(ratio - 1) < 0.1) aspectRatio = '1:1';
          else aspectRatio = `${width}:${height}`;
        }

        const features: FFmpegTrainingFeatures = {
          extraction_success: true,
          resolution_width: width,
          resolution_height: height,
          fps: fps,
          duration_seconds: duration,
          aspect_ratio: aspectRatio,
          has_audio: !!audioStream,
          audio_codec: audioStream?.codec_name || null,
          video_codec: videoStream?.codec_name || null,
          bitrate: parseInt(format?.bit_rate || '0'),
          // Scene detection would require additional processing
          scene_changes: 0,
          cuts_per_second: 0,
          // Motion/color analysis would require frame-by-frame processing
          avg_motion: 0.5, // Placeholder
          color_variance: 0.5, // Placeholder
          brightness_avg: 0.5, // Placeholder
          contrast_score: 0.5, // Placeholder
        };

        resolve({
          features,
          rawMetadata: {
            duration,
            width,
            height,
            fps,
            bitrate: parseInt(format?.bit_rate || '0'),
            format: format?.format_name || 'unknown',
          },
        });
      } catch (parseError: any) {
        resolve({
          features: getDefaultFFmpegFeatures(),
          error: `Metadata parse error: ${parseError.message}`,
        });
      }
    });
  });
}
