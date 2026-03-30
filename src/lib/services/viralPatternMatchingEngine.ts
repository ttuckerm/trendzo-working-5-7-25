/**
 * TRENDZO Viral Pattern Matching Engine
 * 
 * This engine analyzes video content against known viral patterns to:
 * 1. Identify which viral frameworks are being used
 * 2. Calculate pattern match confidence scores
 * 3. Determine viral potential of content
 * 4. Generate improvement recommendations
 * 
 * Based on the comprehensive viral intelligence blueprint
 */

import { ViralFrameworkEngine, ViralFramework } from './viralFrameworkEngine';
import { Platform } from '@/lib/types/database';

export interface VideoContent {
  id: string;
  sourceUrl: string;
  platform: Platform;
  title?: string;
  description?: string;
  transcript?: string;
  duration: number;
  creatorUsername: string;
  creatorFollowerCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  uploadDate: Date;
  hashtags: string[];
  visualElements?: string[];
  audioAnalysis?: {
    tempo?: number;
    mood?: string;
    musicGenre?: string;
    hasOriginalAudio?: boolean;
  };
}

export interface PatternMatch {
  patternId: string;
  patternName: string;
  frameworkId: string;
  frameworkName: string;
  confidenceScore: number; // 0-1
  matchSegments: Array<{
    startTime: number;
    endTime: number;
    element: string;
    description: string;
  }>;
  contributingFactors: string[];
  engagementContribution: number; // Estimated percentage of engagement due to this pattern
}

export interface ViralAnalysis {
  videoId: string;
  overallViralScore: number; // 0-100
  viralPotential: 'low' | 'medium' | 'high' | 'extremely_high';
  patternMatches: PatternMatch[];
  recommendations: string[];
  improvementAreas: string[];
  platformOptimizations: Record<Platform, string[]>;
  confidence: number; // Overall confidence in analysis
}

export class ViralPatternMatchingEngine {
  private static instance: ViralPatternMatchingEngine;
  private viralEngine: ViralFrameworkEngine;
  private patterns: Map<string, ViralPattern> = new Map();

  private constructor() {
    this.viralEngine = ViralFrameworkEngine.getInstance();
    this.initializePatterns();
  }

  public static getInstance(): ViralPatternMatchingEngine {
    if (!ViralPatternMatchingEngine.instance) {
      ViralPatternMatchingEngine.instance = new ViralPatternMatchingEngine();
    }
    return ViralPatternMatchingEngine.instance;
  }

  /**
   * Analyze video content for viral patterns
   */
  public async analyzeVideo(video: VideoContent): Promise<ViralAnalysis> {
    try {
      console.log(`🔍 Analyzing video: ${video.id} for viral patterns`);

      // 1. Extract analyzable text content
      const textContent = this.extractTextContent(video);
      
      // 2. Analyze against each viral pattern
      const patternMatches: PatternMatch[] = [];
      
      for (const [patternId, pattern] of this.patterns) {
        if (pattern.platforms.includes(video.platform)) {
          const match = await this.analyzeAgainstPattern(video, pattern, textContent);
          if (match && match.confidenceScore > 0.3) { // Only include confident matches
            patternMatches.push(match);
          }
        }
      }

      // 3. Calculate overall viral score
      const viralScore = await this.calculateViralScore(video, patternMatches);
      
      // 4. Generate recommendations
      const recommendations = await this.generateRecommendations(video, patternMatches);
      
      // 5. Identify improvement areas
      const improvementAreas = this.identifyImprovementAreas(video, patternMatches);
      
      // 6. Platform-specific optimizations
      const platformOptimizations = this.generatePlatformOptimizations(video, patternMatches);

      const analysis: ViralAnalysis = {
        videoId: video.id,
        overallViralScore: viralScore,
        viralPotential: this.determineViralPotential(viralScore),
        patternMatches: patternMatches.sort((a, b) => b.confidenceScore - a.confidenceScore),
        recommendations,
        improvementAreas,
        platformOptimizations,
        confidence: this.calculateOverallConfidence(patternMatches)
      };

      console.log(`✅ Analysis complete for ${video.id}: ${viralScore}/100 viral score`);
      return analysis;

    } catch (error) {
      console.error('Error analyzing video for viral patterns:', error);
      throw new Error('Failed to analyze video for viral patterns');
    }
  }

  /**
   * Analyze video against a specific viral pattern
   */
  private async analyzeAgainstPattern(
    video: VideoContent, 
    pattern: ViralPattern, 
    textContent: string
  ): Promise<PatternMatch | null> {
    try {
      let confidenceScore = 0;
      const matchSegments: PatternMatch['matchSegments'] = [];
      const contributingFactors: string[] = [];

      // Text-based pattern matching
      if (pattern.triggerWords.length > 0) {
        const textMatches = this.findTextMatches(textContent, pattern.triggerWords);
        if (textMatches.length > 0) {
          confidenceScore += 0.3;
          contributingFactors.push(`Text triggers: ${textMatches.join(', ')}`);
          
          // Add timing for text matches (simplified)
          textMatches.forEach((match, index) => {
            matchSegments.push({
              startTime: Math.min(index * 5, video.duration - 3),
              endTime: Math.min((index + 1) * 5, video.duration),
              element: 'text',
              description: `Text pattern: "${match}"`
            });
          });
        }
      }

      // Visual element matching
      if (video.visualElements && pattern.visualElements.length > 0) {
        const visualMatches = video.visualElements.filter(element => 
          pattern.visualElements.includes(element)
        );
        if (visualMatches.length > 0) {
          confidenceScore += (visualMatches.length / pattern.visualElements.length) * 0.4;
          contributingFactors.push(`Visual elements: ${visualMatches.join(', ')}`);
        }
      }

      // Timing requirements matching
      if (pattern.timingRequirements) {
        const timingMatch = this.analyzeTimingRequirements(video, pattern.timingRequirements);
        confidenceScore += timingMatch.score;
        if (timingMatch.factors.length > 0) {
          contributingFactors.push(...timingMatch.factors);
        }
      }

      // Engagement pattern matching
      const engagementMatch = this.analyzeEngagementPattern(video, pattern);
      confidenceScore += engagementMatch.score;
      contributingFactors.push(...engagementMatch.factors);

      // Framework-specific analysis
      const framework = await this.viralEngine.getFrameworkById(pattern.frameworkId);
      if (framework) {
        const frameworkMatch = this.analyzeFrameworkAlignment(video, framework);
        confidenceScore += frameworkMatch.score;
        contributingFactors.push(...frameworkMatch.factors);
      }

      // Normalize confidence score
      confidenceScore = Math.min(1, Math.max(0, confidenceScore));

      if (confidenceScore < 0.3) {
        return null; // Not confident enough
      }

      // Estimate engagement contribution
      const engagementContribution = this.estimateEngagementContribution(
        video, 
        pattern, 
        confidenceScore
      );

      return {
        patternId: pattern.id,
        patternName: pattern.name,
        frameworkId: pattern.frameworkId,
        frameworkName: framework?.name || 'Unknown',
        confidenceScore,
        matchSegments,
        contributingFactors,
        engagementContribution
      };

    } catch (error) {
      console.error(`Error analyzing pattern ${pattern.id}:`, error);
      return null;
    }
  }

  /**
   * Calculate overall viral score based on pattern matches and video metrics
   */
  private async calculateViralScore(video: VideoContent, matches: PatternMatch[]): Promise<number> {
    let baseScore = 0;

    // Base score from engagement metrics
    const engagementRate = video.viewCount > 0 ? 
      (video.likeCount + video.commentCount + video.shareCount) / video.viewCount : 0;
    
    baseScore += Math.min(40, engagementRate * 10000); // Up to 40 points for engagement

    // Score from view velocity
    const hoursElapsed = (Date.now() - video.uploadDate.getTime()) / (1000 * 60 * 60);
    const viewVelocity = hoursElapsed > 0 ? video.viewCount / hoursElapsed : 0;
    baseScore += Math.min(20, Math.log10(viewVelocity + 1) * 5); // Up to 20 points for velocity

    // Score from pattern matches
    const patternScore = matches.reduce((sum, match) => {
      return sum + (match.confidenceScore * match.engagementContribution / 100 * 40);
    }, 0);

    return Math.min(100, Math.max(0, baseScore + patternScore));
  }

  /**
   * Generate recommendations based on analysis
   */
  private async generateRecommendations(
    video: VideoContent, 
    matches: PatternMatch[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Pattern-based recommendations
    if (matches.length === 0) {
      recommendations.push('Consider incorporating proven viral patterns like curiosity gaps or story arcs');
      recommendations.push('Add a stronger hook in the first 3 seconds');
    } else {
      const bestMatch = matches[0];
      recommendations.push(`Strong use of ${bestMatch.frameworkName} - consider amplifying this pattern`);
      
      if (bestMatch.confidenceScore < 0.7) {
        recommendations.push(`Improve ${bestMatch.patternName} implementation for better viral potential`);
      }
    }

    // Platform-specific recommendations
    const platformTips = this.getPlatformSpecificTips(video.platform);
    recommendations.push(...platformTips);

    // Engagement-based recommendations
    const engagementRate = video.viewCount > 0 ? 
      (video.likeCount + video.commentCount) / video.viewCount : 0;
    
    if (engagementRate < 0.03) {
      recommendations.push('Add more interactive elements to boost engagement');
      recommendations.push('Include clear call-to-action to encourage comments');
    }

    // Duration recommendations
    const optimalDuration = this.getOptimalDuration(video.platform);
    if (video.duration < optimalDuration.min) {
      recommendations.push(`Consider extending video to at least ${optimalDuration.min} seconds`);
    } else if (video.duration > optimalDuration.max) {
      recommendations.push(`Consider shortening video to under ${optimalDuration.max} seconds for better retention`);
    }

    return recommendations.slice(0, 8); // Limit to top 8 recommendations
  }

  /**
   * Initialize viral patterns from frameworks
   */
  private initializePatterns(): void {
    const frameworks = this.viralEngine.getAllFrameworks();
    
    frameworks.forEach(framework => {
      // Create patterns for each framework
      this.createPatternsFromFramework(framework);
    });

    console.log(`🔧 Initialized ${this.patterns.size} viral patterns for analysis`);
  }

  /**
   * Create specific patterns from a viral framework
   */
  private createPatternsFromFramework(framework: ViralFramework): void {
    // Hook patterns
    this.patterns.set(`${framework.id}_hook`, {
      id: `${framework.id}_hook`,
      name: `${framework.name} Hook`,
      frameworkId: framework.id,
      type: 'hook',
      platforms: ['instagram', 'tiktok', 'youtube', 'linkedin'],
      triggerWords: framework.triggers || [],
      visualElements: framework.visualCues || [],
      timingRequirements: {
        minDuration: 3,
        maxDuration: 8,
        peakMoment: 3
      },
      successRate: framework.effectiveness.instagram || 70
    });

    // Content structure patterns
    if (framework.structure) {
      this.patterns.set(`${framework.id}_structure`, {
        id: `${framework.id}_structure`,
        name: `${framework.name} Structure`,
        frameworkId: framework.id,
        type: 'full_structure',
        platforms: ['instagram', 'tiktok', 'youtube'],
        triggerWords: framework.transitions || [],
        visualElements: framework.visualCues || [],
        timingRequirements: {
          minDuration: 15,
          maxDuration: 60,
          peakMoment: 30
        },
        successRate: framework.effectiveness.instagram || 70
      });
    }
  }

  // Helper methods
  private extractTextContent(video: VideoContent): string {
    const parts = [
      video.title || '',
      video.description || '',
      video.transcript || '',
      video.hashtags.join(' ')
    ];
    return parts.join(' ').toLowerCase();
  }

  private findTextMatches(text: string, triggerWords: string[]): string[] {
    return triggerWords.filter(trigger => 
      text.includes(trigger.toLowerCase())
    );
  }

  private analyzeTimingRequirements(video: VideoContent, timing: any): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    if (video.duration >= timing.minDuration && video.duration <= timing.maxDuration) {
      score += 0.2;
      factors.push('Optimal duration');
    }

    return { score, factors };
  }

  private analyzeEngagementPattern(video: VideoContent, pattern: ViralPattern): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    const engagementRate = video.viewCount > 0 ? 
      (video.likeCount + video.commentCount + video.shareCount) / video.viewCount : 0;

    if (engagementRate > 0.05) {
      score += 0.2;
      factors.push('High engagement rate');
    }

    return { score, factors };
  }

  private analyzeFrameworkAlignment(video: VideoContent, framework: ViralFramework): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    // Check platform effectiveness
    const platformEffectiveness = framework.effectiveness[video.platform] || 0;
    if (platformEffectiveness > 70) {
      score += 0.1;
      factors.push(`Strong framework for ${video.platform}`);
    }

    return { score, factors };
  }

  private estimateEngagementContribution(video: VideoContent, pattern: ViralPattern, confidence: number): number {
    // Estimate what percentage of engagement this pattern contributed
    return Math.min(100, confidence * pattern.successRate);
  }

  private determineViralPotential(score: number): ViralAnalysis['viralPotential'] {
    if (score >= 85) return 'extremely_high';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private calculateOverallConfidence(matches: PatternMatch[]): number {
    if (matches.length === 0) return 0.3;
    return matches.reduce((sum, match) => sum + match.confidenceScore, 0) / matches.length;
  }

  private identifyImprovementAreas(video: VideoContent, matches: PatternMatch[]): string[] {
    const areas: string[] = [];

    if (matches.length === 0) {
      areas.push('No viral patterns detected - add proven frameworks');
    }

    if (video.duration < 15) {
      areas.push('Video too short for full story development');
    }

    if (video.hashtags.length < 3) {
      areas.push('Add more relevant hashtags for discoverability');
    }

    return areas;
  }

  private generatePlatformOptimizations(video: VideoContent, matches: PatternMatch[]): Record<Platform, string[]> {
    const optimizations: Record<Platform, string[]> = {
      instagram: ['Use 9:16 vertical format', 'Add trending audio', 'Post during peak hours'],
      tiktok: ['Keep under 60 seconds', 'Use trending sounds', 'Add captions'],
      youtube: ['Create compelling thumbnail', 'Optimize title for search', 'Add end screen'],
      linkedin: ['Professional tone', 'Industry hashtags', 'Post on weekdays'],
      twitter: ['Thread for longer content', 'Use trending hashtags', 'Engage in replies'],
      facebook: ['Native video upload', 'Community-focused content', 'Cross-post to groups']
    };

    return optimizations;
  }

  private getPlatformSpecificTips(platform: Platform): string[] {
    const tips = {
      instagram: ['Use trending audio for better reach', 'Add interactive stickers to stories'],
      tiktok: ['Jump on trending challenges', 'Use duet and stitch features'],
      youtube: ['Create eye-catching thumbnails', 'Optimize for search with keywords'],
      linkedin: ['Share professional insights', 'Engage with industry discussions'],
      twitter: ['Use relevant trending hashtags', 'Engage with current events'],
      facebook: ['Create shareable content', 'Use Facebook Live for engagement']
    };

    return tips[platform] || [];
  }

  private getOptimalDuration(platform: Platform): { min: number; max: number } {
    const durations = {
      instagram: { min: 15, max: 30 },
      tiktok: { min: 15, max: 60 },
      youtube: { min: 60, max: 600 },
      linkedin: { min: 30, max: 90 },
      twitter: { min: 15, max: 140 },
      facebook: { min: 30, max: 120 }
    };

    return durations[platform] || { min: 15, max: 60 };
  }
}

interface ViralPattern {
  id: string;
  name: string;
  frameworkId: string;
  type: 'hook' | 'transition' | 'climax' | 'call_to_action' | 'full_structure';
  platforms: Platform[];
  triggerWords: string[];
  visualElements: string[];
  timingRequirements: {
    minDuration: number;
    maxDuration: number;
    peakMoment: number;
  };
  successRate: number; // Percentage success rate
}

// Export singleton instance
export const viralPatternMatchingEngine = ViralPatternMatchingEngine.getInstance();