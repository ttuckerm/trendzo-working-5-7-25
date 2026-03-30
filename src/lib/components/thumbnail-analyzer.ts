/**
 * Thumbnail Analyzer (Component 20)
 *
 * Analyzes video thumbnails (first frame) for engagement potential using
 * data from the canonical FFmpeg analyzer (brightness, contrast, color saturation).
 *
 * Rewired in Batch A, Prompt 3 — no longer runs its own FFmpeg exec commands.
 * Uses canonical analyzer's signalstats data (brightness_avg, contrast_score, color_variance)
 * instead of extracting a frame and running a separate signalstats pass.
 */

import { existsSync } from 'fs';
import { analyzeVideo, type CanonicalFFmpegResult } from '@/lib/services/ffmpeg-canonical-analyzer';

export interface ThumbnailAnalyzerResult {
  success: boolean;
  visualScore: number; // 0-10
  contrastScore: number; // 0-10
  colorScore: number; // 0-10
  compositionScore: number; // 0-10
  overallScore: number; // 0-10
  confidence: number; // 0-1
  insights: string[];
  features: {
    dominantColors?: string[];
    hasText?: boolean;
    hasFace?: boolean;
    brightness?: number; // 0-255
    contrast?: number; // 0-100
    colorfulness?: number; // 0-100
  };
  error?: string;
}

/**
 * Thumbnail Analyzer
 */
export class ThumbnailAnalyzer {
  /**
   * Analyze thumbnail (first frame) from video using canonical analyzer data.
   */
  public static async analyze(videoPath?: string): Promise<ThumbnailAnalyzerResult> {
    if (!videoPath) {
      return this.failureResult('Video path required for thumbnail analysis', 'No video path provided - cannot analyze thumbnail');
    }

    if (!existsSync(videoPath)) {
      return this.failureResult('Video file does not exist', 'Video file not found');
    }

    try {
      const canonical = await analyzeVideo(videoPath);

      if (!canonical.extraction_success) {
        return this.failureResult(
          canonical.error || 'Canonical FFmpeg analysis failed',
          'FFmpeg analysis failed'
        );
      }

      return this.buildResult(canonical);
    } catch (error: any) {
      return this.failureResult(error.message, 'Error analyzing thumbnail');
    }
  }

  /**
   * Build result from canonical analyzer output.
   * Can also be called directly if a canonical result is already available,
   * avoiding a duplicate FFmpeg run.
   */
  public static buildResult(canonical: CanonicalFFmpegResult): ThumbnailAnalyzerResult {
    const insights: string[] = [];

    // Convert canonical 0-1 normalized values to the scales this component uses
    // brightness_avg: 0-1 -> 0-255 (YAVG scale)
    const brightness = Math.round(canonical.brightness_avg * 255);
    // contrast_score: 0-1 -> 0-100
    const contrast = Math.round(canonical.contrast_score * 100);
    // color_variance (SATAVG): 0-1 -> 0-100 (colorfulness)
    const colorfulness = Math.round(canonical.color_variance * 100);

    // Contrast Score (0-10)
    let contrastScore = 5;
    if (contrast >= 60) {
      contrastScore = 9;
      insights.push('Excellent contrast: High visual impact');
    } else if (contrast >= 45) {
      contrastScore = 7;
      insights.push('Good contrast: Clear visual separation');
    } else if (contrast >= 30) {
      contrastScore = 5;
      insights.push('Moderate contrast: Consider enhancing');
    } else {
      contrastScore = 3;
      insights.push('Low contrast: May not grab attention');
    }

    // Brightness Score (0-10)
    let brightnessScore = 5;
    if (brightness >= 100 && brightness <= 180) {
      brightnessScore = 9;
      insights.push('Optimal brightness: Well-lit frame');
    } else if (brightness >= 80 && brightness < 100) {
      brightnessScore = 6;
      insights.push('Slightly dark: Consider brightening');
    } else if (brightness > 180 && brightness <= 220) {
      brightnessScore = 7;
      insights.push('Bright frame: Good for attention');
    } else if (brightness < 80) {
      brightnessScore = 4;
      insights.push('Very dark: Poor visibility');
    } else {
      brightnessScore = 5;
      insights.push('Very bright: May be overexposed');
    }

    // Color Score (now using real SATAVG data instead of heuristic)
    let colorScore = 5;
    if (colorfulness >= 70) {
      colorScore = 9;
      insights.push('Vibrant colors: Eye-catching palette');
    } else if (colorfulness >= 50) {
      colorScore = 7;
      insights.push('Good color variety');
    } else if (colorfulness >= 30) {
      colorScore = 5;
      insights.push('Moderate colors');
    } else {
      colorScore = 3;
      insights.push('Muted colors: Consider adding vibrancy');
    }

    // Composition Score (heuristic based on brightness distribution)
    let compositionScore = 6; // Baseline
    if (brightness >= 90 && brightness <= 170 && contrast >= 40) {
      compositionScore = 8;
      insights.push('Well-composed frame');
    } else {
      insights.push('Composition: Unable to fully assess');
    }

    // Overall Visual Score (weighted average)
    const visualScore = (
      contrastScore * 0.35 +
      brightnessScore * 0.25 +
      colorScore * 0.25 +
      compositionScore * 0.15
    );

    const overallScore = Math.round(visualScore * 10) / 10;

    // Compute confidence based on how much real signalstats data we got
    const hasBrightness = canonical.brightness_avg > 0;
    const hasContrast = canonical.contrast_score > 0;
    const confidence = (hasBrightness && hasContrast) ? 0.8
      : (hasBrightness || hasContrast) ? 0.5
      : 0.3;

    return {
      success: true,
      visualScore: Math.round(visualScore * 10) / 10,
      contrastScore: Math.round(contrastScore * 10) / 10,
      colorScore: Math.round(colorScore * 10) / 10,
      compositionScore: Math.round(compositionScore * 10) / 10,
      overallScore,
      confidence,
      insights,
      features: {
        brightness,
        contrast,
        colorfulness,
        hasText: undefined, // Would require OCR
        hasFace: undefined  // Would require face detection
      }
    };
  }

  private static failureResult(error: string, insightMsg: string): ThumbnailAnalyzerResult {
    return {
      success: false,
      visualScore: 5,
      contrastScore: 5,
      colorScore: 5,
      compositionScore: 5,
      overallScore: 5,
      confidence: 0.3,
      insights: [insightMsg],
      features: {},
      error
    };
  }

  /**
   * Convert thumbnail analysis to VPS prediction score.
   * Renamed from toDPS — these are VPS-range prediction scores, NOT DPS measurements.
   */
  public static toPrediction(result: ThumbnailAnalyzerResult): number {
    if (!result.success || result.overallScore === undefined) {
      return 50; // Baseline
    }

    // Map overall score (0-10) to DPS (35-80)
    const baseDPS = 35;
    const maxBonus = 45;
    const dpsPrediction = baseDPS + (result.overallScore / 10) * maxBonus;

    return Math.round(dpsPrediction * 10) / 10;
  }
}
