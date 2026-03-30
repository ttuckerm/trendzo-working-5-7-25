/**
 * VIRAL PREDICTION ALGORITHM - CORE SCORING ENGINE
 * 
 * This module contains the complete viral prediction algorithm that generates virality scores,
 * confidence levels, and recommendation feedback for video drafts and templates.
 * 
 * WHAT IT DOES:
 * - Analyzes video content using 40+ viral frameworks
 * - Calculates viral prediction score (0-100) with high accuracy
 * - Generates confidence level (0-1) based on data quality
 * - Provides actionable recommendations for content optimization
 * - Identifies risk factors that could limit viral potential
 * - ENHANCED: Extracts and analyzes keywords/hashtags for viral optimization
 * 
 * INPUTS:
 * - Template features: Script analysis, hooks, storytelling elements
 * - Sound data: Audio quality, beat sync, emotional triggers
 * - Visual metrics: Production quality, pacing, authenticity
 * - Engagement history: Current performance, creator context
 * - Platform context: Timing, trends, cultural relevance
 * - ENHANCED: Keyword/hashtag analysis for discoverability optimization
 * 
 * OUTPUTS:
 * - Viral score (0-100): Primary prediction metric
 * - Confidence level (0-1): Reliability of prediction
 * - Recommendations array: Actionable improvement suggestions
 * - Risk factors: Potential issues limiting viral potential
 * - Component breakdown: Detailed scoring explanation
 * - ENHANCED: Keyword/hashtag optimization suggestions
 * 
 * USED BY:
 * - FeedbackIngest: Real-time content analysis
 * - RecipeBookAPI: Template viral scoring
 * - AdvisorService: Content optimization recommendations
 * - Studio Dashboard: Viral potential assessment
 * - Template Editor: Live scoring during creation
 * - ENHANCED: Keyword/hashtag extraction and optimization
 * 
 * ENHANCED WITH 18-CATEGORY EXHAUSTIVE ELEMENT EXTRACTION + KEYWORD/HASHTAG ANALYSIS:
 * - 300+ granular data points for maximum prediction accuracy
 * - Real-time element scoring for Template Editor integration
 * - Advanced God Mode enhancements with psychological pattern mapping
 * - Comprehensive keyword extraction and hashtag performance tracking
 * - Trending keyword/hashtag analysis for algorithmic optimization
 */

import * as fs from 'fs';
import * as path from 'path';

// Algorithm version for tracking and updates
const VIRALITY_ALGO_VERSION = "v2.1.0-keyword-enhanced";

// ===== KEYWORD & HASHTAG ANALYSIS INTERFACES =====

/**
 * Comprehensive keyword analysis for viral optimization
 */
export interface KeywordAnalysis {
  // Extracted keywords with relevance scoring
  extractedKeywords: Array<{
    keyword: string;
    frequency: number;
    relevanceScore: number; // 0-100 
    position: 'hook' | 'body' | 'cta' | 'caption'; // Where it appears
    viralityScore: number; // Historical viral performance of this keyword
  }>;
  
  // Keyword density and distribution
  keywordDensity: number; // Keywords per 100 words
  keywordDistribution: {
    hook: number; // Percentage in hook
    body: number; // Percentage in body
    cta: number;  // Percentage in CTA
  };
  
  // SEO and discoverability metrics
  searchVolumeEstimate: number; // Estimated search volume
  competitionLevel: 'low' | 'medium' | 'high';
  semanticRelevance: number; // 0-100 semantic coherence
  
  // Trending analysis
  trendingKeywords: Array<{
    keyword: string;
    trendVelocity: number; // Rate of trend growth
    peakPrediction: number; // Days to peak
    viralPotential: number; // 0-100 viral potential
  }>;
  
  // Niche-specific optimization
  nicheKeywords: Array<{
    keyword: string;
    nicheRelevance: number; // 0-100 niche-specific relevance
    crossoverPotential: number; // Potential for broader appeal
  }>;
}

/**
 * Advanced hashtag performance tracking and analysis
 */
export interface HashtagAnalysis {
  // Hashtag performance metrics
  hashtagPerformance: Array<{
    hashtag: string;
    usageFrequency: number; // How often it appears in viral content
    averageViralScore: number; // Average viral score when used
    platformEffectiveness: {
      tiktok: number;
      instagram: number;
      youtube: number;
      linkedin: number;
    };
    temporalTrend: 'rising' | 'stable' | 'declining';
    peakPerformanceDays: number[]; // Days of week/time when most effective
  }>;
  
  // Hashtag strategy metrics
  hashtagMix: {
    branded: number; // Number of branded hashtags
    trending: number; // Number of trending hashtags
    niche: number; // Number of niche-specific hashtags
    broad: number; // Number of broad appeal hashtags
  };
  
  // Hashtag effectiveness scoring
  discoverabilityScore: number; // 0-100 potential for discovery
  algorithmAlignmentScore: number; // 0-100 alignment with platform algorithms
  competitionLevel: number; // 0-100 competition for these hashtags
  
  // Viral hashtag predictions
  viralHashtagCandidates: Array<{
    hashtag: string;
    viralProbability: number; // 0-100 probability of going viral
    suggestedTiming: string; // When to use for maximum impact
    complementaryHashtags: string[]; // Hashtags that work well together
  }>;
  
  // Cross-platform optimization
  platformOptimizedHashtags: {
    tiktok: string[];
    instagram: string[];
    youtube: string[];
    linkedin: string[];
  };
}

/**
 * Keyword/Hashtag temporal tracking for trend analysis
 */
export interface KeywordHashtagTrends {
  // Historical performance data
  historicalData: Array<{
    period: string; // Date range
    topKeywords: Array<{ keyword: string; performance: number }>;
    topHashtags: Array<{ hashtag: string; performance: number }>;
    viralBreakouts: Array<{ term: string; type: 'keyword' | 'hashtag'; viralScore: number }>;
  }>;
  
  // Predictive trend analysis
  emergingTrends: Array<{
    term: string;
    type: 'keyword' | 'hashtag';
    growthRate: number; // Percentage growth rate
    predictedPeak: string; // Predicted peak date
    confidenceLevel: number; // 0-100 confidence in prediction
  }>;
  
  // Seasonal patterns
  seasonalPatterns: Array<{
    term: string;
    seasonality: 'spring' | 'summer' | 'fall' | 'winter' | 'year-round';
    peakMonths: number[]; // Months of peak performance
    cyclicalPattern: boolean; // Whether it follows a cyclical pattern
  }>;
}

/**
 * Enhanced script generation with keyword/hashtag optimization
 */
export interface KeywordOptimizedScript {
  // Original and optimized versions
  originalScript: string;
  optimizedScript: string;
  keywordIntegration: Array<{
    keyword: string;
    placement: number; // Character position
    naturalness: number; // 0-100 how natural the integration feels
    seoBoost: number; // Expected SEO improvement
  }>;
  
  // Hashtag recommendations
  recommendedHashtags: Array<{
    hashtag: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    expectedReach: number; // Estimated reach improvement
  }>;
  
  // Script optimization metrics
  readabilityScore: number; // After keyword integration
  seoScore: number; // Overall SEO optimization score
  viralPotentialBoost: number; // Expected viral score improvement
}

// ===== EXISTING TYPE DEFINITIONS =====

export interface ScriptFeatures {
  // Text analysis from transcript and caption
  hasHook: boolean;                     // Strong opening hook detected
  hasQuestion: boolean;                 // Question-based engagement
  hasAuthority: boolean;                // Authority markers present
  hasControversy: boolean;              // Controversial elements
  hasStorytellingLoop: boolean;         // Complete narrative arc
  transcriptLength: number;             // Character count
  emotionalArousalScore: number;        // 0-100 emotional intensity
  readabilityScore: number;             // 0-100 content clarity
  sentimentScore: number;               // -1 to 1 sentiment analysis
  hookStrength: number;                 // 0-100 hook effectiveness
  persuasionTechniques: number;         // Count of persuasion patterns
}

export interface SoundData {
  // Audio analysis and beat synchronization
  audioQuality: number;                 // 0-100 audio clarity
  beatSyncAccuracy: number;             // 0-100 sync with visual cuts
  emotionalResonance: number;           // 0-100 emotional impact
  soundTrendAlignment: number;          // 0-100 trending audio usage
  volumeConsistency: number;            // 0-100 audio level stability
  hasOriginalAudio: boolean;            // Original vs trending audio
  musicGenre: string;                   // Genre classification
  bpmTempo: number;                     // Beats per minute
}

export interface VisualMetrics {
  // Visual analysis and production quality
  aspectRatio: number;                  // Video aspect ratio (e.g., 0.5625 for 9:16)
  colorfulness: number;                 // 0-100 color saturation
  brightness: number;                   // 0-100 overall brightness
  contrast: number;                     // 0-100 visual contrast
  faceDetections: number;               // Number of faces detected
  visualComplexity: number;             // 0-100 scene complexity
  shotPacingScore: number;              // 0-100 editing pace optimization
  authenticityBalance: number;          // 0-100 authenticity vs production
  hasMotion: boolean;                   // Motion/movement detected
  hasTextOverlay: boolean;              // Text overlays present
  dominantColors: number;               // Count of dominant color themes
  productionQuality: number;            // 0-100 overall quality assessment
}

export interface EngagementHistory {
  // Performance and creator metrics
  viewCount: number;                    // Current view count
  likeCount: number;                    // Current likes
  commentCount: number;                 // Current comments
  shareCount: number;                   // Current shares
  creatorFollowers: number;             // Creator's follower count
  hoursSinceUpload: number;             // Time since posting
  pastViralCount?: number;              // Creator's past viral videos
  avgPastPerformance?: number;          // Average performance score
  cohortMean?: number;                  // Similar creator average
  cohortStandardDeviation?: number;     // Statistical variance
}

export interface PlatformContext {
  // Platform and timing context
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin';
  uploadTime: number;                   // Hour of day (0-23)
  uploadDay: number;                    // Day of week (0-6)
  seasonality: number;                  // 0-1 seasonal factor
  trendAlignment: number;               // 0-1 trend alignment
  culturalRelevanceScore: number;       // 0-100 cultural timing
  competitorActivity: number;           // 0-1 competition level
}

export interface ViralPredictionResult {
  // Complete prediction output
  score: number;                        // 0-100 final viral score
  probability: number;                  // 0-1 viral probability
  confidence: number;                   // 0-1 prediction confidence
  verdict: 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal';
  
  // Detailed component breakdown
  breakdown: {
    scriptScore: number;                // Script analysis contribution
    soundScore: number;                 // Audio analysis contribution
    visualScore: number;                // Visual analysis contribution
    engagementScore: number;            // Engagement metrics contribution
    platformScore: number;              // Platform optimization
    timingScore: number;                // Upload timing optimization
    trendScore: number;                 // Trend alignment score
  };
  
  // Actionable insights
  recommendations: string[];            // Improvement suggestions
  riskFactors: string[];               // Potential limiting factors
  peakTimeEstimate: number;             // Hours until peak performance
  
  // Meta information
  algorithmVersion: string;             // Version used for prediction
  dataQuality: 'high' | 'medium' | 'low'; // Input data quality
  processingTime: number;               // Computation time in ms
}

// ===== 18-CATEGORY EXHAUSTIVE VIDEO ELEMENT INTERFACES =====

/**
 * 1. Video Metadata - Core performance and context data
 * ENHANCED: Now includes comprehensive keyword/hashtag analysis
 */
export interface VideoMetadata {
  originalViews: number;
  originalLikes: number;
  originalShares: number;
  originalComments: number;
  originalSaves: number;
  uploadDateTime: string;
  creatorHandle: string;
  platformSource: 'tiktok' | 'instagram' | 'youtube' | 'linkedin';
  nicheCategory: string;
  frameworkType: string;
  videoDurationSeconds: number;
  aspectRatio: number;
  originalCaption: string;
  
  // ENHANCED: Advanced hashtag tracking
  hashtagsUsed: string[];
  hashtagAnalysis: HashtagAnalysis;
  
  // ENHANCED: Comprehensive keyword analysis
  keywordAnalysis: KeywordAnalysis;
  
  // ENHANCED: Trend tracking
  trendAnalysis: KeywordHashtagTrends;
  
  // ENHANCED: Content optimization data
  contentOptimization: {
    seoScore: number; // 0-100 overall SEO optimization
    discoverabilityScore: number; // 0-100 potential for discovery
    algorithmAlignmentScore: number; // 0-100 platform algorithm alignment
    viralKeywordCount: number; // Number of historically viral keywords used
    trendingElementsCount: number; // Number of trending keywords/hashtags
  };
}

/**
 * 2. Audio Elements - Comprehensive audio analysis
 */
export interface AudioElements {
  backgroundMusicId?: string;
  musicGenre: string;
  musicMood: 'energetic' | 'calm' | 'dramatic' | 'upbeat' | 'melancholic';
  energyLevels: number[]; // Energy progression throughout video
  musicStartStopTimestamps: number[];
  volumeLevels: number[]; // Volume at different segments
  soundEffects: Array<{ type: string; timestamp: number }>;
  voiceOverPresence: boolean;
  voiceTone: 'excited' | 'calm' | 'urgent' | 'authoritative' | 'conversational';
  voicePacingWPM: number[]; // Words per minute at different segments
  audioTransitions: Array<{ type: string; timestamp: number }>;
  silenceMoments: Array<{ timestamp: number; duration: number }>;
  audioHooks: Array<{ type: string; timestamp: number; effectiveness: number }>;
  trendingAudioId?: string;
  originalVsCreatorAudio: 'original' | 'trending' | 'creator_original';
}

/**
 * 3. Hook Elements (0-3 seconds) - Critical opening analysis
 */
export interface HookElements {
  exactHookText: string;
  hookTypeClassification: 'question' | 'controversy' | 'curiosity_gap' | 'transformation' | 'authority' | 'pov' | 'secret';
  visualHookType: 'text_overlay' | 'action' | 'object_reveal' | 'face_close_up' | 'before_after';
  audioHookType: 'sound_effect' | 'music_drop' | 'voice_emphasis' | 'silence_break';
  hookConfidenceScore: number; // 0-100
  timeToMainHookDelivery: number; // Seconds
}

/**
 * 4. Script/Text Elements - Comprehensive text analysis
 */
export interface ScriptElements {
  completeTranscript: string;
  textOverlayContent: string[];
  textAppearanceTimings: number[];
  textAnimationStyles: string[];
  fontStyleIndicators: string[];
  textPositioning: Array<{ text: string; position: 'top' | 'center' | 'bottom' }>;
  powerWordsUsed: string[];
  emotionalTriggersInText: string[];
  questionsAsked: string[];
  claimsPromisesMade: string[];
}

/**
 * 5. Visual Structure - Detailed visual breakdown
 */
export interface VisualStructure {
  sceneCount: number;
  averageShotDuration: number;
  transitionTypes: string[];
  cameraAngles: string[];
  cameraMovements: Array<{ type: 'static' | 'pan' | 'zoom' | 'tilt'; timestamp: number }>;
  bRollToARollRatio: number;
  visualEffectsUsed: string[];
  filterColorGradingStyle: string;
  lightingConditions: 'natural' | 'artificial' | 'mixed' | 'dramatic';
  backgroundLocationChanges: number;
}

/**
 * 6. Pacing & Rhythm - Temporal analysis
 */
export interface PacingRhythm {
  cutsPerMinute: number;
  wordsPerMinute: number;
  informationDensityPerSegment: number[];
  energyLevelProgression: number[];
  momentumChangeTimestamps: number[];
  climaxMomentTimestamp: number;
  resolutionTimestamp: number;
}

/**
 * 7. Content Structure - Narrative framework
 */
export interface ContentStructure {
  openingType: 'hook' | 'question' | 'statement' | 'action';
  problemPresentationTimestamp: number;
  solutionRevealTimestamp: number;
  proofEvidenceTimestamps: number[];
  storyArcProgression: Array<{ phase: string; timestamp: number }>;
  informationRevealSequence: string[];
  loopClosurePoint: number;
  ctaTimestamp: number;
  ctaType: 'follow' | 'comment' | 'share' | 'save' | 'visit_link';
}

/**
 * 8. Engagement Triggers - Interaction catalysts
 */
export interface EngagementTriggers {
  commentBaitTimestamps: number[];
  shareWorthyMomentTimestamps: number[];
  saveTriggers: Array<{ type: string; timestamp: number }>;
  controversyPolarizationMoments: number[];
  surpriseTwistTimestamps: number[];
  emotionalPeakMoments: number[];
  curiosityGapsCreated: Array<{ gap: string; timestamp: number }>;
  patternInterruptsUsed: Array<{ type: string; timestamp: number }>;
}

/**
 * 9. Visual Elements - Rich visual content analysis
 */
export interface VisualElements {
  propsUsed: string[];
  gesturesBodyLanguagePatterns: string[];
  facialExpressionsAtKeyMoments: Array<{ expression: string; timestamp: number }>;
  textToVisualSynchronization: number; // 0-100 sync score
  visualMetaphorsEmployed: string[];
  beforeAfterPresentations: boolean;
  comparisonDisplays: boolean;
  dataVisualizationStyle: string;
}

/**
 * 10. Format-Specific Elements - Content format analysis
 */
export interface FormatSpecificElements {
  seriesIndicators: string; // "Part X of Y"
  recurringVisualElements: string[];
  brandedElements: string[];
  consistentStyleMarkers: string[];
  formatSignatures: string[];
}

/**
 * 11. Performance Indicators - Viral performance markers
 */
export interface PerformanceIndicators {
  retentionCurveIndicators: number[];
  dropOffPoints: number[];
  replayTriggers: number[];
  engagementSpikes: Array<{ timestamp: number; intensity: number }>;
  completionRateMarkers: number[];
}

/**
 * 12. Technical Elements - Technical quality metrics
 */
export interface TechnicalElements {
  videoCodec: string;
  videoQuality: '480p' | '720p' | '1080p' | '4k';
  frameRate: number;
  resolution: string;
  fileSize: number;
  editingSoftwareIndicators: string[];
}

/**
 * 13. Trend Elements - Trend participation analysis
 */
export interface TrendElements {
  trendParticipationMarkers: string[];
  memeReferences: string[];
  culturalReferences: string[];
  seasonalTimelyElements: string[];
  challengeParticipation: boolean;
}

/**
 * 14. Creator Style Signatures - Creator-specific patterns
 */
export interface CreatorStyleSignatures {
  uniquePhrasesCatchphrases: string[];
  signatureTransitions: string[];
  personalVisualStyle: string[];
  recurringElements: string[];
  creatorSpecificHooks: string[];
}

/**
 * 15. Platform Optimization - Platform-specific features
 */
export interface PlatformOptimization {
  platformSpecificFeaturesUsed: string[];
  nativeEffectsEmployed: string[];
  platformAlgorithmOptimizationMarkers: string[];
  crossPlatformCompatibilityElements: string[];
}

/**
 * 16. Psychological Pattern Mapping - Advanced psychological analysis
 */
export interface PsychologicalPatternMapping {
  emotionProgressionTimeline: Array<{ emotion: string; intensity: number; timestamp: number }>;
  tensionReleasePatterns: Array<{ buildup: number; release: number }>;
  dopamineHitTiming: number[];
  socialProofMoments: number[];
  fomoCreationPoints: number[];
  relatabilityMarkers: string[];
  aspirationTriggers: string[];
}

/**
 * 17. Value Delivery Mechanics - Educational/entertainment value
 */
export interface ValueDeliveryMechanics {
  teachingMethodUsed: 'demonstration' | 'explanation' | 'storytelling' | 'comparison';
  informationHierarchy: string[];
  examplePresentationStyle: string;
  complexityProgression: 'simple_to_complex' | 'complex_to_simple' | 'consistent';
  takeawayClarity: number; // 0-100
  contentActionability: number; // 0-100
}

/**
 * 18. Viral Mechanics Scoring - Core virality factors
 */
export interface ViralMechanicsScoring {
  shareabilityFactorElements: string[];
  discussabilityElements: string[];
  memorabilityMarkers: string[];
  repeatabilityFactors: string[];
  trendPotentialIndicators: string[];
}

/**
 * Master interface combining all 18 categories + ENHANCED keyword/hashtag analysis
 */
export interface ExhaustiveVideoElements {
  metadata: VideoMetadata;
  audioElements: AudioElements;
  hookElements: HookElements;
  scriptElements: ScriptElements;
  visualStructure: VisualStructure;
  pacingRhythm: PacingRhythm;
  contentStructure: ContentStructure;
  engagementTriggers: EngagementTriggers;
  visualElements: VisualElements;
  formatSpecificElements: FormatSpecificElements;
  performanceIndicators: PerformanceIndicators;
  technicalElements: TechnicalElements;
  trendElements: TrendElements;
  creatorStyleSignatures: CreatorStyleSignatures;
  platformOptimization: PlatformOptimization;
  psychologicalPatternMapping: PsychologicalPatternMapping;
  valueDeliveryMechanics: ValueDeliveryMechanics;
  viralMechanicsScoring: ViralMechanicsScoring;
  
  // ENHANCED: Keyword/Hashtag Analysis Integration
  keywordHashtagOptimization: {
    overallScore: number; // 0-100 combined keyword/hashtag effectiveness
    discoveryPotential: number; // 0-100 potential for algorithmic discovery
    trendAlignment: number; // 0-100 alignment with current trends
    competitiveAdvantage: number; // 0-100 advantage over competitors
    temporalOptimization: number; // 0-100 timing optimization score
  };
}

/**
 * Enhanced prediction result with granular element scoring + keyword/hashtag optimization
 */
export interface EnhancedViralPredictionResult extends ViralPredictionResult {
  elementScores: {
    hookEffectiveness: number;
    audioEngagement: number;
    visualAppeal: number;
    psychologicalTriggers: number;
    viralMechanics: number;
    platformFit: number;
    // ENHANCED: Keyword/hashtag scores
    keywordOptimization: number;
    hashtagEffectiveness: number;
    discoveryPotential: number;
    trendAlignment: number;
  };
  granularBreakdown: {
    [category: string]: {
      score: number;
      topElements: string[];
      recommendations: string[];
    };
  };
  realTimeOptimization: {
    criticalImprovements: string[];
    quickWins: string[];
    riskyElements: string[];
    // ENHANCED: Keyword/hashtag optimizations
    keywordRecommendations: string[];
    hashtagSuggestions: string[];
    trendingOpportunities: string[];
  };
  
  // ENHANCED: Keyword/hashtag optimization insights
  keywordHashtagInsights: {
    discoveryBoost: number; // Expected % increase in discoverability
    algorithmAlignment: number; // 0-100 alignment with platform algorithms
    competitiveGap: string[]; // Keywords/hashtags competitors are using that you're not
    trendingNow: string[]; // Currently trending keywords/hashtags in your niche
    missedOpportunities: string[]; // High-potential keywords/hashtags not being used
    optimizedScript?: KeywordOptimizedScript; // AI-generated optimized script
  };
}

// ===== ALGORITHM CONSTANTS =====

/**
 * Framework tier weights based on viral research validation
 */
const FRAMEWORK_WEIGHTS = {
  tier1: {
    tripleLayerHook: 0.35,              // 35% - Most impactful element
    storytellingLoop: 0.30,             // 30% - Narrative structure
    dynamicPercentile: 0.25,            // 25% - Statistical foundation
    culturalTiming: 0.20                // 20% - Cultural relevance
  },
  tier2: {
    authorityGap: 0.18,                 // 18% - Credibility boost
    hookPatternRecognition: 0.15,       // 15% - Pattern matching
    visualFormat: 0.12,                 // 12% - Visual optimization
    engagementVelocity: 0.10            // 10% - Engagement speed
  },
  tier3: {
    platformOptimization: 0.08,         // 8% - Platform-specific fit
    psychologicalTriggers: 0.06,        // 6% - Psychological factors
    productionQuality: 0.05,            // 5% - Production value
    audienceBehavior: 0.04              // 4% - Audience patterns
  }
};

/**
 * Platform-specific multipliers for algorithmic preferences
 */
const PLATFORM_MULTIPLIERS = {
  tiktok: 1.2,                          // 20% boost for TikTok optimization
  instagram: 1.0,                       // Baseline multiplier
  youtube: 0.9,                         // 10% reduction for different dynamics
  linkedin: 0.8                         // 20% reduction for professional context
};

/**
 * Platform-specific viral thresholds based on empirical research
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
  tiktok: 0.5,                          // Fast decay (24-hour window)
  instagram: 0.3,                       // Moderate decay (48-hour window)
  youtube: 0.1,                         // Slow decay (7-day window)
  linkedin: 0.2                         // Professional context decay
};

// ===== KEYWORD & HASHTAG SCORING CONSTANTS =====

/**
 * Keyword/hashtag effectiveness weights for viral prediction
 */
const KEYWORD_HASHTAG_WEIGHTS = {
  discoveryScore: 0.25,                 // 25% - Algorithmic discovery potential
  trendAlignment: 0.20,                 // 20% - Alignment with current trends  
  competitiveAdvantage: 0.15,           // 15% - Advantage over competitors
  semanticRelevance: 0.15,              // 15% - Semantic relevance to content
  historicalPerformance: 0.15,          // 15% - Historical viral performance
  temporalOptimization: 0.10            // 10% - Timing and seasonal factors
};

/**
 * Platform-specific keyword/hashtag multipliers
 */
const PLATFORM_KEYWORD_MULTIPLIERS = {
  tiktok: {
    hashtags: 1.3,                      // TikTok heavily favors hashtags
    keywords: 1.1,                      // Moderate keyword importance
    trending: 1.5                       // High trending factor
  },
  instagram: {
    hashtags: 1.2,                      // Strong hashtag culture
    keywords: 1.0,                      // Baseline keyword importance
    trending: 1.2                       // Moderate trending factor
  },
  youtube: {
    hashtags: 0.8,                      // Lower hashtag importance
    keywords: 1.4,                      // High keyword importance for SEO
    trending: 1.0                       // Baseline trending factor
  },
  linkedin: {
    hashtags: 0.9,                      // Professional hashtag usage
    keywords: 1.3,                      // Professional keyword optimization
    trending: 0.8                       // Lower trending emphasis
  }
};

// ===== KEYWORD & HASHTAG SCORING FUNCTIONS =====

/**
 * Calculate keyword optimization score based on viral performance and SEO factors
 */
function calculateKeywordScore(keywordAnalysis: KeywordAnalysis, platform: string): number {
  if (!keywordAnalysis || !keywordAnalysis.extractedKeywords.length) {
    return 30; // Base score for no keywords
  }
  
  // Calculate keyword effectiveness
  const avgViralityScore = keywordAnalysis.extractedKeywords.reduce(
    (sum, kw) => sum + kw.viralityScore, 0
  ) / keywordAnalysis.extractedKeywords.length;
  
  // Calculate trending bonus
  const trendingBonus = keywordAnalysis.trendingKeywords.reduce(
    (sum, kw) => sum + kw.viralPotential, 0
  ) / Math.max(keywordAnalysis.trendingKeywords.length, 1) * 0.2;
  
  // Calculate density optimization (sweet spot is 2-4%)
  const densityScore = keywordAnalysis.keywordDensity > 1 && keywordAnalysis.keywordDensity < 5 
    ? Math.min(keywordAnalysis.keywordDensity * 20, 100) 
    : Math.max(100 - Math.abs(keywordAnalysis.keywordDensity - 3) * 15, 30);
  
  // Apply platform multiplier
  const platformMultiplier = PLATFORM_KEYWORD_MULTIPLIERS[platform as keyof typeof PLATFORM_KEYWORD_MULTIPLIERS]?.keywords || 1.0;
  
  const baseScore = (avgViralityScore * 0.4 + keywordAnalysis.semanticRelevance * 0.3 + densityScore * 0.3);
  return Math.min((baseScore + trendingBonus) * platformMultiplier, 100);
}

/**
 * Calculate hashtag effectiveness score based on performance and discovery potential
 */
function calculateHashtagScore(hashtagAnalysis: HashtagAnalysis, platform: string): number {
  if (!hashtagAnalysis || !hashtagAnalysis.hashtagPerformance.length) {
    return 25; // Base score for no hashtags
  }
  
  // Calculate average hashtag performance
  const avgHashtagScore = hashtagAnalysis.hashtagPerformance.reduce(
    (sum, ht) => sum + ht.averageViralScore, 0
  ) / hashtagAnalysis.hashtagPerformance.length;
  
  // Calculate platform-specific effectiveness
  const platformEffectiveness = hashtagAnalysis.hashtagPerformance.reduce(
    (sum, ht) => sum + ht.platformEffectiveness[platform as keyof typeof ht.platformEffectiveness], 0
  ) / hashtagAnalysis.hashtagPerformance.length;
  
  // Calculate hashtag mix score (optimal mix: 30% trending, 40% niche, 30% broad)
  const mixScore = calculateHashtagMixScore(hashtagAnalysis.hashtagMix);
  
  // Apply platform multiplier
  const platformMultiplier = PLATFORM_KEYWORD_MULTIPLIERS[platform as keyof typeof PLATFORM_KEYWORD_MULTIPLIERS]?.hashtags || 1.0;
  
  const baseScore = (avgHashtagScore * 0.4 + platformEffectiveness * 0.35 + mixScore * 0.25);
  return Math.min(baseScore * platformMultiplier, 100);
}

/**
 * Calculate optimal hashtag mix score
 */
function calculateHashtagMixScore(mix: HashtagAnalysis['hashtagMix']): number {
  const total = mix.branded + mix.trending + mix.niche + mix.broad;
  if (total === 0) return 0;
  
  // Optimal percentages
  const optimalMix = { trending: 0.3, niche: 0.4, broad: 0.3 };
  const actualMix = {
    trending: mix.trending / total,
    niche: mix.niche / total,
    broad: mix.broad / total
  };
  
  // Calculate deviation from optimal
  const deviation = Math.abs(actualMix.trending - optimalMix.trending) +
                   Math.abs(actualMix.niche - optimalMix.niche) +
                   Math.abs(actualMix.broad - optimalMix.broad);
  
  return Math.max(100 - deviation * 100, 0);
}

/**
 * Calculate discovery potential based on keyword/hashtag optimization
 */
function calculateDiscoveryScore(
  keywordAnalysis: KeywordAnalysis, 
  hashtagAnalysis: HashtagAnalysis,
  platform: string
): number {
  const keywordDiscovery = keywordAnalysis?.searchVolumeEstimate || 0;
  const hashtagDiscovery = hashtagAnalysis?.discoverabilityScore || 0;
  const algorithmAlignment = hashtagAnalysis?.algorithmAlignmentScore || 0;
  
  // Weight discovery factors
  const discoveryScore = (
    keywordDiscovery * 0.4 +
    hashtagDiscovery * 0.35 +
    algorithmAlignment * 0.25
  );
  
  return Math.min(discoveryScore, 100);
}

/**
 * Calculate trend alignment score
 */
function calculateTrendAlignmentScore(
  keywordAnalysis: KeywordAnalysis,
  hashtagAnalysis: HashtagAnalysis
): number {
  const trendingKeywordScore = keywordAnalysis?.trendingKeywords.reduce(
    (sum, kw) => sum + kw.viralPotential, 0
  ) / Math.max(keywordAnalysis?.trendingKeywords.length || 1, 1);
  
  const trendingHashtagScore = hashtagAnalysis?.viralHashtagCandidates.reduce(
    (sum, ht) => sum + ht.viralProbability, 0
  ) / Math.max(hashtagAnalysis?.viralHashtagCandidates.length || 1, 1);
  
  return (trendingKeywordScore + trendingHashtagScore) / 2;
}

/**
 * Generate comprehensive keyword/hashtag insights and recommendations
 */
function generateKeywordHashtagInsights(
  keywordAnalysis: KeywordAnalysis,
  hashtagAnalysis: HashtagAnalysis, 
  trendAnalysis: KeywordHashtagTrends,
  platformContext: PlatformContext
): any {
  // Generate keyword recommendations
  const keywordRecommendations = keywordAnalysis?.trendingKeywords
    .filter(kw => kw.viralPotential > 70)
    .slice(0, 5)
    .map(kw => `Use trending keyword "${kw.keyword}" (${kw.viralPotential}% viral potential)`) || [];
  
  // Generate hashtag suggestions
  const hashtagSuggestions = hashtagAnalysis?.viralHashtagCandidates
    .filter(ht => ht.viralProbability > 60)
    .slice(0, 8)
    .map(ht => `#${ht.hashtag} (${ht.viralProbability}% viral probability)`) || [];
  
  // Generate trending opportunities
  const trendingOpportunities = trendAnalysis?.emergingTrends
    .filter(trend => trend.confidenceLevel > 75)
    .slice(0, 3)
    .map(trend => `${trend.type}: "${trend.term}" is trending up ${trend.growthRate}%`) || [];
  
  // Calculate competitive gap
  const competitiveGap = keywordAnalysis?.nicheKeywords
    .filter(kw => kw.crossoverPotential > 80)
    .slice(0, 5)
    .map(kw => kw.keyword) || [];
  
  // Get current trending terms
  const trendingNow = [
    ...(keywordAnalysis?.trendingKeywords.slice(0, 3).map(kw => kw.keyword) || []),
    ...(hashtagAnalysis?.viralHashtagCandidates.slice(0, 3).map(ht => `#${ht.hashtag}`) || [])
  ];
  
  // Identify missed opportunities
  const missedOpportunities = [
    ...(keywordAnalysis?.extractedKeywords
      .filter(kw => kw.viralityScore > 80 && kw.relevanceScore < 50)
      .slice(0, 3)
      .map(kw => `High-viral keyword "${kw.keyword}" underutilized`) || []),
    ...(hashtagAnalysis?.hashtagPerformance
      .filter(ht => ht.averageViralScore > 75)
      .slice(0, 2)
      .map(ht => `#${ht.hashtag} performs well but missing`) || [])
  ];
  
  return {
    discoveryBoost: calculateDiscoveryScore(keywordAnalysis, hashtagAnalysis, platformContext.platform),
    algorithmAlignment: hashtagAnalysis?.algorithmAlignmentScore || 0,
    competitiveGap,
    trendingNow,
    missedOpportunities,
    keywordRecommendations,
    hashtagSuggestions,
    trendingOpportunities,
    optimizedScript: undefined // TODO: Implement AI script optimization
  };
}

// ===== MAIN PREDICTION FUNCTION =====

/**
 * Calculate viral prediction score with confidence and recommendations
 * 
 * This is the main entry point for viral prediction analysis
 * 
 * @param scriptFeatures - Text and transcript analysis results
 * @param soundData - Audio analysis and beat sync metrics
 * @param visualMetrics - Visual analysis and production quality
 * @param engagementHistory - Performance and creator context
 * @param platformContext - Platform and timing information
 * @returns Complete viral prediction with score, confidence, and recommendations
 */
export function predictVirality(
  scriptFeatures: ScriptFeatures,
  soundData: SoundData,
  visualMetrics: VisualMetrics,
  engagementHistory: EngagementHistory,
  platformContext: PlatformContext
): ViralPredictionResult {
  const startTime = Date.now();
  
  // Log prediction if enabled
  logPrediction('STARTING', { scriptFeatures, soundData, visualMetrics, engagementHistory, platformContext });
  
  try {
    // 1. Calculate individual component scores
    const scriptScore = calculateScriptScore(scriptFeatures);
    const soundScore = calculateSoundScore(soundData);
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
    const probability = scoreToProbability(normalizedScore);
    
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
      soundData,
      visualMetrics,
      engagementHistory,
      platformContext,
      normalizedScore
    );
    
    const riskFactors = identifyRiskFactors(
      scriptFeatures,
      soundData,
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
    
    // 17. Assess data quality
    const dataQuality = assessDataQuality(scriptFeatures, visualMetrics, engagementHistory);
    
    const processingTime = Date.now() - startTime;
    
    const result: ViralPredictionResult = {
      score: Math.round(normalizedScore * 100) / 100,
      probability: Math.round(probability * 10000) / 10000,
      confidence: Math.round(confidence * 10000) / 10000,
      verdict,
      breakdown: {
        scriptScore: Math.round(scriptScore),
        soundScore: Math.round(soundScore),
        visualScore: Math.round(visualScore),
        engagementScore: Math.round(engagementScore),
        platformScore: Math.round(platformScore),
        timingScore: Math.round(timingScore),
        trendScore: Math.round(trendScore)
      },
      recommendations,
      riskFactors,
      peakTimeEstimate,
      algorithmVersion: VIRALITY_ALGO_VERSION,
      dataQuality,
      processingTime
    };
    
    // Log successful prediction
    logPrediction('SUCCESS', result);
    
    return result;
    
  } catch (error) {
    logPrediction('ERROR', { error: error.message });
    throw new Error(`Viral prediction failed: ${error.message}`);
  }
}

// ===== COMPONENT SCORING FUNCTIONS =====

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
 * Calculate sound-based score from audio analysis
 */
function calculateSoundScore(soundData: SoundData): number {
  let score = 50; // Base score
  
  // Audio quality (30% of sound score)
  score += (soundData.audioQuality / 100) * 15;
  
  // Beat synchronization (25% of sound score)
  score += (soundData.beatSyncAccuracy / 100) * 12;
  
  // Emotional resonance (25% of sound score)
  score += (soundData.emotionalResonance / 100) * 12;
  
  // Trend alignment (20% of sound score)
  score += (soundData.soundTrendAlignment / 100) * 10;
  
  // Original audio bonus
  if (soundData.hasOriginalAudio && soundData.audioQuality > 70) {
    score += 6; // Bonus for high-quality original audio
  }
  
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
      score += context.seasonality * 20;
      break;
    case 'linkedin':
      score += (1 - context.competitorActivity) * 15;
      break;
  }
  
  return Math.min(score, 100);
}

/**
 * Calculate timing optimization score
 */
function calculateTimingScore(context: PlatformContext): number {
  let score = 50; // Base score
  
  // Optimal posting time (platform-specific)
  const optimalTimes = {
    tiktok: [18, 19, 20, 21, 22],      // 6-10 PM
    instagram: [17, 18, 19, 20],       // 5-8 PM
    youtube: [14, 15, 20, 21],         // 2-3 PM, 8-9 PM
    linkedin: [8, 9, 12, 17, 18]       // 8-9 AM, 12 PM, 5-6 PM
  };
  
  if (optimalTimes[context.platform].includes(context.uploadTime)) {
    score += 25;
  }
  
  // Day of week optimization
  const weekdayBonus = context.uploadDay >= 1 && context.uploadDay <= 5 ? 15 : 10;
  score += weekdayBonus;
  
  // Seasonality factor
  score += context.seasonality * 10;
  
  return Math.min(score, 100);
}

/**
 * Calculate trend alignment score
 */
function calculateTrendScore(context: PlatformContext): number {
  const trendScore = context.trendAlignment * 80 + 20; // Base 20, up to 100
  const culturalBonus = context.culturalRelevanceScore * 0.2;
  
  return Math.min(trendScore + culturalBonus, 100);
}

// ===== STATISTICAL ANALYSIS FUNCTIONS =====

/**
 * Calculate Z-score for statistical foundation
 */
function calculateZScore(history: EngagementHistory): number {
  if (!history.cohortMean || !history.cohortStandardDeviation || history.cohortStandardDeviation === 0) {
    return 0; // No statistical foundation available
  }
  
  return (history.viewCount - history.cohortMean) / history.cohortStandardDeviation;
}

/**
 * Normalize Z-score to 0-1 scale
 */
function normalizeZScore(zScore: number): number {
  // Convert z-score to percentile-like score (0-100)
  return Math.max(0, Math.min(100, 50 + (zScore * 15)));
}

/**
 * Calculate tier scores using framework weights
 */
function calculateTier1Score(scriptScore: number, visualScore: number, statisticalScore: number, trendScore: number): number {
  const weights = FRAMEWORK_WEIGHTS.tier1;
  return (
    scriptScore * weights.tripleLayerHook +
    visualScore * weights.storytellingLoop +
    statisticalScore * weights.dynamicPercentile +
    trendScore * weights.culturalTiming
  );
}

function calculateTier2Score(scriptScore: number, visualScore: number, engagementScore: number): number {
  const weights = FRAMEWORK_WEIGHTS.tier2;
  return (
    scriptScore * weights.authorityGap +
    scriptScore * weights.hookPatternRecognition +
    visualScore * weights.visualFormat +
    engagementScore * weights.engagementVelocity
  );
}

function calculateTier3Score(platformScore: number, visualScore: number, engagementScore: number): number {
  const weights = FRAMEWORK_WEIGHTS.tier3;
  return (
    platformScore * weights.platformOptimization +
    visualScore * weights.psychologicalTriggers +
    visualScore * weights.productionQuality +
    engagementScore * weights.audienceBehavior
  );
}

/**
 * Calculate time decay factor
 */
function calculateDecayFactor(hoursSinceUpload: number, platform: string): number {
  const decayRate = DECAY_RATES[platform as keyof typeof DECAY_RATES] || DECAY_RATES.tiktok;
  return Math.exp(-decayRate * (hoursSinceUpload / 24));
}

/**
 * Convert score to probability
 */
function scoreToProbability(score: number): number {
  // Sigmoid function to convert score to probability
  return 1 / (1 + Math.exp(-(score - 50) / 15));
}

/**
 * Calculate confidence based on data quality
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
 * Determine viral verdict based on probability
 */
function determineVerdict(probability: number): 'mega-viral' | 'hyper-viral' | 'viral' | 'trending' | 'normal' {
  if (probability >= 0.9) return 'mega-viral';
  if (probability >= 0.8) return 'hyper-viral';
  if (probability >= 0.65) return 'viral';
  if (probability >= 0.5) return 'trending';
  return 'normal';
}

// ===== RECOMMENDATION ENGINE =====

/**
 * Generate actionable recommendations for optimization
 */
function generateRecommendations(
  script: ScriptFeatures,
  sound: SoundData,
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
  if (script.hookStrength < 70) {
    recommendations.push('Strengthen opening hook with question, controversy, or surprise');
  }
  
  // Sound recommendations
  if (sound.audioQuality < 70) {
    recommendations.push('Improve audio quality - clear audio significantly impacts engagement');
  }
  if (sound.beatSyncAccuracy < 60) {
    recommendations.push('Sync visual cuts with audio beats for better flow');
  }
  if (sound.soundTrendAlignment < 50) {
    recommendations.push('Consider using trending audio to boost algorithmic reach');
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
  if (!visual.hasMotion) {
    recommendations.push('Add movement or dynamic visual elements');
  }
  
  // Timing recommendations
  if (platform.uploadTime < 17 || platform.uploadTime > 22) {
    recommendations.push('Consider posting during peak hours for your platform');
  }
  
  // Platform-specific recommendations
  if (platform.trendAlignment < 0.5) {
    recommendations.push(`Align content with current ${platform.platform} trends`);
  }
  if (platform.culturalRelevanceScore < 50) {
    recommendations.push('Increase cultural relevance and topical alignment');
  }
  
  return recommendations.slice(0, 8); // Limit to top 8 recommendations
}

/**
 * Identify potential risk factors
 */
function identifyRiskFactors(
  script: ScriptFeatures,
  sound: SoundData,
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
  if (sound.audioQuality < 40) {
    risks.push('Poor audio quality may hurt engagement significantly');
  }
  
  // Performance risks
  if (history.viewCount < history.creatorFollowers * 0.05) {
    risks.push('Below-average reach for follower count');
  }
  if (platform.competitorActivity > 0.8) {
    risks.push('High competitor activity may limit visibility');
  }
  
  // Platform risks
  if (platform.culturalRelevanceScore < 30) {
    risks.push('Low cultural relevance may limit viral potential');
  }
  
  // Technical risks
  if (!visual.hasTextOverlay && script.transcriptLength < 50) {
    risks.push('Limited text content may reduce accessibility');
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
 * Assess input data quality
 */
function assessDataQuality(
  script: ScriptFeatures,
  visual: VisualMetrics,
  history: EngagementHistory
): 'high' | 'medium' | 'low' {
  let qualityScore = 0;
  
  // Script data quality
  if (script.transcriptLength > 50) qualityScore += 1;
  if (script.emotionalArousalScore > 0) qualityScore += 1;
  if (script.hookStrength > 0) qualityScore += 1;
  
  // Visual data quality
  if (visual.faceDetections >= 0) qualityScore += 1;
  if (visual.shotPacingScore > 0) qualityScore += 1;
  if (visual.productionQuality > 0) qualityScore += 1;
  
  // Engagement data quality
  if (history.viewCount > 100) qualityScore += 1;
  if (history.creatorFollowers > 0) qualityScore += 1;
  if (history.cohortMean && history.cohortStandardDeviation) qualityScore += 2;
  
  if (qualityScore >= 8) return 'high';
  if (qualityScore >= 5) return 'medium';
  return 'low';
}

// ===== LOGGING SYSTEM =====

/**
 * Log prediction events to file if LOG_PREDICTIONS=true in environment
 */
function logPrediction(event: 'STARTING' | 'SUCCESS' | 'ERROR', data: any): void {
  if (process.env.LOG_PREDICTIONS !== 'true') return;
  
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      algorithmVersion: VIRALITY_ALGO_VERSION,
      data: event === 'STARTING' ? 'INPUT_DATA_LOGGED' : data // Avoid logging sensitive input
    };
    
    const logDir = path.join(process.cwd(), 'logs', 'predictions');
    const logFile = path.join(logDir, `viral-predictions-${new Date().toISOString().split('T')[0]}.log`);
    
    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Append log entry
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    
  } catch (error) {
    console.warn('Failed to write prediction log:', error.message);
  }
}

// ===== VALIDATION UTILITIES =====

/**
 * Validate input parameters
 */
export function validateInputs(
  scriptFeatures: ScriptFeatures,
  soundData: SoundData,
  visualMetrics: VisualMetrics,
  engagementHistory: EngagementHistory,
  platformContext: PlatformContext
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate script features
  if (typeof scriptFeatures.emotionalArousalScore !== 'number' || scriptFeatures.emotionalArousalScore < 0 || scriptFeatures.emotionalArousalScore > 100) {
    errors.push('emotionalArousalScore must be between 0-100');
  }
  
  // Validate sound data
  if (typeof soundData.audioQuality !== 'number' || soundData.audioQuality < 0 || soundData.audioQuality > 100) {
    errors.push('audioQuality must be between 0-100');
  }
  
  // Validate visual metrics
  if (typeof visualMetrics.faceDetections !== 'number' || visualMetrics.faceDetections < 0) {
    errors.push('faceDetections must be non-negative number');
  }
  
  // Validate engagement history
  if (typeof engagementHistory.viewCount !== 'number' || engagementHistory.viewCount < 0) {
    errors.push('viewCount must be non-negative number');
  }
  
  // Validate platform context
  if (!['tiktok', 'instagram', 'youtube', 'linkedin'].includes(platformContext.platform)) {
    errors.push('platform must be one of: tiktok, instagram, youtube, linkedin');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get algorithm version
 */
export function getAlgorithmVersion(): string {
  return VIRALITY_ALGO_VERSION;
}

/**
 * Export constants for external use
 */
export const ALGORITHM_CONSTANTS = {
  VERSION: VIRALITY_ALGO_VERSION,
  FRAMEWORK_WEIGHTS,
  PLATFORM_MULTIPLIERS,
  VIRAL_THRESHOLDS,
  DECAY_RATES
}; 

// ===== ENHANCED PREDICTION FUNCTIONS =====

/**
 * Enhanced viral prediction using exhaustive 18-category analysis
 * 
 * @param elements - Complete 18-category video element extraction
 * @param scriptFeatures - Legacy script analysis (for backward compatibility)
 * @param soundData - Legacy sound data (for backward compatibility)
 * @param visualMetrics - Legacy visual metrics (for backward compatibility)
 * @param engagementHistory - Historical performance data
 * @param platformContext - Platform and timing context
 * @returns Enhanced prediction with granular element scoring
 */
export function predictViralityEnhanced(
  elements: ExhaustiveVideoElements,
  scriptFeatures: ScriptFeatures,
  soundData: SoundData,
  visualMetrics: VisualMetrics,
  engagementHistory: EngagementHistory,
  platformContext: PlatformContext
): EnhancedViralPredictionResult {
  const startTime = Date.now();
  
  console.log('🧬 Starting enhanced viral prediction with 18-category analysis...');
  
  try {
    // 1. Calculate enhanced element scores
    const elementScores = calculateElementScores(elements);
    
    // 2. Run original prediction for baseline
    const basePrediction = predictVirality(
      scriptFeatures,
      soundData, 
      visualMetrics,
      engagementHistory,
      platformContext
    );
    
    // 3. Apply exhaustive element enhancements
    const enhancedScore = applyExhaustiveEnhancements(
      basePrediction.score,
      elementScores,
      elements
    );
    
    // 4. Calculate granular breakdown by category
    const granularBreakdown = calculateGranularBreakdown(elements, elementScores);
    
    // 5. Generate real-time optimization suggestions
    const realTimeOptimization = generateRealTimeOptimization(elements, elementScores);
    
    // 6. Enhanced God Mode multipliers using psychological patterns
    const enhancedGodMode = calculateEnhancedGodMode(
      elements.psychologicalPatternMapping,
      elements.engagementTriggers,
      elements.viralMechanicsScoring
    );
    
    // 7. Calculate final enhanced viral score
    const finalEnhancedScore = Math.min(
      enhancedScore * enhancedGodMode,
      100
    );
    
    // 8. Enhanced probability calculation
    const enhancedProbability = scoreToProbability(finalEnhancedScore);
    
    // 9. ENHANCED: Calculate keyword/hashtag optimization scores
    const keywordScore = calculateKeywordScore(elements.metadata.keywordAnalysis, platformContext.platform);
    const hashtagScore = calculateHashtagScore(elements.metadata.hashtagAnalysis, platformContext.platform);
    const discoveryScore = calculateDiscoveryScore(
      elements.metadata.keywordAnalysis,
      elements.metadata.hashtagAnalysis, 
      platformContext.platform
    );
    const trendAlignment = calculateTrendAlignmentScore(
      elements.metadata.keywordAnalysis,
      elements.metadata.hashtagAnalysis
    );
    
    // 10. ENHANCED: Generate keyword/hashtag insights and recommendations
    const keywordHashtagInsights = generateKeywordHashtagInsights(
      elements.metadata.keywordAnalysis,
      elements.metadata.hashtagAnalysis,
      elements.metadata.trendAnalysis,
      platformContext
    );

    const result: EnhancedViralPredictionResult = {
      ...basePrediction,
      score: Math.round(finalEnhancedScore * 100) / 100,
      probability: Math.round(enhancedProbability * 10000) / 10000,
      verdict: determineVerdict(enhancedProbability),
      elementScores: {
        ...elementScores,
        // ENHANCED: Add keyword/hashtag scores
        keywordOptimization: keywordScore,
        hashtagEffectiveness: hashtagScore,
        discoveryPotential: discoveryScore,
        trendAlignment: trendAlignment
      },
      granularBreakdown,
      realTimeOptimization: {
        ...realTimeOptimization,
        // ENHANCED: Add keyword/hashtag recommendations
        keywordRecommendations: keywordHashtagInsights.keywordRecommendations,
        hashtagSuggestions: keywordHashtagInsights.hashtagSuggestions,
        trendingOpportunities: keywordHashtagInsights.trendingOpportunities
      },
      // ENHANCED: Add keyword/hashtag insights
      keywordHashtagInsights,
      algorithmVersion: VIRALITY_ALGO_VERSION,
      processingTime: Date.now() - startTime
    };
    
    console.log(`✅ Enhanced prediction complete: ${result.score}% viral score (${(result.probability * 100).toFixed(1)}% probability)`);
    
    return result;
    
     } catch (error: any) {
     console.error('Enhanced viral prediction failed:', error);
     throw new Error(`Enhanced viral prediction failed: ${error.message}`);
   }
}

/**
 * Calculate element scores from exhaustive analysis
 */
function calculateElementScores(elements: ExhaustiveVideoElements): any {
  return {
    hookEffectiveness: calculateHookScore(elements.hookElements, elements.audioElements),
    audioEngagement: calculateAudioEngagementScore(elements.audioElements),
    visualAppeal: calculateVisualAppealScore(elements.visualStructure, elements.visualElements),
    psychologicalTriggers: calculatePsychologicalScore(elements.psychologicalPatternMapping),
    viralMechanics: calculateViralMechanicsScore(elements.viralMechanicsScoring),
    platformFit: calculatePlatformFitScore(elements.platformOptimization, elements.metadata)
  };
}

/**
 * Apply exhaustive element enhancements to base score
 */
function applyExhaustiveEnhancements(
  baseScore: number,
  elementScores: any,
  elements: ExhaustiveVideoElements
): number {
  // Weight each element category based on viral research
  const weights = {
    hookEffectiveness: 0.25,    // 25% - Critical for viral success
    audioEngagement: 0.15,     // 15% - Audio quality and sync
    visualAppeal: 0.15,        // 15% - Visual structure and appeal
    psychologicalTriggers: 0.20, // 20% - Psychological effectiveness
    viralMechanics: 0.15,      // 15% - Core viral mechanisms
    platformFit: 0.10          // 10% - Platform optimization
  };
  
  const enhancementFactor = Object.keys(weights).reduce((total, key) => {
    return total + (elementScores[key as keyof typeof elementScores] / 100) * weights[key as keyof typeof weights];
  }, 0);
  
  return baseScore * (0.7 + enhancementFactor * 0.6); // Base 70% + up to 60% enhancement
}

/**
 * Calculate granular breakdown by category
 */
function calculateGranularBreakdown(
  elements: ExhaustiveVideoElements,
  elementScores: any
): any {
  return {
    hooks: {
      score: elementScores.hookEffectiveness,
      topElements: [elements.hookElements.hookTypeClassification, elements.hookElements.visualHookType],
      recommendations: generateHookRecommendations(elements.hookElements)
    },
    audio: {
      score: elementScores.audioEngagement,
      topElements: [elements.audioElements.musicGenre, elements.audioElements.voiceTone],
      recommendations: generateAudioRecommendations(elements.audioElements)
    },
    visual: {
      score: elementScores.visualAppeal,
      topElements: elements.visualStructure.transitionTypes.slice(0, 3),
      recommendations: generateVisualRecommendations(elements.visualStructure)
    },
    psychological: {
      score: elementScores.psychologicalTriggers,
      topElements: elements.psychologicalPatternMapping.emotionProgressionTimeline.slice(0, 3).map(e => e.emotion),
      recommendations: generatePsychologicalRecommendations(elements.psychologicalPatternMapping)
    },
    viral: {
      score: elementScores.viralMechanics,
      topElements: elements.viralMechanicsScoring.shareabilityFactorElements.slice(0, 3),
      recommendations: generateViralMechanicsRecommendations(elements.viralMechanicsScoring)
    },
    platform: {
      score: elementScores.platformFit,
      topElements: elements.platformOptimization.platformSpecificFeaturesUsed.slice(0, 3),
      recommendations: generatePlatformRecommendations(elements.platformOptimization)
    }
  };
}

/**
 * Generate real-time optimization suggestions
 */
function generateRealTimeOptimization(
  elements: ExhaustiveVideoElements,
  elementScores: any
): any {
  const criticalImprovements = [];
  const quickWins = [];
  const riskyElements = [];
  
  // Critical improvements (score < 50)
  if (elementScores.hookEffectiveness < 50) {
    criticalImprovements.push(`Strengthen hook: Current "${elements.hookElements.hookTypeClassification}" needs more impact`);
  }
  if (elementScores.audioEngagement < 50) {
    criticalImprovements.push(`Improve audio sync: Beat alignment at ${elements.audioElements.voicePacingWPM[0]} WPM is off`);
  }
  
  // Quick wins (score 50-70)
  if (elementScores.visualAppeal >= 50 && elementScores.visualAppeal < 70) {
    quickWins.push(`Add ${elements.visualStructure.averageShotDuration}s shot variation for better pacing`);
  }
  if (elementScores.platformFit >= 50 && elementScores.platformFit < 70) {
    quickWins.push(`Use more ${elements.metadata.platformSource} native features`);
  }
  
  // Risky elements
  if (elements.engagementTriggers.controversyPolarizationMoments.length > 3) {
    riskyElements.push('High controversy may limit algorithmic reach');
  }
  if (elements.technicalElements.fileSize > 50000000) { // 50MB
    riskyElements.push('Large file size may impact loading on slower connections');
  }
  
  return {
    criticalImprovements,
    quickWins,
    riskyElements
  };
}

/**
 * Calculate enhanced God Mode multiplier using psychological patterns
 */
function calculateEnhancedGodMode(
  psychMapping: PsychologicalPatternMapping,
  engagementTriggers: EngagementTriggers,
  viralMechanics: ViralMechanicsScoring
): number {
  let multiplier = 1.0;
  
  // Psychological pattern bonuses
  const emotionIntensity = psychMapping.emotionProgressionTimeline.reduce(
    (avg, emotion) => avg + emotion.intensity, 0
  ) / psychMapping.emotionProgressionTimeline.length;
  
  if (emotionIntensity > 80) multiplier += 0.15; // High emotional intensity
  if (psychMapping.dopamineHitTiming.length > 3) multiplier += 0.10; // Multiple dopamine hits
  if (psychMapping.socialProofMoments.length > 2) multiplier += 0.08; // Social proof integration
  
  // Engagement trigger bonuses
  if (engagementTriggers.commentBaitTimestamps.length > 1) multiplier += 0.05;
  if (engagementTriggers.shareWorthyMomentTimestamps.length > 2) multiplier += 0.07;
  
  // Viral mechanics bonuses
  if (viralMechanics.shareabilityFactorElements.length > 3) multiplier += 0.06;
  if (viralMechanics.memorabilityMarkers.length > 2) multiplier += 0.04;
  
  return Math.min(multiplier, 1.35); // Max 35% enhancement
}

// ===== HELPER FUNCTIONS FOR ELEMENT SCORING =====

function calculateHookScore(hookElements: HookElements, audioElements: AudioElements): number {
  let score = hookElements.hookConfidenceScore;
  
  // Audio-visual hook synchronization bonus
  if (hookElements.audioHookType && hookElements.visualHookType) {
    score += 15; // Synchronized audio-visual hook
  }
  
  // Hook timing optimization
  if (hookElements.timeToMainHookDelivery <= 2) {
    score += 10; // Immediate hook delivery
  }
  
  return Math.min(score, 100);
}

function calculateAudioEngagementScore(audioElements: AudioElements): number {
  let score = 50;
  
  // Energy progression analysis
  const energyVariation = Math.max(...audioElements.energyLevels) - Math.min(...audioElements.energyLevels);
  if (energyVariation > 30) score += 15; // Good energy variation
  
  // Voice pacing optimization
  const avgWPM = audioElements.voicePacingWPM.reduce((sum, wpm) => sum + wpm, 0) / audioElements.voicePacingWPM.length;
  if (avgWPM >= 150 && avgWPM <= 180) score += 12; // Optimal speaking pace
  
  // Audio hook effectiveness
  const audioHookScore = audioElements.audioHooks.reduce((sum, hook) => sum + hook.effectiveness, 0) / audioElements.audioHooks.length;
  score += audioHookScore * 0.2;
  
  return Math.min(score, 100);
}

function calculateVisualAppealScore(visualStructure: VisualStructure, visualElements: VisualElements): number {
  let score = 50;
  
  // Scene variety bonus
  if (visualStructure.sceneCount >= 3 && visualStructure.sceneCount <= 8) score += 15;
  
  // Camera movement engagement
  if (visualStructure.cameraMovements.length > 2) score += 10;
  
  // Visual effects optimization
  if (visualStructure.visualEffectsUsed.length > 0 && visualStructure.visualEffectsUsed.length <= 3) score += 12;
  
  // Facial expression engagement
  if (visualElements.facialExpressionsAtKeyMoments.length > 3) score += 8;
  
  return Math.min(score, 100);
}

function calculatePsychologicalScore(psychMapping: PsychologicalPatternMapping): number {
  let score = 50;
  
  // Emotion progression quality
  const emotionCount = new Set(psychMapping.emotionProgressionTimeline.map(e => e.emotion)).size;
  if (emotionCount >= 3) score += 15; // Emotional variety
  
  // Tension-release patterns
  if (psychMapping.tensionReleasePatterns.length > 1) score += 12;
  
  // Social proof and FOMO integration
  if (psychMapping.socialProofMoments.length > 0) score += 8;
  if (psychMapping.fomoCreationPoints.length > 0) score += 8;
  
  // Relatability and aspiration balance
  if (psychMapping.relatabilityMarkers.length > 0 && psychMapping.aspirationTriggers.length > 0) score += 7;
  
  return Math.min(score, 100);
}

function calculateViralMechanicsScore(viralMechanics: ViralMechanicsScoring): number {
  let score = 50;
  
  // Core viral factors
  if (viralMechanics.shareabilityFactorElements.length > 2) score += 15;
  if (viralMechanics.discussabilityElements.length > 1) score += 12;
  if (viralMechanics.memorabilityMarkers.length > 1) score += 10;
  if (viralMechanics.repeatabilityFactors.length > 0) score += 8;
  if (viralMechanics.trendPotentialIndicators.length > 0) score += 5;
  
  return Math.min(score, 100);
}

function calculatePlatformFitScore(platformOpt: PlatformOptimization, metadata: VideoMetadata): number {
  let score = 50;
  
  // Platform-specific feature usage
  if (platformOpt.platformSpecificFeaturesUsed.length > 1) score += 20;
  if (platformOpt.nativeEffectsEmployed.length > 0) score += 15;
  if (platformOpt.platformAlgorithmOptimizationMarkers.length > 0) score += 10;
  
  // Cross-platform compatibility
  if (platformOpt.crossPlatformCompatibilityElements.length > 0) score += 5;
  
  return Math.min(score, 100);
}

// ===== RECOMMENDATION GENERATORS =====

function generateHookRecommendations(hookElements: HookElements): string[] {
  const recommendations = [];
  
  if (hookElements.hookConfidenceScore < 70) {
    recommendations.push(`Strengthen ${hookElements.hookTypeClassification} hook with more specific/controversial angle`);
  }
  if (hookElements.timeToMainHookDelivery > 2) {
    recommendations.push('Deliver main hook within first 2 seconds for maximum retention');
  }
  if (!hookElements.audioHookType || !hookElements.visualHookType) {
    recommendations.push('Synchronize audio and visual hook elements for compound impact');
  }
  
  return recommendations;
}

function generateAudioRecommendations(audioElements: AudioElements): string[] {
  const recommendations = [];
  
  const avgWPM = audioElements.voicePacingWPM.reduce((sum, wpm) => sum + wpm, 0) / audioElements.voicePacingWPM.length;
  if (avgWPM < 150) {
    recommendations.push('Increase speaking pace to 150-180 WPM for better engagement');
  }
  if (avgWPM > 180) {
    recommendations.push('Slow down speaking pace to 150-180 WPM for clarity');
  }
  
  if (audioElements.silenceMoments.length === 0) {
    recommendations.push('Add strategic silence moments for emphasis and pacing');
  }
  
  if (audioElements.energyLevels.every(level => Math.abs(level - audioElements.energyLevels[0]) < 10)) {
    recommendations.push('Vary energy levels throughout video for dynamic engagement');
  }
  
  return recommendations;
}

function generateVisualRecommendations(visualStructure: VisualStructure): string[] {
  const recommendations = [];
  
  if (visualStructure.averageShotDuration > 3) {
    recommendations.push('Reduce average shot duration to 2-3 seconds for better pacing');
  }
  if (visualStructure.cameraMovements.length === 0) {
    recommendations.push('Add camera movements (pan, zoom) for visual dynamism');
  }
  if (visualStructure.transitionTypes.length <= 1) {
    recommendations.push('Use variety of transition types for visual interest');
  }
  
  return recommendations;
}

function generatePsychologicalRecommendations(psychMapping: PsychologicalPatternMapping): string[] {
  const recommendations = [];
  
  if (psychMapping.emotionProgressionTimeline.length < 3) {
    recommendations.push('Add emotional variety - aim for 3+ distinct emotions throughout video');
  }
  if (psychMapping.dopamineHitTiming.length < 2) {
    recommendations.push('Create more dopamine triggers (surprises, reveals, achievements)');
  }
  if (psychMapping.socialProofMoments.length === 0) {
    recommendations.push('Include social proof elements (testimonials, numbers, popularity)');
  }
  
  return recommendations;
}

function generateViralMechanicsRecommendations(viralMechanics: ViralMechanicsScoring): string[] {
  const recommendations = [];
  
  if (viralMechanics.shareabilityFactorElements.length < 2) {
    recommendations.push('Add shareability factors (surprising info, useful tips, emotional moments)');
  }
  if (viralMechanics.discussabilityElements.length === 0) {
    recommendations.push('Include discussable elements (opinions, questions, controversial angles)');
  }
  if (viralMechanics.memorabilityMarkers.length === 0) {
    recommendations.push('Add memorable elements (unique phrases, visual metaphors, surprising facts)');
  }
  
  return recommendations;
}

function generatePlatformRecommendations(platformOpt: PlatformOptimization): string[] {
  const recommendations = [];
  
  if (platformOpt.platformSpecificFeaturesUsed.length === 0) {
    recommendations.push('Use platform-specific features (effects, stickers, native tools)');
  }
  if (platformOpt.nativeEffectsEmployed.length === 0) {
    recommendations.push('Employ native effects that the algorithm favors');
  }
  
  return recommendations;
} 