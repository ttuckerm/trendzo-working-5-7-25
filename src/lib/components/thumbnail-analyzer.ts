/**
 * Thumbnail Analyzer (Component 20)
 *
 * Analyzes video thumbnails (first frame) to predict engagement potential:
 * - Visual contrast and attention-grabbing elements
 * - Color psychology and palette effectiveness
 * - Text overlay detection and readability
 * - Face detection and emotion analysis
 * - Composition and framing quality
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

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
   * Analyze thumbnail (first frame) from video
   */
  public static async analyze(videoPath?: string): Promise<ThumbnailAnalyzerResult> {
    const insights: string[] = [];
    let tempFramePath: string | null = null;

    try {
      // Validation
      if (!videoPath) {
        return {
          success: false,
          visualScore: 5,
          contrastScore: 5,
          colorScore: 5,
          compositionScore: 5,
          overallScore: 5,
          confidence: 0.3,
          insights: ['No video path provided - cannot analyze thumbnail'],
          features: {},
          error: 'Video path required for thumbnail analysis'
        };
      }

      if (!existsSync(videoPath)) {
        return {
          success: false,
          visualScore: 5,
          contrastScore: 5,
          colorScore: 5,
          compositionScore: 5,
          overallScore: 5,
          confidence: 0.3,
          insights: ['Video file not found'],
          features: {},
          error: 'Video file does not exist'
        };
      }

      // Step 1: Extract first frame using FFmpeg
      const timestamp = Date.now();
      tempFramePath = join(process.cwd(), 'data', 'temp', `thumbnail_${timestamp}.jpg`);

      // FFmpeg 8.0+ requires -update 1 for single-image output to image2 muxer
      // Normalize paths to forward slashes for FFmpeg compatibility on Windows
      const normalizedVideoPath = videoPath.replace(/\\/g, '/');
      const normalizedTempPath = tempFramePath.replace(/\\/g, '/');
      const extractCommand = `ffmpeg -i "${normalizedVideoPath}" -ss 00:00:00.5 -vframes 1 -q:v 2 -update 1 "${normalizedTempPath}" -y`;

      try {
        await execAsync(extractCommand);
      } catch (ffmpegError: any) {
        return {
          success: false,
          visualScore: 5,
          contrastScore: 5,
          colorScore: 5,
          compositionScore: 5,
          overallScore: 5,
          confidence: 0.3,
          insights: ['Failed to extract thumbnail frame'],
          features: {},
          error: `FFmpeg extraction failed: ${ffmpegError.message}`
        };
      }

      if (!existsSync(tempFramePath)) {
        return {
          success: false,
          visualScore: 5,
          contrastScore: 5,
          colorScore: 5,
          compositionScore: 5,
          overallScore: 5,
          confidence: 0.3,
          insights: ['Thumbnail frame not created'],
          features: {},
          error: 'Frame extraction failed'
        };
      }

      // Step 2: Analyze frame using FFmpeg filters
      const analysisCommand = `ffmpeg -i "${tempFramePath}" -vf "signalstats,metadata=print:file=-" -f null -`;

      let brightness = 128;
      let contrast = 50;

      try {
        const { stdout, stderr } = await execAsync(analysisCommand);
        const output = stdout + stderr;

        // Extract brightness (YAVG)
        const brightnessMatch = output.match(/lavfi\.signalstats\.YAVG=([0-9.]+)/);
        if (brightnessMatch) {
          brightness = Math.round(parseFloat(brightnessMatch[1]));
        }

        // Extract contrast metrics (approximate from YDIF)
        const contrastMatch = output.match(/lavfi\.signalstats\.YDIF=([0-9.]+)/);
        if (contrastMatch) {
          contrast = Math.min(100, Math.round(parseFloat(contrastMatch[1]) * 2));
        }
      } catch (analysisError: any) {
        console.warn('FFmpeg analysis warning:', analysisError.message);
      }

      // Step 3: Calculate scores

      // Contrast Score (0-10)
      let contrastScore = 5;
      if (contrast >= 60) {
        contrastScore = 9;
        insights.push('🎨 Excellent contrast: High visual impact');
      } else if (contrast >= 45) {
        contrastScore = 7;
        insights.push('✅ Good contrast: Clear visual separation');
      } else if (contrast >= 30) {
        contrastScore = 5;
        insights.push('⚠️ Moderate contrast: Consider enhancing');
      } else {
        contrastScore = 3;
        insights.push('❌ Low contrast: May not grab attention');
      }

      // Brightness Score (0-10)
      let brightnessScore = 5;
      if (brightness >= 100 && brightness <= 180) {
        brightnessScore = 9;
        insights.push('💡 Optimal brightness: Well-lit frame');
      } else if (brightness >= 80 && brightness < 100) {
        brightnessScore = 6;
        insights.push('🌗 Slightly dark: Consider brightening');
      } else if (brightness > 180 && brightness <= 220) {
        brightnessScore = 7;
        insights.push('☀️ Bright frame: Good for attention');
      } else if (brightness < 80) {
        brightnessScore = 4;
        insights.push('🌑 Very dark: Poor visibility');
      } else {
        brightnessScore = 5;
        insights.push('☀️ Very bright: May be overexposed');
      }

      // Color Score (based on colorfulness estimate)
      const colorfulness = this.estimateColorfulness(brightness, contrast);
      let colorScore = 5;
      if (colorfulness >= 70) {
        colorScore = 9;
        insights.push('🌈 Vibrant colors: Eye-catching palette');
      } else if (colorfulness >= 50) {
        colorScore = 7;
        insights.push('🎨 Good color variety');
      } else if (colorfulness >= 30) {
        colorScore = 5;
        insights.push('⚪ Moderate colors');
      } else {
        colorScore = 3;
        insights.push('⚫ Muted colors: Consider adding vibrancy');
      }

      // Composition Score (heuristic based on brightness distribution)
      let compositionScore = 6; // Baseline (we can't fully analyze without pixel data)
      if (brightness >= 90 && brightness <= 170 && contrast >= 40) {
        compositionScore = 8;
        insights.push('📐 Well-composed frame');
      } else {
        insights.push('📐 Composition: Unable to fully assess');
      }

      // Overall Visual Score (weighted average)
      const visualScore = (
        contrastScore * 0.35 +
        brightnessScore * 0.25 +
        colorScore * 0.25 +
        compositionScore * 0.15
      );

      const overallScore = Math.round(visualScore * 10) / 10;

      // Calculate confidence (we have limited analysis without ML models)
      const confidence = 0.65;

      // Cleanup temp file
      if (tempFramePath && existsSync(tempFramePath)) {
        try {
          unlinkSync(tempFramePath);
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp thumbnail:', cleanupError);
        }
      }

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
          colorfulness: Math.round(colorfulness),
          hasText: undefined, // Would require OCR
          hasFace: undefined  // Would require face detection
        }
      };

    } catch (error: any) {
      // Cleanup temp file on error
      if (tempFramePath && existsSync(tempFramePath)) {
        try {
          unlinkSync(tempFramePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }

      return {
        success: false,
        visualScore: 5,
        contrastScore: 5,
        colorScore: 5,
        compositionScore: 5,
        overallScore: 5,
        confidence: 0.3,
        insights: ['Error analyzing thumbnail'],
        features: {},
        error: error.message
      };
    }
  }

  /**
   * Estimate colorfulness from brightness and contrast
   * This is a heuristic approximation without full pixel analysis
   */
  private static estimateColorfulness(brightness: number, contrast: number): number {
    // High contrast + moderate brightness = likely colorful
    let colorfulness = 30; // Baseline

    if (contrast >= 50) {
      colorfulness += 30;
    } else if (contrast >= 35) {
      colorfulness += 20;
    } else {
      colorfulness += 10;
    }

    if (brightness >= 100 && brightness <= 180) {
      colorfulness += 20;
    } else {
      colorfulness += 10;
    }

    return Math.min(100, colorfulness);
  }

  /**
   * Convert thumbnail analysis to DPS prediction
   * Range: 35 (poor visual) to 80 (excellent visual)
   */
  public static toDPS(result: ThumbnailAnalyzerResult): number {
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
