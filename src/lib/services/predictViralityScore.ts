/**
 * Viral Prediction Score Calculator
 * 
 * Standalone module that calculates viral prediction scores based on multiple factors.
 * Extracted from the main prediction engine for modularity and testability.
 * 
 * @module predictViralityScore
 * @version 1.0.0
 */

export interface ScriptFeatures {
  // Text-based features from transcript analysis
  hasHook: boolean;
  hasQuestion: boolean;
  hasAuthority: boolean;
  hasControversy: boolean;
  hasStorytellingLoop: boolean;
  transcriptLength: number;
  emotionalArousalScore: number;        // 0-100
  readabilityScore: number;             // 0-100
  sentimentScore: number;               // -1 to 1
  hookStrength: number;                 // 0-100
  persuasionTechniques: number;         // Count of techniques detected
}

export interface VisualMetrics {
  // Visual analysis features
  aspectRatio: number;                  // e.g., 0.5625 for 9:16
  colorfulness: number;                 // 0-100
  brightness: number;                   // 0-100
  contrast: number;                     // 0-100
  faceDetections: number;               // Count of faces detected
  visualComplexity: number;             // 0-100
  shotPacingScore: number;              // 0-100
  authenticityBalance: number;          // 0-100
  hasMotion: boolean;
  hasTextOverlay: boolean;
  dominantColors: number;               // Count of dominant colors
}

export interface EngagementHistory {
  // Historical and real-time engagement data
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  creatorFollowers: number;
  hoursSinceUpload: number;
  pastViralCount?: number;              // Optional: creator's past viral videos
  avgPastPerformance?: number;          // Optional: average performance metrics
  cohortMean?: number;                  // Optional: cohort average performance
  cohortStandardDeviation?: number;     // Optional: cohort standard deviation
}

export interface PlatformContext {
  // Platform-specific configuration
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin';
  uploadTime: number;                   // Hour of day (0-23)
  uploadDay: number;                    // Day of week (0-6)
  seasonality: number;                  // 0-1 seasonal factor
  trendAlignment: number;               // 0-1 trend alignment score
  culturalRelevanceScore: number;       // 0-100
  competitorActivity: number;           // 0-1 competitor activity level
}

export interface ViralPredictionResult {
  // Final prediction output
  score: number;                        // 0-100 viral score
  probability: number;                  // 0-1 viral probability
  confidence: number;                   // 0-1 confidence level
  verdict: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal';
  
  // Score breakdown for explainability
  breakdown: {
    scriptScore: number;                // 0-100
    visualScore: number;                // 0-100
    engagementScore: number;            // 0-100
    platformScore: number;              // 0-100
    timingScore: number;                // 0-100
    trendScore: number;                 // 0-100
  };
  
  // Additional insights
  peakTimeEstimate: number;             // Hours until peak performance
  recommendations: string[];            // Actionable improvement suggestions
  riskFactors: string[];               // Potential issues identified
}

/**
 * Framework tier weights based on research validation
 */
const FRAMEWORK_WEIGHTS = {
  tier1: {
    tripleLayerHook: 0.35,              // 35% - Most impactful
    storytellingLoop: 0.30,             // 30% - Strong narrative drive
    dynamicPercentile: 0.25,            // 25% - Statistical foundation
    culturalTiming: 0.20                // 20% - Cultural relevance
  },
  tier2: {
    authorityGap: 0.18,                 // 18% - Credibility boost
    hookPatternRecognition: 0.15,       // 15% - Pattern matching
    visualFormat: 0.12,                 // 12% - Visual appeal
    engagementVelocity: 0.10            // 10% - Engagement speed
  },
  tier3: {
    platformOptimization: 0.08,         // 8% - Platform fit
    psychologicalTriggers: 0.06,        // 6% - Psychological factors
    productionQuality: 0.05,            // 5% - Production value
    audienceBehavior: 0.04              // 4% - Audience patterns
  }
};

/**
 * Platform-specific multipliers based on algorithmic preferences
 */
const PLATFORM_MULTIPLIERS = {
  tiktok: 1.2,                          // 20% boost for TikTok optimization
  instagram: 1.0,                       // Baseline
  youtube: 0.9,                         // 10% reduction for different dynamics
  linkedin: 0.8                         // 20% reduction for professional context
};

/**
 * Platform-specific viral thresholds based on research
 */
const VIRAL_THRESHOLDS = {
  tiktok: { engagementRate: 0.06, viewToFollowerRatio: 0.35 },
  instagram: { engagementRate: 0.03, viewToFollowerRatio: 0.2 },
  youtube: { engagementRate: 0.04, viewToFollowerRatio: 0.15 },
  linkedin: { engagementRate: 0.02, viewToFollowerRatio: 0.1 }
};

/**
 * Time decay rates by platform (research-validated)
 */
const DECAY_RATES = {
  tiktok: 0.5,                          // Fast decay
  instagram: 0.3,                       // Moderate decay
  youtube: 0.1,                         // Slow decay
  linkedin: 0.2                         // Professional context decay
};

/**
 * Main viral prediction score calculator
 * 
 * @param scriptFeatures - Text and transcript analysis features
 * @param visualMetrics - Visual analysis metrics
 * @param engagementHistory - Historical and real-time engagement data
 * @param platformContext - Platform-specific context and timing
 * @returns ViralPredictionResult with score, confidence, and breakdown
 */
export function predictViralityScore(
  scriptFeatures: ScriptFeatures,
  visualMetrics: VisualMetrics,
  engagementHistory: EngagementHistory,
  platformContext: PlatformContext
): ViralPredictionResult {
  
  // 1. Calculate individual component scores
  const scriptScore = calculateScriptScore(scriptFeatures);
  const visualScore = calculateVisualScore(visualMetrics);
  const engagementScore = calculateEngagementScore(engagementHistory);
  const platformScore = calculatePlatformScore(platformContext);
  const timingScore = calculateTimingScore(platformContext);
  const trendScore = calculateTrendScore(platformContext);
  
  // 2. Calculate statistical foundation using Z-score (if cohort data available)
  const zScore = calculateZScore(engagementHistory);
  const statisticalScore = normalizeZScore(zScore);
  
  // 3. Apply framework-based tier weighting
  const tier1Score = calculateTier1Score(scriptScore, visualScore, statisticalScore, trendScore);
  const tier2Score = calculateTier2Score(scriptScore, visualScore, engagementScore);
  const tier3Score = calculateTier3Score(platformScore, visualScore, engagementScore);
  
  // 4. Calculate base viral score using weighted framework combination
  const baseScore = (tier1Score + tier2Score + tier3Score) / 3;
  
  // 5. Apply God Mode enhancements (psychological, production, cultural)
  const psychologicalMultiplier = 1 + (scriptFeatures.emotionalArousalScore / 100) * 0.25;
  const productionMultiplier = 1 + (visualMetrics.shotPacingScore / 100) * 0.20;
  const culturalMultiplier = 1 + (platformContext.culturalRelevanceScore / 100) * 0.35;
  
  // 6. Apply platform-specific multiplier
  const platformMultiplier = PLATFORM_MULTIPLIERS[platformContext.platform];
  
  // 7. Calculate authenticity factor (prevents over-optimization penalty)
  const authenticityFactor = Math.min(visualMetrics.authenticityBalance / 100, 1.0);
  
  // 8. Apply time decay factor
  const decayFactor = calculateDecayFactor(engagementHistory.hoursSinceUpload, platformContext.platform);
  
  // 9. Calculate final viral score using master formula
  const enhancedScore = baseScore * psychologicalMultiplier * productionMultiplier * culturalMultiplier;
  const finalScore = enhancedScore * platformMultiplier * authenticityFactor * decayFactor;
  
  // 10. Apply God Mode boost (15-35% maximum enhancement)
  const godModeBoost = Math.min(
    (psychologicalMultiplier - 1) + (productionMultiplier - 1) + (culturalMultiplier - 1),
    0.35
  );
  const boostedScore = finalScore * (1 + godModeBoost);
  
  // 11. Normalize final score to 0-100 range
  const normalizedScore = Math.min(Math.max(boostedScore * 100, 0), 100);
  
  // 12. Convert score to probability (0-1)
  const probability = scoreToprobability(normalizedScore);
  
  // 13. Calculate confidence based on data quality and consensus
  const confidence = calculateConfidence(
    engagementHistory,
    scriptFeatures,
    visualMetrics,
    platformContext
  );
  
  // 14. Determine verdict based on probability
  const verdict = determineVerdict(probability);
  
  // 15. Generate insights and recommendations
  const recommendations = generateRecommendations(
    scriptFeatures,
    visualMetrics,
    engagementHistory,
    platformContext,
    normalizedScore
  );
  
  const riskFactors = identifyRiskFactors(
    scriptFeatures,
    visualMetrics,
    engagementHistory,
    platformContext
  );
  
  // 16. Calculate peak time estimate
  const peakTimeEstimate = calculatePeakTimeEstimate(
    engagementHistory.hoursSinceUpload,
    platformContext.platform,
    probability
  );
  
  return {
    score: Math.round(normalizedScore * 100) / 100,
    probability: Math.round(probability * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000,
    verdict,
    breakdown: {
      scriptScore: Math.round(scriptScore),
      visualScore: Math.round(visualScore),
      engagementScore: Math.round(engagementScore),
      platformScore: Math.round(platformScore),
      timingScore: Math.round(timingScore),
      trendScore: Math.round(trendScore)
    },
    peakTimeEstimate,
    recommendations,
    riskFactors
  };
}

/**
 * Calculate script-based score from text analysis features
 */
function calculateScriptScore(features: ScriptFeatures): number {
  let score = 50; // Base score
  
  // Hook effectiveness (35% of script score)
  if (features.hasHook) score += 15;
  if (features.hasQuestion) score += 10;
  if (features.hasAuthority) score += 12;
  if (features.hasControversy) score += 8;
  
  // Storytelling quality (30% of script score)
  if (features.hasStorytellingLoop) score += 15;
  score += (features.hookStrength / 100) * 10;
  
  // Content quality (25% of script score)
  score += (features.emotionalArousalScore / 100) * 12;
  score += (features.readabilityScore / 100) * 8;
  
  // Persuasion techniques (10% of script score)
  score += Math.min(features.persuasionTechniques * 2, 10);
  
  return Math.min(score, 100);
}

/**
 * Calculate visual-based score from visual analysis metrics
 */
function calculateVisualScore(metrics: VisualMetrics): number {
  let score = 50; // Base score
  
  // Visual appeal (40% of visual score)
  if (metrics.colorfulness > 70) score += 10;
  if (metrics.brightness > 60 && metrics.brightness < 90) score += 8;
  if (metrics.contrast > 70) score += 12;
  
  // Face and motion detection (30% of visual score)
  if (metrics.faceDetections > 0) score += 15;
  if (metrics.hasMotion) score += 10;
  
  // Production quality (20% of visual score)
  score += (metrics.shotPacingScore / 100) * 10;
  score += (metrics.authenticityBalance / 100) * 8;
  
  // Visual complexity optimization (10% of visual score)
  if (metrics.visualComplexity >= 30 && metrics.visualComplexity <= 70) score += 10;
  
  return Math.min(score, 100);
}

/**
 * Calculate engagement-based score from historical data
 */
function calculateEngagementScore(history: EngagementHistory): number {
  // Calculate engagement rate
  const engagementRate = history.viewCount > 0 ? 
    (history.likeCount + history.commentCount + history.shareCount) / history.viewCount : 0;
  
  // Calculate view-to-follower ratio
  const viewToFollowerRatio = history.creatorFollowers > 0 ? 
    history.viewCount / history.creatorFollowers : 0;
  
  // Base engagement score (0-100)
  const engagementScore = Math.min(engagementRate * 1000, 100);
  const reachScore = Math.min(viewToFollowerRatio * 200, 100);
  
  // Historical performance boost
  let historyBoost = 0;
  if (history.pastViralCount && history.pastViralCount > 0) {
    historyBoost = Math.min(history.pastViralCount * 5, 20);
  }
  
  return Math.min((engagementScore + reachScore) / 2 + historyBoost, 100);
}

/**
 * Calculate platform-specific optimization score
 */
function calculatePlatformScore(context: PlatformContext): number {
  let score = 50; // Base score
  
  // Platform-specific optimizations
  switch (context.platform) {
    case 'tiktok':
      score += context.trendAlignment * 30;
      break;
    case 'instagram':
      score += context.culturalRelevanceScore * 0.25;
      break;
    case 'youtube':
      score += (1 - context.competitorActivity) * 20;
      break;
    case 'linkedin':
      score += context.culturalRelevanceScore * 0.20;
      break;
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate timing-based score
 */
function calculateTimingScore(context: PlatformContext): number {
  let score = 50; // Base score
  
  // Optimal posting time (platform-specific)
  const optimalHours = {
    tiktok: [18, 19, 20, 21, 22], // 6-10 PM
    instagram: [18, 19, 20, 21, 11, 12, 13], // 6-10 PM, 11 AM-1 PM
    youtube: [14, 15, 16, 20, 21, 22], // 2-4 PM, 8-10 PM
    linkedin: [8, 9, 10, 12, 13, 14] // 8-10 AM, 12-2 PM
  };
  
  if (optimalHours[context.platform].includes(context.uploadTime)) {
    score += 25;
  }
  
  // Weekend bonus (varies by platform)
  const weekendBonus = {
    tiktok: 15,
    instagram: 10,
    youtube: 5,
    linkedin: -10 // Penalty for LinkedIn
  };
  
  if (context.uploadDay === 0 || context.uploadDay === 6) {
    score += weekendBonus[context.platform];
  }
  
  // Seasonality factor
  score += context.seasonality * 25;
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate trend alignment score
 */
function calculateTrendScore(context: PlatformContext): number {
  let score = 50; // Base score
  
  // Trend alignment boost
  score += context.trendAlignment * 30;
  
  // Cultural relevance boost
  score += (context.culturalRelevanceScore / 100) * 20;
  
  // Competitor activity penalty
  score -= context.competitorActivity * 10;
  
  return Math.min(Math.max(score, 0), 100);
}

/**
 * Calculate Z-score for statistical foundation
 */
function calculateZScore(history: EngagementHistory): number {
  if (!history.cohortMean || !history.cohortStandardDeviation || history.cohortStandardDeviation === 0) {
    return 0; // Return neutral z-score if no cohort data
  }
  
  return (history.viewCount - history.cohortMean) / history.cohortStandardDeviation;
}

/**
 * Normalize Z-score to 0-1 range
 */
function normalizeZScore(zScore: number): number {
  // Z-score of 3 represents ~99.7% percentile
  return Math.max(0, Math.min(1, (zScore + 3) / 6));
}

/**
 * Calculate tier 1 framework score (highest impact)
 */
function calculateTier1Score(scriptScore: number, visualScore: number, statisticalScore: number, trendScore: number): number {
  return (
    scriptScore * FRAMEWORK_WEIGHTS.tier1.tripleLayerHook +
    scriptScore * FRAMEWORK_WEIGHTS.tier1.storytellingLoop +
    statisticalScore * 100 * FRAMEWORK_WEIGHTS.tier1.dynamicPercentile +
    trendScore * FRAMEWORK_WEIGHTS.tier1.culturalTiming
  );
}

/**
 * Calculate tier 2 framework score (moderate impact)
 */
function calculateTier2Score(scriptScore: number, visualScore: number, engagementScore: number): number {
  return (
    scriptScore * FRAMEWORK_WEIGHTS.tier2.authorityGap +
    scriptScore * FRAMEWORK_WEIGHTS.tier2.hookPatternRecognition +
    visualScore * FRAMEWORK_WEIGHTS.tier2.visualFormat +
    engagementScore * FRAMEWORK_WEIGHTS.tier2.engagementVelocity
  );
}

/**
 * Calculate tier 3 framework score (supporting factors)
 */
function calculateTier3Score(platformScore: number, visualScore: number, engagementScore: number): number {
  return (
    platformScore * FRAMEWORK_WEIGHTS.tier3.platformOptimization +
    visualScore * FRAMEWORK_WEIGHTS.tier3.psychologicalTriggers +
    visualScore * FRAMEWORK_WEIGHTS.tier3.productionQuality +
    engagementScore * FRAMEWORK_WEIGHTS.tier3.audienceBehavior
  );
}

/**
 * Calculate time decay factor
 */
function calculateDecayFactor(hoursSinceUpload: number, platform: string): number {
  const decayRate = DECAY_RATES[platform as keyof typeof DECAY_RATES];
  return Math.exp(-decayRate * hoursSinceUpload / 24); // Normalize to days
}

/**
 * Convert score to probability
 */
function scoreToprobability(score: number): number {
  // Sigmoid-like transformation for realistic probability distribution
  return 1 / (1 + Math.exp(-(score - 50) / 15));
}

/**
 * Calculate confidence level based on data quality
 */
function calculateConfidence(
  history: EngagementHistory,
  script: ScriptFeatures,
  visual: VisualMetrics,
  platform: PlatformContext
): number {
  let confidence = 0.7; // Base confidence
  
  // Time-based confidence (increases with time)
  const timeConfidence = Math.min(history.hoursSinceUpload / 72, 1) * 0.6;
  
  // View-based confidence (increases with views)
  const viewConfidence = Math.min(history.viewCount / 10000, 1) * 0.4;
  
  // Data completeness confidence
  const dataFields = [
    script.transcriptLength > 0,
    visual.faceDetections >= 0,
    history.viewCount > 0,
    history.creatorFollowers > 0,
    platform.culturalRelevanceScore > 0
  ];
  const dataCompleteness = dataFields.filter(Boolean).length / dataFields.length;
  
  // Historical data confidence
  const historyConfidence = (history.pastViralCount && history.avgPastPerformance) ? 0.1 : 0;
  
  return Math.min(
    (timeConfidence + viewConfidence) * 0.6 + 
    dataCompleteness * 0.3 + 
    historyConfidence,
    0.95
  );
}

/**
 * Determine verdict based on probability
 */
function determineVerdict(probability: number): 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal' {
  if (probability >= 0.999) return 'mega-viral';   // Top 0.1%
  if (probability >= 0.99) return 'hyper-viral';   // Top 1%
  if (probability >= 0.95) return 'viral';         // Top 5%
  if (probability >= 0.90) return 'trending';      // Top 10%
  return 'normal';
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(
  script: ScriptFeatures,
  visual: VisualMetrics,
  history: EngagementHistory,
  platform: PlatformContext,
  score: number
): string[] {
  const recommendations: string[] = [];
  
  // Script recommendations
  if (!script.hasHook) {
    recommendations.push('Add a strong hook in the first 3 seconds');
  }
  if (script.emotionalArousalScore < 50) {
    recommendations.push('Increase emotional intensity to trigger sharing behavior');
  }
  if (!script.hasStorytellingLoop) {
    recommendations.push('Structure content with clear setup, tension, and payoff');
  }
  
  // Visual recommendations
  if (visual.faceDetections === 0) {
    recommendations.push('Include face presence for better engagement');
  }
  if (visual.shotPacingScore < 60) {
    recommendations.push('Optimize shot pacing - aim for 2-second average cuts');
  }
  if (visual.authenticityBalance < 70) {
    recommendations.push('Balance production quality with authenticity');
  }
  
  // Timing recommendations
  if (platform.uploadTime < 18 || platform.uploadTime > 22) {
    recommendations.push('Consider posting during peak hours (6-10 PM)');
  }
  
  // Platform-specific recommendations
  if (platform.trendAlignment < 0.5) {
    recommendations.push(`Align content with current ${platform.platform} trends`);
  }
  
  return recommendations.slice(0, 8); // Limit to top 8 recommendations
}

/**
 * Identify potential risk factors
 */
function identifyRiskFactors(
  script: ScriptFeatures,
  visual: VisualMetrics,
  history: EngagementHistory,
  platform: PlatformContext
): string[] {
  const risks: string[] = [];
  
  // Content risks
  if (script.hasControversy) {
    risks.push('Controversial content may limit algorithmic reach');
  }
  if (visual.visualComplexity > 80) {
    risks.push('High visual complexity may overwhelm mobile viewers');
  }
  
  // Competition risks
  if (platform.competitorActivity > 0.8) {
    risks.push('High competitor activity may limit visibility');
  }
  
  // Performance risks
  if (history.viewCount < history.creatorFollowers * 0.05) {
    risks.push('Below-average reach for follower count');
  }
  
  // Platform risks
  if (platform.culturalRelevanceScore < 30) {
    risks.push('Low cultural relevance may limit viral potential');
  }
  
  return risks.slice(0, 5); // Limit to top 5 risks
}

/**
 * Calculate peak time estimate
 */
function calculatePeakTimeEstimate(
  hoursSinceUpload: number,
  platform: string,
  probability: number
): number {
  // Platform-specific peak timing patterns
  const baseTiming = {
    tiktok: 2,    // 2 hours average
    instagram: 4, // 4 hours average
    youtube: 24,  // 24 hours average
    linkedin: 12  // 12 hours average
  };
  
  const base = baseTiming[platform as keyof typeof baseTiming];
  const probabilityMultiplier = probability > 0.8 ? 0.5 : probability > 0.6 ? 0.8 : 1.2;
  
  return Math.round(base * probabilityMultiplier);
}

/**
 * Utility function to validate inputs
 */
export function validateInputs(
  scriptFeatures: ScriptFeatures,
  visualMetrics: VisualMetrics,
  engagementHistory: EngagementHistory,
  platformContext: PlatformContext
): string[] {
  const errors: string[] = [];
  
  // Validate script features
  if (scriptFeatures.emotionalArousalScore < 0 || scriptFeatures.emotionalArousalScore > 100) {
    errors.push('emotionalArousalScore must be between 0 and 100');
  }
  
  // Validate visual metrics
  if (visualMetrics.aspectRatio <= 0) {
    errors.push('aspectRatio must be positive');
  }
  
  // Validate engagement history
  if (engagementHistory.viewCount < 0) {
    errors.push('viewCount cannot be negative');
  }
  
  // Validate platform context
  if (!['tiktok', 'instagram', 'youtube', 'linkedin'].includes(platformContext.platform)) {
    errors.push('platform must be one of: tiktok, instagram, youtube, linkedin');
  }
  
  return errors;
}