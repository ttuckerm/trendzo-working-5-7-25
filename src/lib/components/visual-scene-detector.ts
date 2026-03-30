/**
 * Component 16: Visual Scene Detection
 *
 * Thin wrapper over the canonical FFmpeg analyzer (ffmpeg-canonical-analyzer.ts).
 * Reads pre-computed scene_changes and hook_scene_changes from the canonical result
 * and computes editing pace classification and visual scores.
 *
 * Returns: visualScore, cutsPerSecond, hasTextOverlay, editingPace, sceneChanges
 *
 * Rewired in Batch A, Prompt 3 — no longer runs its own FFmpeg invocations.
 */

import { analyzeVideo, type CanonicalFFmpegResult } from '@/lib/services/ffmpeg-canonical-analyzer';

export interface VisualSceneResult {
  success: boolean;
  visualScore: number; // 0-10
  cutsPerSecond: number;
  editingPace: 'rapid' | 'moderate' | 'slow' | 'unknown';
  sceneChanges: number;
  hasTextOverlay: boolean;
  insights: string[];
  error?: string;

  // Raw metrics
  rawMetrics?: {
    totalFramesAnalyzed: number;
    hookPeriodCuts: number; // Cuts in first 3 seconds
    averageBrightness: number;
    duration: number;
  };
}

export class VisualSceneDetector {
  /**
   * Analyze visual scenes from video file using canonical FFmpeg analyzer.
   */
  public static async analyze(videoPath: string): Promise<VisualSceneResult> {
    try {
      const canonical = await analyzeVideo(videoPath);

      if (!canonical.extraction_success) {
        return {
          success: false,
          visualScore: 0,
          cutsPerSecond: 0,
          editingPace: 'unknown',
          sceneChanges: 0,
          hasTextOverlay: false,
          insights: ['Visual analysis failed'],
          error: canonical.error || 'Canonical FFmpeg analysis failed'
        };
      }

      return this.buildResult(canonical);
    } catch (error: any) {
      return {
        success: false,
        visualScore: 0,
        cutsPerSecond: 0,
        editingPace: 'unknown',
        sceneChanges: 0,
        hasTextOverlay: false,
        insights: ['Visual analysis failed'],
        error: error.message
      };
    }
  }

  /**
   * Build result from canonical analyzer output.
   * Can also be called directly if a canonical result is already available,
   * avoiding a duplicate FFmpeg run.
   */
  public static buildResult(canonical: CanonicalFFmpegResult): VisualSceneResult {
    const cutsPerSecond = canonical.cuts_per_second;
    const sceneChanges = canonical.scene_changes;
    const hookPeriodCuts = canonical.hook_scene_changes;

    const editingPace = this.classifyEditingPace(cutsPerSecond);

    const visualScore = this.calculateVisualScore({
      cutsPerSecond,
      editingPace,
      hookPeriodCuts,
      hasTextOverlay: false, // TODO [VSD-003]: No real text detection yet
      sceneChanges
    });

    const insights = this.generateInsights({
      visualScore,
      cutsPerSecond,
      editingPace,
      hookPeriodCuts,
      hasTextOverlay: false,
      sceneChanges
    });

    return {
      success: true,
      visualScore,
      cutsPerSecond: parseFloat(cutsPerSecond.toFixed(2)),
      editingPace,
      sceneChanges,
      hasTextOverlay: false, // TODO [VSD-003]
      insights,
      rawMetrics: {
        totalFramesAnalyzed: 0, // No longer extracting individual frames
        hookPeriodCuts,
        averageBrightness: canonical.brightness_avg,
        duration: canonical.duration_seconds
      }
    };
  }

  /**
   * Classify editing pace based on cuts per second
   */
  private static classifyEditingPace(cutsPerSecond: number): 'rapid' | 'moderate' | 'slow' | 'unknown' {
    if (cutsPerSecond >= 1.0) return 'rapid';      // 1+ cuts/second = fast-paced
    if (cutsPerSecond >= 0.3) return 'moderate';   // 0.3-1 cuts/second = normal
    if (cutsPerSecond >= 0.1) return 'slow';       // 0.1-0.3 cuts/second = slow
    return 'slow'; // <0.1 cuts/second = very slow or static
  }

  /**
   * Calculate overall visual score (0-10)
   */
  private static calculateVisualScore(params: {
    cutsPerSecond: number;
    editingPace: 'rapid' | 'moderate' | 'slow' | 'unknown';
    hookPeriodCuts: number;
    hasTextOverlay: boolean;
    sceneChanges: number;
  }): number {
    let score = 5; // Base score

    // Editing pace scoring (0-3 points)
    if (params.editingPace === 'rapid') score += 3;
    else if (params.editingPace === 'moderate') score += 2;
    else if (params.editingPace === 'slow') score += 0.5;

    // Hook period cuts (0-2 points)
    if (params.hookPeriodCuts >= 5) score += 2; // 5+ cuts in 3 seconds = excellent
    else if (params.hookPeriodCuts >= 3) score += 1.5;
    else if (params.hookPeriodCuts >= 1) score += 1;

    // Text overlay bonus (+2 points)
    if (params.hasTextOverlay) score += 2;

    // Overall scene changes (0-1 point)
    if (params.sceneChanges >= 10) score += 1;
    else if (params.sceneChanges >= 5) score += 0.5;

    // Penalty for too slow
    if (params.cutsPerSecond < 0.1) score -= 2;

    // Normalize to 0-10 range
    return parseFloat(Math.max(0, Math.min(10, score)).toFixed(1));
  }

  /**
   * Generate actionable insights
   */
  private static generateInsights(params: {
    visualScore: number;
    cutsPerSecond: number;
    editingPace: 'rapid' | 'moderate' | 'slow' | 'unknown';
    hookPeriodCuts: number;
    hasTextOverlay: boolean;
    sceneChanges: number;
  }): string[] {
    const insights: string[] = [];

    // Overall score insight
    if (params.visualScore >= 8) {
      insights.push('Excellent visual pacing - fast cuts drive engagement');
    } else if (params.visualScore >= 6) {
      insights.push('Good visual pacing - maintains viewer attention');
    } else if (params.visualScore >= 4) {
      insights.push('Moderate visual pacing - could benefit from more cuts');
    } else {
      insights.push('Slow visual pacing - add more cuts to improve retention');
    }

    // Editing pace insight
    if (params.editingPace === 'rapid') {
      insights.push(`Rapid editing (${params.cutsPerSecond.toFixed(1)} cuts/sec) keeps viewers hooked`);
    } else if (params.editingPace === 'slow') {
      insights.push(`Slow editing (${params.cutsPerSecond.toFixed(1)} cuts/sec) - increase pace for TikTok`);
    }

    // Hook period insight
    if (params.hookPeriodCuts >= 5) {
      insights.push('Excellent hook editing - multiple cuts in first 3 seconds');
    } else if (params.hookPeriodCuts <= 1) {
      insights.push('Weak hook editing - add more cuts in first 3 seconds');
    }

    // Text overlay insight
    if (params.hasTextOverlay) {
      insights.push('Text overlays detected - great for accessibility and engagement');
    } else {
      insights.push('No text overlays detected - consider adding text for better retention');
    }

    // Scene changes insight
    if (params.sceneChanges < 5) {
      insights.push('Low scene variety - add B-roll or more visual changes');
    }

    return insights;
  }

  /**
   * Convert visual analysis to VPS prediction score.
   * Renamed from toDPS — these are VPS-range prediction scores, NOT DPS measurements.
   */
  public static toPrediction(result: VisualSceneResult): number {
    if (!result.success) {
      return 50; // Neutral if analysis failed
    }

    // Map visual score (0-10) to DPS (40-80)
    // Visual pacing is critical for TikTok/short-form
    const baseDPS = 40 + (result.visualScore * 4);

    // Boost for ideal combinations
    let boost = 0;
    if (result.editingPace === 'rapid' && result.hasTextOverlay) {
      boost += 5; // Fast cuts + text = viral combo
    }
    if (result.cutsPerSecond >= 1.5) {
      boost += 3; // Very fast editing = highly engaging
    }

    const finalDPS = Math.min(80, Math.max(40, baseDPS + boost));
    return parseFloat(finalDPS.toFixed(1));
  }
}
