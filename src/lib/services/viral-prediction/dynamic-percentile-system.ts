// Dynamic Percentile System - Core Viral Scoring Engine
// Enhanced with research-validated z-score methodology replacing 5X rule

import { createClient } from '@supabase/supabase-js';
import { ViralScore, PLATFORM_DECAY_RATES, PLATFORM_WEIGHTS } from '@/lib/types/viral-prediction';
import { classifyByPercentileAndZ, type Platform as VPlatform } from '@/lib/virality/contract'

export class DynamicPercentileSystem {
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async calculateViralScore(
    videoId: string,
    viewCount: number,
    followerCount: number,
    hoursSinceUpload: number,
    platform: 'tiktok' | 'instagram' | 'youtube' = 'tiktok',
    engagementMetrics?: {
      likeCount?: number;
      commentCount?: number;
      shareCount?: number;
    },
    ideaLegoAnalysis?: {
      overallScore: number;
      strongLegos: number; // Count of legos with score >= 70
      viralPotentialLegos: number; // Count of legos with score >= 85
    }
  ): Promise<ViralScore> {
    // Get cohort statistics (mean, median, standard deviation)
    const cohortStats = await this.getCohortStatistics(followerCount, platform);
    
    // Calculate platform-specific decay factor (research-validated rates)
    const decayFactor = this.calculateEnhancedDecayFactor(hoursSinceUpload, platform);
    
    // Get platform weight
    const platformWeight = PLATFORM_WEIGHTS[platform];
    
    // Calculate z-score based viral score (replaces 5X rule)
    const zScore = this.calculateZScore(viewCount, cohortStats);
    
    // Calculate engagement-weighted score
    const engagementScore = this.calculateEngagementScore(viewCount, engagementMetrics, platform);
    
    // Apply master formula: Z-Score + Engagement + Platform + Decay + DPS Idea Mining
    const viralScore = this.calculateMasterViralScore({
      zScore,
      engagementScore,
      platformWeight,
      decayFactor,
      platform,
      ideaLegoAnalysis
    });
    
    // Calculate percentile within cohort using z-score
    const percentile = this.zScoreToPercentile(zScore);
    
    // Calculate confidence based on data quality and time
    const confidence = this.calculateConfidence(hoursSinceUpload, viewCount);
    
    const res = {
      score: viralScore,
      cohortMedian: cohortStats.median,
      platformWeight,
      decayFactor,
      confidence,
      percentile,
      // Enhanced with research-validated metrics
      zScore,
      engagementScore,
      cohortStats,
      classification: this.classifyViralityEnhanced(percentile, zScore)
    };
    // Map classification to central contract (for downstream consumers)
    const mapped = classifyByPercentileAndZ(percentile, zScore, { platform: platform as VPlatform })
    ;(res as any).category = mapped.category
    ;(res as any).thresholdLabel = mapped.threshold
    ;(res as any).confidenceLabel = mapped.confidence
    return res
  }

  private async getCohortMedian(followerCount: number): Promise<number> {
    const lowerBound = followerCount * 0.8;
    const upperBound = followerCount * 1.2;
    
    const { data, error } = await this.supabase
      .from('videos')
      .select('view_count')
      .gte('creator_followers', lowerBound)
      .lte('creator_followers', upperBound)
      .order('view_count', { ascending: true });
    
    if (error || !data || data.length === 0) {
      // Fallback to estimated median based on follower count
      return followerCount * 0.128; // Based on research showing 0.128x average
    }
    
    // Calculate median
    const midPoint = Math.floor(data.length / 2);
    if (data.length % 2 === 0) {
      return (data[midPoint - 1].view_count + data[midPoint].view_count) / 2;
    }
    return data[midPoint].view_count;
  }

  private async calculatePercentile(score: number, followerCount: number): Promise<number> {
    const { count } = await this.supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .lte('viral_score', score)
      .gte('creator_followers', followerCount * 0.8)
      .lte('creator_followers', followerCount * 1.2);
    
    const { count: total } = await this.supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .gte('creator_followers', followerCount * 0.8)
      .lte('creator_followers', followerCount * 1.2);
    
    return total ? (count! / total) * 100 : 50;
  }

  private calculateConfidence(hoursSinceUpload: number, viewCount: number): number {
    // Confidence increases with time and view count
    const timeConfidence = Math.min(hoursSinceUpload / 72, 1); // Max confidence at 72 hours
    const viewConfidence = Math.min(viewCount / 10000, 1); // Max confidence at 10k views
    
    return (timeConfidence * 0.6 + viewConfidence * 0.4);
  }

  // Viral classification based on percentile
  classifyVirality(percentile: number): 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal' {
    if (percentile >= 99.9) return 'mega-viral';  // Top 0.1%
    if (percentile >= 99) return 'hyper-viral';   // Top 1%
    if (percentile >= 95) return 'viral';         // Top 5%
    if (percentile >= 90) return 'trending';      // Top 10%
    return 'normal';
  }

  // Update cohort medians (run hourly)
  async updateCohortMedians() {
    const followerBuckets = [
      { min: 0, max: 1000 },
      { min: 1000, max: 10000 },
      { min: 10000, max: 100000 },
      { min: 100000, max: 1000000 },
      { min: 1000000, max: null }
    ];

    for (const bucket of followerBuckets) {
      const query = this.supabase
        .from('videos')
        .select('view_count')
        .gte('creator_followers', bucket.min);
      
      if (bucket.max) {
        query.lt('creator_followers', bucket.max);
      }

      const { data } = await query.order('view_count', { ascending: true });
      
      if (data && data.length > 0) {
        const median = this.calculateMedianFromArray(data.map(d => d.view_count));
        
        // Store for quick access
        await this.supabase
          .from('cohort_medians')
          .upsert({
            follower_min: bucket.min,
            follower_max: bucket.max,
            median_views: median,
            sample_size: data.length,
            updated_at: new Date().toISOString()
          });
      }
    }
  }

  private calculateMedianFromArray(values: number[]): number {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Get cohort statistics (mean, median, standard deviation) for z-score calculation
   */
  private async getCohortStatistics(followerCount: number, platform: string): Promise<{
    mean: number;
    median: number;
    standardDeviation: number;
    sampleSize: number;
  }> {
    const lowerBound = followerCount * 0.8;
    const upperBound = followerCount * 1.2;
    
    const { data, error } = await this.supabase
      .from('videos')
      .select('view_count')
      .gte('creator_followers', lowerBound)
      .lte('creator_followers', upperBound)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('view_count', { ascending: true });
    
    if (error || !data || data.length < 10) {
      // Fallback to research-based estimates
      return this.getResearchBasedCohortStats(followerCount, platform);
    }
    
    const viewCounts = data.map(d => d.view_count);
    const mean = viewCounts.reduce((sum, val) => sum + val, 0) / viewCounts.length;
    const median = this.calculateMedianFromArray(viewCounts);
    
    // Calculate standard deviation
    const variance = viewCounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / viewCounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      mean,
      median,
      standardDeviation,
      sampleSize: viewCounts.length
    };
  }

  /**
   * Research-based cohort statistics fallback
   */
  private getResearchBasedCohortStats(followerCount: number, platform: string): {
    mean: number;
    median: number;
    standardDeviation: number;
    sampleSize: number;
  } {
    // Based on research showing platform-specific baselines
    const platformMultipliers = {
      tiktok: { baseline: 0.128, variance: 0.5 }, // 12.8 views per 100 followers average
      instagram: { baseline: 0.08, variance: 0.3 }, // 8 views per 100 followers average
      youtube: { baseline: 0.05, variance: 0.4 } // 5 views per 100 followers average
    };
    
    const multiplier = platformMultipliers[platform as keyof typeof platformMultipliers] || platformMultipliers.tiktok;
    const mean = followerCount * multiplier.baseline;
    const median = mean * 0.8; // Median typically lower than mean
    const standardDeviation = mean * multiplier.variance;
    
    return {
      mean,
      median,
      standardDeviation,
      sampleSize: 100 // Estimated
    };
  }

  /**
   * Calculate z-score (replaces 5X rule with statistical approach)
   */
  private calculateZScore(viewCount: number, cohortStats: {
    mean: number;
    standardDeviation: number;
  }): number {
    if (cohortStats.standardDeviation === 0) return 0;
    return (viewCount - cohortStats.mean) / cohortStats.standardDeviation;
  }

  /**
   * Convert z-score to percentile
   */
  private zScoreToPercentile(zScore: number): number {
    // Approximation using cumulative distribution function
    return Math.max(0, Math.min(100, 50 * (1 + this.erf(zScore / Math.sqrt(2)))));
  }

  /**
   * Error function approximation for z-score to percentile conversion
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  /**
   * Enhanced decay factor calculation based on research-validated platform rates
   */
  private calculateEnhancedDecayFactor(hoursSinceUpload: number, platform: string): number {
    // Research-validated decay rates from framework documents
    const decayRates = {
      tiktok: 0.5,    // Steep decay (1.0 → 0.3 → 0.1 within 24 hours)
      instagram: 0.3, // Moderate decay (1.0 → 0.8 → 0.5 → 0.3 over 48 hours)
      youtube: 0.1    // Gradual decay (1.0 → 0.9 → 0.7 → 0.5 over 7 days)
    };
    
    const rate = decayRates[platform as keyof typeof decayRates] || decayRates.tiktok;
    return Math.exp(-rate * (hoursSinceUpload / 24));
  }

  /**
   * Calculate engagement score using platform-specific weights
   */
  private calculateEngagementScore(
    viewCount: number,
    engagementMetrics?: {
      likeCount?: number;
      commentCount?: number;
      shareCount?: number;
    },
    platform: string = 'tiktok'
  ): number {
    if (!engagementMetrics || viewCount === 0) return 0;
    
    const { likeCount = 0, commentCount = 0, shareCount = 0 } = engagementMetrics;
    
    // Platform-specific engagement weights from research
    const platformWeights = {
      tiktok: { like: 1, comment: 2, share: 3 }, // Shares weighted highest
      instagram: { like: 1, comment: 2, share: 2.5 },
      youtube: { like: 1, comment: 1.5, share: 2 }
    };
    
    const weights = platformWeights[platform as keyof typeof platformWeights] || platformWeights.tiktok;
    
    // Calculate weighted engagement rate
    const totalEngagement = (likeCount * weights.like) + (commentCount * weights.comment) + (shareCount * weights.share);
    const engagementRate = totalEngagement / viewCount;
    
    // Research-validated thresholds
    const viralThresholds = {
      tiktok: 0.06,    // >6% for viral
      instagram: 0.03, // >3% for viral
      youtube: 0.05    // >5% for viral
    };
    
    const threshold = viralThresholds[platform as keyof typeof viralThresholds] || viralThresholds.tiktok;
    
    return Math.min(engagementRate / threshold, 2.0); // Cap at 2x threshold
  }

  /**
   * Master viral score formula combining all factors
   */
  private calculateMasterViralScore({
    zScore,
    engagementScore,
    platformWeight,
    decayFactor,
    platform,
    ideaLegoAnalysis
  }: {
    zScore: number;
    engagementScore: number;
    platformWeight: number;
    decayFactor: number;
    platform: string;
    ideaLegoAnalysis?: {
      overallScore: number;
      strongLegos: number;
      viralPotentialLegos: number;
    };
  }): number {
    // Convert z-score to 0-1 scale (z-score of 3 = ~99.7% percentile)
    const zScoreNormalized = Math.max(0, Math.min(1, (zScore + 3) / 6));
    
    // Calculate DPS Idea Mining enhancement
    let dpsBonus = 0;
    if (ideaLegoAnalysis) {
      // Base DPS enhancement from overall Idea Lego score (0-20% boost)
      const baseBonus = (ideaLegoAnalysis.overallScore / 100) * 0.2;
      
      // "Hold Winners" bonus: extra boost for strong systematic optimization
      const strongLegoBonus = (ideaLegoAnalysis.strongLegos / 7) * 0.1; // Up to 10% for all strong legos
      
      // Viral potential bonus: mega boost for viral-level Legos
      const viralPotentialBonus = (ideaLegoAnalysis.viralPotentialLegos / 7) * 0.15; // Up to 15% for all viral legos
      
      dpsBonus = baseBonus + strongLegoBonus + viralPotentialBonus;
    }
    
    // Rebalanced weight components with DPS integration
    const zScoreWeight = 0.35;       // 35% - statistical foundation (reduced to make room for DPS)
    const engagementWeight = 0.25;   // 25% - engagement velocity
    const platformWeight_adj = 0.15; // 15% - platform specifics
    const decayWeight = 0.1;         // 10% - time decay
    const dpsWeight = 0.15;          // 15% - DPS Idea Mining enhancement
    
    const baseScore = (
      (zScoreNormalized * zScoreWeight) +
      (engagementScore * engagementWeight) +
      (platformWeight * platformWeight_adj) +
      (decayFactor * decayWeight)
    );
    
    // Apply DPS enhancement
    const enhancedScore = baseScore + (dpsBonus * dpsWeight);
    
    return Math.min(enhancedScore, 1.0);
  }

  /**
   * Enhanced viral classification using both percentile and z-score
   */
  private classifyViralityEnhanced(percentile: number, zScore: number): {
    category: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal';
    confidence: 'high' | 'medium' | 'low';
    threshold: string;
  } {
    // Research-validated thresholds using z-score methodology
    let category: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal' = 'normal';
    let threshold = '';
    
    if (zScore >= 3.0 && percentile >= 99.9) {
      category = 'mega-viral';
      threshold = 'Top 0.1% (z-score ≥ 3.0)';
    } else if (zScore >= 2.5 && percentile >= 99) {
      category = 'hyper-viral';
      threshold = 'Top 1% (z-score ≥ 2.5)';
    } else if (zScore >= 2.0 && percentile >= 95) {
      category = 'viral';
      threshold = 'Top 5% (z-score ≥ 2.0)';
    } else if (zScore >= 1.5 && percentile >= 90) {
      category = 'trending';
      threshold = 'Top 10% (z-score ≥ 1.5)';
    } else {
      threshold = `${percentile.toFixed(1)}th percentile`;
    }
    
    // Calculate confidence based on z-score strength
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (Math.abs(zScore) >= 2.0) confidence = 'high';
    else if (Math.abs(zScore) >= 1.0) confidence = 'medium';
    
    return { category, confidence, threshold };
  }

  /**
   * Viral classification using research-validated statistical thresholds
   */
  classifyViralityStatistical(zScore: number, percentile: number): {
    isViral: boolean;
    category: string;
    confidence: number;
  } {
    // Facebook: 3 standard deviations, YouTube: 2.5 standard deviations (from research)
    const isViral = zScore >= 2.0; // Conservative threshold for TikTok
    
    let category = 'Normal';
    if (zScore >= 3.0) category = 'Mega-Viral (Top 0.1%)';
    else if (zScore >= 2.5) category = 'Hyper-Viral (Top 1%)';
    else if (zScore >= 2.0) category = 'Viral (Top 5%)';
    else if (zScore >= 1.5) category = 'Trending (Top 10%)';
    
    const confidence = Math.min(Math.abs(zScore) / 3.0, 1.0);
    
    return { isViral, category, confidence };
  }
}