import { Niche, Platform } from '@/lib/types/database';

// Types for content library
export interface ContentFramework {
  id: string;
  name: string;
  description: string;
  structure: string[];
  useCases: string[];
  viralityScore: number;
  platforms: Platform[];
  niches: Niche[];
}

export interface HookTemplate {
  id: string;
  template: string;
  category: 'curiosity' | 'fear' | 'desire' | 'anger' | 'surprise' | 'social_proof';
  niche: Niche;
  platform: Platform;
  viralityScore: number;
  variables: string[];
  examples: string[];
}

export interface ProblemSolutionPair {
  id: string;
  problem: string;
  solution: string;
  niche: Niche;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  emotionalTrigger: string;
  targetAudience: string;
}

export interface CallToActionTemplate {
  id: string;
  template: string;
  urgencyLevel: 'low' | 'medium' | 'high';
  platform: Platform;
  action: 'subscribe' | 'buy' | 'download' | 'comment' | 'share' | 'visit';
  conversionRate: number;
}

export interface ContentRecommendation {
  framework: ContentFramework;
  hook: HookTemplate;
  problemSolution: ProblemSolutionPair;
  cta: CallToActionTemplate;
  confidence: number;
  reasoning: string[];
}

/**
 * Smart Content Library
 * Provides curated content frameworks, hooks, and templates optimized for viral performance
 */
export class SmartContentLibrary {
  private static instance: SmartContentLibrary;
  private frameworks: ContentFramework[] = [];
  private hooks: HookTemplate[] = [];
  private problemSolutions: ProblemSolutionPair[] = [];
  private ctas: CallToActionTemplate[] = [];

  private constructor() {
    this.loadContentLibrary();
  }

  static getInstance(): SmartContentLibrary {
    if (!SmartContentLibrary.instance) {
      SmartContentLibrary.instance = new SmartContentLibrary();
    }
    return SmartContentLibrary.instance;
  }

  /**
   * Get personalized content recommendations
   */
  getContentRecommendations(params: {
    niche: Niche;
    platform: Platform;
    topic: string;
    targetAudience?: string;
    goalType: 'viral' | 'conversion' | 'engagement' | 'awareness';
    userTier: 'free' | 'premium' | 'business';
  }): ContentRecommendation[] {
    const { niche, platform, topic, targetAudience, goalType, userTier } = params;

    // Filter relevant content
    const relevantFrameworks = this.frameworks.filter(fw => 
      fw.niches.includes(niche) && fw.platforms.includes(platform)
    );

    const relevantHooks = this.hooks.filter(hook => 
      hook.niche === niche && hook.platform === platform
    );

    const relevantProblems = this.problemSolutions.filter(ps => 
      ps.niche === niche && ps.targetAudience.includes(targetAudience || '')
    );

    const relevantCTAs = this.ctas.filter(cta => 
      cta.platform === platform
    );

    // Generate recommendations
    const recommendations: ContentRecommendation[] = [];

    for (const framework of relevantFrameworks.slice(0, 3)) {
      const hook = this.selectBestHook(relevantHooks, goalType, topic);
      const problemSolution = this.selectBestProblemSolution(relevantProblems, framework);
      const cta = this.selectBestCTA(relevantCTAs, goalType);

      if (hook && problemSolution && cta) {
        recommendations.push({
          framework,
          hook,
          problemSolution,
          cta,
          confidence: this.calculateRecommendationConfidence(
            framework, hook, problemSolution, cta, params
          ),
          reasoning: this.generateReasoning(framework, hook, problemSolution, cta, params)
        });
      }
    }

    // Sort by confidence and filter by user tier
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, userTier === 'free' ? 1 : userTier === 'premium' ? 3 : 5);
  }

  /**
   * Get hook templates by category
   */
  getHooksByCategory(
    category: HookTemplate['category'],
    niche: Niche,
    platform: Platform
  ): HookTemplate[] {
    return this.hooks
      .filter(hook => 
        hook.category === category && 
        hook.niche === niche && 
        hook.platform === platform
      )
      .sort((a, b) => b.viralityScore - a.viralityScore);
  }

  /**
   * Get trending content patterns
   */
  getTrendingPatterns(niche: Niche, platform: Platform): {
    patterns: string[];
    frameworks: ContentFramework[];
    hooks: HookTemplate[];
  } {
    const trendingFrameworks = this.frameworks
      .filter(fw => fw.niches.includes(niche) && fw.platforms.includes(platform))
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .slice(0, 3);

    const trendingHooks = this.hooks
      .filter(hook => hook.niche === niche && hook.platform === platform)
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .slice(0, 5);

    const patterns = this.extractTrendingPatterns(trendingFrameworks, trendingHooks);

    return {
      patterns,
      frameworks: trendingFrameworks,
      hooks: trendingHooks
    };
  }

  /**
   * Generate content variations
   */
  generateContentVariations(baseContent: {
    hook: string;
    problem: string;
    solution: string;
    cta: string;
  }, niche: Niche, platform: Platform): Array<{
    variation: string;
    hook: string;
    problem: string;
    solution: string;
    cta: string;
    score: number;
  }> {
    const variations = [];

    // Hook variations
    const hookTemplates = this.getHooksByCategory('curiosity', niche, platform).slice(0, 3);
    
    for (const hookTemplate of hookTemplates) {
      const variationHook = this.applyHookTemplate(hookTemplate, baseContent.hook);
      
      variations.push({
        variation: 'hook_' + hookTemplate.id,
        hook: variationHook,
        problem: baseContent.problem,
        solution: baseContent.solution,
        cta: baseContent.cta,
        score: hookTemplate.viralityScore
      });
    }

    // CTA variations
    const ctaTemplates = this.ctas.filter(cta => cta.platform === platform).slice(0, 2);
    
    for (const ctaTemplate of ctaTemplates) {
      variations.push({
        variation: 'cta_' + ctaTemplate.id,
        hook: baseContent.hook,
        problem: baseContent.problem,
        solution: baseContent.solution,
        cta: ctaTemplate.template,
        score: ctaTemplate.conversionRate * 10 // Convert to 0-100 scale
      });
    }

    return variations.sort((a, b) => b.score - a.score);
  }

  /**
   * Get content framework by ID
   */
  getFramework(id: string): ContentFramework | undefined {
    return this.frameworks.find(fw => fw.id === id);
  }

  /**
   * Get all frameworks for a niche/platform
   */
  getFrameworks(niche: Niche, platform: Platform): ContentFramework[] {
    return this.frameworks.filter(fw => 
      fw.niches.includes(niche) && fw.platforms.includes(platform)
    );
  }

  /**
   * Private helper methods
   */
  private selectBestHook(hooks: HookTemplate[], goalType: string, topic: string): HookTemplate | null {
    if (hooks.length === 0) return null;

    // Score hooks based on goal type and topic relevance
    const scoredHooks = hooks.map(hook => ({
      hook,
      score: this.calculateHookScore(hook, goalType, topic)
    }));

    const bestHook = scoredHooks.sort((a, b) => b.score - a.score)[0];
    return bestHook ? bestHook.hook : null;
  }

  private selectBestProblemSolution(
    problems: ProblemSolutionPair[],
    framework: ContentFramework
  ): ProblemSolutionPair | null {
    if (problems.length === 0) return null;

    // Prefer problems that match the framework's use cases
    const matchingProblems = problems.filter(ps => 
      framework.useCases.some(useCase => 
        ps.problem.toLowerCase().includes(useCase.toLowerCase()) ||
        ps.solution.toLowerCase().includes(useCase.toLowerCase())
      )
    );

    return matchingProblems.length > 0 ? matchingProblems[0] : problems[0];
  }

  private selectBestCTA(ctas: CallToActionTemplate[], goalType: string): CallToActionTemplate | null {
    if (ctas.length === 0) return null;

    // Select CTA based on goal type
    const goalToCTAMap: Record<string, CallToActionTemplate['action'][]> = {
      viral: ['share', 'comment'],
      conversion: ['buy', 'download', 'visit'],
      engagement: ['comment', 'subscribe'],
      awareness: ['subscribe', 'visit']
    };

    const preferredActions = goalToCTAMap[goalType] || ['subscribe'];
    const matchingCTAs = ctas.filter(cta => preferredActions.includes(cta.action));

    return matchingCTAs.length > 0 ? 
      matchingCTAs.sort((a, b) => b.conversionRate - a.conversionRate)[0] : 
      ctas[0];
  }

  private calculateHookScore(hook: HookTemplate, goalType: string, topic: string): number {
    let score = hook.viralityScore;

    // Topic relevance bonus
    const topicWords = topic.toLowerCase().split(' ');
    const hookWords = hook.template.toLowerCase().split(' ');
    const relevance = topicWords.filter(word => hookWords.includes(word)).length;
    score += relevance * 5;

    // Goal type bonus
    const goalToCategoryMap: Record<string, HookTemplate['category'][]> = {
      viral: ['surprise', 'curiosity', 'fear'],
      conversion: ['desire', 'fear', 'social_proof'],
      engagement: ['curiosity', 'anger', 'social_proof'],
      awareness: ['curiosity', 'surprise']
    };

    const preferredCategories = goalToCategoryMap[goalType] || ['curiosity'];
    if (preferredCategories.includes(hook.category)) {
      score += 10;
    }

    return score;
  }

  private calculateRecommendationConfidence(
    framework: ContentFramework,
    hook: HookTemplate,
    problemSolution: ProblemSolutionPair,
    cta: CallToActionTemplate,
    params: any
  ): number {
    let confidence = 50;

    // Framework fit
    confidence += framework.viralityScore * 0.2;

    // Hook quality
    confidence += hook.viralityScore * 0.3;

    // CTA conversion rate
    confidence += cta.conversionRate * 10;

    // Urgency alignment
    if (problemSolution.urgencyLevel === 'high' || problemSolution.urgencyLevel === 'critical') {
      confidence += 10;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  private generateReasoning(
    framework: ContentFramework,
    hook: HookTemplate,
    problemSolution: ProblemSolutionPair,
    cta: CallToActionTemplate,
    params: any
  ): string[] {
    const reasoning = [];

    reasoning.push(`${framework.name} framework chosen for ${params.niche} content`);
    reasoning.push(`${hook.category} hook selected for ${params.goalType} optimization`);
    reasoning.push(`Problem urgency level: ${problemSolution.urgencyLevel}`);
    reasoning.push(`CTA optimized for ${cta.action} with ${cta.conversionRate}% conversion rate`);

    if (hook.viralityScore > 80) {
      reasoning.push('High-performing hook template (80+ viral score)');
    }

    if (framework.viralityScore > 85) {
      reasoning.push('Proven framework with 85+ viral score');
    }

    return reasoning;
  }

  private extractTrendingPatterns(
    frameworks: ContentFramework[],
    hooks: HookTemplate[]
  ): string[] {
    const patterns = [];

    // Framework patterns
    const commonStructures = frameworks
      .flatMap(fw => fw.structure)
      .reduce((acc, structure) => {
        acc[structure] = (acc[structure] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topStructures = Object.entries(commonStructures)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([structure]) => structure);

    patterns.push(...topStructures);

    // Hook patterns
    const topCategories = hooks
      .reduce((acc, hook) => {
        acc[hook.category] = (acc[hook.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const popularCategories = Object.entries(topCategories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([category]) => `${category} hooks are trending`);

    patterns.push(...popularCategories);

    return patterns;
  }

  private applyHookTemplate(template: HookTemplate, originalHook: string): string {
    // Extract key elements from original hook
    const elements = this.extractHookElements(originalHook);
    
    // Apply template with extracted elements
    let newHook = template.template;
    
    // Replace template variables
    for (const variable of template.variables) {
      const placeholder = `{${variable}}`;
      if (newHook.includes(placeholder)) {
        newHook = newHook.replace(
          placeholder, 
          elements[variable] || `[${variable}]`
        );
      }
    }

    return newHook;
  }

  private extractHookElements(hook: string): Record<string, string> {
    const elements: Record<string, string> = {};

    // Extract numbers
    const numbers = hook.match(/\d+/g);
    if (numbers) {
      elements.number = numbers[0];
    }

    // Extract topics (simplified extraction)
    const commonTopics = ['business', 'fitness', 'money', 'success', 'growth', 'marketing'];
    for (const topic of commonTopics) {
      if (hook.toLowerCase().includes(topic)) {
        elements.topic = topic;
        break;
      }
    }

    // Extract time references
    const timePatterns = ['days?', 'weeks?', 'months?', 'years?', 'minutes?', 'hours?'];
    for (const pattern of timePatterns) {
      const match = hook.match(new RegExp(`\\d+\\s*${pattern}`, 'i'));
      if (match) {
        elements.timeframe = match[0];
        break;
      }
    }

    return elements;
  }

  /**
   * Load content library data
   */
  private loadContentLibrary(): void {
    this.loadFrameworks();
    this.loadHooks();
    this.loadProblemSolutions();
    this.loadCTAs();
  }

  private loadFrameworks(): void {
    this.frameworks = [
      {
        id: 'problem_agitation_solution',
        name: 'Problem-Agitation-Solution (PAS)',
        description: 'Identify problem, agitate pain, present solution',
        structure: ['Problem Hook', 'Pain Agitation', 'Solution Reveal', 'Social Proof', 'Call to Action'],
        useCases: ['Pain point content', 'Product launches', 'Service promotion'],
        viralityScore: 92,
        platforms: ['instagram', 'tiktok', 'facebook', 'youtube'],
        niches: ['business', 'fitness', 'education', 'creator']
      },
      {
        id: 'before_after_bridge',
        name: 'Before-After-Bridge (BAB)',
        description: 'Show current state, desired state, and the bridge',
        structure: ['Current State', 'Desired State', 'Bridge Solution', 'Proof', 'CTA'],
        useCases: ['Transformation content', 'Success stories', 'Tutorial videos'],
        viralityScore: 89,
        platforms: ['instagram', 'tiktok', 'linkedin', 'youtube'],
        niches: ['fitness', 'business', 'education', 'creator']
      },
      {
        id: 'curiosity_gap',
        name: 'Curiosity Gap',
        description: 'Create knowledge gap that demands to be filled',
        structure: ['Intriguing Hook', 'Setup Mystery', 'Build Tension', 'Reveal Answer', 'Deeper Value'],
        useCases: ['Educational content', 'Tips and tricks', 'Secret reveals'],
        viralityScore: 94,
        platforms: ['tiktok', 'instagram', 'twitter', 'youtube'],
        niches: ['education', 'business', 'creator', 'fitness']
      },
      {
        id: 'authority_story',
        name: 'Authority Story',
        description: 'Establish credibility through personal narrative',
        structure: ['Credentials Hook', 'Challenge Faced', 'Journey Taken', 'Results Achieved', 'Lesson Learned'],
        useCases: ['Personal branding', 'Thought leadership', 'Case studies'],
        viralityScore: 87,
        platforms: ['linkedin', 'youtube', 'instagram', 'facebook'],
        niches: ['business', 'creator', 'education', 'fitness']
      },
      {
        id: 'list_reveal',
        name: 'List Reveal',
        description: 'Promise multiple valuable items and reveal one by one',
        structure: ['Number Promise', 'Item 1 Reveal', 'Item 2 Reveal', 'Final Item Surprise', 'Summary CTA'],
        useCases: ['Tips compilations', 'Resource lists', 'Step-by-step guides'],
        viralityScore: 85,
        platforms: ['tiktok', 'instagram', 'twitter', 'youtube'],
        niches: ['education', 'business', 'fitness', 'creator']
      }
    ];
  }

  private loadHooks(): void {
    this.hooks = [
      // Business hooks
      {
        id: 'business_mistake_hook',
        template: 'The #{number} mistake {target_audience} make that costs them ${amount}',
        category: 'fear',
        niche: 'business',
        platform: 'linkedin',
        viralityScore: 91,
        variables: ['number', 'target_audience', 'amount'],
        examples: ['The #1 mistake entrepreneurs make that costs them $50k']
      },
      {
        id: 'business_secret_hook',
        template: 'The {topic} secret that {big_company} doesn\'t want you to know',
        category: 'curiosity',
        niche: 'business',
        platform: 'twitter',
        viralityScore: 88,
        variables: ['topic', 'big_company'],
        examples: ['The marketing secret that Apple doesn\'t want you to know']
      },
      {
        id: 'business_result_hook',
        template: 'How I {achieved_result} in {timeframe} (and you can too)',
        category: 'desire',
        niche: 'business',
        platform: 'instagram',
        viralityScore: 85,
        variables: ['achieved_result', 'timeframe'],
        examples: ['How I built a 6-figure business in 6 months (and you can too)']
      },

      // Fitness hooks
      {
        id: 'fitness_transformation_hook',
        template: '{timeframe} ago I {starting_point}. Today I {end_point}',
        category: 'surprise',
        niche: 'fitness',
        platform: 'instagram',
        viralityScore: 93,
        variables: ['timeframe', 'starting_point', 'end_point'],
        examples: ['30 days ago I couldn\'t do a push-up. Today I did 100']
      },
      {
        id: 'fitness_mistake_hook',
        template: 'Stop doing {common_exercise}. Here\'s why it\'s {negative_effect}',
        category: 'anger',
        niche: 'fitness',
        platform: 'tiktok',
        viralityScore: 89,
        variables: ['common_exercise', 'negative_effect'],
        examples: ['Stop doing crunches. Here\'s why they\'re destroying your back']
      },

      // Creator hooks
      {
        id: 'creator_growth_hook',
        template: '{platform} just changed their algorithm. Here\'s how to win',
        category: 'curiosity',
        niche: 'creator',
        platform: 'twitter',
        viralityScore: 87,
        variables: ['platform'],
        examples: ['Instagram just changed their algorithm. Here\'s how to win']
      },
      {
        id: 'creator_behind_scenes_hook',
        template: 'What {timeframe} of content creation actually looks like',
        category: 'social_proof',
        niche: 'creator',
        platform: 'instagram',
        viralityScore: 84,
        variables: ['timeframe'],
        examples: ['What 365 days of content creation actually looks like']
      },

      // Education hooks
      {
        id: 'education_trick_hook',
        template: 'Your {subject} teacher never told you this {skill} trick',
        category: 'curiosity',
        niche: 'education',
        platform: 'tiktok',
        viralityScore: 90,
        variables: ['subject', 'skill'],
        examples: ['Your math teacher never told you this calculation trick']
      },
      {
        id: 'education_learn_hook',
        template: 'Learn {skill} in {timeframe} (even if you\'re {obstacle})',
        category: 'desire',
        niche: 'education',
        platform: 'youtube',
        viralityScore: 86,
        variables: ['skill', 'timeframe', 'obstacle'],
        examples: ['Learn coding in 30 days (even if you\'re not technical)']
      }
    ];
  }

  private loadProblemSolutions(): void {
    this.problemSolutions = [
      {
        id: 'business_cash_flow',
        problem: 'Small businesses struggling with inconsistent cash flow',
        solution: 'Predictable revenue through subscription model implementation',
        niche: 'business',
        urgencyLevel: 'critical',
        emotionalTrigger: 'financial security',
        targetAudience: 'small business owners'
      },
      {
        id: 'fitness_motivation',
        problem: 'People starting strong but losing motivation after 2 weeks',
        solution: 'Habit stacking system that makes exercise automatic',
        niche: 'fitness',
        urgencyLevel: 'high',
        emotionalTrigger: 'self-improvement',
        targetAudience: 'fitness beginners'
      },
      {
        id: 'creator_burnout',
        problem: 'Content creators burning out from constant content pressure',
        solution: 'Batch creation system and content repurposing strategy',
        niche: 'creator',
        urgencyLevel: 'high',
        emotionalTrigger: 'sustainability',
        targetAudience: 'content creators'
      },
      {
        id: 'education_retention',
        problem: 'Students forgetting what they learn within 24 hours',
        solution: 'Spaced repetition system with active recall techniques',
        niche: 'education',
        urgencyLevel: 'medium',
        emotionalTrigger: 'academic success',
        targetAudience: 'students and lifelong learners'
      }
    ];
  }

  private loadCTAs(): void {
    this.ctas = [
      {
        id: 'instagram_save_share',
        template: 'Save this post and share it with someone who needs to see this!',
        urgencyLevel: 'medium',
        platform: 'instagram',
        action: 'share',
        conversionRate: 8.5
      },
      {
        id: 'tiktok_follow_comment',
        template: 'Follow for more tips like this and comment your biggest challenge below!',
        urgencyLevel: 'low',
        platform: 'tiktok',
        action: 'subscribe',
        conversionRate: 12.3
      },
      {
        id: 'linkedin_connect_comment',
        template: 'Connect with me for more insights and drop a comment with your thoughts!',
        urgencyLevel: 'low',
        platform: 'linkedin',
        action: 'comment',
        conversionRate: 15.7
      },
      {
        id: 'youtube_subscribe_bell',
        template: 'Subscribe and hit the bell for weekly videos that will change your game!',
        urgencyLevel: 'medium',
        platform: 'youtube',
        action: 'subscribe',
        conversionRate: 18.2
      },
      {
        id: 'urgent_download',
        template: 'Download this free guide before it\'s gone - link in bio!',
        urgencyLevel: 'high',
        platform: 'instagram',
        action: 'download',
        conversionRate: 22.1
      },
      {
        id: 'limited_offer',
        template: 'Get 50% off (24 hours only) - link in bio!',
        urgencyLevel: 'high',
        platform: 'instagram',
        action: 'buy',
        conversionRate: 35.4
      }
    ];
  }
}

// Export singleton instance
export const smartContentLibrary = SmartContentLibrary.getInstance();