import Anthropic from '@anthropic-ai/sdk';
import { Niche, Platform } from '@/lib/types/database';

// Types for Claude Service
export interface ViralHook {
  hook: string;
  timing: string;
  emotionalTrigger: string;
  callToAction: string;
}

export interface VideoScript {
  sections: Array<{
    timeRange: string;
    content: string;
    visualCues: string[];
    audioSync: string;
  }>;
  totalDuration: number;
  keyMoments: string[];
  viralElements: string[];
}

export interface AudioTrack {
  id: string;
  name: string;
  bpm: number;
  genre: string;
  mood: string;
}

export interface VisualElement {
  type: 'text' | 'image' | 'video' | 'transition';
  content: string;
  timing: { start: number; end: number };
  effects: string[];
}

export interface ViralPrediction {
  score: number;
  confidence: number;
  strengths: string[];
  improvements: string[];
  predictedViews: { min: number; max: number };
  bestPostingTime: string;
}

export interface Template {
  id: string;
  name: string;
  niche: Niche;
  platform: Platform;
  baseScript: string;
  duration: number;
}

/**
 * Claude AI Service for content generation
 * Handles all AI-powered content creation for viral videos
 */
export class ClaudeService {
  private static instance: ClaudeService;
  private anthropic: Anthropic | null = null;
  private isTestMode: boolean = true;

  private constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      this.isTestMode = false;
    } else {
      console.warn('⚠️ ClaudeService running in TEST MODE - using fallback content');
    }
  }

  static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService();
    }
    return ClaudeService.instance;
  }

  /**
   * Generate a viral hook based on niche and platform
   */
  async generateViralHook(params: {
    niche: Niche;
    platform: Platform;
    topic: string;
    targetAudience?: string;
  }): Promise<ViralHook> {
    const { niche, platform, topic, targetAudience } = params;

    if (!this.isTestMode && this.anthropic) {
      try {
        const prompt = `Generate a viral video hook for:
        - Niche: ${niche}
        - Platform: ${platform}
        - Topic: ${topic}
        - Target Audience: ${targetAudience || 'general'}
        
        Provide:
        1. A compelling hook (first 3 seconds)
        2. Optimal timing breakdown
        3. The emotional trigger being used
        4. A clear call-to-action
        
        Format as JSON with: hook, timing, emotionalTrigger, callToAction`;

        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        });

        // Parse the response and return structured data
        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        return JSON.parse(content);
      } catch (error) {
        console.error('Claude API error:', error);
        // Fall back to test content
      }
    }

    // Fallback content for each niche/platform combination
    return this.getFallbackViralHook(niche, platform, topic);
  }

  /**
   * Generate complete video script with timing
   */
  async generateVideoScript(params: {
    template: Template;
    userInput: string;
    duration: number;
    style?: string;
  }): Promise<VideoScript> {
    const { template, userInput, duration, style } = params;

    if (!this.isTestMode && this.anthropic) {
      try {
        const prompt = `Create a ${duration}-second viral video script:
        - Template: ${template.name}
        - User Input: ${userInput}
        - Style: ${style || 'engaging and authentic'}
        - Platform: ${template.platform}
        
        Structure:
        1. Hook (0-3s): Grab attention
        2. Problem (3-10s): Present pain point
        3. Solution (10-20s): Your value prop
        4. Proof (20-25s): Social proof/results
        5. CTA (25-30s): Clear next step
        
        Include visual cues and audio sync points.
        Format as detailed JSON script sections.`;

        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        return JSON.parse(content);
      } catch (error) {
        console.error('Claude API error:', error);
      }
    }

    // Return fallback script
    return this.getFallbackVideoScript(template, userInput, duration);
  }

  /**
   * Predict viral potential of content
   */
  async predictViralScore(params: {
    script: VideoScript;
    audioTrack: AudioTrack;
    visualElements: VisualElement[];
    niche: Niche;
    platform: Platform;
  }): Promise<ViralPrediction> {
    const { script, audioTrack, visualElements, niche, platform } = params;

    if (!this.isTestMode && this.anthropic) {
      try {
        const prompt = `Analyze viral potential:
        - Script sections: ${script.sections.length}
        - Audio: ${audioTrack.name} (${audioTrack.bpm} BPM, ${audioTrack.mood})
        - Visual elements: ${visualElements.length}
        - Niche: ${niche}
        - Platform: ${platform}
        
        Evaluate:
        1. Hook strength (0-100)
        2. Emotional resonance
        3. Trend alignment
        4. Platform optimization
        5. Predicted performance
        
        Provide score, confidence, strengths, improvements, view prediction, and best posting time.`;

        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        return JSON.parse(content);
      } catch (error) {
        console.error('Claude API error:', error);
      }
    }

    // Return fallback prediction
    return this.getFallbackViralPrediction(script, audioTrack, niche, platform);
  }

  /**
   * Generate content ideas based on trending topics
   */
  async generateContentIdeas(params: {
    niche: Niche;
    platform: Platform;
    count: number;
    trendingTopics?: string[];
  }): Promise<Array<{ title: string; hook: string; viralScore: number }>> {
    if (!this.isTestMode && this.anthropic) {
      try {
        const prompt = `Generate ${params.count} viral video ideas for:
        - Niche: ${params.niche}
        - Platform: ${params.platform}
        ${params.trendingTopics ? `- Trending: ${params.trendingTopics.join(', ')}` : ''}
        
        For each idea provide:
        1. Catchy title
        2. Opening hook
        3. Viral score (0-100)
        
        Focus on what's working NOW on ${params.platform}.`;

        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        return JSON.parse(content);
      } catch (error) {
        console.error('Claude API error:', error);
      }
    }

    // Return fallback ideas
    return this.getFallbackContentIdeas(params.niche, params.platform, params.count);
  }

  /**
   * Optimize content for platform-specific algorithms
   */
  async optimizeForPlatform(params: {
    content: string;
    platform: Platform;
    currentTrends: string[];
  }): Promise<{ optimizedContent: string; changes: string[]; tips: string[] }> {
    if (!this.isTestMode && this.anthropic) {
      try {
        const prompt = `Optimize this content for ${params.platform}:
        "${params.content}"
        
        Current trends: ${params.currentTrends.join(', ')}
        
        Provide:
        1. Optimized version
        2. List of changes made
        3. Platform-specific tips
        
        Focus on ${params.platform}'s algorithm preferences.`;

        const response = await this.anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 600,
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        return JSON.parse(content);
      } catch (error) {
        console.error('Claude API error:', error);
      }
    }

    // Return fallback optimization
    return {
      optimizedContent: this.getPlatformOptimizedContent(params.content, params.platform),
      changes: ['Added platform-specific hashtags', 'Optimized hook timing', 'Enhanced CTA'],
      tips: this.getPlatformTips(params.platform)
    };
  }

  // Fallback content methods
  private getFallbackViralHook(niche: Niche, platform: Platform, topic: string): ViralHook {
    const hooks: Record<`${Niche}-${Platform}`, ViralHook> = {
      'business-linkedin': {
        hook: "The ONE LinkedIn strategy that 10x'd my leads in 30 days...",
        timing: "0-3 seconds: Bold claim with specific result",
        emotionalTrigger: "FOMO - Fear of missing out on growth",
        callToAction: "Comment 'GROWTH' to get my free template"
      },
      'business-twitter': {
        hook: "I made $50k from one Twitter thread. Here's the formula:",
        timing: "0-2 seconds: Shocking result + promise",
        emotionalTrigger: "Greed - Desire for financial success",
        callToAction: "Bookmark this thread and thank me later"
      },
      'business-facebook': {
        hook: "Warning: This Facebook ad strategy is almost TOO effective",
        timing: "0-3 seconds: Pattern interrupt with warning",
        emotionalTrigger: "Curiosity - What's the secret?",
        callToAction: "Share this before Facebook changes their algorithm"
      },
      'business-instagram': {
        hook: "POV: You just discovered the Instagram hack big brands don't want you to know",
        timing: "0-3 seconds: POV format + conspiracy angle",
        emotionalTrigger: "Rebellion - Us vs them mentality",
        callToAction: "Save this post and try it today"
      },
      'creator-linkedin': {
        hook: "How I went from 0 to 100k LinkedIn followers (no ads, no hacks)",
        timing: "0-3 seconds: Transformation story",
        emotionalTrigger: "Inspiration - If I can do it, you can too",
        callToAction: "Follow for daily creator tips"
      },
      'creator-twitter': {
        hook: "The Twitter algorithm LOVES this one weird trick:",
        timing: "0-2 seconds: Algorithm secret reveal",
        emotionalTrigger: "Curiosity - Weird trick intrigue",
        callToAction: "RT to save a creator's career"
      },
      'creator-facebook': {
        hook: "Facebook just showed me why 90% of creators fail...",
        timing: "0-3 seconds: Negative statistic hook",
        emotionalTrigger: "Fear - Avoiding failure",
        callToAction: "Type 'YES' if you want the solution"
      },
      'creator-instagram': {
        hook: "Replying to @user: Yes, this is how I edit viral Reels",
        timing: "0-3 seconds: Reply format for authenticity",
        emotionalTrigger: "Helpfulness - Answering questions",
        callToAction: "Check my bio for the full tutorial"
      },
      'fitness-linkedin': {
        hook: "Corporate wellness programs are broken. Here's what actually works:",
        timing: "0-3 seconds: Problem + solution tease",
        emotionalTrigger: "Frustration - Current solutions don't work",
        callToAction: "DM me 'WELLNESS' for a free consultation"
      },
      'fitness-twitter': {
        hook: "Lost 30lbs while growing my business. The secret? It's not what you think.",
        timing: "0-3 seconds: Personal result + mystery",
        emotionalTrigger: "Surprise - Unexpected solution",
        callToAction: "Follow the thread for the full system"
      },
      'fitness-facebook': {
        hook: "At 45, I'm in the best shape of my life. Here's my morning routine:",
        timing: "0-3 seconds: Age-defying transformation",
        emotionalTrigger: "Hope - It's never too late",
        callToAction: "Join our free 30-day challenge"
      },
      'fitness-instagram': {
        hook: "What I eat in a day to stay shredded (realistic edition)",
        timing: "0-3 seconds: WIEIAD format + realistic angle",
        emotionalTrigger: "Relatability - Achievable goals",
        callToAction: "Comment your biggest nutrition struggle"
      },
      'education-linkedin': {
        hook: "Harvard's study on learning just proved what we suspected all along...",
        timing: "0-3 seconds: Authority + validation",
        emotionalTrigger: "Vindication - Science backs common sense",
        callToAction: "Share with someone who needs to see this"
      },
      'education-twitter': {
        hook: "Schools won't teach you this, but it's the most important skill of 2024:",
        timing: "0-3 seconds: Anti-establishment + future focus",
        emotionalTrigger: "Concern - Don't get left behind",
        callToAction: "Save this thread for your kids"
      },
      'education-facebook': {
        hook: "My daughter learned more from YouTube than 12 years of school. Here's why:",
        timing: "0-3 seconds: Personal story + controversial take",
        emotionalTrigger: "Validation - Parents' concerns confirmed",
        callToAction: "Share if you agree education needs reform"
      },
      'education-instagram': {
        hook: "Study hack that got me from C's to A's:",
        timing: "0-2 seconds: Transformation + hack promise",
        emotionalTrigger: "Hope - Academic improvement possible",
        callToAction: "Save for exam season!"
      }
    };

    return hooks[`${niche}-${platform}`] || {
      hook: `Discover the secret to ${topic} success...`,
      timing: "0-3 seconds: Mystery hook",
      emotionalTrigger: "Curiosity",
      callToAction: "Learn more in my bio"
    };
  }

  private getFallbackVideoScript(template: Template, userInput: string, duration: number): VideoScript {
    return {
      sections: [
        {
          timeRange: "0-3s",
          content: `Hook: ${userInput}`,
          visualCues: ["Close-up face shot", "Text overlay", "Quick cut"],
          audioSync: "Beat drop at 2s"
        },
        {
          timeRange: "3-10s",
          content: "Present the problem your audience faces",
          visualCues: ["B-roll footage", "Problem visualization", "Emotional close-ups"],
          audioSync: "Building tension"
        },
        {
          timeRange: "10-20s",
          content: "Reveal your unique solution",
          visualCues: ["Product demo", "Before/after", "Success metrics"],
          audioSync: "Upbeat transition"
        },
        {
          timeRange: "20-25s",
          content: "Show social proof and results",
          visualCues: ["Testimonials", "Screenshots", "Numbers animation"],
          audioSync: "Confident rhythm"
        },
        {
          timeRange: "25-30s",
          content: "Clear call-to-action",
          visualCues: ["CTA text", "Arrow pointing", "Urgency element"],
          audioSync: "Final beat drop"
        }
      ],
      totalDuration: duration,
      keyMoments: ["0s - Hook", "10s - Solution reveal", "25s - CTA"],
      viralElements: ["Pattern interrupt", "Emotional story", "Clear value prop", "Social proof"]
    };
  }

  private getFallbackViralPrediction(
    script: VideoScript,
    audioTrack: AudioTrack,
    niche: Niche,
    platform: Platform
  ): ViralPrediction {
    // Simple scoring based on key elements
    const baseScore = 60;
    const hookBonus = script.sections[0].content.length > 50 ? 10 : 5;
    const audioBonus = audioTrack.bpm > 120 ? 10 : 5;
    const platformBonus = 15; // Assume good platform fit
    
    const totalScore = Math.min(100, baseScore + hookBonus + audioBonus + platformBonus);

    return {
      score: totalScore,
      confidence: 0.75,
      strengths: [
        "Strong emotional hook",
        "Good audio-visual sync",
        "Clear value proposition",
        "Platform-optimized duration"
      ],
      improvements: [
        "Add more pattern interrupts",
        "Include trending sounds",
        "Enhance visual transitions"
      ],
      predictedViews: {
        min: totalScore * 1000,
        max: totalScore * 5000
      },
      bestPostingTime: this.getBestPostingTime(platform)
    };
  }

  private getFallbackContentIdeas(niche: Niche, platform: Platform, count: number) {
    const ideas: Record<Niche, Array<{ title: string; hook: string; viralScore: number }>> = {
      business: [
        {
          title: "The $100k LinkedIn Strategy No One Talks About",
          hook: "I generated $100k from LinkedIn in 90 days using this weird strategy...",
          viralScore: 85
        },
        {
          title: "Why Your Sales Funnel Is Broken (And How to Fix It)",
          hook: "Your funnel is leaking money at THIS exact spot...",
          viralScore: 78
        },
        {
          title: "The 4-Hour Work Week Is Dead. Here's What's Next",
          hook: "Forget the 4-hour work week. The future is...",
          viralScore: 82
        }
      ],
      creator: [
        {
          title: "How I Gained 100k Followers in 30 Days (No Ads)",
          hook: "Everyone said organic growth was dead. Then I did this...",
          viralScore: 92
        },
        {
          title: "The Algorithm Change That's Making Creators Rich",
          hook: "The platform just revealed their algorithm. Here's how to win...",
          viralScore: 88
        },
        {
          title: "Why 99% of Creators Burn Out (And How to Avoid It)",
          hook: "I almost quit content creation. Then I discovered...",
          viralScore: 75
        }
      ],
      fitness: [
        {
          title: "The 5-Minute Morning Routine That Changed My Life",
          hook: "This 5-minute routine replaced my 2-hour gym session...",
          viralScore: 83
        },
        {
          title: "What Happens When You Quit Sugar for 30 Days",
          hook: "Day 1 without sugar: Hell. Day 30: Life-changing...",
          viralScore: 90
        },
        {
          title: "The Exercise Science Says You Should Never Do",
          hook: "This popular exercise is destroying your gains...",
          viralScore: 79
        }
      ],
      education: [
        {
          title: "How to Learn Anything 10x Faster (Science-Based)",
          hook: "MIT researchers discovered this learning hack that changes everything...",
          viralScore: 87
        },
        {
          title: "The Skills Schools Should Teach (But Don't)",
          hook: "Your kids won't learn these in school, but they're essential for 2024...",
          viralScore: 81
        },
        {
          title: "Why Traditional Education Is Becoming Obsolete",
          hook: "Google just said they don't care about degrees anymore. Here's why...",
          viralScore: 85
        }
      ]
    };

    return ideas[niche].slice(0, count);
  }

  private getPlatformOptimizedContent(content: string, platform: Platform): string {
    const optimizations: Record<Platform, string> = {
      linkedin: content + "\n\n#LinkedInMarketing #B2B #ProfessionalGrowth\n\nThoughts?",
      twitter: content.substring(0, 250) + "... 🧵\n\n(1/8)",
      facebook: "🚨 " + content + "\n\nType 'YES' if this resonates with you! 👇",
      instagram: content + "\n\n-\n" + this.generateInstagramHashtags()
    };

    return optimizations[platform];
  }

  private getPlatformTips(platform: Platform): string[] {
    const tips: Record<Platform, string[]> = {
      linkedin: [
        "Post during business hours (8-10 AM, 5-6 PM)",
        "Use native video for 3x more engagement",
        "Ask a question to boost comments"
      ],
      twitter: [
        "Keep initial tweet under 200 characters",
        "Use thread format for complex topics",
        "Include a visual in tweet #3"
      ],
      facebook: [
        "Videos 1-3 minutes perform best",
        "Ask for specific reactions (not just likes)",
        "Post when your audience is most active"
      ],
      instagram: [
        "Reels under 30 seconds get more views",
        "Use trending audio for 2x reach",
        "Include a text hook in first 3 seconds"
      ]
    };

    return tips[platform];
  }

  private getBestPostingTime(platform: Platform): string {
    const times: Record<Platform, string> = {
      linkedin: "Tuesday-Thursday, 8-10 AM",
      twitter: "Weekdays, 9-10 AM & 7-9 PM",
      facebook: "Thursday-Sunday, 1-4 PM",
      instagram: "Monday-Friday, 11 AM-1 PM & 7-9 PM"
    };

    return times[platform];
  }

  private generateInstagramHashtags(): string {
    const hashtags = [
      "#viralreels", "#contentcreator", "#trending", "#explorepage",
      "#reelsinstagram", "#viralvideos", "#instareels", "#trendingreels",
      "#reelitfeelit", "#videooftheday", "#instaviral", "#contentcreation"
    ];
    
    // Return 10 random hashtags
    return hashtags.sort(() => 0.5 - Math.random()).slice(0, 10).join(' ');
  }
}

// Export singleton instance
export const claudeService = ClaudeService.getInstance();