/**
 * Framework Parser Service
 * Converts documented viral strategies into executable algorithms
 * Implements Dynamic Percentile System and weighted framework combinations
 * Enhanced with Comprehensive Framework Library (40+ frameworks)
 */

import { PredictionResult, VideoAnalysis, FrameworkScore, GodModeAnalysis } from '../../types/viral-prediction';
import { ComprehensiveFrameworkLibrary } from './comprehensive-framework-library';

export interface FrameworkWeights {
  tier1: {
    tripleLayerHook: number;        // 35% weight
    storytellingLoop: number;       // 30% weight
    dynamicPercentile: number;      // 25% weight
    culturalTiming: number;         // 20% weight
  };
  tier2: {
    authorityGap: number;           // 18% weight
    hookPatternRecognition: number; // 15% weight
    visualFormat: number;           // 12% weight
    engagementVelocity: number;     // 10% weight
  };
  tier3: {
    platformOptimization: number;   // 8% weight each (x7)
    psychologicalTriggers: number;  // 6% weight each (x10)
    productionQuality: number;      // 5% weight each (x10)
    audienceBehavior: number;       // 4% weight each (x5)
  };
}

export interface PlatformWeights {
  tiktok: {
    completionRate: number;         // 40%
    engagementVelocity: number;     // 25%
    shareRate: number;              // 20%
    commentQuality: number;         // 15%
  };
  instagram: {
    watchTime: number;              // 35%
    saveRate: number;               // 25%
    unconnectedReach: number;       // 20%
    storyReshare: number;          // 20%
  };
  youtube: {
    swipeAwayRate: number;          // 45% (inverted)
    clickThroughRate: number;       // 25%
    sustainedPerformance: number;   // 20%
    thumbnailEffectiveness: number; // 10%
  };
  linkedin: {
    firstHourEngagement: number;    // 50%
    networkAmplification: number;   // 30%
    commentThreadQuality: number;   // 20%
  };
}

export class FrameworkParser {
  private frameworkWeights: FrameworkWeights;
  private platformWeights: PlatformWeights;
  private comprehensiveLibrary: ComprehensiveFrameworkLibrary;

  constructor() {
    this.frameworkWeights = this.initializeFrameworkWeights();
    this.platformWeights = this.initializePlatformWeights();
    this.comprehensiveLibrary = new ComprehensiveFrameworkLibrary();
  }

  /**
   * Parse video content and calculate viral prediction score using all 40+ frameworks
   */
  public async parseVideoContent(
    videoAnalysis: VideoAnalysis,
    platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin' = 'tiktok'
  ): Promise<PredictionResult> {
    // 1. Analyze with comprehensive framework library (40+ frameworks)
    const comprehensiveAnalysis = this.comprehensiveLibrary.analyzeVideoWithAllFrameworks(videoAnalysis);
    
    // 2. Calculate base framework scores (legacy + comprehensive)
    const frameworkScores = await this.calculateFrameworkScores(videoAnalysis);
    
    // 3. Apply God Mode enhancements
    const godModeAnalysis = await this.calculateGodModeEnhancements(videoAnalysis);
    
    // 4. Calculate Dynamic Percentile System score
    const dpsScore = this.calculateDynamicPercentileScore(videoAnalysis);
    
    // 5. Apply platform-specific weights
    const platformScore = this.calculatePlatformScore(videoAnalysis, platform);
    
    // 6. Calculate final viral score using master formula + comprehensive analysis
    const baseViralScore = this.calculateFinalViralScore(
      frameworkScores,
      godModeAnalysis,
      dpsScore,
      platformScore,
      platform
    );

    // 7. Enhance with comprehensive framework analysis
    const enhancedViralScore = this.enhanceWithComprehensiveAnalysis(
      baseViralScore,
      comprehensiveAnalysis
    );

    // 8. Generate enhanced recommendations
    const recommendations = this.generateEnhancedRecommendations(
      frameworkScores,
      godModeAnalysis,
      comprehensiveAnalysis
    );

    return {
      videoId: videoAnalysis.videoId,
      viralScore: Math.round(enhancedViralScore * 100) / 100,
      viralProbability: this.scoreToprobability(enhancedViralScore),
      confidenceLevel: this.calculateConfidenceLevel(frameworkScores, godModeAnalysis),
      peakTimeEstimate: this.calculatePeakTimeEstimate(godModeAnalysis.culturalTiming),
      hookAnalysis: frameworkScores.hookDetections,
      psychologicalFactors: godModeAnalysis.psychological,
      productionQuality: godModeAnalysis.productionQuality,
      culturalTiming: godModeAnalysis.culturalTiming,
      recommendedActions: recommendations,
      frameworkBreakdown: this.createEnhancedFrameworkBreakdown(frameworkScores, comprehensiveAnalysis),
      dpsScore,
      platformOptimization: platformScore,
      // Enhanced with comprehensive analysis
      detectedFrameworks: comprehensiveAnalysis.detectedFrameworks,
      topFrameworks: comprehensiveAnalysis.topFrameworks,
      frameworkCount: this.comprehensiveLibrary.getFrameworkCount(),
      comprehensiveScore: comprehensiveAnalysis.overallScore
    };
  }

  /**
   * Calculate scores for all 40 frameworks
   */
  private async calculateFrameworkScores(videoAnalysis: VideoAnalysis): Promise<FrameworkScore> {
    const scores: FrameworkScore = {
      tier1: {
        tripleLayerHook: this.analyzeTripleLayerHook(videoAnalysis),
        storytellingLoop: this.analyzeStorytellingLoop(videoAnalysis),
        dynamicPercentile: this.calculateDynamicPercentileScore(videoAnalysis),
        culturalTiming: this.analyzeCulturalTiming(videoAnalysis)
      },
      tier2: {
        authorityGap: this.analyzeAuthorityGap(videoAnalysis),
        hookPatternRecognition: this.analyzeHookPatterns(videoAnalysis),
        visualFormat: this.analyzeVisualFormat(videoAnalysis),
        engagementVelocity: this.analyzeEngagementVelocity(videoAnalysis)
      },
      tier3: {
        platformOptimization: this.analyzePlatformOptimization(videoAnalysis),
        psychologicalTriggers: this.analyzePsychologicalTriggers(videoAnalysis),
        productionQuality: this.analyzeProductionQuality(videoAnalysis),
        audienceBehavior: this.analyzeAudienceBehavior(videoAnalysis)
      },
      hookDetections: this.detectHookPatterns(videoAnalysis),
      overallScore: 0 // Will be calculated
    };

    // Calculate weighted overall score
    scores.overallScore = this.calculateWeightedScore(scores);
    
    return scores;
  }

  /**
   * Analyze Triple-Layer Hook System (35% weight)
   */
  private analyzeTripleLayerHook(analysis: VideoAnalysis): number {
    let score = 0;
    let layerCount = 0;

    // Layer 1: Verbal hook (first 3 seconds of transcript)
    if (analysis.transcript && analysis.transcript.length > 0) {
      const firstThreeSeconds = analysis.transcript.substring(0, 100); // Approximate
      const verbalHookPatterns = [
        /^(what if|imagine if|did you know|this is|i found|let me tell you)/i,
        /^(number \d+|step \d+|here's how|watch this)/i,
        /^(unpopular opinion|controversial|they don't want)/i
      ];
      
      if (verbalHookPatterns.some(pattern => pattern.test(firstThreeSeconds))) {
        score += 0.33;
        layerCount++;
      }
    }

    // Layer 2: Visual hook (compelling first frame indicators)
    if (analysis.visualFeatures) {
      const { faceDetection, motionDetection, colorAnalysis } = analysis.visualFeatures;
      
      // Strong visual elements in first frame
      if (faceDetection?.eyeContact || motionDetection?.immediateAction || colorAnalysis?.highContrast) {
        score += 0.33;
        layerCount++;
      }
    }

    // Layer 3: Text overlay hook
    if (analysis.textOverlays && analysis.textOverlays.length > 0) {
      const firstOverlay = analysis.textOverlays[0];
      if (firstOverlay.timestamp < 3 && firstOverlay.text.length > 5) {
        score += 0.33;
        layerCount++;
      }
    }

    // Multiplicative bonus for multiple layers
    if (layerCount > 1) {
      score *= Math.pow(1.15, layerCount - 1);
    }

    return Math.min(score, 1.0);
  }

  /**
   * Analyze Storytelling Loop (30% weight)
   */
  private analyzeStorytellingLoop(analysis: VideoAnalysis): number {
    if (!analysis.transcript) return 0;

    let score = 0;
    const transcript = analysis.transcript.toLowerCase();

    // Check for question opening
    const questionPatterns = [
      /^(what if|how did|is it possible|can you|have you ever)/,
      /\?.*?(watch|see|find out|discover)/,
      /(but first|before i tell you|here's the thing)/
    ];
    
    if (questionPatterns.some(pattern => pattern.test(transcript))) {
      score += 0.4;
    }

    // Check for tension building
    const tensionPatterns = [
      /(but then|however|suddenly|plot twist)/,
      /(the problem was|here's where it gets)/,
      /(you won't believe|this changed everything)/
    ];
    
    if (tensionPatterns.some(pattern => pattern.test(transcript))) {
      score += 0.3;
    }

    // Check for resolution/payoff
    const resolutionPatterns = [
      /(that's when|finally|the answer is)/,
      /(here's what happened|turns out|the result)/,
      /(so remember|the lesson is|takeaway)/
    ];
    
    if (resolutionPatterns.some(pattern => pattern.test(transcript))) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate Dynamic Percentile System Score
   */
  private calculateDynamicPercentileScore(analysis: VideoAnalysis): number {
    const { viewCount, likeCount, commentCount, shareCount, creatorFollowers } = analysis;
    
    // Calculate engagement rate
    const engagementRate = viewCount > 0 ? 
      (likeCount + commentCount + shareCount) / viewCount : 0;

    // Calculate view-to-follower ratio
    const viewToFollowerRatio = creatorFollowers > 0 ? 
      viewCount / creatorFollowers : 0;

    // Platform-specific thresholds (from research)
    const viralThresholds = {
      tiktok: {
        engagementRate: 0.06,        // >6% for viral
        viewToFollowerRatio: 0.35    // Top performers
      },
      instagram: {
        engagementRate: 0.03,        // >3% for viral
        viewToFollowerRatio: 0.2
      }
    };

    // Calculate percentile score
    const engagementPercentile = Math.min(engagementRate / viralThresholds.tiktok.engagementRate, 2.0);
    const viewPercentile = Math.min(viewToFollowerRatio / viralThresholds.tiktok.viewToFollowerRatio, 2.0);

    return (engagementPercentile + viewPercentile) / 2;
  }

  /**
   * Analyze Cultural Timing (20% weight)
   */
  private analyzeCulturalTiming(analysis: VideoAnalysis): number {
    let score = 0;

    // Check hashtag relevance to current trends
    if (analysis.hashtags && analysis.hashtags.length > 0) {
      const trendingScore = this.calculateHashtagTrendiness(analysis.hashtags);
      score += trendingScore * 0.4;
    }

    // Check upload timing (current hour vs optimal)
    const uploadHour = new Date(analysis.uploadTimestamp).getHours();
    const optimalHours = [19, 20, 21, 22]; // Peak engagement hours
    if (optimalHours.includes(uploadHour)) {
      score += 0.3;
    }

    // Check for breaking news/event correlation
    if (this.isRelatedToCurrentEvents(analysis)) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect hook patterns from the 30+ pattern library
   */
  private detectHookPatterns(analysis: VideoAnalysis): Array<{
    hookType: string;
    confidence: number;
    expectedSuccessRate: number;
  }> {
    const detectedHooks: Array<{
      hookType: string;
      confidence: number;
      expectedSuccessRate: number;
    }> = [];

    if (!analysis.transcript) return detectedHooks;

    const transcript = analysis.transcript.toLowerCase();

    // Tier 1 Hook Patterns (8-15% success rate)
    const tier1Patterns = [
      {
        name: 'Authority Gap',
        pattern: /(coming from someone who|as someone who|i've been|after \d+ years)/,
        successRate: 0.12
      },
      {
        name: 'Controversial Opinion',
        pattern: /(unpopular opinion|controversial|they don't want you|most people don't)/,
        successRate: 0.11
      },
      {
        name: 'Transformation Promise',
        pattern: /(how i went from|before and after|transformation|changed my life)/,
        successRate: 0.10
      },
      {
        name: 'Secret Revelation',
        pattern: /(secret|hidden|insider|they don't tell you|behind the scenes)/,
        successRate: 0.09
      },
      {
        name: 'Mistake Learning',
        pattern: /(mistake|failed|lost money|wish i knew|learned the hard way)/,
        successRate: 0.08
      }
    ];

    // Tier 2 Hook Patterns (5-8% success rate)
    const tier2Patterns = [
      {
        name: 'Challenge Documentation',
        pattern: /(day \d+ of|week \d+ of|trying to|challenge|goal)/,
        successRate: 0.07
      },
      {
        name: 'Comparison Shock',
        pattern: /(difference between|vs|compared to|shocking|will blow your mind)/,
        successRate: 0.06
      },
      {
        name: 'Timeline Surprise',
        pattern: /(in \d+ days|within a week|overnight|suddenly|plot twist)/,
        successRate: 0.05
      }
    ];

    // Check patterns and calculate confidence
    [...tier1Patterns, ...tier2Patterns].forEach(pattern => {
      const match = pattern.pattern.test(transcript);
      if (match) {
        // Calculate confidence based on pattern strength and context
        const confidence = this.calculatePatternConfidence(transcript, pattern.pattern);
        
        detectedHooks.push({
          hookType: pattern.name,
          confidence,
          expectedSuccessRate: pattern.successRate
        });
      }
    });

    return detectedHooks.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate God Mode enhancements
   */
  private async calculateGodModeEnhancements(analysis: VideoAnalysis): Promise<GodModeAnalysis> {
    return {
      psychological: await this.calculatePsychologicalGodMode(analysis),
      productionQuality: this.calculateProductionQualityGodMode(analysis),
      culturalTiming: this.calculateCulturalTimingGodMode(analysis)
    };
  }

  /**
   * Calculate final viral score using the master formula
   */
  private calculateFinalViralScore(
    frameworkScores: FrameworkScore,
    godModeAnalysis: GodModeAnalysis,
    dpsScore: number,
    platformScore: number,
    platform: string
  ): number {
    // Base framework score (weighted combination)
    const baseScore = frameworkScores.overallScore;

    // God Mode multipliers
    const psychologicalMultiplier = 1 + (godModeAnalysis.psychological.emotionalArousalScore / 100) * 0.25;
    const productionMultiplier = 1 + (godModeAnalysis.productionQuality.shotPacingScore / 100) * 0.20;
    const culturalMultiplier = 1 + (godModeAnalysis.culturalTiming.culturalRelevanceScore / 100) * 0.35;

    // Platform weight
    const platformMultiplier = this.getPlatformMultiplier(platform);

    // Authenticity factor (prevents over-optimization penalty)
    const authenticityFactor = Math.min(
      godModeAnalysis.productionQuality.authenticityBalance / 100,
      1.0
    );

    // Apply master formula
    const viralScore = (baseScore * psychologicalMultiplier * productionMultiplier * culturalMultiplier) 
                      * platformMultiplier * authenticityFactor * (1 + dpsScore * 0.1);

    // God Mode enhancement boost (15-35%)
    const godModeBoost = 1 + Math.min(
      (psychologicalMultiplier - 1) + (productionMultiplier - 1) + (culturalMultiplier - 1),
      0.35
    );

    return Math.min(viralScore * godModeBoost, 1.0);
  }

  // Helper methods for framework calculations
  private calculateWeightedScore(scores: FrameworkScore): number {
    const tier1Score = (
      scores.tier1.tripleLayerHook * this.frameworkWeights.tier1.tripleLayerHook +
      scores.tier1.storytellingLoop * this.frameworkWeights.tier1.storytellingLoop +
      scores.tier1.dynamicPercentile * this.frameworkWeights.tier1.dynamicPercentile +
      scores.tier1.culturalTiming * this.frameworkWeights.tier1.culturalTiming
    ) / 100; // Convert percentages to decimals

    const tier2Score = (
      scores.tier2.authorityGap * this.frameworkWeights.tier2.authorityGap +
      scores.tier2.hookPatternRecognition * this.frameworkWeights.tier2.hookPatternRecognition +
      scores.tier2.visualFormat * this.frameworkWeights.tier2.visualFormat +
      scores.tier2.engagementVelocity * this.frameworkWeights.tier2.engagementVelocity
    ) / 100;

    const tier3Score = (
      scores.tier3.platformOptimization * this.frameworkWeights.tier3.platformOptimization +
      scores.tier3.psychologicalTriggers * this.frameworkWeights.tier3.psychologicalTriggers +
      scores.tier3.productionQuality * this.frameworkWeights.tier3.productionQuality +
      scores.tier3.audienceBehavior * this.frameworkWeights.tier3.audienceBehavior
    ) / 100;

    return tier1Score + tier2Score + tier3Score;
  }

  private scoreToprobability(score: number): number {
    // Convert 0-1 score to viral probability percentage
    return Math.round(score * 100) / 100;
  }

  private calculateConfidenceLevel(
    frameworkScores: FrameworkScore,
    godModeAnalysis: GodModeAnalysis
  ): 'high' | 'medium' | 'low' {
    const avgConfidence = (
      frameworkScores.overallScore +
      godModeAnalysis.psychological.emotionalArousalScore / 100 +
      godModeAnalysis.productionQuality.authenticityBalance / 100 +
      godModeAnalysis.culturalTiming.culturalRelevanceScore / 100
    ) / 4;

    if (avgConfidence > 0.8) return 'high';
    if (avgConfidence > 0.5) return 'medium';
    return 'low';
  }

  // Initialize framework weights based on research
  private initializeFrameworkWeights(): FrameworkWeights {
    return {
      tier1: {
        tripleLayerHook: 35,
        storytellingLoop: 30,
        dynamicPercentile: 25,
        culturalTiming: 20
      },
      tier2: {
        authorityGap: 18,
        hookPatternRecognition: 15,
        visualFormat: 12,
        engagementVelocity: 10
      },
      tier3: {
        platformOptimization: 8,
        psychologicalTriggers: 6,
        productionQuality: 5,
        audienceBehavior: 4
      }
    };
  }

  private initializePlatformWeights(): PlatformWeights {
    return {
      tiktok: {
        completionRate: 0.40,
        engagementVelocity: 0.25,
        shareRate: 0.20,
        commentQuality: 0.15
      },
      instagram: {
        watchTime: 0.35,
        saveRate: 0.25,
        unconnectedReach: 0.20,
        storyReshare: 0.20
      },
      youtube: {
        swipeAwayRate: 0.45,
        clickThroughRate: 0.25,
        sustainedPerformance: 0.20,
        thumbnailEffectiveness: 0.10
      },
      linkedin: {
        firstHourEngagement: 0.50,
        networkAmplification: 0.30,
        commentThreadQuality: 0.20
      }
    };
  }

  // Placeholder methods for additional framework calculations
  private analyzeAuthorityGap(analysis: VideoAnalysis): number { return 0.5; }
  private analyzeHookPatterns(analysis: VideoAnalysis): number { return 0.5; }
  private analyzeVisualFormat(analysis: VideoAnalysis): number { return 0.5; }
  private analyzeEngagementVelocity(analysis: VideoAnalysis): number { return 0.5; }
  private analyzePlatformOptimization(analysis: VideoAnalysis): number { return 0.5; }
  private analyzePsychologicalTriggers(analysis: VideoAnalysis): number { return 0.5; }
  private analyzeProductionQuality(analysis: VideoAnalysis): number { return 0.5; }
  private analyzeAudienceBehavior(analysis: VideoAnalysis): number { return 0.5; }
  private calculateHashtagTrendiness(hashtags: string[]): number { return 0.5; }
  private isRelatedToCurrentEvents(analysis: VideoAnalysis): boolean { return false; }
  private calculatePatternConfidence(transcript: string, pattern: RegExp): number { return 0.75; }
  private calculatePsychologicalGodMode(analysis: VideoAnalysis): Promise<any> { 
    return Promise.resolve({
      emotionalArousalScore: 75,
      arousalType: 'excitement',
      socialCurrencyScore: 80,
      parasocialStrength: 70
    }); 
  }
  private calculateProductionQualityGodMode(analysis: VideoAnalysis): any { 
    return {
      shotPacingScore: 85,
      authenticityBalance: 80,
      calculatedSpontaneityScore: 75
    }; 
  }
  private calculateCulturalTimingGodMode(analysis: VideoAnalysis): any { 
    return {
      trendStage: 'emerging',
      hoursUntilPeak: 12,
      culturalRelevanceScore: 85
    }; 
  }
  private calculatePlatformScore(analysis: VideoAnalysis, platform: string): number { return 0.8; }
  private getPlatformMultiplier(platform: string): number { return 1.0; }
  private calculatePeakTimeEstimate(culturalTiming: any): string { 
    return new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(); 
  }
  private generateRecommendations(frameworkScores: FrameworkScore, godModeAnalysis: GodModeAnalysis): string[] {
    return [
      'Optimize hook in first 3 seconds for higher engagement',
      'Add storytelling loop to increase watch time',
      'Improve cultural timing alignment with trending topics'
    ];
  }
  private createFrameworkBreakdown(scores: FrameworkScore): any {
    return {
      tier1: scores.tier1,
      tier2: scores.tier2,
      tier3: scores.tier3,
      hookDetections: scores.hookDetections.length
    };
  }

  /**
   * Enhance viral score with comprehensive framework analysis
   */
  private enhanceWithComprehensiveAnalysis(
    baseScore: number,
    comprehensiveAnalysis: any
  ): number {
    // Use comprehensive framework score to boost or moderate base score
    const comprehensiveWeight = 0.4; // 40% influence from comprehensive analysis
    const baseWeight = 0.6; // 60% from existing system

    const enhancedScore = (baseScore * baseWeight) + (comprehensiveAnalysis.overallScore * comprehensiveWeight);
    
    // Apply tier 1 framework bonus if detected
    const tier1Frameworks = comprehensiveAnalysis.detectedFrameworks.filter(
      (d: any) => d.framework.tier === 1 && d.confidence > 0.5
    );
    
    if (tier1Frameworks.length > 0) {
      const tier1Bonus = Math.min(tier1Frameworks.length * 0.05, 0.15); // Max 15% bonus
      return Math.min(enhancedScore + tier1Bonus, 1.0);
    }

    return Math.min(enhancedScore, 1.0);
  }

  /**
   * Generate enhanced recommendations using comprehensive framework analysis
   */
  private generateEnhancedRecommendations(
    frameworkScores: FrameworkScore,
    godModeAnalysis: GodModeAnalysis,
    comprehensiveAnalysis: any
  ): string[] {
    const recommendations: string[] = [];

    // Add comprehensive framework recommendations
    recommendations.push(...comprehensiveAnalysis.recommendations);

    // Add legacy recommendations
    const legacyRecommendations = this.generateRecommendations(frameworkScores, godModeAnalysis);
    recommendations.push(...legacyRecommendations);

    // Framework-specific enhancements
    if (comprehensiveAnalysis.topFrameworks.length > 0) {
      const topFramework = comprehensiveAnalysis.topFrameworks[0];
      recommendations.unshift(`Leverage ${topFramework.name} framework for ${(topFramework.viralRate * 100).toFixed(1)}% viral rate`);
    }

    // Remove duplicates and limit to top 8 recommendations
    const uniqueRecommendations = Array.from(new Set(recommendations));
    return uniqueRecommendations.slice(0, 8);
  }

  /**
   * Create enhanced framework breakdown with comprehensive analysis
   */
  private createEnhancedFrameworkBreakdown(
    scores: FrameworkScore,
    comprehensiveAnalysis: any
  ): any {
    return {
      legacy: {
        tier1: scores.tier1,
        tier2: scores.tier2,
        tier3: scores.tier3,
        hookDetections: scores.hookDetections.length
      },
      comprehensive: {
        totalFrameworks: comprehensiveAnalysis.detectedFrameworks.length,
        topFrameworks: comprehensiveAnalysis.topFrameworks.map((f: any) => f.name),
        overallScore: comprehensiveAnalysis.overallScore,
        categoryBreakdown: this.categorizeDetectedFrameworks(comprehensiveAnalysis.detectedFrameworks)
      }
    };
  }

  /**
   * Categorize detected frameworks by type
   */
  private categorizeDetectedFrameworks(detectedFrameworks: any[]): any {
    const categories = {
      'hook-driven': 0,
      'visual-format': 0,
      'content-series': 0,
      'algorithm-optimization': 0,
      'growth-research': 0
    };

    detectedFrameworks.forEach(detection => {
      if (categories.hasOwnProperty(detection.framework.category)) {
        categories[detection.framework.category as keyof typeof categories]++;
      }
    });

    return categories;
  }

  /**
   * Get comprehensive framework library for external access
   */
  public getComprehensiveLibrary(): ComprehensiveFrameworkLibrary {
    return this.comprehensiveLibrary;
  }

  /**
   * Real-time analysis for ≤5 second requirement
   */
  public async analyzeRealTime(videoAnalysis: VideoAnalysis): Promise<{
    viralProbability: number;
    score: number;
    improvements: string[];
    analysisTime: number;
  }> {
    return await this.comprehensiveLibrary.analyzeContentRealTime(videoAnalysis);
  }

  /**
   * Generate daily recipe book
   */
  public async generateDailyRecipeBook(): Promise<any> {
    return await this.comprehensiveLibrary.generateDailyRecipeBook();
  }
}

export default FrameworkParser;