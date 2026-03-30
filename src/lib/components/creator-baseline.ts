/**
 * Component 19: Creator History Baseline
 *
 * Personalizes predictions based on creator's historical performance.
 * Compares new predictions to creator's baseline to provide contextualized scores.
 *
 * Example: If creator averages 40 DPS and prediction is 70 DPS,
 * this is 1.75x better than their usual content.
 *
 * Returns: relativeScore, improvementFactor, contextualizedPrediction
 */

export interface CreatorProfile {
  id: string;
  tiktok_username: string;
  baseline_dps: number;
  baseline_engagement_rate: number;
  avg_views: number;
  avg_likes: number;
  total_videos: number;
  dps_percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  content_style?: Record<string, any>;
  strengths?: string[];
  weaknesses?: string[];
}

export interface CreatorBaselineResult {
  success: boolean;
  relativeScore: number; // 0-10 (how good is this compared to their baseline)
  improvementFactor: number; // multiplier (1.5x = 50% better than usual)
  percentileRank: string; // 'below p25' | 'p25-p50' | 'p50-p75' | 'p75-p90' | 'top 10%'
  contextualizedPrediction: string; // Human-readable: "1.5x better than your average"
  insights: string[];
  error?: string;

  // Raw data
  rawData?: {
    predictedDPS: number;
    creatorBaselineDPS: number;
    creatorP50: number;
    creatorP90: number;
  };
}

export class CreatorBaseline {
  /**
   * Analyze prediction relative to creator's baseline
   */
  public static analyze(
    predictedDPS: number,
    creatorProfile: CreatorProfile
  ): CreatorBaselineResult {
    if (!creatorProfile || creatorProfile.baseline_dps === 0) {
      return {
        success: false,
        relativeScore: 0,
        improvementFactor: 1,
        percentileRank: 'unknown',
        contextualizedPrediction: 'No creator baseline available',
        insights: ['Creator has no historical data for comparison'],
        error: 'No creator baseline'
      };
    }

    const baselineDPS = creatorProfile.baseline_dps;
    const percentiles = creatorProfile.dps_percentiles || { p25: 0, p50: 0, p75: 0, p90: 0 };

    // Calculate improvement factor
    const improvementFactor = predictedDPS / baselineDPS;

    // Determine percentile rank
    const percentileRank = this.getPercentileRank(predictedDPS, percentiles);

    // Calculate relative score (0-10)
    const relativeScore = this.calculateRelativeScore(predictedDPS, baselineDPS, percentiles);

    // Generate contextualized prediction
    const contextualizedPrediction = this.generateContextualizedPrediction(
      improvementFactor,
      percentileRank,
      baselineDPS
    );

    // Generate insights
    const insights = this.generateInsights(
      predictedDPS,
      baselineDPS,
      improvementFactor,
      percentileRank,
      creatorProfile
    );

    return {
      success: true,
      relativeScore,
      improvementFactor: parseFloat(improvementFactor.toFixed(2)),
      percentileRank,
      contextualizedPrediction,
      insights,
      rawData: {
        predictedDPS,
        creatorBaselineDPS: baselineDPS,
        creatorP50: percentiles.p50,
        creatorP90: percentiles.p90
      }
    };
  }

  /**
   * Determine which percentile bucket the prediction falls into
   */
  private static getPercentileRank(
    predictedDPS: number,
    percentiles: { p25: number; p50: number; p75: number; p90: number }
  ): string {
    if (predictedDPS >= percentiles.p90) return 'top 10%';
    if (predictedDPS >= percentiles.p75) return 'p75-p90';
    if (predictedDPS >= percentiles.p50) return 'p50-p75';
    if (predictedDPS >= percentiles.p25) return 'p25-p50';
    return 'below p25';
  }

  /**
   * Calculate relative score (0-10) based on how prediction compares to baseline
   */
  private static calculateRelativeScore(
    predictedDPS: number,
    baselineDPS: number,
    percentiles: { p25: number; p50: number; p75: number; p90: number }
  ): number {
    // Score based on percentile rank
    if (predictedDPS >= percentiles.p90) return 10; // Top 10% = perfect score
    if (predictedDPS >= percentiles.p75) return 8;  // Top 25% = great
    if (predictedDPS >= percentiles.p50) return 6;  // Above median = good
    if (predictedDPS >= percentiles.p25) return 4;  // Above p25 = okay
    if (predictedDPS >= baselineDPS) return 3;      // Above average = minimal
    return 2; // Below average = weak
  }

  /**
   * Generate human-readable contextualized prediction
   */
  private static generateContextualizedPrediction(
    improvementFactor: number,
    percentileRank: string,
    baselineDPS: number
  ): string {
    if (improvementFactor >= 2.0) {
      return `🔥 ${improvementFactor.toFixed(1)}x better than your average - this could be your best video yet!`;
    } else if (improvementFactor >= 1.5) {
      return `⭐ ${improvementFactor.toFixed(1)}x better than your average - strong performer!`;
    } else if (improvementFactor >= 1.2) {
      return `✓ ${improvementFactor.toFixed(1)}x better than your average - above your usual`;
    } else if (improvementFactor >= 1.0) {
      return `→ Similar to your average performance (${baselineDPS.toFixed(0)} DPS baseline)`;
    } else if (improvementFactor >= 0.8) {
      return `⚠ Slightly below your average (${baselineDPS.toFixed(0)} DPS baseline)`;
    } else {
      return `❌ Significantly below your average - needs improvement`;
    }
  }

  /**
   * Generate actionable insights based on creator context
   */
  private static generateInsights(
    predictedDPS: number,
    baselineDPS: number,
    improvementFactor: number,
    percentileRank: string,
    creatorProfile: CreatorProfile
  ): string[] {
    const insights: string[] = [];

    // Percentile insight
    if (percentileRank === 'top 10%') {
      insights.push(`This would be in your TOP 10% of videos - exceptional content!`);
    } else if (percentileRank === 'p75-p90') {
      insights.push(`This would rank in your top 25% - better than most of your content`);
    } else if (percentileRank === 'p50-p75') {
      insights.push(`This would be above your median performance - solid content`);
    } else if (percentileRank === 'below p25') {
      insights.push(`This would rank in your bottom 25% - consider improving before posting`);
    }

    // Improvement factor insight
    if (improvementFactor >= 1.5) {
      insights.push(`${((improvementFactor - 1) * 100).toFixed(0)}% better than your ${baselineDPS.toFixed(0)} DPS average`);
    } else if (improvementFactor < 0.9) {
      insights.push(`${((1 - improvementFactor) * 100).toFixed(0)}% worse than your ${baselineDPS.toFixed(0)} DPS average`);
    }

    // Context-specific insights
    if (creatorProfile.total_videos > 0) {
      insights.push(`Based on analysis of ${creatorProfile.total_videos} videos from @${creatorProfile.tiktok_username}`);
    }

    // Strength/weakness insights
    if (creatorProfile.strengths && creatorProfile.strengths.length > 0) {
      insights.push(`Your strengths: ${creatorProfile.strengths.slice(0, 2).join(', ')}`);
    }

    if (creatorProfile.weaknesses && creatorProfile.weaknesses.length > 0 && improvementFactor < 1.2) {
      insights.push(`Improvement areas: ${creatorProfile.weaknesses.slice(0, 2).join(', ')}`);
    }

    return insights;
  }

  /**
   * Convert creator baseline analysis to DPS adjustment
   *
   * This adjusts the raw prediction based on creator's historical performance.
   * A creator with consistently high performance gets a boost, low performance gets penalty.
   */
  public static adjustPrediction(
    rawPrediction: number,
    result: CreatorBaselineResult
  ): number {
    if (!result.success) {
      return rawPrediction; // No adjustment if no baseline
    }

    // Apply adjustment based on relative score
    // relativeScore 0-10 maps to adjustment -10 to +10
    const adjustment = (result.relativeScore - 5) * 2;

    const adjustedPrediction = rawPrediction + adjustment;

    // Clamp to valid DPS range
    return Math.max(0, Math.min(100, adjustedPrediction));
  }

  /**
   * Load creator profile from database
   */
  public static async loadProfile(tiktokUsername: string): Promise<CreatorProfile | null> {
    try {
      const { createClient } = await import('@supabase/supabase-js');

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
        {
          db: { schema: 'public' },
          auth: { persistSession: false }
        }
      );

      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('tiktok_username', tiktokUsername)
        .single();

      if (error || !data) {
        console.warn(`[CreatorBaseline] Profile not found for @${tiktokUsername}`);
        return null;
      }

      return data as CreatorProfile;
    } catch (error: any) {
      console.error('[CreatorBaseline] Error loading profile:', error.message);
      return null;
    }
  }
}
