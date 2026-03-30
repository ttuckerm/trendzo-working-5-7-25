/**
 * FEAT-007: DPS Prediction Engine
 * Predicts DPS score and estimated performance metrics before content creation
 */

import { PredictionEstimates } from '@/types/pre-content-prediction';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Configuration
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Platform-specific decay factors (content aging rates)
const PLATFORM_DECAY_FACTORS: Record<string, number> = {
  tiktok: 0.95,      // Fast decay, viral windows are short
  instagram: 0.92,   // Medium decay
  youtube: 1.0,      // No decay, evergreen content
  twitter: 0.90,     // Very fast decay
  linkedin: 0.98,    // Slow decay
};

// Niche-specific weight adjustments
const NICHE_WEIGHT_ADJUSTMENTS: Record<string, number> = {
  'personal-finance': 1.1,    // High engagement niche
  'fitness': 1.05,
  'comedy': 1.0,
  'education': 0.95,
  'technology': 1.0,
  'default': 1.0,
};

// ============================================================================
// Cohort Statistics (for estimating views/likes)
// ============================================================================

/**
 * Fetch cohort statistics for a given platform and follower count
 */
async function fetchCohortStats(
  platform: string,
  followerCount: number
): Promise<{
  avgViews: number;
  avgLikes: number;
  avgDPS: number;
} | null> {
  try {
    // Round follower count to nearest cohort bucket
    const cohortBuckets = [1000, 5000, 10000, 50000, 100000, 500000, 1000000];
    const nearestBucket = cohortBuckets.reduce((prev, curr) =>
      Math.abs(curr - followerCount) < Math.abs(prev - followerCount) ? curr : prev
    );

    const { data, error } = await supabase
      .from('cohort_stats')
      .select('avg_views, avg_likes, avg_dps')
      .eq('platform', platform)
      .eq('follower_bucket', nearestBucket)
      .single();

    if (error || !data) {
      console.warn(`No cohort stats found for ${platform} with ${nearestBucket} followers`);
      return null;
    }

    return {
      avgViews: parseFloat(data.avg_views || 0),
      avgLikes: parseFloat(data.avg_likes || 0),
      avgDPS: parseFloat(data.avg_dps || 0),
    };
  } catch (error) {
    console.error('Failed to fetch cohort stats:', error);
    return null;
  }
}

/**
 * Fallback estimation when no cohort data exists
 */
function estimateFallbackMetrics(followerCount: number): {
  avgViews: number;
  avgLikes: number;
  avgDPS: number;
} {
  // Basic heuristics: views ~10-50x followers, likes ~2-5% of views
  const avgViews = followerCount * 25; // 25x multiplier
  const avgLikes = avgViews * 0.03;    // 3% like rate
  const avgDPS = 50;                   // Baseline DPS

  return { avgViews, avgLikes, avgDPS };
}

// ============================================================================
// DPS Calculation
// ============================================================================

/**
 * Calculate predicted DPS based on pattern and consensus scores
 */
export function calculatePredictedDPS(
  patternMatchScore: number,
  consensusScore: number,
  niche: string,
  platform: string
): number {
  // Base score: weighted combination of pattern match and LLM consensus
  // Pattern matching (40%) + LLM consensus (60%)
  const baseScore = (patternMatchScore * 0.4) + (consensusScore * 0.6);

  // Apply niche-specific adjustment
  const nicheWeight = NICHE_WEIGHT_ADJUSTMENTS[niche] || NICHE_WEIGHT_ADJUSTMENTS['default'];
  const nicheAdjustedScore = baseScore * nicheWeight;

  // Apply platform decay factor
  const platformDecay = PLATFORM_DECAY_FACTORS[platform] || 1.0;
  const predictedDPS = nicheAdjustedScore * platformDecay;

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, Math.round(predictedDPS * 100) / 100));
}

// ============================================================================
// Performance Estimation
// ============================================================================

/**
 * Format number to K/M format (e.g., 1200 -> "1.2K", 1500000 -> "1.5M")
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toFixed(0);
}

/**
 * Calculate estimated views range based on predicted DPS and follower count
 */
function estimateViewsRange(
  predictedDPS: number,
  cohortAvgViews: number,
  cohortAvgDPS: number
): string {
  // If predicted DPS is higher than cohort average, boost views
  const dpsMultiplier = predictedDPS / Math.max(1, cohortAvgDPS);

  const estimatedViews = cohortAvgViews * dpsMultiplier;

  // Range: ±20%
  const lowerBound = estimatedViews * 0.8;
  const upperBound = estimatedViews * 1.2;

  return `${formatNumber(lowerBound)}-${formatNumber(upperBound)}`;
}

/**
 * Calculate estimated likes range
 */
function estimateLikesRange(
  predictedDPS: number,
  cohortAvgLikes: number,
  cohortAvgDPS: number
): string {
  const dpsMultiplier = predictedDPS / Math.max(1, cohortAvgDPS);
  const estimatedLikes = cohortAvgLikes * dpsMultiplier;

  // Range: ±20%
  const lowerBound = estimatedLikes * 0.8;
  const upperBound = estimatedLikes * 1.2;

  return `${formatNumber(lowerBound)}-${formatNumber(upperBound)}`;
}

/**
 * Calculate DPS percentile based on historical data
 */
async function estimateDPSPercentile(
  predictedDPS: number,
  platform: string,
  niche: string
): Promise<string> {
  try {
    // Query how many videos have lower DPS
    const { count: lowerCount, error: lowerError } = await supabase
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .eq('platform', platform)
      .lt('dps_score', predictedDPS);

    const { count: totalCount, error: totalError } = await supabase
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .eq('platform', platform);

    if (lowerError || totalError || !totalCount) {
      throw new Error('Failed to calculate percentile');
    }

    const percentile = ((lowerCount || 0) / totalCount) * 100;

    if (percentile >= 95) return 'Top 5%';
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Top 50%';

    return `${Math.round(100 - percentile)}th percentile`;
  } catch (error) {
    console.error('Failed to estimate DPS percentile:', error);

    // Fallback estimation based on DPS score
    if (predictedDPS >= 85) return 'Top 5%';
    if (predictedDPS >= 75) return 'Top 10%';
    if (predictedDPS >= 60) return 'Top 25%';
    return 'Top 50%';
  }
}

// ============================================================================
// Main Prediction Service
// ============================================================================

/**
 * Predict DPS and performance estimates
 */
export async function predictPerformance(
  patternMatchScore: number,
  consensusScore: number,
  niche: string,
  platform: string,
  followerCount?: number
): Promise<{
  predictedDPS: number;
  estimates: PredictionEstimates;
}> {
  // Calculate predicted DPS
  const predictedDPS = calculatePredictedDPS(
    patternMatchScore,
    consensusScore,
    niche,
    platform
  );

  // Get cohort statistics or use fallback
  const followers = followerCount || 10000; // Default to 10K followers
  const cohortStats = await fetchCohortStats(platform, followers) ||
                      estimateFallbackMetrics(followers);

  // Estimate views and likes ranges
  const estimatedViews = estimateViewsRange(
    predictedDPS,
    cohortStats.avgViews,
    cohortStats.avgDPS
  );

  const estimatedLikes = estimateLikesRange(
    predictedDPS,
    cohortStats.avgLikes,
    cohortStats.avgDPS
  );

  // Estimate DPS percentile
  const estimatedDPSPercentile = await estimateDPSPercentile(
    predictedDPS,
    platform,
    niche
  );

  return {
    predictedDPS,
    estimates: {
      estimatedViews,
      estimatedLikes,
      estimatedDPSPercentile,
    },
  };
}
