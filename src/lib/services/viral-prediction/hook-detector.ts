// Hook Detection System - 30+ viral patterns recognition

import { HookDetection } from '@/lib/types/viral-prediction';
import { createClient } from '@supabase/supabase-js';

interface HookFramework {
  id: string;
  name: string;
  category: string;
  pattern_rules: {
    keywords?: string[];
    visual_patterns?: string[];
    audio_patterns?: string[];
    structure_patterns?: string[];
    timing?: string;
    emotion?: string;
  };
  success_rate: number;
}

export class HookDetector {
  private supabase;
  private hookFrameworks: HookFramework[] = [];
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    this.loadHookFrameworks();
  }

  private async loadHookFrameworks() {
    const { data } = await this.supabase
      .from('hook_frameworks')
      .select('*')
      .order('success_rate', { ascending: false });
    
    this.hookFrameworks = data || [];
  }

  async detectHooks(video: {
    caption: string;
    visual_features: any;
    audio_features: any;
    duration_seconds: number;
    hashtags?: string[];
  }): Promise<HookDetection[]> {
    const detectedHooks: HookDetection[] = [];
    
    // Ensure frameworks are loaded
    if (this.hookFrameworks.length === 0) {
      await this.loadHookFrameworks();
    }

    for (const framework of this.hookFrameworks) {
      const detection = await this.detectSingleHook(video, framework);
      if (detection.confidence > 0.5) {
        detectedHooks.push(detection);
      }
    }

    // Sort by confidence
    return detectedHooks.sort((a, b) => b.confidence - a.confidence);
  }

  private async detectSingleHook(
    video: any, 
    framework: HookFramework
  ): Promise<HookDetection> {
    let confidence = 0;
    const detectedElements: string[] = [];
    const rules = framework.pattern_rules;

    // 1. Keyword detection in caption
    if (rules.keywords && video.caption) {
      const captionLower = video.caption.toLowerCase();
      const keywordMatches = rules.keywords.filter(keyword => 
        captionLower.includes(keyword.toLowerCase())
      );
      
      if (keywordMatches.length > 0) {
        confidence += 0.3 * (keywordMatches.length / rules.keywords.length);
        detectedElements.push(...keywordMatches.map(k => `keyword: ${k}`));
      }
    }

    // 2. Hashtag analysis
    if (video.hashtags && rules.keywords) {
      const hashtagMatches = video.hashtags.filter((tag: string) =>
        rules.keywords!.some(keyword => 
          tag.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (hashtagMatches.length > 0) {
        confidence += 0.2;
        detectedElements.push(...hashtagMatches.map((t: string) => `hashtag: ${t}`));
      }
    }

    // 3. Visual pattern detection
    if (rules.visual_patterns && video.visual_features) {
      const visualMatches = this.detectVisualPatterns(
        video.visual_features, 
        rules.visual_patterns
      );
      
      if (visualMatches.length > 0) {
        confidence += 0.25 * (visualMatches.length / rules.visual_patterns.length);
        detectedElements.push(...visualMatches);
      }
    }

    // 4. Audio pattern detection
    if (rules.audio_patterns && video.audio_features) {
      const audioMatches = this.detectAudioPatterns(
        video.audio_features,
        rules.audio_patterns
      );
      
      if (audioMatches.length > 0) {
        confidence += 0.15;
        detectedElements.push(...audioMatches);
      }
    }

    // 5. Timing-based detection
    if (rules.timing) {
      const timingMatch = this.checkTimingPattern(
        video.duration_seconds,
        rules.timing
      );
      
      if (timingMatch) {
        confidence += 0.1;
        detectedElements.push(`timing: ${rules.timing}`);
      }
    }

    return {
      hookId: framework.id,
      hookType: framework.name,
      confidence: Math.min(confidence, 1),
      detectedElements,
      expectedSuccessRate: framework.success_rate
    };
  }

  private detectVisualPatterns(
    visualFeatures: any,
    patterns: string[]
  ): string[] {
    const matches: string[] = [];
    
    // Example visual patterns
    patterns.forEach(pattern => {
      switch (pattern) {
        case 'split_screen':
          if (visualFeatures.layout?.includes('split')) {
            matches.push('visual: split_screen');
          }
          break;
        case 'text_overlay':
          if (visualFeatures.text_elements?.length > 0) {
            matches.push('visual: text_overlay');
          }
          break;
        case 'rapid_cuts':
          if (visualFeatures.cut_rate > 0.5) {
            matches.push('visual: rapid_cuts');
          }
          break;
        case 'face_closeup':
          if (visualFeatures.face_prominence > 0.7) {
            matches.push('visual: face_closeup');
          }
          break;
      }
    });
    
    return matches;
  }

  private detectAudioPatterns(
    audioFeatures: any,
    patterns: string[]
  ): string[] {
    const matches: string[] = [];
    
    patterns.forEach(pattern => {
      switch (pattern) {
        case 'trending_audio':
          if (audioFeatures.is_trending) {
            matches.push('audio: trending_sound');
          }
          break;
        case 'beat_drop':
          if (audioFeatures.beat_drops?.length > 0) {
            matches.push('audio: beat_drop_sync');
          }
          break;
        case 'voiceover':
          if (audioFeatures.has_voiceover) {
            matches.push('audio: voiceover');
          }
          break;
      }
    });
    
    return matches;
  }

  private checkTimingPattern(
    duration: number,
    timingRule: string
  ): boolean {
    switch (timingRule) {
      case 'first_3_seconds':
        return duration >= 3;
      case 'under_15_seconds':
        return duration <= 15;
      case 'optimal_length':
        return duration >= 15 && duration <= 60;
      default:
        return false;
    }
  }

  // Store detected hooks for a video
  async saveDetectedHooks(videoId: string, hooks: HookDetection[]) {
    for (const hook of hooks) {
      await this.supabase.from('video_hooks').insert({
        video_id: videoId,
        hook_id: hook.hookId,
        confidence_score: hook.confidence,
        detected_elements: hook.detectedElements,
        performance_impact: hook.expectedSuccessRate * hook.confidence
      });
    }
  }

  // Analyze hook effectiveness over time
  async analyzeHookPerformance() {
    const { data: hookPerformance } = await this.supabase
      .from('video_hooks')
      .select(`
        hook_id,
        videos!inner(viral_score, viral_probability),
        hook_frameworks!inner(name, category)
      `)
      .gte('confidence_score', 0.7);

    // Calculate actual performance vs expected
    const performanceMap = new Map();
    
    hookPerformance?.forEach(record => {
      const hookId = record.hook_id;
      if (!performanceMap.has(hookId)) {
        performanceMap.set(hookId, {
          totalVideos: 0,
          totalViralScore: 0,
          viralVideos: 0
        });
      }
      
      const stats = performanceMap.get(hookId);
      stats.totalVideos++;
      stats.totalViralScore += record.videos.viral_score;
      if (record.videos.viral_probability > 0.7) {
        stats.viralVideos++;
      }
    });

    // Update hook effectiveness scores
    for (const [hookId, stats] of performanceMap) {
      const actualSuccessRate = (stats.viralVideos / stats.totalVideos) * 100;
      
      await this.supabase
        .from('hook_frameworks')
        .update({ 
          success_rate: actualSuccessRate,
          usage_count: stats.totalVideos
        })
        .eq('id', hookId);
    }
  }
}