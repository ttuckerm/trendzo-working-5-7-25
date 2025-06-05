/**
 * TRENDZO Viral Template Generation Service
 * 
 * This service converts approved viral videos into reusable templates by:
 * 1. Analyzing viral pattern matches
 * 2. Extracting template structure
 * 3. Creating personalization options
 * 4. Generating usage instructions
 * 5. Predicting viral potential
 * 
 * Based on the comprehensive viral intelligence blueprint
 */

import { ViralFrameworkEngine } from './viralFrameworkEngine';
import { viralPatternMatchingEngine, VideoContent, PatternMatch } from './viralPatternMatchingEngine';
import { Platform } from '@/lib/types/database';

export interface GeneratedTemplate {
  id: string;
  sourceVideoId: string;
  primaryPatternId: string;
  templateName: string;
  templateDescription: string;
  targetPlatform: Platform;
  targetNiche: string;
  
  // Template Structure
  templateStructure: TemplateStructure;
  personalizationOptions: PersonalizationOptions;
  
  // Performance Predictions
  predictedViralScore: number;
  confidenceInterval: { min: number; max: number };
  targetDemographics: string[];
  optimalPostingTimes: string[];
  
  // Usage Tracking
  usageCount: number;
  successRate: number;
  avgPerformance: PerformanceMetrics;
  
  // Metadata
  isActive: boolean;
  qualityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateStructure {
  framework: string;
  duration: { min: number; max: number; optimal: number };
  sections: TemplateSection[];
  timing: TimingRequirements;
  visualElements: VisualElement[];
  audioRequirements: AudioRequirements;
  interactionPoints: InteractionPoint[];
}

export interface TemplateSection {
  id: string;
  type: 'hook' | 'setup' | 'conflict' | 'resolution' | 'cta';
  name: string;
  description: string;
  duration: { min: number; max: number };
  position: number; // 0-100 percentage through video
  
  // Content guidelines
  textGuidelines: {
    tone: string;
    keyWords: string[];
    avoidWords: string[];
    maxLength: number;
  };
  
  // Visual guidelines
  visualGuidelines: {
    shots: string[];
    lighting: string;
    composition: string;
    transitions: string[];
  };
  
  // Personalization variables
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'choice' | 'image' | 'brand';
  description: string;
  defaultValue: any;
  options?: any[];
  required: boolean;
  impact: 'low' | 'medium' | 'high'; // Impact on viral potential
}

export interface PersonalizationOptions {
  industry: {
    available: string[];
    default: string;
    impact: number; // 0-1 impact on success rate
  };
  tone: {
    available: ('professional' | 'casual' | 'creative' | 'inspiring' | 'educational')[];
    default: string;
    guidelines: Record<string, string>;
  };
  targetAudience: {
    demographics: string[];
    interests: string[];
    painPoints: string[];
  };
  brandCustomization: {
    logo: boolean;
    colors: boolean;
    fonts: boolean;
    messaging: boolean;
  };
  contentCustomization: {
    examples: string[];
    statistics: boolean;
    testimonials: boolean;
    callToAction: string[];
  };
}

export interface TimingRequirements {
  totalDuration: { min: number; max: number; optimal: number };
  hookDuration: { min: number; max: number };
  peakMoment: number; // Percentage through video
  ctaDuration: { min: number; max: number };
  pacing: 'slow' | 'medium' | 'fast';
}

export interface VisualElement {
  type: 'close_up' | 'wide_shot' | 'text_overlay' | 'transition' | 'b_roll';
  timing: number; // Percentage through video
  duration: number; // Seconds
  description: string;
  importance: 'required' | 'recommended' | 'optional';
}

export interface AudioRequirements {
  musicGenre?: string;
  tempo?: 'slow' | 'medium' | 'fast';
  mood: string;
  originalAudio: boolean;
  voiceover: {
    required: boolean;
    tone: string;
    pace: string;
  };
}

export interface InteractionPoint {
  timing: number; // Percentage through video
  type: 'comment_prompt' | 'share_prompt' | 'save_prompt' | 'follow_prompt';
  message: string;
  expectedEngagement: number; // Percentage lift
}

export interface PerformanceMetrics {
  avgViews: number;
  avgEngagementRate: number;
  avgViralScore: number;
  avgCompletionRate: number;
  platformPerformance: Record<Platform, number>;
}

export class ViralTemplateGenerationService {
  private static instance: ViralTemplateGenerationService;
  private viralEngine: ViralFrameworkEngine;

  private constructor() {
    this.viralEngine = ViralFrameworkEngine.getInstance();
  }

  public static getInstance(): ViralTemplateGenerationService {
    if (!ViralTemplateGenerationService.instance) {
      ViralTemplateGenerationService.instance = new ViralTemplateGenerationService();
    }
    return ViralTemplateGenerationService.instance;
  }

  /**
   * Generate template from approved viral video
   */
  public async generateTemplateFromVideo(
    video: VideoContent,
    patternAnalysis: { patternMatches: PatternMatch[]; viralScore: number }
  ): Promise<GeneratedTemplate> {
    try {
      console.log(`🎯 Generating template from viral video: ${video.id}`);

      // 1. Identify primary viral pattern
      const primaryPattern = this.identifyPrimaryPattern(patternAnalysis.patternMatches);
      if (!primaryPattern) {
        throw new Error('No viable viral pattern found for template generation');
      }

      // 2. Extract template structure
      const templateStructure = await this.extractTemplateStructure(video, primaryPattern);

      // 3. Create personalization options
      const personalizationOptions = await this.createPersonalizationOptions(
        video, 
        primaryPattern, 
        templateStructure
      );

      // 4. Generate performance predictions
      const predictions = await this.generatePerformancePredictions(
        video, 
        patternAnalysis, 
        templateStructure
      );

      // 5. Create template metadata
      const templateId = this.generateTemplateId();
      const templateName = this.generateTemplateName(video, primaryPattern);
      const templateDescription = this.generateTemplateDescription(video, primaryPattern);

      const template: GeneratedTemplate = {
        id: templateId,
        sourceVideoId: video.id,
        primaryPatternId: primaryPattern.patternId,
        templateName,
        templateDescription,
        targetPlatform: video.platform,
        targetNiche: this.determineTargetNiche(video),
        templateStructure,
        personalizationOptions,
        predictedViralScore: predictions.viralScore,
        confidenceInterval: predictions.confidenceInterval,
        targetDemographics: predictions.demographics,
        optimalPostingTimes: predictions.postingTimes,
        usageCount: 0,
        successRate: 0,
        avgPerformance: this.initializePerformanceMetrics(),
        isActive: true,
        qualityScore: this.calculateQualityScore(templateStructure, primaryPattern),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 6. Save to database
      await this.saveTemplateToDatabase(template);

      console.log(`✅ Template ${templateId} generated successfully`);
      return template;

    } catch (error) {
      console.error('Error generating template from video:', error);
      throw new Error('Failed to generate template from viral video');
    }
  }

  /**
   * Identify the primary viral pattern for template generation
   */
  private identifyPrimaryPattern(patternMatches: PatternMatch[]): PatternMatch | null {
    if (patternMatches.length === 0) return null;

    // Sort by confidence score and engagement contribution
    const sortedMatches = patternMatches.sort((a, b) => {
      const scoreA = a.confidenceScore * 0.6 + (a.engagementContribution / 100) * 0.4;
      const scoreB = b.confidenceScore * 0.6 + (b.engagementContribution / 100) * 0.4;
      return scoreB - scoreA;
    });

    // Return the best match if it meets minimum thresholds
    const bestMatch = sortedMatches[0];
    if (bestMatch.confidenceScore >= 0.7 && bestMatch.engagementContribution >= 30) {
      return bestMatch;
    }

    return null;
  }

  /**
   * Extract template structure from video and pattern
   */
  private async extractTemplateStructure(
    video: VideoContent, 
    pattern: PatternMatch
  ): Promise<TemplateStructure> {
    const framework = await this.viralEngine.getFrameworkById(pattern.frameworkId);
    
    // Create sections based on the viral framework
    const sections = this.createTemplateSections(video, pattern, framework);
    
    // Extract timing requirements
    const timing = this.extractTimingRequirements(video, pattern);
    
    // Identify visual elements
    const visualElements = this.identifyVisualElements(video, pattern);
    
    // Define audio requirements
    const audioRequirements = this.defineAudioRequirements(video);
    
    // Create interaction points
    const interactionPoints = this.createInteractionPoints(pattern, timing);

    return {
      framework: framework?.name || 'Custom',
      duration: {
        min: Math.max(15, video.duration - 10),
        max: Math.min(90, video.duration + 15),
        optimal: video.duration
      },
      sections,
      timing,
      visualElements,
      audioRequirements,
      interactionPoints
    };
  }

  /**
   * Create template sections based on viral framework
   */
  private createTemplateSections(
    video: VideoContent, 
    pattern: PatternMatch, 
    framework: any
  ): TemplateSection[] {
    const sections: TemplateSection[] = [];

    // Hook section (always first)
    sections.push({
      id: 'hook',
      type: 'hook',
      name: 'Hook',
      description: 'Grab attention in the first 3 seconds',
      duration: { min: 2, max: 5 },
      position: 0,
      textGuidelines: {
        tone: 'intriguing',
        keyWords: this.extractKeyWords(video.title || ''),
        avoidWords: ['maybe', 'probably', 'might'],
        maxLength: 50
      },
      visualGuidelines: {
        shots: ['close_up', 'dramatic_zoom'],
        lighting: 'bright',
        composition: 'center_focus',
        transitions: ['quick_cut']
      },
      variables: [
        {
          id: 'hook_statement',
          name: 'Hook Statement',
          type: 'text',
          description: 'Attention-grabbing opening statement',
          defaultValue: 'This will change everything...',
          required: true,
          impact: 'high'
        }
      ]
    });

    // Content sections based on framework structure
    if (framework?.structure) {
      this.addFrameworkSections(sections, framework, video);
    } else {
      // Default structure
      this.addDefaultSections(sections, video);
    }

    // Call-to-action section (always last)
    sections.push({
      id: 'cta',
      type: 'cta',
      name: 'Call to Action',
      description: 'Drive engagement and action',
      duration: { min: 3, max: 8 },
      position: 85,
      textGuidelines: {
        tone: 'actionable',
        keyWords: ['comment', 'share', 'follow', 'save'],
        avoidWords: ['forget to', 'don\'t forget'],
        maxLength: 30
      },
      visualGuidelines: {
        shots: ['medium_shot'],
        lighting: 'consistent',
        composition: 'direct_eye_contact',
        transitions: ['fade']
      },
      variables: [
        {
          id: 'cta_action',
          name: 'Call to Action',
          type: 'choice',
          description: 'What action should viewers take?',
          defaultValue: 'comment',
          options: ['comment', 'share', 'follow', 'save', 'like'],
          required: true,
          impact: 'medium'
        }
      ]
    });

    return sections;
  }

  /**
   * Create personalization options
   */
  private async createPersonalizationOptions(
    video: VideoContent,
    pattern: PatternMatch,
    structure: TemplateStructure
  ): Promise<PersonalizationOptions> {
    const targetNiche = this.determineTargetNiche(video);

    return {
      industry: {
        available: this.getRelatedIndustries(targetNiche),
        default: targetNiche,
        impact: 0.3
      },
      tone: {
        available: ['professional', 'casual', 'creative', 'inspiring', 'educational'],
        default: this.detectTone(video),
        guidelines: {
          professional: 'Formal, authoritative, data-driven',
          casual: 'Conversational, relatable, friendly',
          creative: 'Artistic, unique, experimental',
          inspiring: 'Motivational, uplifting, empowering',
          educational: 'Informative, clear, structured'
        }
      },
      targetAudience: {
        demographics: this.extractDemographics(video),
        interests: this.extractInterests(video),
        painPoints: this.extractPainPoints(video)
      },
      brandCustomization: {
        logo: true,
        colors: true,
        fonts: true,
        messaging: true
      },
      contentCustomization: {
        examples: this.generateExampleOptions(targetNiche),
        statistics: true,
        testimonials: true,
        callToAction: ['comment below', 'share your story', 'try this method', 'follow for more']
      }
    };
  }

  /**
   * Generate performance predictions
   */
  private async generatePerformancePredictions(
    video: VideoContent,
    analysis: { patternMatches: PatternMatch[]; viralScore: number },
    structure: TemplateStructure
  ): Promise<{
    viralScore: number;
    confidenceInterval: { min: number; max: number };
    demographics: string[];
    postingTimes: string[];
  }> {
    // Base prediction on original video performance
    const baseScore = analysis.viralScore;
    
    // Adjust for template factors
    let adjustedScore = baseScore;
    
    // Framework effectiveness
    const bestPattern = analysis.patternMatches[0];
    if (bestPattern && bestPattern.confidenceScore > 0.8) {
      adjustedScore *= 1.1; // 10% boost for strong pattern match
    }
    
    // Template quality
    const qualityMultiplier = structure.sections.length >= 4 ? 1.05 : 0.95;
    adjustedScore *= qualityMultiplier;
    
    // Platform optimization
    const platformBoost = this.getPlatformOptimizationBoost(video.platform, structure);
    adjustedScore *= platformBoost;
    
    // Confidence interval (±15% of predicted score)
    const variance = adjustedScore * 0.15;
    
    return {
      viralScore: Math.min(100, Math.max(0, adjustedScore)),
      confidenceInterval: {
        min: Math.max(0, adjustedScore - variance),
        max: Math.min(100, adjustedScore + variance)
      },
      demographics: this.extractDemographics(video),
      postingTimes: this.getOptimalPostingTimes(video.platform)
    };
  }

  // Helper methods
  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateName(video: VideoContent, pattern: PatternMatch): string {
    const frameworkName = pattern.frameworkName;
    const niche = this.determineTargetNiche(video);
    return `${frameworkName} - ${niche} Template`;
  }

  private generateTemplateDescription(video: VideoContent, pattern: PatternMatch): string {
    const frameworkName = pattern.frameworkName;
    const platform = video.platform;
    const engagement = ((video.likeCount + video.commentCount + video.shareCount) / video.viewCount * 100).toFixed(1);
    
    return `Proven ${frameworkName} template based on viral ${platform} content with ${engagement}% engagement rate. Perfect for creating engaging content that resonates with your audience.`;
  }

  private determineTargetNiche(video: VideoContent): string {
    const title = (video.title || '').toLowerCase();
    const description = (video.description || '').toLowerCase();
    const hashtags = video.hashtags.join(' ').toLowerCase();
    const content = `${title} ${description} ${hashtags}`;

    const niches = {
      'business': ['business', 'entrepreneur', 'startup', 'productivity', 'leadership'],
      'fitness': ['fitness', 'workout', 'health', 'gym', 'exercise'],
      'education': ['learn', 'education', 'tutorial', 'tips', 'howto'],
      'lifestyle': ['lifestyle', 'daily', 'routine', 'life', 'personal'],
      'technology': ['tech', 'technology', 'coding', 'software', 'digital'],
      'finance': ['money', 'finance', 'investment', 'financial', 'wealth']
    };

    for (const [niche, keywords] of Object.entries(niches)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return niche;
      }
    }

    return 'general';
  }

  private extractKeyWords(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return words.filter(word => word.length > 3 && !stopWords.has(word)).slice(0, 5);
  }

  private extractTimingRequirements(video: VideoContent, pattern: PatternMatch): TimingRequirements {
    return {
      totalDuration: {
        min: Math.max(15, video.duration - 10),
        max: Math.min(90, video.duration + 15),
        optimal: video.duration
      },
      hookDuration: { min: 2, max: 5 },
      peakMoment: 60, // 60% through video typically
      ctaDuration: { min: 3, max: 8 },
      pacing: video.duration < 30 ? 'fast' : video.duration < 60 ? 'medium' : 'slow'
    };
  }

  private identifyVisualElements(video: VideoContent, pattern: PatternMatch): VisualElement[] {
    const elements: VisualElement[] = [];

    // Add basic visual elements based on pattern
    elements.push({
      type: 'close_up',
      timing: 5,
      duration: 3,
      description: 'Close-up shot for hook',
      importance: 'required'
    });

    if (video.duration > 20) {
      elements.push({
        type: 'text_overlay',
        timing: 30,
        duration: 5,
        description: 'Text overlay for key point',
        importance: 'recommended'
      });
    }

    elements.push({
      type: 'transition',
      timing: 85,
      duration: 2,
      description: 'Transition to call-to-action',
      importance: 'recommended'
    });

    return elements;
  }

  private defineAudioRequirements(video: VideoContent): AudioRequirements {
    return {
      musicGenre: video.audioAnalysis?.musicGenre || 'upbeat',
      tempo: video.audioAnalysis?.tempo ? (video.audioAnalysis.tempo > 120 ? 'fast' : 'medium') : 'medium',
      mood: 'energetic',
      originalAudio: video.audioAnalysis?.hasOriginalAudio || false,
      voiceover: {
        required: true,
        tone: 'conversational',
        pace: video.duration < 30 ? 'fast' : 'medium'
      }
    };
  }

  private createInteractionPoints(pattern: PatternMatch, timing: TimingRequirements): InteractionPoint[] {
    return [
      {
        timing: 95,
        type: 'comment_prompt',
        message: 'What do you think? Comment below!',
        expectedEngagement: 15
      }
    ];
  }

  private addFrameworkSections(sections: TemplateSection[], framework: any, video: VideoContent): void {
    // Add framework-specific sections based on structure
    if (framework.structure.includes('setup')) {
      sections.push({
        id: 'setup',
        type: 'setup',
        name: 'Setup',
        description: 'Establish context and build anticipation',
        duration: { min: 5, max: 10 },
        position: 20,
        textGuidelines: {
          tone: 'engaging',
          keyWords: ['context', 'situation', 'story'],
          avoidWords: ['boring', 'long story'],
          maxLength: 80
        },
        visualGuidelines: {
          shots: ['medium_shot', 'wide_shot'],
          lighting: 'natural',
          composition: 'rule_of_thirds',
          transitions: ['smooth_cut']
        },
        variables: []
      });
    }

    if (framework.structure.includes('conflict')) {
      sections.push({
        id: 'conflict',
        type: 'conflict',
        name: 'Conflict/Problem',
        description: 'Present the challenge or problem',
        duration: { min: 8, max: 15 },
        position: 45,
        textGuidelines: {
          tone: 'urgent',
          keyWords: ['problem', 'challenge', 'issue'],
          avoidWords: ['impossible', 'hopeless'],
          maxLength: 70
        },
        visualGuidelines: {
          shots: ['close_up', 'dramatic_angle'],
          lighting: 'dramatic',
          composition: 'tension_building',
          transitions: ['quick_cut']
        },
        variables: []
      });
    }

    if (framework.structure.includes('resolution')) {
      sections.push({
        id: 'resolution',
        type: 'resolution',
        name: 'Resolution/Solution',
        description: 'Provide the solution or breakthrough',
        duration: { min: 10, max: 20 },
        position: 70,
        textGuidelines: {
          tone: 'triumphant',
          keyWords: ['solution', 'answer', 'breakthrough'],
          avoidWords: ['complicated', 'difficult'],
          maxLength: 90
        },
        visualGuidelines: {
          shots: ['reveal_shot', 'wide_shot'],
          lighting: 'bright',
          composition: 'celebratory',
          transitions: ['reveal_cut']
        },
        variables: []
      });
    }
  }

  private addDefaultSections(sections: TemplateSection[], video: VideoContent): void {
    // Add default content section
    sections.push({
      id: 'content',
      type: 'setup',
      name: 'Main Content',
      description: 'Deliver the core message or value',
      duration: { min: 10, max: 25 },
      position: 40,
      textGuidelines: {
        tone: 'informative',
        keyWords: this.extractKeyWords(video.description || ''),
        avoidWords: ['confusing', 'unclear'],
        maxLength: 100
      },
      visualGuidelines: {
        shots: ['medium_shot'],
        lighting: 'consistent',
        composition: 'centered',
        transitions: ['smooth_cut']
      },
      variables: []
    });
  }

  private calculateQualityScore(structure: TemplateStructure, pattern: PatternMatch): number {
    let score = 0;

    // Pattern confidence contributes 40%
    score += pattern.confidenceScore * 40;

    // Structure completeness contributes 30%
    const sectionScore = Math.min(1, structure.sections.length / 4) * 30;
    score += sectionScore;

    // Timing optimization contributes 20%
    const timingScore = structure.timing.totalDuration.optimal >= 15 && 
                       structure.timing.totalDuration.optimal <= 60 ? 20 : 10;
    score += timingScore;

    // Visual elements contribute 10%
    const visualScore = Math.min(1, structure.visualElements.length / 3) * 10;
    score += visualScore;

    return Math.min(1, score / 100);
  }

  private async saveTemplateToDatabase(template: GeneratedTemplate): Promise<void> {
    try {
      const { supabaseClient } = await import('@/lib/supabase-client');
      
      const { error } = await supabaseClient
        .from('generated_templates')
        .insert({
          id: template.id,
          source_video_id: template.sourceVideoId,
          primary_pattern_id: template.primaryPatternId,
          template_name: template.templateName,
          template_description: template.templateDescription,
          target_platform: template.targetPlatform,
          target_niche: template.targetNiche,
          template_structure: template.templateStructure,
          personalization_options: template.personalizationOptions,
          predicted_viral_score: template.predictedViralScore,
          confidence_interval: template.confidenceInterval,
          target_demographics: template.targetDemographics,
          optimal_posting_times: template.optimalPostingTimes,
          usage_count: template.usageCount,
          success_rate: template.successRate,
          avg_performance: template.avgPerformance,
          is_active: template.isActive,
          quality_score: template.qualityScore
        });

      if (error) {
        console.error('Error saving template to database:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error accessing database:', error);
    }
  }

  // Additional helper methods
  private getRelatedIndustries(niche: string): string[] {
    const industryMap: Record<string, string[]> = {
      business: ['finance', 'consulting', 'real estate', 'marketing', 'sales'],
      fitness: ['health', 'nutrition', 'wellness', 'sports', 'lifestyle'],
      education: ['training', 'coaching', 'consulting', 'personal development'],
      technology: ['software', 'AI', 'data science', 'cybersecurity', 'gaming'],
      lifestyle: ['travel', 'food', 'fashion', 'home', 'relationships']
    };

    return industryMap[niche] || ['general', 'lifestyle', 'business'];
  }

  private detectTone(video: VideoContent): string {
    const text = `${video.title || ''} ${video.description || ''}`.toLowerCase();
    
    if (text.includes('professional') || text.includes('business') || video.platform === 'linkedin') {
      return 'professional';
    }
    if (text.includes('fun') || text.includes('funny') || text.includes('lol')) {
      return 'casual';
    }
    if (text.includes('learn') || text.includes('how to') || text.includes('tutorial')) {
      return 'educational';
    }
    if (text.includes('inspire') || text.includes('motivate') || text.includes('dream')) {
      return 'inspiring';
    }
    
    return 'creative';
  }

  private extractDemographics(video: VideoContent): string[] {
    // Simple demographic extraction based on content and platform
    const demographics: string[] = [];
    
    if (video.platform === 'linkedin') {
      demographics.push('professionals', 'entrepreneurs', 'business owners');
    } else if (video.platform === 'tiktok') {
      demographics.push('gen z', 'millennials', 'content creators');
    } else if (video.platform === 'instagram') {
      demographics.push('millennials', 'gen z', 'lifestyle enthusiasts');
    }
    
    return demographics;
  }

  private extractInterests(video: VideoContent): string[] {
    const interests: string[] = [];
    const text = `${video.title || ''} ${video.description || ''} ${video.hashtags.join(' ')}`.toLowerCase();
    
    const interestKeywords = {
      'productivity': ['productivity', 'efficiency', 'time management'],
      'fitness': ['fitness', 'workout', 'health'],
      'business': ['business', 'entrepreneur', 'startup'],
      'technology': ['tech', 'ai', 'software'],
      'lifestyle': ['lifestyle', 'wellness', 'self care']
    };
    
    for (const [interest, keywords] of Object.entries(interestKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        interests.push(interest);
      }
    }
    
    return interests;
  }

  private extractPainPoints(video: VideoContent): string[] {
    const text = `${video.title || ''} ${video.description || ''}`.toLowerCase();
    const painPoints: string[] = [];
    
    const painKeywords = [
      'struggling with', 'tired of', 'frustrated by', 'problem with',
      'difficult to', 'hard to', 'can\'t seem to', 'failing at'
    ];
    
    painKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        painPoints.push(keyword.replace(' with', '').replace(' to', '').replace(' by', ''));
      }
    });
    
    return painPoints.length > 0 ? painPoints : ['time constraints', 'lack of results', 'complexity'];
  }

  private generateExampleOptions(niche: string): string[] {
    const examples: Record<string, string[]> = {
      business: ['case studies', 'success stories', 'market data', 'industry trends'],
      fitness: ['workout routines', 'transformation stories', 'nutrition tips', 'exercise demos'],
      education: ['step-by-step guides', 'before/after examples', 'student success', 'learning methods'],
      technology: ['product demos', 'code examples', 'tech comparisons', 'innovation showcases']
    };
    
    return examples[niche] || ['real examples', 'case studies', 'success stories', 'practical tips'];
  }

  private getPlatformOptimizationBoost(platform: Platform, structure: TemplateStructure): number {
    // Platform-specific optimization multipliers
    const optimizations: Record<Platform, number> = {
      instagram: structure.timing.totalDuration.optimal <= 30 ? 1.1 : 0.95,
      tiktok: structure.timing.totalDuration.optimal <= 60 ? 1.15 : 0.9,
      youtube: structure.timing.totalDuration.optimal >= 60 ? 1.05 : 0.95,
      linkedin: structure.framework.includes('professional') ? 1.1 : 1.0,
      twitter: structure.timing.totalDuration.optimal <= 140 ? 1.2 : 0.8,
      facebook: 1.0 // Baseline
    };
    
    return optimizations[platform] || 1.0;
  }

  private getOptimalPostingTimes(platform: Platform): string[] {
    const postingTimes: Record<Platform, string[]> = {
      instagram: ['6:00 PM', '8:00 PM', '9:00 PM'],
      tiktok: ['6:00 AM', '10:00 AM', '7:00 PM'],
      youtube: ['2:00 PM', '4:00 PM', '8:00 PM'],
      linkedin: ['8:00 AM', '12:00 PM', '5:00 PM'],
      twitter: ['9:00 AM', '3:00 PM', '8:00 PM'],
      facebook: ['1:00 PM', '3:00 PM', '8:00 PM']
    };
    
    return postingTimes[platform] || ['12:00 PM', '6:00 PM', '8:00 PM'];
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      avgViews: 0,
      avgEngagementRate: 0,
      avgViralScore: 0,
      avgCompletionRate: 0,
      platformPerformance: {
        instagram: 0,
        tiktok: 0,
        youtube: 0,
        linkedin: 0,
        twitter: 0,
        facebook: 0
      }
    };
  }
}

// Export singleton instance
export const viralTemplateGenerationService = ViralTemplateGenerationService.getInstance();