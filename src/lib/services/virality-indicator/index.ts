/**
 * Virality Indicator Engine
 * 
 * Proprietary 6-factor prediction algorithm for viral content analysis.
 * Analyzes multiple dimensions of content to predict virality potential.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ViralityInput {
  transcript: string;
  duration_seconds: number;
  resolution?: number;
  niche?: string;
  ffmpeg_data?: {
    scene_changes?: number;
    avg_brightness?: number;
    has_faces?: boolean;
    audio_levels?: number[];
  };
  metadata?: {
    has_text_overlay?: boolean;
    has_trending_audio?: boolean;
    posting_hour?: number;
  };
}

export interface ViralityResult {
  virality_indicator: number; // 0-100 score
  confidence: number;
  classification: 'low' | 'medium' | 'high' | 'viral';
  breakdown: {
    visual: number;
    audio: number;
    text: number;
    timing: number;
    pacing: number;
    engagement_potential: number;
  };
  sub_scores: Record<string, number>;
  top_recommendations: string[];
  processing_time_ms: number;
}

// ============================================================================
// VIRALITY INDICATOR ENGINE
// ============================================================================

export const viralityIndicator = {
  /**
   * Analyze content for virality potential
   */
  async analyze(input: ViralityInput): Promise<ViralityResult> {
    const startTime = Date.now();
    
    // Extract text features
    const transcript = input.transcript || '';
    const words = transcript.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const duration = input.duration_seconds || 0;
    
    // ========================================
    // FACTOR 1: TEXT QUALITY (0-100)
    // ========================================
    let textScore = 30;

    // Hook detection
    const hookPatterns = [
      /^(stop|wait|listen|watch|look)/i,
      /^(here'?s|this is)/i,
      /^(did you|have you|do you)/i,
      /\?.*\?/,
    ];
    if (hookPatterns.some(p => p.test(transcript))) {
      textScore += 15;
    } else {
      textScore -= 10; // No hook detected
    }

    // Question engagement
    const questionCount = (transcript.match(/\?/g) || []).length;
    textScore += Math.min(10, questionCount * 3);

    // Power words
    const powerWords = ['secret', 'discover', 'proven', 'amazing', 'shocking', 'truth', 'hidden'];
    const powerWordCount = powerWords.filter(w => transcript.toLowerCase().includes(w)).length;
    textScore += Math.min(15, powerWordCount * 5);

    // CTA presence
    const ctaWords = ['follow', 'like', 'share', 'comment', 'subscribe', 'save'];
    if (ctaWords.some(w => transcript.toLowerCase().includes(w))) {
      textScore += 10;
    } else {
      textScore -= 5; // No CTA
    }

    // Extremely short transcript penalty
    if (wordCount < 20) {
      textScore -= 10;
    }

    textScore = Math.max(0, Math.min(100, textScore));
    
    // ========================================
    // FACTOR 2: VISUAL QUALITY (0-100)
    // ========================================
    let visualScore = 30;

    if (input.resolution) {
      if (input.resolution >= 1080) visualScore += 20;
      else if (input.resolution >= 720) visualScore += 10;
    }

    if (input.ffmpeg_data) {
      // Scene changes (dynamism)
      const sceneChanges = input.ffmpeg_data.scene_changes || 0;
      const changesPerSec = sceneChanges / Math.max(1, duration);
      if (changesPerSec > 0.3 && changesPerSec < 2) {
        visualScore += 15;
      }

      // Brightness (good lighting)
      const brightness = input.ffmpeg_data.avg_brightness || 50;
      if (brightness >= 40 && brightness <= 80) {
        visualScore += 10;
      } else if (brightness < 30) {
        visualScore -= 5; // Low brightness penalty
      }

      // Face presence (connection)
      if (input.ffmpeg_data.has_faces) {
        visualScore += 15;
      }

      // No scene changes AND no faces — static/lifeless content
      if (sceneChanges === 0 && !input.ffmpeg_data.has_faces) {
        visualScore -= 10;
      }
    }

    visualScore = Math.max(0, Math.min(100, visualScore));
    
    // ========================================
    // FACTOR 3: AUDIO QUALITY (0-100)
    // ========================================
    let audioScore = 30;

    // No speech detected — major penalty
    if (!transcript || transcript.trim().length < 10) {
      audioScore -= 15;
    }

    if (input.metadata?.has_trending_audio) {
      audioScore += 25;
    }

    if (input.ffmpeg_data?.audio_levels) {
      const levels = input.ffmpeg_data.audio_levels;
      const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
      if (avgLevel > 0.3 && avgLevel < 0.8) {
        audioScore += 15;
      }
      // Check audio variety (range of levels)
      const maxLevel = Math.max(...levels);
      const minLevel = Math.min(...levels);
      if (maxLevel - minLevel < 0.05 && levels.length > 1) {
        audioScore -= 5; // No audio variety — monotone/flat
      }
    }

    audioScore = Math.max(0, Math.min(100, audioScore));
    
    // FACTOR 4: TIMING — REMOVED (VIR-005)
    // Timing factor almost always scored 50 (no posting hour data provided),
    // adding noise by pulling the indicator toward 50. Weight redistributed
    // to remaining 5 factors.

    // ========================================
    // FACTOR 5: PACING (0-100)
    // ========================================
    let pacingScore = 30;

    // When duration is unknown (using the fallback), score stays at base (uncertainty)
    const hasDuration = input.duration_seconds > 0;
    if (hasDuration) {
      // Words per second
      const wordsPerSecond = wordCount / Math.max(1, duration);
      if (wordsPerSecond >= 2 && wordsPerSecond <= 4) {
        pacingScore += 20;
      } else if (wordsPerSecond >= 1.5 && wordsPerSecond <= 5) {
        pacingScore += 10;
      }

      // Optimal duration (15-45 seconds)
      if (duration >= 15 && duration <= 45) {
        pacingScore += 20;
      } else if (duration >= 10 && duration <= 60) {
        pacingScore += 10;
      }

      // Too long penalty
      if (duration > 120) {
        pacingScore -= 10;
      }
      // Too short penalty
      if (duration < 5) {
        pacingScore -= 10;
      }
    }

    pacingScore = Math.max(0, Math.min(100, pacingScore));
    
    // ========================================
    // FACTOR 6: ENGAGEMENT POTENTIAL (0-100)
    // ========================================
    let engagementScore = 30;

    // Second person "you"
    const hasYouLanguage = /\byou\b/i.test(transcript);
    if (hasYouLanguage) {
      engagementScore += 15;
    }

    // Questions
    const hasQuestions = questionCount > 0;

    // No "you" language AND no questions — not engaging
    if (!hasYouLanguage && !hasQuestions) {
      engagementScore -= 10;
    }

    // Story indicators
    if (/\b(story|happened|once|remember)\b/i.test(transcript)) {
      engagementScore += 10;
    }

    // Controversy/curiosity gap
    if (/\b(secret|truth|nobody|most people don'?t)\b/i.test(transcript)) {
      engagementScore += 15;
    }

    engagementScore = Math.max(0, Math.min(100, engagementScore));

    // ========================================
    // CALCULATE OVERALL VIRALITY INDICATOR
    // ========================================
    // Timing factor removed (VIR-005). Its 10% weight redistributed proportionally:
    // Text: 25→28%, Visual: 20→22%, Audio: 15→17%, Pacing: 15→17%, Engagement: 15→16%

    const weights = {
      text: 0.28,
      visual: 0.22,
      audio: 0.17,
      pacing: 0.17,
      engagement_potential: 0.16,
    };

    const viralityIndicator =
      textScore * weights.text +
      visualScore * weights.visual +
      audioScore * weights.audio +
      pacingScore * weights.pacing +
      engagementScore * weights.engagement_potential;
    
    // Classification
    let classification: 'low' | 'medium' | 'high' | 'viral';
    if (viralityIndicator >= 80) classification = 'viral';
    else if (viralityIndicator >= 65) classification = 'high';
    else if (viralityIndicator >= 45) classification = 'medium';
    else classification = 'low';
    
    // Confidence based on data completeness
    let confidence = 0.5;
    if (input.transcript.length > 100) confidence += 0.15;
    if (input.ffmpeg_data) confidence += 0.15;
    if (input.metadata) confidence += 0.10;
    if (input.resolution) confidence += 0.10;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (textScore < 60) recommendations.push('Add a stronger hook in the first 3 seconds');
    if (visualScore < 60) recommendations.push('Improve lighting and video quality');
    if (audioScore < 60) recommendations.push('Consider using trending audio');
    if (pacingScore < 60) recommendations.push('Optimize video length to 15-45 seconds');
    if (engagementScore < 60) recommendations.push('Make content more relatable with "you" language');
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30a7b9'},body:JSON.stringify({sessionId:'30a7b9',location:'virality-indicator/index.ts:RESULT',message:'Virality indicator factor breakdown',data:{viralityIndicator:Math.round(viralityIndicator*10)/10,textScore,visualScore,audioScore,pacingScore,engagementScore,wordCount,duration,hasFFmpegData:!!input.ffmpeg_data,hasMetadata:!!input.metadata,hasResolution:!!input.resolution,sceneChanges:input.ffmpeg_data?.scene_changes,avgBrightness:input.ffmpeg_data?.avg_brightness,hasFaces:input.ffmpeg_data?.has_faces,audioLevels:input.ffmpeg_data?.audio_levels?.length||0,transcriptLength:transcript.length},timestamp:Date.now(),hypothesisId:'A,E'})}).catch(()=>{});
    // #endregion

    return {
      virality_indicator: Math.round(viralityIndicator * 10) / 10,
      confidence: Math.min(1, confidence),
      classification,
      breakdown: {
        visual: visualScore,
        audio: audioScore,
        text: textScore,
        timing: 0, // Timing factor removed (VIR-005) — kept in interface for backward compat
        pacing: pacingScore,
        engagement_potential: engagementScore,
      },
      sub_scores: {
        hook_strength: textScore * 0.4,
        clarity: textScore * 0.3,
        emotional_impact: engagementScore * 0.5,
        value_density: textScore * 0.3,
      },
      top_recommendations: recommendations.slice(0, 3),
      processing_time_ms: Date.now() - startTime,
    };
  }
};

export default viralityIndicator;
