// Comprehensive Viral Prediction Platform Types
import { VIRAL_PERCENTILE_THRESHOLDS as VIRAL_THRESHOLDS_CFG, PLATFORM_WEIGHTS as PLATFORM_WEIGHTS_CFG } from '@/config/viral-thresholds';

// Framework Parser Types
export interface VideoAnalysis {
  videoId: string;
  tiktokId: string;
  creatorId: string;
  transcript: string;
  hashtags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  creatorFollowers: number;
  uploadTimestamp: string;
  visualFeatures?: any;
  audioFeatures?: any;
  durationSeconds: number;
  textOverlays: Array<{
    text: string;
    timestamp: number;
  }>;
}

export interface FrameworkScore {
  tier1: {
    tripleLayerHook: number;
    storytellingLoop: number;
    dynamicPercentile: number;
    culturalTiming: number;
  };
  tier2: {
    authorityGap: number;
    hookPatternRecognition: number;
    visualFormat: number;
    engagementVelocity: number;
  };
  tier3: {
    platformOptimization: number;
    psychologicalTriggers: number;
    productionQuality: number;
    audienceBehavior: number;
  };
  hookDetections: Array<{
    hookType: string;
    confidence: number;
    expectedSuccessRate: number;
  }>;
  overallScore: number;
}

export interface GodModeAnalysis {
  psychological: {
    emotionalArousalScore: number;
    arousalType: string;
    socialCurrencyScore: number;
    parasocialStrength: number;
  };
  productionQuality: {
    shotPacingScore: number;
    authenticityBalance: number;
    calculatedSpontaneityScore: number;
  };
  culturalTiming: {
    trendStage: string;
    hoursUntilPeak: number;
    culturalRelevanceScore: number;
  };
}

export interface ViralScore {
  score: number;
  cohortMedian: number;
  platformWeight: number;
  decayFactor: number;
  confidence: number;
  percentile: number;
}

export interface EngagementVelocity {
  likesPerHour: number;
  commentsPerHour: number;
  sharesPerHour: number;
  viewsPerHour: number;
  timeDecayWeight: number;
  acceleration: number;
}

export interface CrossPlatformSignal {
  platform: 'twitter' | 'instagram' | 'youtube';
  viralityIndicator: number;
  correlationStrength: number;
  timeToSpread: number; // hours
  engagementMetrics: Record<string, number>;
}

export interface HookDetection {
  hookId: string;
  hookType: string;
  confidence: number;
  detectedElements: string[];
  expectedSuccessRate: number;
}

export interface PredictionResult {
  videoId: string;
  viralScore: number; // Simplified to number for framework parser
  viralProbability: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  recommendedActions: string[];
  peakTimeEstimate: string; // ISO string for API compatibility
  hookAnalysis: Array<{
    hookType: string;
    confidence: number;
    expectedSuccessRate: number;
  }>;
  psychologicalFactors?: {
    emotionalArousalScore: number;
    arousalType: string;
    socialCurrencyScore: number;
    parasocialStrength: number;
  };
  productionQuality?: {
    shotPacingScore: number;
    authenticityBalance: number;
    calculatedSpontaneityScore: number;
  };
  culturalTiming?: {
    trendStage: string;
    hoursUntilPeak: number;
    culturalRelevanceScore: number;
  };
  frameworkBreakdown?: any;
  dpsScore?: number;
  platformOptimization?: number;
}

// God Mode Enhancements
export interface PsychologicalEngagement {
  emotionalArousalScore: number;
  arousalType: 'awe' | 'anger' | 'surprise' | 'excitement';
  arousalIntensity: number;
  socialCurrencyScore: number;
  parasocialStrength: number;
  emotionDiversityScore: number;
  highArousalEmotions: Record<string, number>;
}

export interface ProductionQuality {
  shotPacingScore: number;
  averageShotDuration: number;
  rapidCutPercentage: number;
  patternInterruptCount: number;
  authenticityBalance: number;
  calculatedSpontaneityScore: number;
}

export interface PerspectiveAnalysis {
  youUsageCount: number;
  youPercentage: number;
  directAddressMoments: Array<{timestamp: number, context: string}>;
  viewerInclusionScore: number;
  duetPotentialScore: number;
  stitchPotentialScore: number;
}

export interface CulturalTiming {
  trendStage: 'emerging' | 'rising' | 'peak' | 'declining';
  hoursUntilPeak: number;
  culturalRelevanceScore: number;
  seasonalAlignment: number;
  platformPeakTimes: Record<string, string[]>;
}

// Inception Mode Types
export interface MarketingTemplate {
  id: string;
  templateName: string;
  templateType: 'case_study' | 'demo' | 'testimonial' | 'educational';
  structure: any;
  viralElements: string[];
  provenHooks: string[];
  averageViralScore: number;
  conversionRate: number;
}

export interface OneClickOptimization {
  optimizationType: 'copy_winner' | 'optimize_viral' | 'platform_specific';
  transformationRules: any;
  successPatterns: string[];
  averageImprovement: number;
}

export interface InceptionAnalytics {
  contentId: string;
  viralScore: number;
  viewCount: number;
  engagementRate: number;
  clicksToSite: number;
  signupsGenerated: number;
  conversionRate: number;
  predictionAccuracy: number;
}

// Platform-specific decay constants
export const PLATFORM_DECAY_RATES = {
  tiktok: 0.5,    // Steep decay
  instagram: 0.3,  // Moderate decay
  youtube: 0.1     // Gradual decay
};

export const PLATFORM_WEIGHTS = {
  tiktok: PLATFORM_WEIGHTS_CFG.tiktok,
  instagram: PLATFORM_WEIGHTS_CFG.instagram,
  youtube: PLATFORM_WEIGHTS_CFG.youtube
};

// God Mode accuracy improvements
export const GOD_MODE_ACCURACY_BOOSTS = {
  psychologicalEngagement: 0.05,  // +5%
  productionQuality: 0.03,        // +3%
  secondPersonPerspective: 0.03,  // +3%
  culturalTiming: 0.05,          // +5%
  authenticityParadox: 0.03      // +3%
};

// Viral classification thresholds
export const VIRAL_THRESHOLDS = {
  megaViral: VIRAL_THRESHOLDS_CFG.mega,   // Top 0.1%
  hyperViral: VIRAL_THRESHOLDS_CFG.hyper, // Top 1%
  viral: VIRAL_THRESHOLDS_CFG.viral,      // Top 5%
  trending: VIRAL_THRESHOLDS_CFG.trending,// Top 10%
  normal: 0                                // Everything else
};

// Hook effectiveness multipliers
export const HOOK_EFFECTIVENESS = {
  storytelling: 1.0,   // 100% baseline
  authority: 0.85,     // 85% of storytelling
  challenge: 0.75,     // 75% of storytelling
  emotional: 0.8,      // 80% of storytelling
  curiosity: 0.9,      // 90% of storytelling
  relatability: 0.95,  // 95% of storytelling
  educational: 0.7,    // 70% of storytelling
  social: 0.65        // 65% of storytelling
};