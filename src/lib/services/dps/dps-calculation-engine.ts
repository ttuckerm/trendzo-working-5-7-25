/**
 * FEAT-002: DPS Calculation Engine
 * 
 * Core Dynamic Percentile System viral score calculation logic.
 * Implements the proprietary DPS algorithm for viral content scoring.
 * 
 * @module dps-calculation-engine
 * @patent PATENT-003: DPS Virality Fingerprinting Logic
 */

import { z } from 'zod';

// =====================================================
// Type Definitions & Validation Schemas
// =====================================================

export const VideoInputSchema = z.object({
  videoId: z.string().min(1),
  platform: z.enum(['tiktok', 'instagram', 'youtube']),
  viewCount: z.number().int().nonnegative(),
  likeCount: z.number().int().nonnegative().optional(),
  commentCount: z.number().int().nonnegative().optional(),
  shareCount: z.number().int().nonnegative().optional(),
  followerCount: z.number().int().nonnegative(),
  hoursSinceUpload: z.number().nonnegative(),
  publishedAt: z.string().datetime(),
  caption: z.string().optional(), // Enhancement: For Identity Container scoring
});

export type VideoInput = z.infer<typeof VideoInputSchema>;

export interface DPSResult {
  videoId: string;
  viralScore: number;          // 0-100
  percentileRank: number;      // 0-100
  classification: 'normal' | 'viral' | 'mega-viral';
  zScore: number;
  decayFactor: number;
  platformWeight: number;
  cohortMedian: number;
  confidence: number;          // 0-1
  calculatedAt: string;
  auditId: string;
  processingTimeMs?: number;
  identityContainerScore?: number; // 0-100 (Enhancement: Identity Container scoring)
  ffmpegVisualScore?: number;      // 0-100 (Enhancement: FFmpeg Visual Intelligence)
}

export interface CohortStats {
  cohortMedian: number;
  cohortMean: number;
  cohortStdDev: number;
  sampleSize: number;
}

export interface BatchDPSResult {
  batchId: string;
  totalVideos: number;
  successCount: number;
  failureCount: number;
  results: DPSResult[];
  errors: Array<{ videoId: string; error: string }>;
  auditId: string;
  processingTimeMs: number;
}

// =====================================================
// Constants & Configuration
// =====================================================

/**
 * Platform-specific decay rates (λ parameter for exponential decay)
 * TikTok: Fastest decay (content goes stale quickly)
 * Instagram: Moderate decay
 * YouTube: Slowest decay (longer shelf life)
 */
export const DECAY_RATES = {
  tiktok: 0.5,
  instagram: 0.3,
  youtube: 0.1,
} as const;

/**
 * Platform weights for viral score calculation
 * All normalized to 1.0 currently; can be adjusted based on platform virality potential
 */
export const PLATFORM_WEIGHTS = {
  tiktok: 1.0,
  instagram: 0.95,
  youtube: 0.9,
} as const;

/**
 * Engagement metric weights for engagement score calculation
 * Tuned based on correlation with viral performance
 */
export const ENGAGEMENT_WEIGHTS = {
  tiktok: {
    like: 0.35,
    comment: 0.30,
    share: 0.35,
  },
  instagram: {
    like: 0.40,
    comment: 0.35,
    share: 0.25,
  },
  youtube: {
    like: 0.30,
    comment: 0.40,
    share: 0.30,
  },
} as const;

/**
 * Virality classification thresholds (score-based)
 * Based on DPS viral_score (0-100 scale)
 */
export const VIRALITY_THRESHOLDS = {
  MEGA_VIRAL: 80,   // Mega-viral threshold
  VIRAL: 70,        // Viral threshold
  NORMAL: 0,        // Below viral threshold
} as const;

/**
 * Maximum time decay (beyond this, decay factor stays constant)
 */
export const MAX_DECAY_HOURS = 2160; // 90 days

// =====================================================
// Core DPS Calculation Functions
// =====================================================

/**
 * Calculate time decay factor using exponential decay
 * Formula: e^(-λt) where λ is decay rate and t is hours since upload
 * 
 * @param hours - Hours since video upload
 * @param platform - Video platform (affects decay rate)
 * @returns Decay factor (0-1)
 */
export function calculateDecayFactor(hours: number, platform: keyof typeof DECAY_RATES): number {
  const cappedHours = Math.min(hours, MAX_DECAY_HOURS);
  const lambda = DECAY_RATES[platform];
  return Math.exp(-lambda * cappedHours / 100); // Normalize to reasonable scale
}

/**
 * Calculate engagement score from interaction metrics
 * Weighted combination of likes, comments, shares relative to views
 * 
 * @param viewCount - Total views
 * @param likeCount - Total likes
 * @param commentCount - Total comments
 * @param shareCount - Total shares
 * @param platform - Video platform
 * @returns Engagement score (0-1)
 */
export function calculateEngagementScore(
  viewCount: number,
  likeCount: number = 0,
  commentCount: number = 0,
  shareCount: number = 0,
  platform: keyof typeof ENGAGEMENT_WEIGHTS
): number {
  if (viewCount === 0) return 0;

  const weights = ENGAGEMENT_WEIGHTS[platform];
  
  // Calculate engagement rates
  const likeRate = likeCount / viewCount;
  const commentRate = commentCount / viewCount;
  const shareRate = shareCount / viewCount;
  
  // Weighted combination
  const engagementScore = 
    (likeRate * weights.like) +
    (commentRate * weights.comment) +
    (shareRate * weights.share);
  
  // Normalize to 0-1 range (cap at 1.0)
  return Math.min(engagementScore * 10, 1.0); // Scale factor of 10 for typical engagement rates
}

/**
 * Calculate z-score (standard deviations from cohort mean)
 * 
 * @param value - Video view count
 * @param cohortMean - Mean view count for cohort
 * @param cohortStdDev - Standard deviation for cohort
 * @returns Z-score
 */
export function calculateZScore(value: number, cohortMean: number, cohortStdDev: number): number {
  if (cohortStdDev === 0) return 0;
  return (value - cohortMean) / cohortStdDev;
}

/**
 * Convert z-score to percentile rank using cumulative distribution function
 * Approximation of standard normal CDF
 * 
 * @param zScore - Z-score
 * @returns Percentile rank (0-100)
 */
export function zScoreToPercentile(zScore: number): number {
  // Clamp z-score to reasonable range
  const clampedZ = Math.max(-5, Math.min(5, zScore));
  
  // Approximation of CDF using error function
  const t = 1 / (1 + 0.2316419 * Math.abs(clampedZ));
  const d = 0.3989423 * Math.exp(-clampedZ * clampedZ / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  const percentile = clampedZ >= 0 
    ? (1 - probability) * 100
    : probability * 100;
  
  return Math.max(0, Math.min(100, percentile));
}

/**
 * Classify virality based on viral score
 *
 * @param viralScore - DPS viral score (0-100)
 * @returns Viral classification
 */
export function classifyVirality(viralScore: number): 'normal' | 'viral' | 'mega-viral' {
  if (viralScore >= VIRALITY_THRESHOLDS.MEGA_VIRAL) return 'mega-viral';
  if (viralScore >= VIRALITY_THRESHOLDS.VIRAL) return 'viral';
  return 'normal';
}

/**
 * Calculate cohort bounds for follower count
 * Uses ±20% range to define cohort
 * 
 * @param followerCount - Creator follower count
 * @returns [lowerBound, upperBound]
 */
export function getCohortBounds(followerCount: number): [number, number] {
  const lowerBound = Math.floor(followerCount * 0.8);
  const upperBound = Math.ceil(followerCount * 1.2);
  return [lowerBound, upperBound];
}

/**
 * Calculate confidence score based on data completeness and cohort sample size
 * 
 * @param cohortSampleSize - Number of videos in cohort
 * @param video - Video input data
 * @returns Confidence score (0-1)
 */
export function calculateConfidence(cohortSampleSize: number, video: VideoInput): number {
  let confidence = 1.0;
  
  // Penalize small cohort sample sizes
  if (cohortSampleSize < 100) {
    confidence *= 0.7;
  } else if (cohortSampleSize < 500) {
    confidence *= 0.85;
  } else if (cohortSampleSize < 1000) {
    confidence *= 0.95;
  }
  
  // Penalize missing engagement data
  let missingFields = 0;
  if (!video.likeCount) missingFields++;
  if (!video.commentCount) missingFields++;
  if (!video.shareCount) missingFields++;
  
  if (missingFields > 0) {
    confidence *= (1 - (missingFields * 0.1)); // 10% penalty per missing field
  }
  
  // Penalize very early videos (< 1 hour old)
  if (video.hoursSinceUpload < 1) {
    confidence *= 0.6;
  } else if (video.hoursSinceUpload < 6) {
    confidence *= 0.8;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate FFmpeg Visual Intelligence Score (V2 Enhanced)
 * 
 * V2 uses comprehensive multimodal features from immediate scraping analysis:
 * - Video quality (resolution, FPS, bitrate)
 * - Scene dynamics (cuts, motion score)
 * - Face presence (talking head detection)
 * - Audio features (music, volume)
 * 
 * Research shows V2 multimodal achieves 0.86 correlation with virality
 * vs 0.53 for text-only analysis.
 *
 * @param visualData - FFmpeg visual analysis data (V2 enhanced)
 * @returns Visual intelligence score (0-100)
 */
export function calculateFFmpegVisualScore(visualData: {
  // Legacy fields
  resolution_width?: number;
  resolution_height?: number;
  fps?: number;
  bitrate?: number;
  hook_scene_changes?: number;
  quality_score?: number;
  // V2 fields
  scene_changes?: number;
  avg_brightness?: number;
  motion_score?: number;
  has_faces?: boolean;
  face_time_ratio?: number;
  has_music?: boolean;
  avg_volume?: number;
  speech_rate_wpm?: number;
  duration_seconds?: number;
}): number {
  // Check if we have V2 data (comprehensive analysis)
  const hasV2Data = visualData.scene_changes !== undefined || 
                    visualData.motion_score !== undefined ||
                    visualData.has_faces !== undefined;
  
  if (hasV2Data) {
    // V2 Scoring Algorithm (research-backed weights)
    return calculateV2Score(visualData);
  } else {
    // Fallback to legacy scoring
    return calculateLegacyScore(visualData);
  }
}

/**
 * V2 Scoring Algorithm
 * Based on research correlating multimodal features with virality
 */
function calculateV2Score(visualData: {
  resolution_height?: number;
  fps?: number;
  scene_changes?: number;
  motion_score?: number;
  has_faces?: boolean;
  face_time_ratio?: number;
  has_music?: boolean;
  avg_volume?: number;
  speech_rate_wpm?: number;
  duration_seconds?: number;
}): number {
  let score = 0;

  // Factor 1: Resolution Quality (0-15 points)
  if (visualData.resolution_height) {
    if (visualData.resolution_height >= 1080) score += 15;
    else if (visualData.resolution_height >= 720) score += 12;
    else if (visualData.resolution_height >= 480) score += 8;
    else score += 5;
  }

  // Factor 2: Scene Dynamics (0-20 points) - CRITICAL for virality
  // Optimal: 0.3-0.5 cuts per second (moderate pacing)
  if (visualData.scene_changes !== undefined && visualData.duration_seconds) {
    const cutsPerSecond = visualData.scene_changes / visualData.duration_seconds;
    if (cutsPerSecond >= 0.3 && cutsPerSecond <= 0.5) {
      score += 20; // Optimal viral pacing
    } else if (cutsPerSecond >= 0.2 && cutsPerSecond <= 0.7) {
      score += 15; // Good pacing
    } else if (cutsPerSecond >= 0.1 && cutsPerSecond <= 1.0) {
      score += 10; // Acceptable pacing
    } else {
      score += 5; // Too slow or too chaotic
    }
  } else if (visualData.scene_changes !== undefined) {
    // If we have scene changes but no duration, use raw count
    if (visualData.scene_changes >= 3 && visualData.scene_changes <= 15) {
      score += 15;
    } else if (visualData.scene_changes >= 1) {
      score += 10;
    } else {
      score += 5;
    }
  }

  // Factor 3: Motion Score (0-15 points)
  // From research: motion score 70-85 correlates with viral
  if (visualData.motion_score !== undefined) {
    if (visualData.motion_score >= 70 && visualData.motion_score <= 85) {
      score += 15; // Optimal motion
    } else if (visualData.motion_score >= 50 && visualData.motion_score <= 90) {
      score += 12; // Good motion
    } else if (visualData.motion_score >= 30) {
      score += 8; // Some motion
    } else {
      score += 4; // Static video
    }
  }

  // Factor 4: Face Presence (0-15 points) - Talking heads perform well
  if (visualData.has_faces) {
    score += 10;
    // Bonus for high face time ratio
    if (visualData.face_time_ratio && visualData.face_time_ratio >= 0.5) {
      score += 5; // Prominent face presence
    }
  } else {
    score += 5; // B-roll/product videos still get some points
  }

  // Factor 5: Music Presence (0-15 points)
  if (visualData.has_music) {
    score += 12; // Music correlates with engagement
    // Bonus for good volume
    if (visualData.avg_volume && visualData.avg_volume >= 40 && visualData.avg_volume <= 70) {
      score += 3; // Optimal volume level
    }
  } else {
    score += 5; // Voice-over videos
  }

  // Factor 6: Speech Rate (0-10 points)
  // Optimal: 140-180 WPM for TikTok
  if (visualData.speech_rate_wpm) {
    if (visualData.speech_rate_wpm >= 140 && visualData.speech_rate_wpm <= 180) {
      score += 10; // Optimal speaking pace
    } else if (visualData.speech_rate_wpm >= 100 && visualData.speech_rate_wpm <= 220) {
      score += 7; // Acceptable pace
    } else {
      score += 3; // Too slow or too fast
    }
  }

  // Factor 7: Duration Sweet Spot (0-10 points)
  // TikTok viral videos: 15-60 seconds optimal
  if (visualData.duration_seconds) {
    if (visualData.duration_seconds >= 15 && visualData.duration_seconds <= 60) {
      score += 10; // Optimal length
    } else if (visualData.duration_seconds >= 7 && visualData.duration_seconds <= 90) {
      score += 7; // Good length
    } else if (visualData.duration_seconds >= 3) {
      score += 4; // Too short or too long
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Legacy Scoring Algorithm (pre-V2)
 * Used when V2 data is not available
 */
function calculateLegacyScore(visualData: {
  resolution_height?: number;
  fps?: number;
  bitrate?: number;
  hook_scene_changes?: number;
  quality_score?: number;
}): number {
  let score = 0;

  // Factor 1: Resolution quality (0-30 points)
  if (visualData.resolution_height) {
    if (visualData.resolution_height >= 1080) {
      score += 30;
    } else if (visualData.resolution_height >= 720) {
      score += 22;
    } else if (visualData.resolution_height >= 480) {
      score += 14;
    } else {
      score += 8;
    }
  }

  // Factor 2: Frame rate quality (0-25 points)
  if (visualData.fps) {
    if (visualData.fps >= 60) {
      score += 25;
    } else if (visualData.fps >= 30) {
      score += 18;
    } else if (visualData.fps >= 24) {
      score += 12;
    } else {
      score += 6;
    }
  }

  // Factor 3: Bitrate/quality (0-20 points)
  if (visualData.bitrate) {
    const bitrateKbps = visualData.bitrate / 1000;
    if (bitrateKbps >= 5000) {
      score += 20;
    } else if (bitrateKbps >= 2500) {
      score += 14;
    } else if (bitrateKbps >= 1000) {
      score += 8;
    } else {
      score += 4;
    }
  }

  // Factor 4: Hook scene changes (0-15 points)
  if (visualData.hook_scene_changes !== undefined) {
    if (visualData.hook_scene_changes >= 2 && visualData.hook_scene_changes <= 4) {
      score += 15;
    } else if (visualData.hook_scene_changes === 1) {
      score += 8;
    } else if (visualData.hook_scene_changes > 4) {
      score += 5;
    } else {
      score += 2;
    }
  }

  // Factor 5: Overall quality score (0-10 points)
  if (visualData.quality_score !== undefined) {
    score += visualData.quality_score * 10;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate Identity Container score based on caption analysis
 * Analyzes caption for "mirror quality" - how well it reflects authentic creator identity
 *
 * @param caption - Video caption text
 * @returns Identity Container score (0-100)
 */
export function calculateIdentityContainerScore(caption?: string): number {
  if (!caption || caption.trim().length === 0) {
    return 50; // Neutral score for missing caption
  }
  
  let score = 50; // Start at baseline
  
  // Factor 1: Personal pronouns indicate authentic voice (boost +20)
  const personalPronouns = /\b(I|my|me|mine|we|our|us)\b/gi;
  const pronounMatches = (caption.match(personalPronouns) || []).length;
  if (pronounMatches > 0) {
    score += Math.min(20, pronounMatches * 5);
  }
  
  // Factor 2: Questions engage audience identity (boost +15)
  const questionMarks = (caption.match(/\?/g) || []).length;
  if (questionMarks > 0) {
    score += Math.min(15, questionMarks * 7.5);
  }
  
  // Factor 3: Emojis add personality (boost +10)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
  const emojiCount = (caption.match(emojiRegex) || []).length;
  if (emojiCount > 0) {
    score += Math.min(10, emojiCount * 2);
  }
  
  // Factor 4: Excessive hashtags reduce authenticity (penalty -20)
  const hashtags = (caption.match(/#/g) || []).length;
  if (hashtags > 5) {
    score -= Math.min(20, (hashtags - 5) * 4);
  }
  
  // Factor 5: All caps feels less authentic (penalty -15)
  const capsWords = caption.split(/\s+/).filter(word => {
    return word.length > 3 && word === word.toUpperCase();
  }).length;
  if (capsWords > 2) {
    score -= Math.min(15, (capsWords - 2) * 5);
  }
  
  // Factor 6: Generic promotional language reduces mirror quality (penalty -10)
  const promoKeywords = /\b(buy|shop|link|sale|discount|promo|limited|offer)\b/gi;
  const promoMatches = (caption.match(promoKeywords) || []).length;
  if (promoMatches > 0) {
    score -= Math.min(10, promoMatches * 3.5);
  }
  
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate master viral score using DPS algorithm
 * Combines z-score, engagement, platform weight, decay factor, and identity container
 * 
 * @param params - Calculation parameters
 * @returns Viral score (0-100)
 */
export function calculateMasterViralScore(params: {
  zScore: number;
  engagementScore: number;
  platformWeight: number;
  decayFactor: number;
  platform: string;
  identityContainerScore?: number;
  ffmpegVisualScore?: number; // NEW: FFmpeg visual intelligence (0-100)
}): number {
  const { zScore, engagementScore, platformWeight, decayFactor, identityContainerScore, ffmpegVisualScore } = params;

  // Convert z-score to 0-100 scale (z-score of ±3 = 0/100)
  const zScoreNormalized = ((zScore + 3) / 6) * 100;
  const clampedZScore = Math.max(0, Math.min(100, zScoreNormalized));

  // Weighted combination with Identity Container + FFmpeg Visual Intelligence:
  // - Z-score: 52% (raw performance vs cohort) [reduced from 55%]
  // - Engagement: 21% (interaction quality) [reduced from 22%]
  // - Decay: 12% (time relevance) [reduced from 13%]
  // - Identity Container: 10% (mirror quality)
  // - FFmpeg Visual: 5% (video quality & hook optimization) [NEW]
  const hasIdentity = identityContainerScore !== undefined;
  const hasFFmpeg = ffmpegVisualScore !== undefined;

  // Calculate base score with available components
  let baseScore = 0;
  let totalWeight = 0;

  // Core components (always present)
  baseScore += (clampedZScore * 0.52);
  baseScore += (engagementScore * 100 * 0.21);
  baseScore += (decayFactor * 100 * 0.12);
  totalWeight += 0.52 + 0.21 + 0.12; // 0.85

  // Optional: Identity Container (10%)
  if (hasIdentity) {
    baseScore += (identityContainerScore! * 0.10);
    totalWeight += 0.10;
  }

  // Optional: FFmpeg Visual Intelligence (5%)
  if (hasFFmpeg) {
    baseScore += (ffmpegVisualScore! * 0.05);
    totalWeight += 0.05;
  }

  // Redistribute weights if components are missing (normalize to 100%)
  if (totalWeight < 1.0) {
    const redistributionFactor = 1.0 / totalWeight;
    baseScore *= redistributionFactor;
  }

  // Apply platform weight
  const finalScore = baseScore * platformWeight;

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, finalScore));
}

/**
 * Main DPS calculation function
 * Orchestrates the complete calculation flow
 *
 * @param video - Video input data
 * @param cohortStats - Cohort statistics for comparison
 * @param ffmpegVisualScore - Optional FFmpeg visual intelligence score (0-100)
 * @returns DPS calculation result
 */
export function calculateDPS(video: VideoInput, cohortStats: CohortStats, ffmpegVisualScore?: number): DPSResult {
  const startTime = Date.now();

  // 1. Calculate z-score
  const zScore = calculateZScore(
    video.viewCount,
    cohortStats.cohortMean,
    cohortStats.cohortStdDev
  );

  // 2. Calculate engagement score
  const engagementScore = calculateEngagementScore(
    video.viewCount,
    video.likeCount,
    video.commentCount,
    video.shareCount,
    video.platform
  );

  // 3. Apply time decay
  const decayFactor = calculateDecayFactor(
    video.hoursSinceUpload,
    video.platform
  );

  // 4. Get platform weight
  const platformWeight = PLATFORM_WEIGHTS[video.platform];

  // 5. Calculate Identity Container score (Enhancement)
  const identityContainerScore = calculateIdentityContainerScore(video.caption);

  // 6. Calculate master viral score (with FFmpeg boost if available)
  const viralScore = calculateMasterViralScore({
    zScore,
    engagementScore,
    platformWeight,
    decayFactor,
    platform: video.platform,
    identityContainerScore,
    ffmpegVisualScore,
  });
  
  // 7. Determine percentile and classification
  const percentileRank = zScoreToPercentile(zScore);
  const classification = classifyVirality(viralScore); // Use viral score, not percentile
  
  // 8. Calculate confidence
  const confidence = calculateConfidence(cohortStats.sampleSize, video);
  
  // 9. Generate audit ID
  const auditId = generateAuditId();
  
  const processingTimeMs = Date.now() - startTime;
  
  return {
    videoId: video.videoId,
    viralScore: roundToDecimal(viralScore, 2),
    percentileRank: roundToDecimal(percentileRank, 2),
    classification,
    zScore: roundToDecimal(zScore, 4),
    decayFactor: roundToDecimal(decayFactor, 4),
    platformWeight,
    cohortMedian: cohortStats.cohortMedian,
    confidence: roundToDecimal(confidence, 3),
    calculatedAt: new Date().toISOString(),
    auditId,
    processingTimeMs,
    identityContainerScore: roundToDecimal(identityContainerScore, 2),
    ffmpegVisualScore: ffmpegVisualScore !== undefined ? roundToDecimal(ffmpegVisualScore, 2) : undefined,
  };
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Generate unique audit ID for traceability
 */
export function generateAuditId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `aud_dps_${timestamp}_${random}`;
}

/**
 * Round number to specified decimal places
 */
export function roundToDecimal(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Validate video input data
 * @throws {z.ZodError} if validation fails
 */
export function validateVideoInput(video: unknown): VideoInput {
  return VideoInputSchema.parse(video);
}

/**
 * Calculate hours since upload from published timestamp
 */
export function calculateHoursSinceUpload(publishedAt: string): number {
  const published = new Date(publishedAt);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

// =====================================================
// Exports
// =====================================================

export const DPSEngine = {
  calculateDPS,
  calculateDecayFactor,
  calculateEngagementScore,
  calculateZScore,
  zScoreToPercentile,
  classifyVirality,
  getCohortBounds,
  calculateConfidence,
  calculateMasterViralScore,
  calculateIdentityContainerScore,
  validateVideoInput,
  calculateHoursSinceUpload,
  generateAuditId,
};

export default DPSEngine;

