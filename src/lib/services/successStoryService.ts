// Success Story Service for generating compelling user success content

export interface UserSuccessData {
  userId: string;
  userName: string;
  metric: string;
  beforeValue: number;
  afterValue: number;
  improvement: number;
  timeframe: string;
  industry: string;
  useCase: string;
  testimonial?: string;
  dateAchieved: Date;
}

export interface SuccessStoryTemplate {
  id: string;
  name: string;
  style: 'testimonial_montage' | 'before_after' | 'case_study' | 'stat_showcase';
  format: 'video_script' | 'social_post' | 'landing_page' | 'email';
  duration?: number; // For video scripts
  structure: {
    hook: string;
    problem: string;
    solution: string;
    results: string;
    cta: string;
  };
}

export interface GeneratedStoryContent {
  id: string;
  template: SuccessStoryTemplate;
  userData: UserSuccessData[];
  content: {
    script: string;
    visualCues: string[];
    musicSuggestion: string;
    textOverlays: string[];
  };
  performance: {
    expectedViews: number;
    expectedEngagement: number;
    viralProbability: number;
  };
}

class SuccessStoryService {
  private readonly mockUserSuccesses: UserSuccessData[] = [
    {
      userId: '1',
      userName: 'Sarah Chen',
      metric: 'content engagement',
      beforeValue: 150,
      afterValue: 12500,
      improvement: 8233,
      timeframe: '30 days',
      industry: 'Tech Startup',
      useCase: 'Product launch videos',
      testimonial: 'Trendzo completely transformed how we create content. Our engagement went through the roof!',
      dateAchieved: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      userId: '2',
      userName: 'Marcus Rodriguez',
      metric: 'conversion rate',
      beforeValue: 1.2,
      afterValue: 6.8,
      improvement: 467,
      timeframe: '2 weeks',
      industry: 'SaaS',
      useCase: 'Feature announcement videos',
      testimonial: 'The AI-powered suggestions helped us create our first viral video that got 2.3M views.',
      dateAchieved: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      userId: '3',
      userName: 'Jennifer Kim',
      metric: 'video views',
      beforeValue: 500,
      afterValue: 850000,
      improvement: 169900,
      timeframe: '1 week',
      industry: 'E-commerce',
      useCase: 'Product demos',
      testimonial: 'I went from 500 views to 850K views in just one week using Trendzo templates.',
      dateAchieved: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      userId: '4',
      userName: 'David Park',
      metric: 'lead generation',
      beforeValue: 12,
      afterValue: 340,
      improvement: 2733,
      timeframe: '3 weeks',
      industry: 'Marketing Agency',
      useCase: 'Client case studies',
      testimonial: 'Our client acquisition tripled after we started using Trendzo for our video content.',
      dateAchieved: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    },
    {
      userId: '5',
      userName: 'Lisa Zhang',
      metric: 'follower growth',
      beforeValue: 2400,
      afterValue: 45600,
      improvement: 1800,
      timeframe: '6 weeks',
      industry: 'Personal Brand',
      useCase: 'Educational content',
      testimonial: 'Trendzo helped me build a personal brand that landed me speaking opportunities.',
      dateAchieved: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  ];

  private readonly storyTemplates: SuccessStoryTemplate[] = [
    {
      id: 'testimonial_montage',
      name: 'Testimonial Montage',
      style: 'testimonial_montage',
      format: 'video_script',
      duration: 30,
      structure: {
        hook: 'What if I told you [metric] could increase by [improvement]% in just [timeframe]?',
        problem: 'Like many [industry] professionals, [userName] was struggling with [problem_area].',
        solution: 'Then they discovered Trendzo and everything changed.',
        results: 'In just [timeframe], [userName] saw their [metric] go from [before] to [after].',
        cta: 'Ready to see similar results? Start your Trendzo journey today.',
      },
    },
    {
      id: 'before_after',
      name: 'Before & After Transformation',
      style: 'before_after',
      format: 'video_script',
      duration: 25,
      structure: {
        hook: 'From [before] to [after] in [timeframe] - here\'s how:',
        problem: '[userName] was stuck at [before] [metric] and feeling frustrated.',
        solution: 'They tried Trendzo\'s AI-powered content creation tools.',
        results: 'The results? [improvement]% increase in [metric] and [testimonial]',
        cta: 'Your transformation starts here. Try Trendzo free.',
      },
    },
    {
      id: 'stat_showcase',
      name: 'Statistics Showcase',
      style: 'stat_showcase',
      format: 'video_script',
      duration: 20,
      structure: {
        hook: '[improvement]% increase. [timeframe]. Real results.',
        problem: 'Most [industry] companies struggle with low-performing content.',
        solution: 'Trendzo users see different results.',
        results: '[userName]: [before] → [after] [metric]. [improvement]% growth.',
        cta: 'Join thousands getting real results with Trendzo.',
      },
    },
  ];

  async fetchTopUserSuccesses(criteria: {
    metric: string;
    timeframe: string;
    limit: number;
    industry?: string;
  }): Promise<UserSuccessData[]> {
    // Simulate API call to fetch real user success data
    await new Promise(resolve => setTimeout(resolve, 1000));

    let filteredSuccesses = this.mockUserSuccesses;

    // Filter by metric if specified
    if (criteria.metric !== 'any') {
      filteredSuccesses = filteredSuccesses.filter(success => 
        success.metric.toLowerCase().includes(criteria.metric.toLowerCase())
      );
    }

    // Filter by industry if specified
    if (criteria.industry) {
      filteredSuccesses = filteredSuccesses.filter(success =>
        success.industry.toLowerCase().includes(criteria.industry.toLowerCase())
      );
    }

    // Sort by improvement percentage (highest first)
    filteredSuccesses.sort((a, b) => b.improvement - a.improvement);

    return filteredSuccesses.slice(0, criteria.limit);
  }

  async generateSuccessStoryScript(
    successData: UserSuccessData[],
    templateId: string,
    customizations?: {
      tone?: 'professional' | 'casual' | 'inspirational' | 'urgent';
      length?: 'short' | 'medium' | 'long';
      platform?: 'tiktok' | 'linkedin' | 'instagram' | 'youtube';
    }
  ): Promise<GeneratedStoryContent> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const template = this.storyTemplates.find(t => t.id === templateId) || this.storyTemplates[0];
    const primarySuccess = successData[0];

    // Generate script based on template
    let script = this.generateScriptFromTemplate(template, primarySuccess, customizations);

    // Generate visual cues
    const visualCues = this.generateVisualCues(template, primarySuccess, customizations);

    // Generate music suggestion
    const musicSuggestion = this.generateMusicSuggestion(customizations?.platform || 'tiktok', customizations?.tone || 'inspirational');

    // Generate text overlays
    const textOverlays = this.generateTextOverlays(primarySuccess, template);

    // Calculate expected performance
    const performance = this.calculateExpectedPerformance(successData, template, customizations);

    return {
      id: `story_${Date.now()}`,
      template,
      userData: successData,
      content: {
        script,
        visualCues,
        musicSuggestion,
        textOverlays,
      },
      performance,
    };
  }

  async createVideoTemplate(storyContent: GeneratedStoryContent): Promise<{
    templateId: string;
    videoSpec: {
      duration: number;
      format: string;
      resolution: string;
    };
    timeline: {
      timestamp: number;
      action: string;
      content: string;
    }[];
    assets: {
      backgrounds: string[];
      overlays: string[];
      music: string;
    };
  }> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const timeline = this.generateTimeline(storyContent);
    const assets = this.generateAssetList(storyContent);

    return {
      templateId: `template_${storyContent.id}`,
      videoSpec: {
        duration: storyContent.template.duration || 30,
        format: '9:16',
        resolution: '1080x1920',
      },
      timeline,
      assets,
    };
  }

  private generateScriptFromTemplate(
    template: SuccessStoryTemplate,
    successData: UserSuccessData,
    customizations?: any
  ): string {
    let script = '';

    // Hook
    script += template.structure.hook
      .replace('[metric]', successData.metric)
      .replace('[improvement]', successData.improvement.toString())
      .replace('[timeframe]', successData.timeframe) + '\n\n';

    // Problem
    script += template.structure.problem
      .replace('[industry]', successData.industry)
      .replace('[userName]', successData.userName)
      .replace('[problem_area]', this.getProblemArea(successData.metric)) + '\n\n';

    // Solution
    script += template.structure.solution + '\n\n';

    // Results
    script += template.structure.results
      .replace('[timeframe]', successData.timeframe)
      .replace('[userName]', successData.userName)
      .replace('[metric]', successData.metric)
      .replace('[before]', this.formatValue(successData.beforeValue, successData.metric))
      .replace('[after]', this.formatValue(successData.afterValue, successData.metric))
      .replace('[improvement]', successData.improvement.toString()) + '\n\n';

    // Add testimonial if available
    if (successData.testimonial) {
      script += `"${successData.testimonial}" - ${successData.userName}\n\n`;
    }

    // CTA
    script += template.structure.cta;

    return this.adjustScriptForCustomizations(script, customizations);
  }

  private generateVisualCues(
    template: SuccessStoryTemplate,
    successData: UserSuccessData,
    customizations?: any
  ): string[] {
    const cues = [];

    switch (template.style) {
      case 'testimonial_montage':
        cues.push('Show user avatar with name overlay');
        cues.push('Display before/after statistics');
        cues.push('Show Trendzo dashboard in action');
        cues.push('Cut to user testimonial video');
        break;

      case 'before_after':
        cues.push('Split screen: before vs after');
        cues.push('Animated numbers counting up');
        cues.push('Progress bar visualization');
        cues.push('Success celebration animation');
        break;

      case 'stat_showcase':
        cues.push('Large bold statistics');
        cues.push('Industry context graphics');
        cues.push('Growth chart animation');
        cues.push('Multiple success examples');
        break;
    }

    return cues;
  }

  private generateMusicSuggestion(platform: string, tone: string): string {
    const musicMap = {
      tiktok: {
        inspirational: 'uplifting_tech_beat_trending.mp3',
        professional: 'clean_corporate_modern.mp3',
        casual: 'friendly_upbeat_pop.mp3',
        urgent: 'high_energy_motivational.mp3',
      },
      linkedin: {
        inspirational: 'professional_inspiring_piano.mp3',
        professional: 'corporate_success_theme.mp3',
        casual: 'light_business_acoustic.mp3',
        urgent: 'urgent_professional_drive.mp3',
      },
    };

    return musicMap[platform as keyof typeof musicMap]?.[tone as keyof typeof musicMap['tiktok']] || 
           'inspirational_tech_background.mp3';
  }

  private generateTextOverlays(successData: UserSuccessData, template: SuccessStoryTemplate): string[] {
    return [
      `${successData.improvement}% INCREASE`,
      `${successData.timeframe.toUpperCase()}`,
      `${this.formatValue(successData.beforeValue, successData.metric)} → ${this.formatValue(successData.afterValue, successData.metric)}`,
      `${successData.userName}`,
      `${successData.industry}`,
      'REAL RESULTS',
      'TRY TRENDZO FREE',
    ];
  }

  private calculateExpectedPerformance(
    successData: UserSuccessData[],
    template: SuccessStoryTemplate,
    customizations?: any
  ): { expectedViews: number; expectedEngagement: number; viralProbability: number } {
    // Base performance on success story impressiveness
    const avgImprovement = successData.reduce((sum, data) => sum + data.improvement, 0) / successData.length;
    
    let baseViews = 50000;
    let baseEngagement = 2500;
    let viralProb = 45;

    // Boost based on improvement percentages
    if (avgImprovement > 1000) {
      baseViews *= 3;
      baseEngagement *= 2.5;
      viralProb += 25;
    } else if (avgImprovement > 500) {
      baseViews *= 2;
      baseEngagement *= 2;
      viralProb += 15;
    }

    // Template-specific adjustments
    if (template.style === 'testimonial_montage') {
      baseViews *= 1.4; // Testimonials perform well
      viralProb += 10;
    }

    // Platform adjustments
    if (customizations?.platform === 'tiktok') {
      baseViews *= 2; // TikTok has higher reach
      viralProb += 15;
    }

    return {
      expectedViews: Math.round(baseViews),
      expectedEngagement: Math.round(baseEngagement),
      viralProbability: Math.min(95, viralProb),
    };
  }

  private generateTimeline(storyContent: GeneratedStoryContent): {
    timestamp: number;
    action: string;
    content: string;
  }[] {
    const duration = storyContent.template.duration || 30;
    const timeline = [];

    // Hook (first 3 seconds)
    timeline.push({
      timestamp: 0,
      action: 'show_text',
      content: storyContent.userData[0].improvement + '% INCREASE',
    });

    timeline.push({
      timestamp: 1,
      action: 'show_voiceover',
      content: 'Hook section of script',
    });

    // Problem (3-8 seconds)
    timeline.push({
      timestamp: 3,
      action: 'show_user',
      content: storyContent.userData[0].userName,
    });

    timeline.push({
      timestamp: 4,
      action: 'show_before_stats',
      content: `Before: ${this.formatValue(storyContent.userData[0].beforeValue, storyContent.userData[0].metric)}`,
    });

    // Solution (8-15 seconds)
    timeline.push({
      timestamp: 8,
      action: 'show_trendzo_demo',
      content: 'Trendzo interface in action',
    });

    // Results (15-25 seconds)
    timeline.push({
      timestamp: 15,
      action: 'show_after_stats',
      content: `After: ${this.formatValue(storyContent.userData[0].afterValue, storyContent.userData[0].metric)}`,
    });

    timeline.push({
      timestamp: 18,
      action: 'show_testimonial',
      content: storyContent.userData[0].testimonial || 'Amazing results!',
    });

    // CTA (25-30 seconds)
    timeline.push({
      timestamp: 25,
      action: 'show_cta',
      content: 'Try Trendzo Free',
    });

    return timeline;
  }

  private generateAssetList(storyContent: GeneratedStoryContent): {
    backgrounds: string[];
    overlays: string[];
    music: string;
  } {
    return {
      backgrounds: [
        'gradient_success_bg.mp4',
        'testimonial_backdrop.jpg',
        'stats_visualization_bg.mp4',
      ],
      overlays: [
        'success_checkmarks.png',
        'growth_arrows.png',
        'percentage_indicators.png',
        'user_avatar_frame.png',
      ],
      music: storyContent.content.musicSuggestion,
    };
  }

  private getProblemArea(metric: string): string {
    const problemMap: Record<string, string> = {
      'content engagement': 'low engagement rates',
      'conversion rate': 'poor conversion performance',
      'video views': 'limited reach and visibility',
      'lead generation': 'struggling to generate quality leads',
      'follower growth': 'slow audience building',
    };
    return problemMap[metric] || 'content performance challenges';
  }

  private formatValue(value: number, metric: string): string {
    if (metric.includes('rate') || metric.includes('percentage')) {
      return `${value}%`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  }

  private adjustScriptForCustomizations(script: string, customizations?: any): string {
    if (!customizations) return script;

    // Adjust for tone
    if (customizations.tone === 'urgent') {
      script = script.replace(/\./g, '!');
      script = 'Don\'t wait! ' + script;
    } else if (customizations.tone === 'casual') {
      script = script.replace(/\b(discover|utilize|implement)\b/g, (match) => {
        const casual = { discover: 'find', utilize: 'use', implement: 'try' };
        return casual[match as keyof typeof casual] || match;
      });
    }

    // Adjust for length
    if (customizations.length === 'short') {
      const sentences = script.split('. ');
      script = sentences.slice(0, Math.ceil(sentences.length * 0.7)).join('. ');
    } else if (customizations.length === 'long') {
      script += '\n\nPlus, get access to our exclusive viral template library and AI-powered optimization tools.';
    }

    return script;
  }
}

export const successStoryService = new SuccessStoryService();