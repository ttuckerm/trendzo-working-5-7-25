// God Mode Psychological Analysis Engine - Deep emotional intelligence

import { createClient } from '@supabase/supabase-js';
import { PsychologicalEngagement } from '@/lib/types/viral-prediction';

export class GodModePsychologicalAnalyzer {
  private supabase;
  private claudeAPI: any;
  
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  async analyzePsychologicalFactors(video: {
    id: string;
    caption: string;
    visual_features: any;
    audio_features: any;
    duration_seconds: number;
  }): Promise<PsychologicalEngagement> {
    
    // 1. Emotional Arousal Analysis
    const emotionalAnalysis = await this.analyzeEmotionalArousal(video.caption);
    
    // 2. Social Currency Assessment
    const socialCurrency = await this.assessSocialCurrency(video);
    
    // 3. Parasocial Relationship Potential
    const parasocial = await this.analyzeParasocialPotential(video);
    
    // 4. Emotion Diversity Scoring
    const emotionDiversity = await this.calculateEmotionDiversity(video.caption);

    const psychoAnalysis: PsychologicalEngagement = {
      emotionalArousalScore: emotionalAnalysis.score,
      arousalType: emotionalAnalysis.primaryType,
      arousalIntensity: emotionalAnalysis.intensity,
      socialCurrencyScore: socialCurrency.score,
      parasocialStrength: parasocial.strength,
      emotionDiversityScore: emotionDiversity.score,
      highArousalEmotions: emotionalAnalysis.emotions
    };

    // Store in database
    await this.storePsychologicalAnalysis(video.id, psychoAnalysis, {
      socialCurrency,
      parasocial,
      emotionDiversity
    });

    return psychoAnalysis;
  }

  private async analyzeEmotionalArousal(caption: string): Promise<{
    score: number;
    primaryType: 'awe' | 'anger' | 'surprise' | 'excitement';
    intensity: number;
    emotions: Record<string, number>;
  }> {
    // High-arousal emotion keywords and patterns
    const emotionPatterns = {
      awe: {
        keywords: ['amazing', 'incredible', 'unbelievable', 'mind-blowing', 'stunning', 'breathtaking'],
        intensifiers: ['absolutely', 'completely', 'totally', 'beyond'],
        score: 0
      },
      anger: {
        keywords: ['outrageous', 'ridiculous', 'insane', 'crazy', 'unacceptable', 'disgusting'],
        intensifiers: ['so', 'extremely', 'ridiculously', 'absolutely'],
        score: 0
      },
      surprise: {
        keywords: ['shocking', 'unexpected', 'plot twist', 'never saw', 'can\'t believe'],
        intensifiers: ['totally', 'completely', 'never', 'absolutely'],
        score: 0
      },
      excitement: {
        keywords: ['pumped', 'hyped', 'excited', 'thrilled', 'can\'t wait', 'finally'],
        intensifiers: ['so', 'really', 'super', 'extremely'],
        score: 0
      }
    };

    const captionLower = caption.toLowerCase();
    
    // Score each emotion
    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      let score = 0;
      
      // Keyword matching
      patterns.keywords.forEach(keyword => {
        if (captionLower.includes(keyword)) {
          score += 0.2;
          
          // Check for intensifiers nearby
          patterns.intensifiers.forEach(intensifier => {
            if (captionLower.includes(`${intensifier} ${keyword}`) || 
                captionLower.includes(`${keyword} ${intensifier}`)) {
              score += 0.1;
            }
          });
        }
      });
      
      // Punctuation intensity (! marks, caps)
      const exclamationCount = (caption.match(/!/g) || []).length;
      const capsRatio = (caption.match(/[A-Z]/g) || []).length / caption.length;
      
      if (exclamationCount > 0) score += Math.min(exclamationCount * 0.1, 0.3);
      if (capsRatio > 0.3) score += 0.2;
      
      patterns.score = Math.min(score, 1);
    }

    // Find primary emotion and calculate overall scores
    const emotions = {
      awe: emotionPatterns.awe.score,
      anger: emotionPatterns.anger.score,
      surprise: emotionPatterns.surprise.score,
      excitement: emotionPatterns.excitement.score
    };

    const primaryType = Object.entries(emotions).reduce((a, b) => 
      emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b
    )[0] as 'awe' | 'anger' | 'surprise' | 'excitement';

    const overallScore = Math.max(...Object.values(emotions));
    const intensity = overallScore * (1 + (captionLower.includes('!') ? 0.2 : 0));

    return {
      score: overallScore,
      primaryType,
      intensity: Math.min(intensity, 1),
      emotions
    };
  }

  private async assessSocialCurrency(video: any): Promise<{
    score: number;
    inTheKnowIndicators: string[];
    shareabilityFactors: string[];
  }> {
    const indicators: string[] = [];
    const shareabilityFactors: string[] = [];
    let score = 0;

    const caption = video.caption.toLowerCase();

    // "In the know" indicators
    const knowledgeSignals = [
      { pattern: 'secret', weight: 0.3, indicator: 'reveals_secret' },
      { pattern: 'hack', weight: 0.25, indicator: 'life_hack' },
      { pattern: 'trick', weight: 0.2, indicator: 'insider_trick' },
      { pattern: 'behind the scenes', weight: 0.3, indicator: 'exclusive_access' },
      { pattern: 'industry', weight: 0.2, indicator: 'industry_knowledge' },
      { pattern: 'exposed', weight: 0.25, indicator: 'truth_revealing' }
    ];

    knowledgeSignals.forEach(signal => {
      if (caption.includes(signal.pattern)) {
        score += signal.weight;
        indicators.push(signal.indicator);
      }
    });

    // Shareability factors
    const shareabilityPatterns = [
      { pattern: 'you need to see', weight: 0.2, factor: 'urgency_to_share' },
      { pattern: 'everyone should know', weight: 0.25, factor: 'public_service' },
      { pattern: 'tag someone', weight: 0.3, factor: 'direct_sharing_prompt' },
      { pattern: 'share if', weight: 0.25, factor: 'conditional_sharing' },
      { pattern: 'repost', weight: 0.2, factor: 'repost_encouragement' }
    ];

    shareabilityPatterns.forEach(pattern => {
      if (caption.includes(pattern.pattern)) {
        score += pattern.weight;
        shareabilityFactors.push(pattern.factor);
      }
    });

    // Visual shareability (if available)
    if (video.visual_features?.aesthetic_score > 0.8) {
      score += 0.2;
      shareabilityFactors.push('high_aesthetic_value');
    }

    return {
      score: Math.min(score, 1),
      inTheKnowIndicators: indicators,
      shareabilityFactors
    };
  }

  private async analyzeParasocialPotential(video: any): Promise<{
    strength: number;
    connectionMarkers: string[];
    expectedCLVMultiplier: number;
  }> {
    const connectionMarkers: string[] = [];
    let strength = 0;

    const caption = video.caption.toLowerCase();

    // Direct address patterns
    const directAddress = [
      { pattern: 'you', weight: 0.1, marker: 'direct_addressing' },
      { pattern: 'your', weight: 0.1, marker: 'personal_reference' },
      { pattern: 'we', weight: 0.15, marker: 'inclusive_language' },
      { pattern: 'us', weight: 0.15, marker: 'community_building' }
    ];

    directAddress.forEach(pattern => {
      const matches = (caption.match(new RegExp(pattern.pattern, 'g')) || []).length;
      if (matches > 0) {
        strength += pattern.weight * Math.min(matches / 10, 1); // Diminishing returns
        connectionMarkers.push(pattern.marker);
      }
    });

    // Personal sharing indicators
    const personalSharing = [
      { pattern: 'my story', weight: 0.3, marker: 'personal_vulnerability' },
      { pattern: 'honestly', weight: 0.2, marker: 'authentic_disclosure' },
      { pattern: 'real talk', weight: 0.25, marker: 'authentic_communication' },
      { pattern: 'confession', weight: 0.3, marker: 'intimate_sharing' }
    ];

    personalSharing.forEach(pattern => {
      if (caption.includes(pattern.pattern)) {
        strength += pattern.weight;
        connectionMarkers.push(pattern.marker);
      }
    });

    // Community building signals
    if (caption.includes('comment below') || caption.includes('let me know')) {
      strength += 0.2;
      connectionMarkers.push('engagement_invitation');
    }

    if (caption.includes('follow for more') || caption.includes('series')) {
      strength += 0.15;
      connectionMarkers.push('series_continuity');
    }

    // Expected CLV multiplier based on parasocial strength
    const expectedCLVMultiplier = 1 + (strength * 0.3); // 30% max increase

    return {
      strength: Math.min(strength, 1),
      connectionMarkers,
      expectedCLVMultiplier
    };
  }

  private async calculateEmotionDiversity(caption: string): Promise<{
    score: number;
    emotionCategories: string[];
  }> {
    const emotionCategories = new Set<string>();
    
    // Emotion category patterns
    const emotions = {
      joy: ['happy', 'joy', 'excited', 'thrilled', 'amazing'],
      fear: ['scared', 'terrified', 'worried', 'nervous', 'anxiety'],
      anger: ['angry', 'mad', 'furious', 'outraged', 'annoyed'],
      sadness: ['sad', 'depressed', 'heartbroken', 'disappointed'],
      surprise: ['shocked', 'surprised', 'unexpected', 'wow'],
      disgust: ['gross', 'disgusting', 'revolting', 'sick'],
      trust: ['trust', 'reliable', 'honest', 'authentic'],
      anticipation: ['excited', 'waiting', 'can\'t wait', 'soon']
    };

    const captionLower = caption.toLowerCase();
    
    Object.entries(emotions).forEach(([category, keywords]) => {
      if (keywords.some(keyword => captionLower.includes(keyword))) {
        emotionCategories.add(category);
      }
    });

    // Diversity score: more emotions = higher engagement potential
    const diversityScore = Math.min(emotionCategories.size / 4, 1); // Max at 4 emotions

    return {
      score: diversityScore,
      emotionCategories: Array.from(emotionCategories)
    };
  }

  private async storePsychologicalAnalysis(
    videoId: string, 
    analysis: PsychologicalEngagement,
    details: any
  ) {
    await this.supabase.from('psychological_engagement').insert({
      video_id: videoId,
      emotional_arousal_score: analysis.emotionalArousalScore,
      arousal_type: analysis.arousalType,
      arousal_intensity: analysis.arousalIntensity,
      social_currency_score: analysis.socialCurrencyScore,
      in_the_know_indicators: details.socialCurrency.inTheKnowIndicators,
      shareability_factors: details.socialCurrency.shareabilityFactors,
      parasocial_strength: analysis.parasocialStrength,
      creator_viewer_connection_markers: details.parasocial.connectionMarkers,
      expected_clv_multiplier: details.parasocial.expectedCLVMultiplier,
      high_arousal_emotions: analysis.highArousalEmotions,
      emotion_diversity_score: analysis.emotionDiversityScore,
      analyzed_at: new Date().toISOString()
    });
  }

  // Calculate God Mode accuracy boost
  calculateAccuracyBoost(analysis: PsychologicalEngagement): number {
    let boost = 0;

    // High arousal emotions boost
    if (analysis.emotionalArousalScore > 0.7) boost += 0.05; // +5%
    
    // Social currency boost  
    if (analysis.socialCurrencyScore > 0.6) boost += 0.03; // +3%
    
    // Parasocial strength boost
    if (analysis.parasocialStrength > 0.5) boost += 0.02; // +2%

    return Math.min(boost, 0.1); // Max 10% boost
  }
}