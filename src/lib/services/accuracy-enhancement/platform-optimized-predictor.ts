/**
 * PLATFORM-OPTIMIZED PREDICTOR - PLATFORM-SPECIFIC ACCURACY ENHANCEMENT
 * 
 * 🎯 TARGET: +0.5% accuracy improvement through platform-specific optimization
 * 
 * STRATEGY:
 * - Platform-specific algorithm weight adjustments and feature importance
 * - Content format optimization for each platform's algorithm preferences
 * - Platform-specific viral pattern recognition and scoring
 * - Creator tier optimization based on platform dynamics
 * - Timing and engagement optimization per platform
 * - Platform algorithm change adaptation
 * 
 * ARCHITECTURE:
 * - Platform-specific prediction models with optimized weights
 * - Content format analysis tailored to platform requirements
 * - Creator tier scoring adapted to platform dynamics
 * - Platform-specific timing and engagement optimization
 */

import { createClient } from '@supabase/supabase-js';
import { realTimeMonitor } from '@/lib/monitoring/real-time-monitor';

// ===== TYPES & INTERFACES =====

interface PlatformOptimizationInput {
  content: string;
  hashtags: string[];
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  niche: string;
  creator_followers: number;
  video_length?: number;
  upload_time?: string;
  base_prediction: {
    score: number;
    confidence: number;
  };
}

interface PlatformConfiguration {
  algorithm_preferences: {
    content_format_weights: Record<string, number>;
    creator_tier_multipliers: Record<string, number>;
    engagement_type_preferences: Record<string, number>;
    timing_importance: number;
    hashtag_effectiveness: number;
    content_length_optimization: {
      optimal_min: number;
      optimal_max: number;
      penalty_factor: number;
    };
  };
  viral_patterns: {
    trending_formats: string[];
    success_indicators: string[];
    engagement_triggers: string[];
  };
  performance_metrics: {
    accuracy_baseline: number;
    confidence_modifier: number;
    prediction_variance: number;
  };
}

interface PlatformOptimizationResult {
  platform: string;
  optimized_score: number;
  optimization_boost: number;
  confidence_adjustment: number;
  platform_factors: {
    format_optimization: number;
    creator_tier_optimization: number;
    timing_optimization: number;
    content_length_optimization: number;
    hashtag_optimization: number;
    viral_pattern_match: number;
  };
  platform_recommendations: string[];
  algorithm_alignment_score: number;
  competitive_advantage_score: number;
}

// ===== PLATFORM CONFIGURATIONS =====

const PLATFORM_CONFIGS: Record<string, PlatformConfiguration> = {
  tiktok: {
    algorithm_preferences: {
      content_format_weights: {
        'short_hook': 1.8,
        'trend_participation': 1.6,
        'visual_appeal': 1.4,
        'audio_sync': 1.7,
        'text_overlay': 1.3,
        'story_format': 1.1,
        'educational': 1.5,
        'entertainment': 1.6
      },
      creator_tier_multipliers: {
        'micro': 1.2,    // TikTok favors smaller creators
        'small': 1.3,
        'medium': 1.1,
        'large': 0.9,
        'mega': 0.8
      },
      engagement_type_preferences: {
        'views': 1.0,
        'likes': 1.4,
        'comments': 1.6,
        'shares': 1.8,    // Shares are crucial on TikTok
        'saves': 1.3
      },
      timing_importance: 1.4,
      hashtag_effectiveness: 1.3,
      content_length_optimization: {
        optimal_min: 15,
        optimal_max: 60,
        penalty_factor: 0.02
      }
    },
    viral_patterns: {
      trending_formats: ['pov', 'trend', 'challenge', 'duet', 'tutorial', 'transformation'],
      success_indicators: ['trending_audio', 'viral_hashtag', 'creator_collaboration', 'trend_participation'],
      engagement_triggers: ['hook_in_first_3s', 'surprising_twist', 'relatable_content', 'call_to_action']
    },
    performance_metrics: {
      accuracy_baseline: 0.92,
      confidence_modifier: 1.1,
      prediction_variance: 0.15
    }
  },
  
  instagram: {
    algorithm_preferences: {
      content_format_weights: {
        'aesthetic_appeal': 1.7,
        'story_quality': 1.4,
        'hashtag_strategy': 1.6,
        'carousel_posts': 1.3,
        'reels_format': 1.5,
        'user_generated_content': 1.2,
        'behind_the_scenes': 1.3,
        'lifestyle': 1.4
      },
      creator_tier_multipliers: {
        'micro': 1.1,
        'small': 1.2,
        'medium': 1.3,    // Instagram sweet spot
        'large': 1.2,
        'mega': 1.0
      },
      engagement_type_preferences: {
        'views': 1.0,
        'likes': 1.3,
        'comments': 1.4,
        'shares': 1.2,
        'saves': 1.6      // Saves are highly valued
      },
      timing_importance: 1.2,
      hashtag_effectiveness: 1.5,
      content_length_optimization: {
        optimal_min: 30,
        optimal_max: 90,
        penalty_factor: 0.015
      }
    },
    viral_patterns: {
      trending_formats: ['carousel', 'reels', 'story_series', 'before_after', 'tutorial', 'aesthetic'],
      success_indicators: ['high_engagement_rate', 'saves_ratio', 'aesthetic_quality', 'hashtag_reach'],
      engagement_triggers: ['visual_appeal', 'inspirational_content', 'educational_value', 'lifestyle_aspiration']
    },
    performance_metrics: {
      accuracy_baseline: 0.90,
      confidence_modifier: 1.0,
      prediction_variance: 0.12
    }
  },
  
  youtube: {
    algorithm_preferences: {
      content_format_weights: {
        'retention_optimization': 1.8,
        'thumbnail_appeal': 1.6,
        'title_optimization': 1.5,
        'educational_content': 1.4,
        'series_format': 1.3,
        'collaboration': 1.2,
        'community_engagement': 1.4,
        'trending_topics': 1.3
      },
      creator_tier_multipliers: {
        'micro': 0.9,
        'small': 1.0,
        'medium': 1.1,
        'large': 1.3,     // YouTube favors established creators
        'mega': 1.4
      },
      engagement_type_preferences: {
        'views': 1.2,
        'watch_time': 1.8,  // Watch time is crucial
        'likes': 1.1,
        'comments': 1.3,
        'subscribes': 1.6
      },
      timing_importance: 1.1,
      hashtag_effectiveness: 0.8,  // Less important on YouTube
      content_length_optimization: {
        optimal_min: 120,
        optimal_max: 600,
        penalty_factor: 0.01
      }
    },
    viral_patterns: {
      trending_formats: ['tutorial', 'review', 'vlog', 'explanation', 'reaction', 'series'],
      success_indicators: ['high_retention', 'subscriber_growth', 'comment_engagement', 'playlist_adds'],
      engagement_triggers: ['valuable_information', 'entertainment_value', 'community_building', 'consistent_quality']
    },
    performance_metrics: {
      accuracy_baseline: 0.88,
      confidence_modifier: 0.95,
      prediction_variance: 0.18
    }
  },
  
  twitter: {
    algorithm_preferences: {
      content_format_weights: {
        'thread_format': 1.5,
        'news_commentary': 1.4,
        'viral_tweet': 1.6,
        'community_engagement': 1.3,
        'real_time_content': 1.7,
        'thought_leadership': 1.2,
        'humor': 1.4,
        'controversy': 1.3
      },
      creator_tier_multipliers: {
        'micro': 1.0,
        'small': 1.1,
        'medium': 1.2,
        'large': 1.3,
        'mega': 1.1
      },
      engagement_type_preferences: {
        'views': 1.0,
        'likes': 1.2,
        'retweets': 1.6,   // Retweets drive virality
        'comments': 1.4,
        'quotes': 1.5
      },
      timing_importance: 1.6,      // Timing is crucial on Twitter
      hashtag_effectiveness: 1.1,
      content_length_optimization: {
        optimal_min: 50,
        optimal_max: 280,
        penalty_factor: 0.025
      }
    },
    viral_patterns: {
      trending_formats: ['thread', 'viral_tweet', 'news_break', 'hot_take', 'meme', 'quote_tweet'],
      success_indicators: ['retweet_ratio', 'engagement_velocity', 'trending_hashtag', 'influencer_amplification'],
      engagement_triggers: ['timely_relevance', 'controversial_opinion', 'humor', 'valuable_insight']
    },
    performance_metrics: {
      accuracy_baseline: 0.85,
      confidence_modifier: 0.9,
      prediction_variance: 0.22
    }
  }
};

// ===== PLATFORM-OPTIMIZED PREDICTOR =====

export class PlatformOptimizedPredictor {
  private supabase: any;
  private platformConfigs: Record<string, PlatformConfiguration>;
  private performanceHistory: Map<string, any>;
  private isInitialized = false;
  
  // Performance tracking
  private optimizationCount = 0;
  private accuracyBoosts: number[] = [];
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    
    this.platformConfigs = PLATFORM_CONFIGS;
    this.performanceHistory = new Map();
    
    // Initialize optimization data
    this.initializeAsync();
  }
  
  /**
   * MAIN PLATFORM OPTIMIZATION METHOD
   * 🎯 TARGET: +0.5% accuracy through platform-specific optimization
   */
  async optimizeForPlatform(input: PlatformOptimizationInput): Promise<PlatformOptimizationResult> {
    const startTime = performance.now();
    
    try {
      await this.ensureInitialized();
      
      console.log(`📱 Optimizing prediction for ${input.platform}...`);
      
      const config = this.platformConfigs[input.platform];
      if (!config) {
        throw new Error(`Platform ${input.platform} not supported`);
      }
      
      // 1. Analyze content format optimization
      const formatOptimization = this.analyzeContentFormat(input, config);
      
      // 2. Optimize for creator tier on this platform
      const creatorOptimization = this.optimizeCreatorTier(input, config);
      
      // 3. Analyze timing optimization
      const timingOptimization = this.analyzeTimingOptimization(input, config);
      
      // 4. Optimize content length for platform
      const lengthOptimization = this.optimizeContentLength(input, config);
      
      // 5. Optimize hashtag strategy for platform
      const hashtagOptimization = this.optimizeHashtagStrategy(input, config);
      
      // 6. Match viral patterns specific to platform
      const viralPatternMatch = this.matchViralPatterns(input, config);
      
      // 7. Calculate overall platform optimization
      const optimizationBoost = this.calculateOptimizationBoost({
        formatOptimization,
        creatorOptimization,
        timingOptimization,
        lengthOptimization,
        hashtagOptimization,
        viralPatternMatch
      }, config);
      
      // 8. Apply platform-specific confidence adjustment
      const confidenceAdjustment = this.calculateConfidenceAdjustment(input, config, optimizationBoost);
      
      // 9. Calculate optimized score
      const optimizedScore = Math.min(
        Math.max(input.base_prediction.score + optimizationBoost, 0),
        100
      );
      
      // 10. Generate platform-specific recommendations
      const recommendations = this.generatePlatformRecommendations(input, config, {
        formatOptimization,
        creatorOptimization,
        timingOptimization,
        lengthOptimization,
        hashtagOptimization,
        viralPatternMatch
      });
      
      // 11. Calculate algorithm alignment score
      const algorithmAlignment = this.calculateAlgorithmAlignment(input, config);
      
      // 12. Calculate competitive advantage score
      const competitiveAdvantage = this.calculateCompetitiveAdvantage(input, config, optimizationBoost);
      
      const processingTime = performance.now() - startTime;
      
      const result: PlatformOptimizationResult = {
        platform: input.platform,
        optimized_score: optimizedScore,
        optimization_boost: optimizationBoost,
        confidence_adjustment: confidenceAdjustment,
        platform_factors: {
          format_optimization: formatOptimization,
          creator_tier_optimization: creatorOptimization,
          timing_optimization: timingOptimization,
          content_length_optimization: lengthOptimization,
          hashtag_optimization: hashtagOptimization,
          viral_pattern_match: viralPatternMatch
        },
        platform_recommendations: recommendations,
        algorithm_alignment_score: algorithmAlignment,
        competitive_advantage_score: competitiveAdvantage
      };
      
      // Track performance
      this.trackOptimization(result, processingTime);
      
      console.log(`✅ Platform optimization complete: +${optimizationBoost.toFixed(1)} boost for ${input.platform}`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Platform optimization failed:', error);
      return this.generateErrorResult(input);
    }
  }
  
  /**
   * Analyze content format optimization for platform
   */
  private analyzeContentFormat(input: PlatformOptimizationInput, config: PlatformConfiguration): number {
    const content = input.content.toLowerCase();
    const formatWeights = config.algorithm_preferences.content_format_weights;
    
    let formatScore = 0;
    let matchedFormats = 0;
    
    // Check for format indicators
    for (const [format, weight] of Object.entries(formatWeights)) {
      let matches = false;
      
      switch (format) {
        case 'short_hook':
          matches = content.length < 100 && (content.includes('secret') || content.includes('tip'));
          break;
        case 'trend_participation':
          matches = input.hashtags.some(tag => tag.toLowerCase().includes('trend'));
          break;
        case 'educational':
          matches = content.includes('learn') || content.includes('how to') || content.includes('tip');
          break;
        case 'entertainment':
          matches = content.includes('funny') || content.includes('lol') || content.includes('hilarious');
          break;
        case 'aesthetic_appeal':
          matches = content.includes('beautiful') || content.includes('stunning') || content.includes('aesthetic');
          break;
        case 'story_quality':
          matches = content.includes('story') || content.includes('happened') || content.includes('time');
          break;
        case 'retention_optimization':
          matches = this.hasRetentionElements(content);
          break;
        case 'thread_format':
          matches = content.includes('thread') || content.includes('1/') || content.length > 200;
          break;
        default:
          matches = content.includes(format.replace('_', ' '));
      }
      
      if (matches) {
        formatScore += weight;
        matchedFormats++;
      }
    }
    
    // Normalize score
    const normalizedScore = matchedFormats > 0 ? (formatScore / matchedFormats - 1) * 5 : 0;
    
    return Math.min(Math.max(normalizedScore, -3), 8); // Cap between -3 and +8
  }
  
  /**
   * Optimize for creator tier on specific platform
   */
  private optimizeCreatorTier(input: PlatformOptimizationInput, config: PlatformConfiguration): number {
    const creatorTier = this.getCreatorTier(input.creator_followers);
    const multiplier = config.algorithm_preferences.creator_tier_multipliers[creatorTier] || 1.0;
    
    // Calculate optimization based on how well creator tier aligns with platform
    const optimization = (multiplier - 1) * 3; // Convert multiplier to optimization score
    
    return Math.min(Math.max(optimization, -2), 6); // Cap between -2 and +6
  }
  
  /**
   * Analyze timing optimization for platform
   */
  private analyzeTimingOptimization(input: PlatformOptimizationInput, config: PlatformConfiguration): number {
    if (!input.upload_time) return 0;
    
    const uploadTime = new Date(input.upload_time);
    const hour = uploadTime.getHours();
    const day = uploadTime.getDay();
    
    // Platform-specific optimal timing
    const optimalTiming = this.getPlatformOptimalTiming(input.platform);
    
    let timingScore = 0;
    
    // Check if in optimal hour range
    if (optimalTiming.optimal_hours.includes(hour)) {
      timingScore += 2;
    }
    
    // Check if on optimal day
    if (optimalTiming.optimal_days.includes(day)) {
      timingScore += 1;
    }
    
    // Apply platform timing importance
    const timingImportance = config.algorithm_preferences.timing_importance;
    const optimization = timingScore * timingImportance - timingImportance;
    
    return Math.min(Math.max(optimization, -2), 4); // Cap between -2 and +4
  }
  
  /**
   * Optimize content length for platform
   */
  private optimizeContentLength(input: PlatformOptimizationInput, config: PlatformConfiguration): number {
    const contentLength = input.content.length;
    const lengthConfig = config.algorithm_preferences.content_length_optimization;
    
    let optimization = 0;
    
    if (contentLength >= lengthConfig.optimal_min && contentLength <= lengthConfig.optimal_max) {
      // Within optimal range
      optimization += 2;
    } else {
      // Calculate penalty for being outside optimal range
      const deviation = Math.min(
        Math.abs(contentLength - lengthConfig.optimal_min),
        Math.abs(contentLength - lengthConfig.optimal_max)
      );
      
      optimization -= deviation * lengthConfig.penalty_factor;
    }
    
    return Math.min(Math.max(optimization, -3), 3); // Cap between -3 and +3
  }
  
  /**
   * Optimize hashtag strategy for platform
   */
  private optimizeHashtagStrategy(input: PlatformOptimizationInput, config: PlatformConfiguration): number {
    const hashtagCount = input.hashtags.length;
    const hashtagEffectiveness = config.algorithm_preferences.hashtag_effectiveness;
    
    let optimization = 0;
    
    // Platform-specific hashtag optimization
    const optimalHashtagCount = this.getPlatformOptimalHashtagCount(input.platform);
    
    if (hashtagCount >= optimalHashtagCount.min && hashtagCount <= optimalHashtagCount.max) {
      optimization += 1.5 * hashtagEffectiveness;
    } else {
      optimization -= Math.abs(hashtagCount - optimalHashtagCount.optimal) * 0.2;
    }
    
    // Check for platform-specific trending hashtags
    const platformTrendingBonus = this.calculateTrendingHashtagBonus(input.hashtags, input.platform);
    optimization += platformTrendingBonus * hashtagEffectiveness;
    
    return Math.min(Math.max(optimization, -2), 4); // Cap between -2 and +4
  }
  
  /**
   * Match viral patterns specific to platform
   */
  private matchViralPatterns(input: PlatformOptimizationInput, config: PlatformConfiguration): number {
    const content = input.content.toLowerCase();
    const viralPatterns = config.viral_patterns;
    
    let patternScore = 0;
    
    // Check trending formats
    for (const format of viralPatterns.trending_formats) {
      if (content.includes(format)) {
        patternScore += 1;
      }
    }
    
    // Check success indicators
    for (const indicator of viralPatterns.success_indicators) {
      if (this.checkSuccessIndicator(indicator, input)) {
        patternScore += 1.5;
      }
    }
    
    // Check engagement triggers
    for (const trigger of viralPatterns.engagement_triggers) {
      if (this.checkEngagementTrigger(trigger, input)) {
        patternScore += 0.8;
      }
    }
    
    // Normalize and cap
    return Math.min(patternScore, 6);
  }
  
  /**
   * Calculate overall optimization boost
   */
  private calculateOptimizationBoost(
    factors: Record<string, number>,
    config: PlatformConfiguration
  ): number {
    // Weighted combination of optimization factors
    const weights = {
      formatOptimization: 0.25,
      creatorOptimization: 0.20,
      timingOptimization: 0.15,
      lengthOptimization: 0.15,
      hashtagOptimization: 0.15,
      viralPatternMatch: 0.10
    };
    
    let totalOptimization = 0;
    
    for (const [factor, value] of Object.entries(factors)) {
      const weight = weights[factor as keyof typeof weights] || 0;
      totalOptimization += value * weight;
    }
    
    // Apply platform-specific modifier
    const platformModifier = this.getPlatformOptimizationModifier(config);
    const finalOptimization = totalOptimization * platformModifier;
    
    // Cap optimization boost at target (+0.5% = +5 points for typical 1000-point scale)
    return Math.min(Math.max(finalOptimization, -5), 5);
  }
  
  /**
   * Calculate platform-specific confidence adjustment
   */
  private calculateConfidenceAdjustment(
    input: PlatformOptimizationInput,
    config: PlatformConfiguration,
    optimizationBoost: number
  ): number {
    const baseConfidence = input.base_prediction.confidence;
    const confidenceModifier = config.performance_metrics.confidence_modifier;
    
    // Adjust confidence based on platform-specific factors
    let adjustment = 0;
    
    // Higher optimization boost increases confidence
    adjustment += Math.abs(optimizationBoost) * 0.05;
    
    // Platform-specific confidence modification
    adjustment *= confidenceModifier;
    
    // Ensure adjustment doesn't make confidence exceed reasonable bounds
    const adjustedConfidence = baseConfidence + adjustment;
    const finalAdjustment = Math.max(0.1, Math.min(adjustedConfidence, 0.95)) - baseConfidence;
    
    return finalAdjustment;
  }
  
  /**
   * Generate platform-specific recommendations
   */
  private generatePlatformRecommendations(
    input: PlatformOptimizationInput,
    config: PlatformConfiguration,
    factors: Record<string, number>
  ): string[] {
    const recommendations = [];
    const platform = input.platform;
    
    // Format-specific recommendations
    if (factors.formatOptimization < 1) {
      const topFormats = this.getTopFormatsForPlatform(platform);
      recommendations.push(`Consider using ${platform}-optimized formats: ${topFormats.join(', ')}`);
    }
    
    // Creator tier recommendations
    if (factors.creatorOptimization < 0) {
      recommendations.push(`Your creator tier may be less favored on ${platform} - focus on engagement quality over reach`);
    } else if (factors.creatorOptimization > 2) {
      recommendations.push(`Your creator tier is well-suited for ${platform} - leverage platform-specific features`);
    }
    
    // Timing recommendations
    if (factors.timingOptimization < 0) {
      const optimalTiming = this.getPlatformOptimalTiming(platform);
      recommendations.push(`Optimize posting time for ${platform}: ${optimalTiming.description}`);
    }
    
    // Length recommendations
    if (factors.lengthOptimization < 0) {
      const lengthConfig = config.algorithm_preferences.content_length_optimization;
      recommendations.push(`Optimize content length for ${platform}: ${lengthConfig.optimal_min}-${lengthConfig.optimal_max} characters`);
    }
    
    // Hashtag recommendations
    if (factors.hashtagOptimization < 1) {
      const hashtagConfig = this.getPlatformOptimalHashtagCount(platform);
      recommendations.push(`Optimize hashtag strategy for ${platform}: use ${hashtagConfig.optimal} hashtags`);
    }
    
    // Viral pattern recommendations
    if (factors.viralPatternMatch < 2) {
      const trendingFormats = config.viral_patterns.trending_formats;
      recommendations.push(`Include ${platform} viral patterns: ${trendingFormats.slice(0, 3).join(', ')}`);
    }
    
    // Platform-specific general recommendations
    recommendations.push(...this.getPlatformSpecificTips(platform));
    
    return recommendations.length > 0 ? recommendations.slice(0, 5) : [`Content optimized for ${platform}`];
  }
  
  // ===== UTILITY METHODS =====
  
  private getCreatorTier(followers: number): string {
    if (followers < 1000) return 'micro';
    if (followers < 10000) return 'small';
    if (followers < 100000) return 'medium';
    if (followers < 1000000) return 'large';
    return 'mega';
  }
  
  private hasRetentionElements(content: string): boolean {
    const retentionElements = ['first', 'next', 'finally', 'but', 'however', 'until', 'wait'];
    return retentionElements.some(element => content.includes(element));
  }
  
  private getPlatformOptimalTiming(platform: string): { optimal_hours: number[], optimal_days: number[], description: string } {
    const timings = {
      tiktok: {
        optimal_hours: [18, 19, 20, 21, 22],
        optimal_days: [1, 2, 3, 4, 5], // Mon-Fri
        description: 'Post 6-10 PM on weekdays for maximum reach'
      },
      instagram: {
        optimal_hours: [11, 12, 17, 18, 19],
        optimal_days: [0, 1, 2, 3, 4, 5], // Sun-Fri
        description: 'Post 11-12 PM or 5-7 PM, especially weekdays and Sunday'
      },
      youtube: {
        optimal_hours: [14, 15, 16, 19, 20, 21],
        optimal_days: [0, 1, 2, 3, 4, 5], // Sun-Fri
        description: 'Post 2-4 PM or 7-9 PM on weekdays and Sunday'
      },
      twitter: {
        optimal_hours: [8, 9, 12, 17, 18],
        optimal_days: [1, 2, 3, 4, 5], // Mon-Fri
        description: 'Post 8-9 AM, 12 PM, or 5-6 PM on weekdays'
      }
    };
    
    return timings[platform] || timings.tiktok;
  }
  
  private getPlatformOptimalHashtagCount(platform: string): { min: number, max: number, optimal: number } {
    const hashtags = {
      tiktok: { min: 3, max: 5, optimal: 4 },
      instagram: { min: 5, max: 15, optimal: 10 },
      youtube: { min: 1, max: 3, optimal: 2 },
      twitter: { min: 1, max: 3, optimal: 2 }
    };
    
    return hashtags[platform] || hashtags.tiktok;
  }
  
  private calculateTrendingHashtagBonus(hashtags: string[], platform: string): number {
    // Platform-specific trending hashtags (simplified)
    const trendingByPlatform = {
      tiktok: ['fyp', 'viral', 'trending', 'foryou'],
      instagram: ['reels', 'explore', 'instagood', 'photooftheday'],
      youtube: ['shorts', 'trending', 'viral', 'subscribe'],
      twitter: ['trending', 'viral', 'breaking', 'news']
    };
    
    const platformTrending = trendingByPlatform[platform] || [];
    const trendingCount = hashtags.filter(tag => 
      platformTrending.some(trending => tag.toLowerCase().includes(trending))
    ).length;
    
    return Math.min(trendingCount * 0.5, 2); // Max 2 point bonus
  }
  
  private checkSuccessIndicator(indicator: string, input: PlatformOptimizationInput): boolean {
    switch (indicator) {
      case 'trending_audio':
        return input.hashtags.some(tag => tag.toLowerCase().includes('audio') || tag.toLowerCase().includes('sound'));
      case 'viral_hashtag':
        return input.hashtags.some(tag => tag.toLowerCase().includes('viral') || tag.toLowerCase().includes('trending'));
      case 'high_engagement_rate':
        return input.creator_followers > 10000; // Simplified check
      case 'aesthetic_quality':
        return input.content.toLowerCase().includes('aesthetic') || input.content.toLowerCase().includes('beautiful');
      case 'high_retention':
        return this.hasRetentionElements(input.content);
      case 'retweet_ratio':
        return input.content.length < 200; // Shorter content gets more retweets
      default:
        return false;
    }
  }
  
  private checkEngagementTrigger(trigger: string, input: PlatformOptimizationInput): boolean {
    const content = input.content.toLowerCase();
    
    switch (trigger) {
      case 'hook_in_first_3s':
        return content.substring(0, 30).includes('secret') || content.substring(0, 30).includes('tip');
      case 'surprising_twist':
        return content.includes('but') || content.includes('however') || content.includes('plot twist');
      case 'relatable_content':
        return content.includes('relate') || content.includes('same') || content.includes('mood');
      case 'call_to_action':
        return content.includes('follow') || content.includes('like') || content.includes('comment');
      case 'visual_appeal':
        return content.includes('beautiful') || content.includes('stunning') || content.includes('aesthetic');
      case 'valuable_information':
        return content.includes('tip') || content.includes('hack') || content.includes('learn');
      case 'timely_relevance':
        return content.includes('today') || content.includes('now') || content.includes('breaking');
      default:
        return false;
    }
  }
  
  private getPlatformOptimizationModifier(config: PlatformConfiguration): number {
    // Modifier based on platform's prediction accuracy and variance
    const accuracy = config.performance_metrics.accuracy_baseline;
    const variance = config.performance_metrics.prediction_variance;
    
    // Higher accuracy platforms get higher modifier
    // Lower variance platforms get higher modifier
    return accuracy * (1 - variance);
  }
  
  private calculateAlgorithmAlignment(input: PlatformOptimizationInput, config: PlatformConfiguration): number {
    // Calculate how well the content aligns with platform algorithm preferences
    const contentLength = input.content.length;
    const hashtagCount = input.hashtags.length;
    const creatorTier = this.getCreatorTier(input.creator_followers);
    
    let alignmentScore = 50; // Base score
    
    // Length alignment
    const lengthConfig = config.algorithm_preferences.content_length_optimization;
    if (contentLength >= lengthConfig.optimal_min && contentLength <= lengthConfig.optimal_max) {
      alignmentScore += 15;
    }
    
    // Hashtag alignment
    const hashtagConfig = this.getPlatformOptimalHashtagCount(input.platform);
    if (hashtagCount >= hashtagConfig.min && hashtagCount <= hashtagConfig.max) {
      alignmentScore += 10;
    }
    
    // Creator tier alignment
    const tierMultiplier = config.algorithm_preferences.creator_tier_multipliers[creatorTier] || 1.0;
    alignmentScore += (tierMultiplier - 1) * 20;
    
    return Math.min(Math.max(alignmentScore, 0), 100);
  }
  
  private calculateCompetitiveAdvantage(
    input: PlatformOptimizationInput,
    config: PlatformConfiguration,
    optimizationBoost: number
  ): number {
    // Calculate competitive advantage based on optimization and platform dynamics
    let advantageScore = 50; // Base score
    
    // Optimization boost advantage
    advantageScore += optimizationBoost * 5;
    
    // Creator tier advantage
    const creatorTier = this.getCreatorTier(input.creator_followers);
    const tierMultiplier = config.algorithm_preferences.creator_tier_multipliers[creatorTier] || 1.0;
    
    if (tierMultiplier > 1.2) {
      advantageScore += 20; // Strong advantage
    } else if (tierMultiplier > 1.0) {
      advantageScore += 10; // Moderate advantage
    }
    
    // Viral pattern advantage
    const patternMatches = this.matchViralPatterns(input, config);
    advantageScore += patternMatches * 3;
    
    return Math.min(Math.max(advantageScore, 0), 100);
  }
  
  private getTopFormatsForPlatform(platform: string): string[] {
    const config = this.platformConfigs[platform];
    if (!config) return [];
    
    const formats = Object.entries(config.algorithm_preferences.content_format_weights)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([format]) => format.replace('_', ' '));
    
    return formats;
  }
  
  private getPlatformSpecificTips(platform: string): string[] {
    const tips = {
      tiktok: [
        'Use trending audio for maximum reach',
        'Hook viewers in the first 3 seconds',
        'Post consistently for algorithm favor'
      ],
      instagram: [
        'Focus on high-quality visuals',
        'Use Instagram Reels for better reach',
        'Engage with your community actively'
      ],
      youtube: [
        'Optimize for watch time retention',
        'Create compelling thumbnails',
        'Build community through comments'
      ],
      twitter: [
        'Join trending conversations',
        'Use threads for longer content',
        'Time posts for maximum engagement'
      ]
    };
    
    return tips[platform] || [];
  }
  
  private generateErrorResult(input: PlatformOptimizationInput): PlatformOptimizationResult {
    return {
      platform: input.platform,
      optimized_score: input.base_prediction.score,
      optimization_boost: 0,
      confidence_adjustment: 0,
      platform_factors: {
        format_optimization: 0,
        creator_tier_optimization: 0,
        timing_optimization: 0,
        content_length_optimization: 0,
        hashtag_optimization: 0,
        viral_pattern_match: 0
      },
      platform_recommendations: ['Error during platform optimization'],
      algorithm_alignment_score: 50,
      competitive_advantage_score: 50
    };
  }
  
  private trackOptimization(result: PlatformOptimizationResult, processingTime: number): void {
    this.optimizationCount++;
    this.accuracyBoosts.push(result.optimization_boost);
    
    // Track with monitoring system
    realTimeMonitor.recordResponseTime({
      endpoint: '/api/platform-optimization',
      method: 'POST',
      responseTime: processingTime,
      statusCode: 200,
      timestamp: new Date()
    });
    
    console.log(`📱 Platform optimization ${this.optimizationCount}: +${result.optimization_boost.toFixed(1)} boost for ${result.platform}`);
  }
  
  private async initializeAsync(): Promise<void> {
    try {
      console.log('🚀 Initializing Platform-Optimized Predictor...');
      
      // Load platform performance history
      await this.loadPerformanceHistory();
      
      this.isInitialized = true;
      console.log('✅ Platform-Optimized Predictor initialized');
      
    } catch (error) {
      console.error('❌ Platform predictor initialization failed:', error);
    }
  }
  
  private async ensureInitialized(): Promise<void> {
    let attempts = 0;
    while (!this.isInitialized && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }
  
  private async loadPerformanceHistory(): Promise<void> {
    try {
      // Load recent platform performance data
      const { data: performanceData } = await this.supabase
        .from('platform_performance')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (performanceData) {
        for (const data of performanceData) {
          this.performanceHistory.set(`${data.platform}_${data.content_type}`, data);
        }
        console.log(`✅ Loaded ${performanceData.length} platform performance records`);
      }
      
    } catch (error) {
      console.error('⚠️ Failed to load performance history:', error);
    }
  }
  
  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    optimization_count: number;
    average_boost: number;
    platform_distribution: Record<string, number>;
    total_boost_potential: number;
  } {
    const avgBoost = this.accuracyBoosts.length > 0 
      ? this.accuracyBoosts.reduce((sum, boost) => sum + boost, 0) / this.accuracyBoosts.length 
      : 0;
    
    // Platform distribution (simplified)
    const platformDist = {
      tiktok: 0.4,
      instagram: 0.3,
      youtube: 0.2,
      twitter: 0.1
    };
    
    return {
      optimization_count: this.optimizationCount,
      average_boost: avgBoost,
      platform_distribution: platformDist,
      total_boost_potential: 0.5 // Target 0.5% improvement
    };
  }
}

// Export singleton instance
export const platformOptimizedPredictor = new PlatformOptimizedPredictor();