/**
 * Immediate Video Analyzer
 * 
 * Provides quick video analysis using FFmpeg for immediate processing.
 * Used during bulk downloads and scraping to analyze videos on-the-fly.
 */

import { runV2FFmpegAnalysisForPath, runV2FFmpegAnalysisForUrl } from './ffmpeg-full-analyzer';

// ============================================================================
// TYPES
// ============================================================================

export interface ImmediateAnalysisResult {
  success: boolean;
  videoId: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  aspectRatio: string;
  transcript?: string;
  error?: string;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze a video immediately after download
 * 
 * @param videoUrl - Original video URL (for fallback)
 * @param videoId - Video identifier
 * @param transcript - Pre-extracted transcript (if available)
 * @param localPath - Local file path (if downloaded)
 */
export async function analyzeVideoImmediately(
  videoUrl: string,
  videoId: string,
  transcript: string = '',
  localPath?: string
): Promise<ImmediateAnalysisResult> {
  try {
    let ffmpegResult;

    // Prefer local path if available
    if (localPath) {
      ffmpegResult = await runV2FFmpegAnalysisForPath(localPath, { timeout: 30000 });
    } else {
      // Fall back to URL analysis
      ffmpegResult = await runV2FFmpegAnalysisForUrl(videoUrl, { timeout: 60000 });
    }

    if (!ffmpegResult.success) {
      return {
        success: false,
        videoId,
        duration: 0,
        width: 0,
        height: 0,
        fps: 0,
        hasAudio: false,
        aspectRatio: 'unknown',
        transcript,
        error: ffmpegResult.error,
      };
    }

    return {
      success: true,
      videoId,
      duration: ffmpegResult.duration,
      width: ffmpegResult.width,
      height: ffmpegResult.height,
      fps: ffmpegResult.fps,
      hasAudio: ffmpegResult.hasAudio,
      aspectRatio: ffmpegResult.aspectRatio,
      transcript,
    };
  } catch (error: any) {
    console.error(`[Immediate Analyzer] Error for ${videoId}:`, error.message);
    return {
      success: false,
      videoId,
      duration: 0,
      width: 0,
      height: 0,
      fps: 0,
      hasAudio: false,
      aspectRatio: 'unknown',
      transcript,
      error: error.message,
    };
  }
}

/**
 * Batch analyze multiple videos
 */
export async function analyzeVideosImmediately(
  videos: Array<{ url: string; videoId: string; transcript?: string; localPath?: string }>,
  options: { concurrency?: number } = {}
): Promise<ImmediateAnalysisResult[]> {
  const { concurrency = 3 } = options;
  const results: ImmediateAnalysisResult[] = [];

  // Process in batches for concurrency control
  for (let i = 0; i < videos.length; i += concurrency) {
    const batch = videos.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(v => analyzeVideoImmediately(v.url, v.videoId, v.transcript || '', v.localPath))
    );
    results.push(...batchResults);
  }

  return results;
}
