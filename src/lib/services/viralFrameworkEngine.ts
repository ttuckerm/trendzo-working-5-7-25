import { Platform, Niche } from '@/lib/types/database';
import { viralPredictionModel, MLFeatures, PredictionResult } from './viralPredictionModel';

// Types for Viral Framework System
export interface ViralFramework {
  id: string;
  name: string;
  category: 'hook_driven' | 'narrative' | 'visual_format' | 'content_series' | 'algorithm_optimization';
  effectiveness: Record<Platform, number>; // 1-5 star rating
  successBenchmarks: {
    watchTime: number;
    engagementRate: number;
    shareRate: number;
    viralThreshold: number;
  };
  implementation: {
    coreMechanics: string[];
    structure: string;
    visualRequirements: string[];
    effort: 'low' | 'medium' | 'high';
  };
  risks: string[];
  examples: string[];
}

export interface DynamicPercentileSystem {
  platform: Platform;
  cohortMedian: number;
  platformWeight: number;
  decayFactor: number;
  lastUpdated: string;
  thresholds: {
    viral: number; // Top 5%
    hyperViral: number; // Top 1%
    megaViral: number; // Top 0.1%
  };
}

export interface EngagementVelocity {
  score: number;
  timeMultiplier: number;
  detectionWindow: number; // hours
  signals: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
}

export interface HookClassification {
  type: 'challenge_loop' | 'authority_result' | 'storytelling' | 'myth_busting' | 'controversial';
  viralRate: number;
  template: string;
  requirements: string[];
  platformOptimal: Platform[];
}

export interface ContentAnalysis {
  templateId: string;
  detectedFrameworks: string[];
  hookClassification: HookClassification;
  visualFormat: string;
  platformOptimization: Record<Platform, number>;
  viralPotential: number;
  recommendations: string[];
  riskFactors: string[];
}

/**
 * Viral Framework Engine
 * Implements the comprehensive viral content framework for prediction and optimization
 */
export class ViralFrameworkEngine {
  private static instance: ViralFrameworkEngine;
  private frameworks: Map<string, ViralFramework> = new Map();
  private dpsData: Map<Platform, DynamicPercentileSystem> = new Map();
  private hookTemplates: Map<string, HookClassification> = new Map();

  private constructor() {
    this.initializeFrameworks();
    this.initializeDPS();
    this.initializeHookTemplates();
  }

  static getInstance(): ViralFrameworkEngine {
    if (!ViralFrameworkEngine.instance) {
      ViralFrameworkEngine.instance = new ViralFrameworkEngine();
    }
    return ViralFrameworkEngine.instance;
  }

  /**
   * Calculate viral score using Dynamic Percentile System
   */
  calculateViralScore(params: {
    viewCount: number;
    followerCount: number;
    platform: Platform;
    timeElapsed: number; // hours since posting
  }): { score: number; classification: string; percentile: number } {
    const dps = this.dpsData.get(params.platform);
    if (!dps) {
      throw new Error(`DPS data not available for platform: ${params.platform}`);
    }

    // Calculate cohort median for similar sized accounts
    const cohortMedian = this.getCohortMedian(params.followerCount, params.platform);
    
    // Apply decay factor
    const decayFactor = Math.exp(-dps.decayFactor * params.timeElapsed);
    
    // Calculate viral score
    const viralScore = (params.viewCount / cohortMedian) * dps.platformWeight * decayFactor;

    // Classify based on thresholds
    let classification = 'normal';
    let percentile = 50;

    if (viralScore >= dps.thresholds.megaViral) {
      classification = 'mega_viral';
      percentile = 99.9;
    } else if (viralScore >= dps.thresholds.hyperViral) {
      classification = 'hyper_viral';
      percentile = 99;
    } else if (viralScore >= dps.thresholds.viral) {
      classification = 'viral';
      percentile = 95;
    } else if (viralScore >= 0.5) {
      classification = 'high_performing';
      percentile = 80;
    }

    return { score: viralScore, classification, percentile };
  }

  /**
   * Calculate engagement velocity with time multipliers
   */
  calculateEngagementVelocity(params: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    timeElapsed: number; // hours
    platform: Platform;
  }): EngagementVelocity {
    // Time multiplier based on platform-specific windows
    const timeMultiplier = this.getTimeMultiplier(params.timeElapsed, params.platform);
    
    // Weighted engagement score
    const weightedEngagement = (
      params.likes + 
      (params.comments * 2) + 
      (params.shares * 3)
    ) / params.views;

    const score = weightedEngagement * timeMultiplier;

    return {
      score,
      timeMultiplier,
      detectionWindow: this.getDetectionWindow(params.platform),
      signals: {
        likes: params.likes,
        comments: params.comments,
        shares: params.shares,
        views: params.views
      }
    };
  }

  /**
   * Analyze content and recommend viral frameworks
   */
  async analyzeContent(params: {
    content: string;
    visualStyle: string;
    duration: number;
    platform: Platform;
    niche?: Niche;
  }): Promise<ContentAnalysis> {
    // Detect hook type
    const hookClassification = this.classifyHook(params.content);
    
    // Identify applicable frameworks
    const detectedFrameworks = this.detectFrameworks(params);
    
    // Calculate platform optimization scores
    const platformOptimization = this.calculatePlatformOptimization(params);
    
    // Generate viral potential score
    const viralPotential = this.calculateViralPotential(params, hookClassification, detectedFrameworks);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(params, hookClassification);
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(params, hookClassification);

    return {
      templateId: `template_${Date.now()}`,
      detectedFrameworks,
      hookClassification,
      visualFormat: params.visualStyle,
      platformOptimization,
      viralPotential,
      recommendations,
      riskFactors
    };
  }

  /**
   * Get optimal posting recommendations
   */
  getOptimalPostingStrategy(platform: Platform, niche?: Niche): {
    bestTimes: string[];
    optimalLength: { min: number; max: number; sweet: number };
    hashtagStrategy: {
      method: string;
      count: number;
      examples: string[];
    };
    seoStrategy: string[];
  } {
    const platformSpecs = this.getPlatformSpecs(platform);
    
    return {
      bestTimes: platformSpecs.postingWindows,
      optimalLength: platformSpecs.optimalLength,
      hashtagStrategy: platformSpecs.hashtagStrategy,
      seoStrategy: platformSpecs.seoStrategy
    };
  }

  /**
   * Recommend frameworks based on goals
   */
  recommendFrameworks(params: {
    goal: 'viral_growth' | 'engagement' | 'followers' | 'brand_building';
    platform: Platform;
    contentType: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  }): ViralFramework[] {
    const allFrameworks = Array.from(this.frameworks.values());
    
    // Filter by platform effectiveness
    const platformSuitable = allFrameworks.filter(fw => 
      fw.effectiveness[params.platform] >= 3
    );

    // Filter by effort level based on experience
    const effortThreshold = {
      beginner: 'low',
      intermediate: 'medium',
      advanced: 'high'
    };

    const effortSuitable = platformSuitable.filter(fw => {
      if (params.experienceLevel === 'beginner') return fw.implementation.effort === 'low';
      if (params.experienceLevel === 'intermediate') return fw.implementation.effort !== 'high';
      return true; // Advanced can handle any effort
    });

    // Sort by goal alignment
    return effortSuitable
      .sort((a, b) => this.scoreFrameworkForGoal(b, params.goal) - this.scoreFrameworkForGoal(a, params.goal))
      .slice(0, 5);
  }

  /**
   * Update DPS baselines (weekly cron job)
   */
  async updateDPSBaselines(): Promise<void> {
    for (const platform of Object.values(Platform)) {
      try {
        // Get recent performance data
        const recentData = await this.fetchRecentPerformanceData(platform);
        
        // Recalculate cohort medians
        const cohortMedians = this.recalculateCohortMedians(recentData);
        
        // Update decay rates if patterns have shifted
        const newDecayRate = this.calculateDecayRate(recentData);
        
        // Update thresholds
        const newThresholds = this.calculatePercentileThresholds(recentData);
        
        this.dpsData.set(platform, {
          platform,
          cohortMedian: cohortMedians.overall,
          platformWeight: this.getPlatformWeight(platform),
          decayFactor: newDecayRate,
          lastUpdated: new Date().toISOString(),
          thresholds: newThresholds
        });

        console.log(`Updated DPS for ${platform}`);
      } catch (error) {
        console.error(`Failed to update DPS for ${platform}:`, error);
      }
    }
  }

  /**
   * Private helper methods
   */
  private classifyHook(content: string): HookClassification {
    const hooks = Array.from(this.hookTemplates.values());
    
    // Simple keyword matching - in production would use NLP
    for (const hook of hooks) {
      const keywords = hook.template.toLowerCase().split(' ');
      const contentLower = content.toLowerCase();
      
      const matches = keywords.filter(keyword => 
        keyword.length > 3 && contentLower.includes(keyword)
      ).length;
      
      if (matches >= 2) {
        return hook;
      }
    }

    // Default to storytelling if no clear match
    return this.hookTemplates.get('storytelling') || hooks[0];
  }

  private detectFrameworks(params: any): string[] {
    const detected: string[] = [];
    
    // Check duration for visual formats
    if (params.duration <= 30 && params.visualStyle.includes('angle_change')) {
      detected.push('shot_angle_change');
    }
    
    if (params.visualStyle.includes('prop')) {
      detected.push('visual_prop_demonstration');
    }
    
    if (params.content.includes('episode') || params.content.includes('part')) {
      detected.push('episode_based_series');
    }
    
    return detected;
  }

  private calculatePlatformOptimization(params: any): Record<Platform, number> {
    const optimization: Partial<Record<Platform, number>> = {};
    
    Object.values(Platform).forEach(platform => {
      let score = 50; // Base score
      
      const specs = this.getPlatformSpecs(platform);
      
      // Duration optimization
      if (params.duration >= specs.optimalLength.min && params.duration <= specs.optimalLength.max) {
        score += 25;
      }
      
      // Content type alignment
      if (specs.contentPreferences.includes(params.visualStyle)) {
        score += 15;
      }
      
      // Hook alignment
      const hookEffectiveness = this.frameworks.get('authority_gap')?.effectiveness[platform] || 3;
      score += hookEffectiveness * 4;
      
      optimization[platform] = Math.min(100, score);
    });
    
    return optimization as Record<Platform, number>;
  }

  private calculateViralPotential(params: any, hook: HookClassification, frameworks: string[]): number {
    let score = hook.viralRate; // Start with hook viral rate
    
    // Boost for multiple frameworks
    score += frameworks.length * 5;
    
    // Platform alignment bonus
    if (hook.platformOptimal.includes(params.platform)) {
      score += 15;
    }
    
    // Duration optimization
    const specs = this.getPlatformSpecs(params.platform);
    if (params.duration === specs.optimalLength.sweet) {
      score += 10;
    }
    
    return Math.min(100, score);
  }

  private generateRecommendations(params: any, hook: HookClassification): string[] {
    const recommendations: string[] = [];
    
    if (hook.viralRate < 15) {
      recommendations.push('Consider switching to a higher-performing hook type');
    }
    
    const specs = this.getPlatformSpecs(params.platform);
    if (params.duration > specs.optimalLength.max) {
      recommendations.push(`Reduce duration to ${specs.optimalLength.sweet}s for optimal performance`);
    }
    
    if (!params.visualStyle.includes('angle_change')) {
      recommendations.push('Add shot angle changes every 2-2.5 seconds');
    }
    
    recommendations.push(`Post during optimal times: ${specs.postingWindows.join(' or ')}`);
    
    return recommendations;
  }

  private identifyRiskFactors(params: any, hook: HookClassification): string[] {
    const risks: string[] = [];
    
    if (hook.type === 'controversial') {
      risks.push('High controversy may lead to audience fragmentation');
      risks.push('Potential for negative comments and backlash');
    }
    
    if (params.duration > 45 && params.platform === 'tiktok') {
      risks.push('Long duration may hurt TikTok algorithm performance');
    }
    
    if (!hook.platformOptimal.includes(params.platform)) {
      risks.push(`Hook type not optimized for ${params.platform}`);
    }
    
    return risks;
  }

  private getTimeMultiplier(timeElapsed: number, platform: Platform): number {
    const multipliers = {
      tiktok: { '0-1': 3.0, '1-3': 2.0, '3-24': 1.5, '24+': 1.0 },
      instagram: { '0-1': 2.5, '1-6': 2.0, '6-24': 1.3, '24+': 1.0 },
      youtube: { '0-1': 2.0, '1-24': 1.5, '24-168': 1.2, '168+': 1.0 }
    };

    const platformMultipliers = multipliers[platform] || multipliers.tiktok;
    
    if (timeElapsed <= 1) return platformMultipliers['0-1'];
    if (timeElapsed <= 3 && platform === 'tiktok') return platformMultipliers['1-3'];
    if (timeElapsed <= 6 && platform === 'instagram') return platformMultipliers['1-6'];
    if (timeElapsed <= 24) return platformMultipliers['3-24'] || platformMultipliers['1-24'];
    return platformMultipliers['24+'];
  }

  private getDetectionWindow(platform: Platform): number {
    const windows = {
      tiktok: 3,
      instagram: 6,
      youtube: 24,
      linkedin: 6,
      twitter: 2,
      facebook: 12
    };
    return windows[platform] || 6;
  }

  private getCohortMedian(followerCount: number, platform: Platform): number {
    // Mock implementation - in production would use real cohort data
    const baseMedian = followerCount * 0.1; // 10% of followers is typical baseline
    const platformMultipliers = {
      tiktok: 1.2,
      instagram: 0.8,
      youtube: 0.6,
      linkedin: 0.4,
      twitter: 0.7,
      facebook: 0.5
    };
    
    return baseMedian * (platformMultipliers[platform] || 1.0);
  }

  private getPlatformWeight(platform: Platform): number {
    const weights = {
      tiktok: 1.0,
      instagram: 0.85,
      youtube: 0.7,
      linkedin: 0.6,
      twitter: 0.8,
      facebook: 0.5
    };
    return weights[platform] || 1.0;
  }

  private getPlatformSpecs(platform: Platform) {
    const specs = {
      tiktok: {
        postingWindows: ['6-10 AM', '7-11 PM'],
        optimalLength: { min: 21, max: 35, sweet: 28 },
        hashtagStrategy: {
          method: 'Hidden text + caption keywords',
          count: 10-15,
          examples: ['#fyp', '#viral', '#tiktok']
        },
        seoStrategy: ['Keywords in hidden text', 'Use trending sounds', 'Others searched for keywords'],
        contentPreferences: ['angle_change', 'prop', 'challenge'],
        decayRate: 0.5
      },
      instagram: {
        postingWindows: ['11 AM-1 PM', '7-9 PM EST'],
        optimalLength: { min: 15, max: 30, sweet: 22 },
        hashtagStrategy: {
          method: '3×3 method',
          count: 9,
          examples: ['#topic', '#audience', '#result']
        },
        seoStrategy: ['Keywords in first 125 chars', 'Custom cover image', 'Story promotion'],
        contentPreferences: ['storytelling', 'b_roll', 'series'],
        decayRate: 0.3
      },
      youtube: {
        postingWindows: ['12-3 PM', '7-10 PM EST'],
        optimalLength: { min: 50, max: 59, sweet: 55 },
        hashtagStrategy: {
          method: 'Title + description optimization',
          count: 5-8,
          examples: ['#shorts', '#tutorial', '#viral']
        },
        seoStrategy: ['Full keyword in title', 'Add to playlists', 'Loop strategy'],
        contentPreferences: ['watch_time_max', 'seo_optimized'],
        decayRate: 0.1
      }
    };

    return specs[platform] || specs.tiktok;
  }

  private scoreFrameworkForGoal(framework: ViralFramework, goal: string): number {
    const goalScoring = {
      viral_growth: {
        hook_driven: 5,
        algorithm_optimization: 4,
        narrative: 3,
        visual_format: 3,
        content_series: 2
      },
      engagement: {
        narrative: 5,
        visual_format: 4,
        hook_driven: 3,
        content_series: 3,
        algorithm_optimization: 2
      },
      followers: {
        content_series: 5,
        hook_driven: 4,
        narrative: 3,
        visual_format: 2,
        algorithm_optimization: 2
      },
      brand_building: {
        narrative: 5,
        content_series: 4,
        visual_format: 3,
        hook_driven: 2,
        algorithm_optimization: 1
      }
    };

    return goalScoring[goal]?.[framework.category] || 1;
  }

  // Mock data fetching methods - in production would integrate with APIs
  private async fetchRecentPerformanceData(platform: Platform): Promise<any[]> {
    // Mock implementation
    return [];
  }

  private recalculateCohortMedians(data: any[]): { overall: number } {
    // Mock implementation
    return { overall: 1000 };
  }

  private calculateDecayRate(data: any[]): number {
    // Mock implementation
    return 0.3;
  }

  private calculatePercentileThresholds(data: any[]): { viral: number; hyperViral: number; megaViral: number } {
    // Mock implementation
    return { viral: 5.0, hyperViral: 10.0, megaViral: 25.0 };
  }

  private initializeFrameworks(): void {
    // Initialize the 15 core frameworks from the compendium
    const frameworks: ViralFramework[] = [
      {
        id: 'authority_gap',
        name: 'Authority Gap Hook',
        category: 'hook_driven',
        effectiveness: {
          instagram: 4, tiktok: 3, linkedin: 5, twitter: 3, facebook: 3, youtube: 2
        },
        successBenchmarks: {
          watchTime: 60,
          engagementRate: 5,
          shareRate: 0.5,
          viralThreshold: 85
        },
        implementation: {
          coreMechanics: ['Hook + Authority credential within 3 seconds', 'Structure: Hook → Authority → Value'],
          structure: 'Hook → Authority statement → Value delivery',
          visualRequirements: ['Close-up face shot', 'Credential visual', 'Teaching sequence'],
          effort: 'medium'
        },
        risks: ['Overplaying credentials can appear boastful'],
        examples: ['I lost 60 pounds doing one of these', 'This is coming from a 37-year-old self-made millionaire']
      },
      {
        id: 'storytelling_loop',
        name: 'Storytelling Loop',
        category: 'narrative',
        effectiveness: {
          instagram: 4, tiktok: 5, linkedin: 2, twitter: 3, facebook: 4, youtube: 3
        },
        successBenchmarks: {
          watchTime: 60,
          engagementRate: 6,
          shareRate: 0.3,
          viralThreshold: 100
        },
        implementation: {
          coreMechanics: ['Open narrative question', 'Build tension', 'Deliver payoff at end'],
          structure: 'Open question → Build tension → Deliver payoff',
          visualRequirements: ['Dynamic shots supporting narrative arc'],
          effort: 'high'
        },
        risks: ['Weak payoff causes viewer betrayal', 'Over-promising in hook'],
        examples: ['Is it possible to get a 6-pack without going to the gym?']
      }
      // ... Additional frameworks would be added here
    ];

    frameworks.forEach(fw => this.frameworks.set(fw.id, fw));
  }

  private initializeDPS(): void {
    // Initialize DPS data for each platform
    Object.values(Platform).forEach(platform => {
      this.dpsData.set(platform, {
        platform,
        cohortMedian: 1000, // Mock baseline
        platformWeight: this.getPlatformWeight(platform),
        decayFactor: this.getPlatformSpecs(platform).decayRate,
        lastUpdated: new Date().toISOString(),
        thresholds: {
          viral: 5.0,
          hyperViral: 10.0,
          megaViral: 25.0
        }
      });
    });
  }

  private initializeHookTemplates(): void {
    const hooks: HookClassification[] = [
      {
        type: 'challenge_loop',
        viralRate: 18,
        template: 'Is it possible to [achieve X] without [constraint Y]?',
        requirements: ['Cognitive loop requiring closure'],
        platformOptimal: ['tiktok', 'instagram']
      },
      {
        type: 'authority_result',
        viralRate: 15,
        template: 'I went from [before] to [after] in [timeframe]',
        requirements: ['Personal proof/client results'],
        platformOptimal: ['linkedin', 'instagram']
      },
      {
        type: 'storytelling',
        viralRate: 14,
        template: '[Time] ago, [unexpected event/realization]',
        requirements: ['Must connect to niche lesson by video end'],
        platformOptimal: ['instagram', 'tiktok', 'youtube']
      },
      {
        type: 'myth_busting',
        viralRate: 12,
        template: 'What if I told you [common belief] is wrong?',
        requirements: ['Data/evidence in content body'],
        platformOptimal: ['youtube', 'linkedin']
      },
      {
        type: 'controversial',
        viralRate: 11,
        template: '90% of people will hate what I\'m about to say',
        requirements: ['High risk; use sparingly'],
        platformOptimal: ['tiktok', 'twitter']
      }
    ];

    hooks.forEach(hook => this.hookTemplates.set(hook.type, hook));
  }
}

// Export singleton instance
export const viralFrameworkEngine = ViralFrameworkEngine.getInstance();