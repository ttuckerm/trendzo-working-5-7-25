import { claudeService } from './claudeService';
import { Niche, Platform } from '@/lib/types/database';

// Types for personalization
export interface PersonalizationContext {
  user: {
    id: string;
    email: string;
    niche: Niche;
    platform: Platform;
    tier: 'free' | 'premium' | 'business';
    createdVideos: number;
    avgViralScore: number;
  };
  template: {
    id: string;
    name: string;
    baseScript: string;
    niche: Niche;
    platform: Platform;
    viralScore: number;
    metadata: Record<string, any>;
  };
  userInput: {
    topic: string;
    targetAudience?: string;
    callToAction?: string;
    brandName?: string;
    personalStory?: string;
    results?: string;
    timeframe?: string;
  };
  trends: {
    currentTrends: string[];
    trendingAudio: string[];
    competitorInsights: string[];
  };
}

export interface PersonalizedTemplate {
  id: string;
  originalTemplateId: string;
  personalizedScript: string;
  sections: Array<{
    id: string;
    timeRange: string;
    content: string;
    personalizedContent: string;
    visualCues: string[];
    audioSync: string;
    confidenceScore: number;
  }>;
  viralScore: number;
  improvements: string[];
  platformOptimizations: string[];
  metadata: {
    personalizationLevel: 'basic' | 'advanced' | 'expert';
    aiConfidence: number;
    templateVariant: string;
    generatedAt: string;
  };
}

export interface PersonalizationRule {
  id: string;
  name: string;
  trigger: string;
  replacement: string;
  conditions?: Record<string, any>;
  priority: number;
}

/**
 * Template Personalization Engine
 * Transforms generic templates into personalized, high-converting content
 */
export class TemplatePersonalizationEngine {
  private static instance: TemplatePersonalizationEngine;
  private personalizationRules: PersonalizationRule[] = [];

  private constructor() {
    this.loadPersonalizationRules();
  }

  static getInstance(): TemplatePersonalizationEngine {
    if (!TemplatePersonalizationEngine.instance) {
      TemplatePersonalizationEngine.instance = new TemplatePersonalizationEngine();
    }
    return TemplatePersonalizationEngine.instance;
  }

  /**
   * Main personalization function
   */
  async personalizeTemplate(context: PersonalizationContext): Promise<PersonalizedTemplate> {
    const { user, template, userInput, trends } = context;

    // Determine personalization level based on user tier
    const personalizationLevel = this.getPersonalizationLevel(user.tier);
    
    // Apply rule-based personalization first
    let personalizedScript = await this.applyPersonalizationRules(
      template.baseScript, 
      context
    );

    // Apply AI-powered personalization
    if (personalizationLevel !== 'basic') {
      personalizedScript = await this.applyAIPersonalization(
        personalizedScript,
        context
      );
    }

    // Generate sections with timing
    const sections = await this.generatePersonalizedSections(
      personalizedScript,
      context
    );

    // Calculate viral score for personalized version
    const viralScore = await this.calculatePersonalizedViralScore(
      sections,
      context
    );

    // Generate improvements and optimizations
    const improvements = await this.generateImprovements(context, viralScore);
    const platformOptimizations = this.getPlatformOptimizations(
      template.platform,
      personalizedScript
    );

    return {
      id: `personalized_${template.id}_${Date.now()}`,
      originalTemplateId: template.id,
      personalizedScript,
      sections,
      viralScore,
      improvements,
      platformOptimizations,
      metadata: {
        personalizationLevel,
        aiConfidence: this.calculateAIConfidence(userInput, template),
        templateVariant: this.getTemplateVariant(context),
        generatedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Apply rule-based personalization
   */
  private async applyPersonalizationRules(
    baseScript: string,
    context: PersonalizationContext
  ): Promise<string> {
    let personalizedScript = baseScript;

    // Apply rules in priority order
    const applicableRules = this.personalizationRules
      .filter(rule => this.shouldApplyRule(rule, context))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      personalizedScript = this.applyRule(personalizedScript, rule, context);
    }

    return personalizedScript;
  }

  /**
   * Apply AI-powered personalization using Claude
   */
  private async applyAIPersonalization(
    script: string,
    context: PersonalizationContext
  ): Promise<string> {
    try {
      const { user, userInput, trends } = context;
      
      // For premium+ users, use Claude for advanced personalization
      if (user.tier === 'free') {
        return script; // Basic users get rule-based only
      }

      const personalizedHook = await claudeService.generateViralHook({
        niche: user.niche,
        platform: user.platform,
        topic: userInput.topic,
        targetAudience: userInput.targetAudience
      });

      // Replace the hook in the script
      const hookRegex = /Hook:.*?(?=\n|\.\.\.|$)/i;
      const personalizedScript = script.replace(
        hookRegex,
        `Hook: ${personalizedHook.hook}`
      );

      return personalizedScript;
    } catch (error) {
      console.error('AI personalization failed:', error);
      return script; // Fallback to rule-based version
    }
  }

  /**
   * Generate personalized sections with timing
   */
  private async generatePersonalizedSections(
    personalizedScript: string,
    context: PersonalizationContext
  ): Promise<PersonalizedTemplate['sections']> {
    const { template, userInput } = context;
    
    // Standard video structure for all platforms
    const standardSections = [
      { 
        id: 'hook', 
        timeRange: '0-3s', 
        type: 'hook',
        importance: 'critical' 
      },
      { 
        id: 'problem', 
        timeRange: '3-10s', 
        type: 'problem',
        importance: 'high' 
      },
      { 
        id: 'solution', 
        timeRange: '10-20s', 
        type: 'solution',
        importance: 'high' 
      },
      { 
        id: 'proof', 
        timeRange: '20-25s', 
        type: 'proof',
        importance: 'medium' 
      },
      { 
        id: 'cta', 
        timeRange: '25-30s', 
        type: 'cta',
        importance: 'critical' 
      }
    ];

    const sections = standardSections.map(section => {
      const content = this.extractSectionContent(personalizedScript, section.type);
      const personalizedContent = this.personalizeSectionContent(
        content,
        section.type,
        context
      );

      return {
        id: section.id,
        timeRange: section.timeRange,
        content,
        personalizedContent,
        visualCues: this.getVisualCues(section.type, context),
        audioSync: this.getAudioSync(section.type, context.template.platform),
        confidenceScore: this.calculateSectionConfidence(
          personalizedContent,
          section.importance
        )
      };
    });

    return sections;
  }

  /**
   * Extract content for specific section type from script
   */
  private extractSectionContent(script: string, sectionType: string): string {
    const sectionPatterns: Record<string, RegExp> = {
      hook: /Hook:\s*(.+?)(?=\n|Problem:|Solution:|$)/is,
      problem: /Problem:\s*(.+?)(?=\n|Solution:|Proof:|$)/is,
      solution: /Solution:\s*(.+?)(?=\n|Proof:|CTA:|$)/is,
      proof: /Proof:\s*(.+?)(?=\n|CTA:|$)/is,
      cta: /CTA:\s*(.+?)$/is
    };

    const pattern = sectionPatterns[sectionType];
    if (!pattern) return '';

    const match = script.match(pattern);
    return match ? match[1].trim() : this.getFallbackContent(sectionType);
  }

  /**
   * Personalize content for specific section
   */
  private personalizeSectionContent(
    content: string,
    sectionType: string,
    context: PersonalizationContext
  ): string {
    const { userInput, user } = context;

    let personalizedContent = content;

    // Apply section-specific personalization
    switch (sectionType) {
      case 'hook':
        personalizedContent = this.personalizeHook(content, userInput, user);
        break;
      case 'problem':
        personalizedContent = this.personalizeProblem(content, userInput);
        break;
      case 'solution':
        personalizedContent = this.personalizeSolution(content, userInput);
        break;
      case 'proof':
        personalizedContent = this.personalizeProof(content, userInput);
        break;
      case 'cta':
        personalizedContent = this.personalizeCTA(content, userInput);
        break;
    }

    return personalizedContent;
  }

  /**
   * Section-specific personalization methods
   */
  private personalizeHook(content: string, userInput: any, user: any): string {
    let hook = content;
    
    // Replace placeholders
    if (userInput.topic) {
      hook = hook.replace(/\[TOPIC\]/g, userInput.topic);
      hook = hook.replace(/\[YOUR_TOPIC\]/g, userInput.topic);
    }

    if (userInput.results) {
      hook = hook.replace(/\[RESULT\]/g, userInput.results);
      hook = hook.replace(/\[YOUR_RESULT\]/g, userInput.results);
    }

    if (userInput.timeframe) {
      hook = hook.replace(/\[TIMEFRAME\]/g, userInput.timeframe);
      hook = hook.replace(/\[TIME\]/g, userInput.timeframe);
    }

    // Add urgency based on user tier
    if (user.tier === 'free' && !hook.includes('secret') && !hook.includes('mistake')) {
      hook = `The secret to ${userInput.topic || 'success'} that ${hook.toLowerCase()}`;
    }

    return hook;
  }

  private personalizeProblem(content: string, userInput: any): string {
    let problem = content;
    
    if (userInput.targetAudience) {
      problem = problem.replace(/\[AUDIENCE\]/g, userInput.targetAudience);
      problem = problem.replace(/people/g, userInput.targetAudience);
    }

    return problem;
  }

  private personalizeSolution(content: string, userInput: any): string {
    let solution = content;
    
    if (userInput.brandName) {
      solution = solution.replace(/\[BRAND\]/g, userInput.brandName);
      solution = solution.replace(/\[PRODUCT\]/g, userInput.brandName);
    }

    if (userInput.personalStory) {
      solution = solution.replace(/\[STORY\]/g, userInput.personalStory);
    }

    return solution;
  }

  private personalizeProof(content: string, userInput: any): string {
    let proof = content;
    
    if (userInput.results) {
      proof = proof.replace(/\[PROOF\]/g, userInput.results);
      proof = proof.replace(/\[RESULTS\]/g, userInput.results);
    }

    return proof;
  }

  private personalizeCTA(content: string, userInput: any): string {
    let cta = content;
    
    if (userInput.callToAction) {
      cta = userInput.callToAction;
    } else {
      // Smart CTA based on content type
      if (userInput.brandName) {
        cta = `Try ${userInput.brandName} today!`;
      } else if (userInput.topic) {
        cta = `Start your ${userInput.topic} journey now!`;
      }
    }

    return cta;
  }

  /**
   * Get visual cues for each section
   */
  private getVisualCues(sectionType: string, context: PersonalizationContext): string[] {
    const { template } = context;
    
    const visualCueLibrary: Record<string, Record<Platform, string[]>> = {
      hook: {
        instagram: ['Close-up face shot', 'Bold text overlay', 'Quick transition'],
        tiktok: ['Eye-catching opener', 'Text animation', 'Face reveal'],
        linkedin: ['Professional headshot', 'Clean text overlay', 'Confident pose'],
        twitter: ['Simple background', 'Clear text', 'Eye contact'],
        facebook: ['Engaging thumbnail', 'Clear messaging', 'Warm lighting'],
        youtube: ['High-quality shot', 'Branded intro', 'Clear audio']
      },
      problem: {
        instagram: ['Problem visualization', 'Relatable scenarios', 'Emotional expression'],
        tiktok: ['Quick problem demo', 'Frustrated reaction', 'Before state'],
        linkedin: ['Professional challenge', 'Business context', 'Industry reference'],
        twitter: ['Simple explanation', 'Clear problem statement', 'Relatable example'],
        facebook: ['Community problem', 'Shared experience', 'Empathy shot'],
        youtube: ['Detailed explanation', 'Multiple examples', 'Supporting visuals']
      },
      solution: {
        instagram: ['Solution demo', 'Step-by-step reveal', 'Transformation'],
        tiktok: ['Quick solution', 'Magic reveal', 'Before/after'],
        linkedin: ['Professional solution', 'Business value', 'ROI focus'],
        twitter: ['Concise solution', 'Clear benefits', 'Action steps'],
        facebook: ['Detailed solution', 'Community benefit', 'Shared success'],
        youtube: ['Comprehensive solution', 'Tutorial elements', 'Screen recording']
      },
      proof: {
        instagram: ['Results showcase', 'Testimonial clips', 'Data visualization'],
        tiktok: ['Quick proof', 'Numbers animation', 'Success montage'],
        linkedin: ['Professional testimonials', 'Case studies', 'Industry validation'],
        twitter: ['Data points', 'Brief testimonials', 'Achievement highlights'],
        facebook: ['Customer stories', 'Community proof', 'Social validation'],
        youtube: ['Detailed case studies', 'Multiple testimonials', 'Comprehensive proof']
      },
      cta: {
        instagram: ['Clear CTA text', 'Arrow pointing', 'Action button'],
        tiktok: ['Strong CTA', 'Urgency elements', 'Direct instruction'],
        linkedin: ['Professional CTA', 'Business value', 'Next steps'],
        twitter: ['Simple CTA', 'Link in bio', 'Engagement ask'],
        facebook: ['Community CTA', 'Share prompt', 'Engagement drive'],
        youtube: ['Subscribe reminder', 'Link in description', 'Next video teaser']
      }
    };

    return visualCueLibrary[sectionType]?.[template.platform] || ['Generic visual cue'];
  }

  /**
   * Get audio sync points for platform
   */
  private getAudioSync(sectionType: string, platform: Platform): string {
    const audioSyncLibrary: Record<string, Record<Platform, string>> = {
      hook: {
        instagram: 'Beat drop at 1s',
        tiktok: 'Immediate audio hook',
        linkedin: 'Professional tone start',
        twitter: 'Clean audio start',
        facebook: 'Engaging music intro',
        youtube: 'Branded audio intro'
      },
      problem: {
        instagram: 'Tension building',
        tiktok: 'Dramatic pause',
        linkedin: 'Steady rhythm',
        twitter: 'Clear speaking pace',
        facebook: 'Empathetic tone',
        youtube: 'Explanatory pace'
      },
      solution: {
        instagram: 'Upbeat transition',
        tiktok: 'Revealing moment',
        linkedin: 'Confident delivery',
        twitter: 'Clear solution tone',
        facebook: 'Hopeful music',
        youtube: 'Instructional tone'
      },
      proof: {
        instagram: 'Success music',
        tiktok: 'Victory sound',
        linkedin: 'Authoritative tone',
        twitter: 'Credible delivery',
        facebook: 'Celebration music',
        youtube: 'Evidence-based tone'
      },
      cta: {
        instagram: 'Final beat drop',
        tiktok: 'Urgent call',
        linkedin: 'Professional close',
        twitter: 'Direct ask',
        facebook: 'Community call',
        youtube: 'Subscription reminder'
      }
    };

    return audioSyncLibrary[sectionType]?.[platform] || 'Standard audio sync';
  }

  /**
   * Calculate confidence score for section
   */
  private calculateSectionConfidence(content: string, importance: string): number {
    let score = 50; // Base score

    // Content quality factors
    if (content.length > 20) score += 10;
    if (content.includes('?')) score += 5; // Questions engage
    if (content.match(/\d+/)) score += 10; // Numbers add credibility
    if (content.match(/[!]{1,2}$/)) score += 5; // Exclamation adds energy

    // Importance multiplier
    const importanceMultipliers = {
      critical: 1.2,
      high: 1.1,
      medium: 1.0,
      low: 0.9
    };

    score *= importanceMultipliers[importance as keyof typeof importanceMultipliers] || 1;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate viral score for personalized template
   */
  private async calculatePersonalizedViralScore(
    sections: PersonalizedTemplate['sections'],
    context: PersonalizationContext
  ): Promise<number> {
    const { template, user } = context;
    
    let score = template.viralScore; // Start with base template score
    
    // Personalization bonus
    const avgConfidence = sections.reduce((sum, section) => sum + section.confidenceScore, 0) / sections.length;
    score += (avgConfidence - 50) * 0.2; // Confidence above 50 adds to score
    
    // User experience bonus
    if (user.createdVideos > 5) score += 5; // Experienced users get better results
    if (user.avgViralScore > 80) score += 10; // High-performing users
    
    // Platform optimization bonus
    if (user.platform === template.platform) score += 5;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  /**
   * Generate improvement suggestions
   */
  private async generateImprovements(
    context: PersonalizationContext,
    viralScore: number
  ): Promise<string[]> {
    const improvements: string[] = [];
    
    if (viralScore < 70) {
      improvements.push('Strengthen your hook with a more specific pain point');
      improvements.push('Add concrete numbers or results to build credibility');
    }
    
    if (viralScore < 80) {
      improvements.push('Include a personal story to increase relatability');
      improvements.push('Make your call-to-action more specific and urgent');
    }
    
    if (viralScore < 90) {
      improvements.push('Consider adding trending audio for platform optimization');
      improvements.push('Test different visual transitions between sections');
    }
    
    return improvements;
  }

  /**
   * Get platform-specific optimizations
   */
  private getPlatformOptimizations(platform: Platform, script: string): string[] {
    const optimizations: Record<Platform, string[]> = {
      instagram: [
        'Use trending hashtags in your caption',
        'Post during peak hours (7-9 PM)',
        'Include a question in your caption for engagement'
      ],
      tiktok: [
        'Use trending sounds for better reach',
        'Add text overlays for accessibility',
        'Keep it under 30 seconds for best performance'
      ],
      linkedin: [
        'Add industry-specific keywords',
        'Tag relevant professionals in your post',
        'Include a thought-provoking question'
      ],
      twitter: [
        'Break into a thread for complex topics',
        'Use relevant trending hashtags',
        'Tweet during business hours for B2B content'
      ],
      facebook: [
        'Post native video for better reach',
        'Encourage shares and comments',
        'Use Facebook-native features like polls'
      ],
      youtube: [
        'Optimize title with keywords',
        'Create custom thumbnail',
        'Add end screen with next video'
      ]
    };

    return optimizations[platform] || [];
  }

  /**
   * Helper methods
   */
  private getPersonalizationLevel(tier: string): 'basic' | 'advanced' | 'expert' {
    switch (tier) {
      case 'free': return 'basic';
      case 'premium': return 'advanced';
      case 'business': return 'expert';
      default: return 'basic';
    }
  }

  private shouldApplyRule(rule: PersonalizationRule, context: PersonalizationContext): boolean {
    if (!rule.conditions) return true;
    
    // Check conditions (simplified - extend as needed)
    for (const [key, value] of Object.entries(rule.conditions)) {
      if (key === 'tier' && context.user.tier !== value) return false;
      if (key === 'platform' && context.template.platform !== value) return false;
      if (key === 'niche' && context.template.niche !== value) return false;
    }
    
    return true;
  }

  private applyRule(script: string, rule: PersonalizationRule, context: PersonalizationContext): string {
    const triggerRegex = new RegExp(rule.trigger, 'gi');
    return script.replace(triggerRegex, this.interpolateReplacement(rule.replacement, context));
  }

  private interpolateReplacement(replacement: string, context: PersonalizationContext): string {
    return replacement
      .replace(/\{topic\}/g, context.userInput.topic || '')
      .replace(/\{audience\}/g, context.userInput.targetAudience || 'everyone')
      .replace(/\{brand\}/g, context.userInput.brandName || 'your brand')
      .replace(/\{result\}/g, context.userInput.results || 'amazing results');
  }

  private calculateAIConfidence(userInput: any, template: any): number {
    let confidence = 50;
    
    if (userInput.topic) confidence += 20;
    if (userInput.targetAudience) confidence += 15;
    if (userInput.personalStory) confidence += 10;
    if (userInput.results) confidence += 5;
    
    return Math.min(100, confidence);
  }

  private getTemplateVariant(context: PersonalizationContext): string {
    const { user, template } = context;
    return `${template.niche}_${template.platform}_${user.tier}_${Date.now()}`;
  }

  private getFallbackContent(sectionType: string): string {
    const fallbacks: Record<string, string> = {
      hook: 'Here\'s something that will change everything...',
      problem: 'You\'re probably struggling with this common issue...',
      solution: 'Here\'s exactly how to solve it...',
      proof: 'This approach has worked for thousands of people...',
      cta: 'Take action now and see the results!'
    };

    return fallbacks[sectionType] || 'Content placeholder';
  }

  /**
   * Load personalization rules
   */
  private loadPersonalizationRules(): void {
    this.personalizationRules = [
      {
        id: 'topic_replacement',
        name: 'Topic Replacement',
        trigger: '\\[TOPIC\\]',
        replacement: '{topic}',
        priority: 100
      },
      {
        id: 'audience_replacement',
        name: 'Audience Replacement',
        trigger: '\\[AUDIENCE\\]',
        replacement: '{audience}',
        priority: 90
      },
      {
        id: 'brand_replacement',
        name: 'Brand Replacement',
        trigger: '\\[BRAND\\]',
        replacement: '{brand}',
        priority: 80
      },
      {
        id: 'result_replacement',
        name: 'Result Replacement',
        trigger: '\\[RESULT\\]',
        replacement: '{result}',
        priority: 70
      },
      {
        id: 'premium_hook_enhancement',
        name: 'Premium Hook Enhancement',
        trigger: 'Hook: (.+)',
        replacement: 'Hook: The $1 that 99% of people don\'t know',
        conditions: { tier: 'premium' },
        priority: 60
      }
    ];
  }
}

// Export singleton instance
export const templatePersonalizationEngine = TemplatePersonalizationEngine.getInstance();