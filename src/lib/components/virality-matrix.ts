/**
 * Virality Matrix Component
 * 
 * 9-dimension viral content analysis aligned with training extraction.
 * Scores content across key virality factors.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ViralityMatrixInput {
  transcript: string;
  duration: number;
  niche?: string;
}

export interface ViralityMatrixResult {
  success: boolean;
  error?: string;
  
  // Overall score (0-1)
  vm_overall: number;
  
  // 9 dimensions (0-1 each)
  vm_hook_strength: number;
  vm_emotional_resonance: number;
  vm_value_density: number;
  vm_shareability: number;
  vm_trend_alignment: number;
  vm_pacing_retention: number;
  vm_authenticity: number;
  vm_controversy: number;
  vm_cta_strength: number;
  
  insights: string[];
  latency: number;
}

// ============================================================================
// VIRALITY MATRIX CLASS
// ============================================================================

export class ViralityMatrix {
  /**
   * Analyze content using 9-dimension virality matrix
   */
  static async analyze(input: ViralityMatrixInput): Promise<ViralityMatrixResult> {
    const startTime = Date.now();
    
    try {
      const { transcript, duration, niche = 'general' } = input;
      
      if (!transcript || transcript.length < 10) {
        return {
          success: false,
          error: 'Insufficient transcript for analysis',
          vm_overall: 0,
          vm_hook_strength: 0,
          vm_emotional_resonance: 0,
          vm_value_density: 0,
          vm_shareability: 0,
          vm_trend_alignment: 0,
          vm_pacing_retention: 0,
          vm_authenticity: 0,
          vm_controversy: 0,
          vm_cta_strength: 0,
          insights: [],
          latency: Date.now() - startTime,
        };
      }
      
      const lowerTranscript = transcript.toLowerCase();
      const words = transcript.split(/\s+/).filter(w => w.length > 0);
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // ========================================
      // DIMENSION 1: HOOK STRENGTH (0-1)
      // ========================================
      let hookStrength = 0.4;
      
      const hookText = transcript.slice(0, 150).toLowerCase();
      const hookPatterns = [
        { pattern: /^(stop|wait|listen|watch)/i, boost: 0.2 },
        { pattern: /^(here'?s|this is|the secret)/i, boost: 0.15 },
        { pattern: /^(did you|have you|do you)/i, boost: 0.15 },
        { pattern: /\?/, boost: 0.1 },
        { pattern: /\byou\b/, boost: 0.1 },
      ];
      
      for (const { pattern, boost } of hookPatterns) {
        if (pattern.test(hookText)) {
          hookStrength += boost;
        }
      }
      hookStrength = Math.min(1, hookStrength);
      
      // ========================================
      // DIMENSION 2: EMOTIONAL RESONANCE (0-1)
      // ========================================
      let emotionalResonance = 0.4;
      
      const emotionWords = ['love', 'hate', 'amazing', 'terrible', 'incredible', 'shocking', 'beautiful', 'worst', 'best'];
      const emotionCount = emotionWords.filter(w => lowerTranscript.includes(w)).length;
      emotionalResonance += Math.min(0.4, emotionCount * 0.1);
      
      // Exclamation marks indicate emotion
      const exclamations = (transcript.match(/!/g) || []).length;
      emotionalResonance += Math.min(0.2, exclamations * 0.05);
      emotionalResonance = Math.min(1, emotionalResonance);
      
      // ========================================
      // DIMENSION 3: VALUE DENSITY (0-1)
      // ========================================
      let valueDensity = 0.4;
      
      const valueIndicators = [
        /\b(learn|discover|tip|trick|hack|secret|how to|guide)\b/i,
        /\b(step|first|second|third|number one)\b/i,
        /\b(never|always|must|important|key|essential)\b/i,
      ];
      
      for (const pattern of valueIndicators) {
        if (pattern.test(transcript)) {
          valueDensity += 0.15;
        }
      }
      
      // Information density based on word count relative to duration
      const wordsPerSecond = words.length / Math.max(1, duration);
      if (wordsPerSecond >= 2 && wordsPerSecond <= 4) {
        valueDensity += 0.15;
      }
      valueDensity = Math.min(1, valueDensity);
      
      // ========================================
      // DIMENSION 4: SHAREABILITY (0-1)
      // ========================================
      let shareability = 0.4;
      
      const shareIndicators = [
        /\b(share|tag|send this|show this)\b/i,
        /\b(everyone|your friends|someone)\b/i,
        /\b(relatable|so true|literally me)\b/i,
      ];
      
      for (const pattern of shareIndicators) {
        if (pattern.test(transcript)) {
          shareability += 0.15;
        }
      }
      
      // Questions increase shareability (discussion)
      const questions = (transcript.match(/\?/g) || []).length;
      shareability += Math.min(0.15, questions * 0.05);
      shareability = Math.min(1, shareability);
      
      // ========================================
      // DIMENSION 5: TREND ALIGNMENT (0-1)
      // ========================================
      let trendAlignment = 0.4;
      
      const trendingPhrases = [
        'pov', 'no way', 'plot twist', 'hear me out',
        'not me', 'the way', 'i can\'t', 'lowkey', 'highkey',
        'main character', 'rent free', 'understood the assignment'
      ];
      
      for (const phrase of trendingPhrases) {
        if (lowerTranscript.includes(phrase)) {
          trendAlignment += 0.1;
        }
      }
      trendAlignment = Math.min(1, trendAlignment);
      
      // ========================================
      // DIMENSION 6: PACING & RETENTION (0-1)
      // ========================================
      let pacingRetention = 0.4;
      
      // Optimal duration
      if (duration >= 15 && duration <= 45) {
        pacingRetention += 0.2;
      } else if (duration >= 10 && duration <= 60) {
        pacingRetention += 0.1;
      }
      
      // Speaking pace
      if (wordsPerSecond >= 2 && wordsPerSecond <= 4) {
        pacingRetention += 0.2;
      }
      
      // Sentence variety (keeps attention)
      const avgSentenceLength = words.length / Math.max(1, sentences.length);
      if (avgSentenceLength >= 5 && avgSentenceLength <= 15) {
        pacingRetention += 0.1;
      }
      pacingRetention = Math.min(1, pacingRetention);
      
      // ========================================
      // DIMENSION 7: AUTHENTICITY (0-1)
      // ========================================
      let authenticity = 0.5;
      
      // First person = personal story
      if (/\b(i|my|me|myself)\b/i.test(transcript)) {
        authenticity += 0.15;
      }
      
      // Personal indicators
      if (/\b(honestly|truth|real talk|genuinely|personally)\b/i.test(transcript)) {
        authenticity += 0.15;
      }
      
      // Story elements
      if (/\b(story|happened|experience|remember|when i)\b/i.test(transcript)) {
        authenticity += 0.15;
      }
      authenticity = Math.min(1, authenticity);
      
      // ========================================
      // DIMENSION 8: CONTROVERSY/CURIOSITY (0-1)
      // ========================================
      let controversy = 0.3;
      
      const controversyIndicators = [
        /\b(unpopular opinion|hot take|controversial)\b/i,
        /\b(nobody|most people|they don't want you to know)\b/i,
        /\b(secret|hidden|truth|exposed|reveal)\b/i,
        /\b(wrong|mistake|problem|issue|fail)\b/i,
      ];
      
      for (const pattern of controversyIndicators) {
        if (pattern.test(transcript)) {
          controversy += 0.15;
        }
      }
      controversy = Math.min(1, controversy);
      
      // ========================================
      // DIMENSION 9: CTA STRENGTH (0-1)
      // ========================================
      let ctaStrength = 0.3;
      
      const ctaPatterns = [
        { pattern: /\bfollow\b/i, boost: 0.2 },
        { pattern: /\b(like|save|share)\b/i, boost: 0.15 },
        { pattern: /\bcomment\b/i, boost: 0.15 },
        { pattern: /\bsubscribe\b/i, boost: 0.1 },
        { pattern: /\b(link in bio|check out)\b/i, boost: 0.1 },
        { pattern: /\b(part 2|more)\b/i, boost: 0.1 },
      ];
      
      for (const { pattern, boost } of ctaPatterns) {
        if (pattern.test(transcript)) {
          ctaStrength += boost;
        }
      }
      ctaStrength = Math.min(1, ctaStrength);
      
      // ========================================
      // CALCULATE OVERALL SCORE
      // ========================================
      
      const weights = {
        hook: 0.15,
        emotional: 0.12,
        value: 0.12,
        share: 0.10,
        trend: 0.10,
        pacing: 0.12,
        authenticity: 0.10,
        controversy: 0.09,
        cta: 0.10,
      };
      
      const vmOverall = 
        hookStrength * weights.hook +
        emotionalResonance * weights.emotional +
        valueDensity * weights.value +
        shareability * weights.share +
        trendAlignment * weights.trend +
        pacingRetention * weights.pacing +
        authenticity * weights.authenticity +
        controversy * weights.controversy +
        ctaStrength * weights.cta;
      
      // Generate insights
      const insights: string[] = [];
      if (hookStrength >= 0.7) insights.push('Strong hook opening');
      if (emotionalResonance >= 0.7) insights.push('High emotional impact');
      if (valueDensity >= 0.7) insights.push('Dense value content');
      if (shareability >= 0.7) insights.push('Highly shareable');
      if (pacingRetention >= 0.7) insights.push('Excellent pacing');
      if (ctaStrength >= 0.7) insights.push('Strong call-to-action');
      
      if (hookStrength < 0.5) insights.push('Consider strengthening hook');
      if (ctaStrength < 0.4) insights.push('Add clear call-to-action');
      
      return {
        success: true,
        vm_overall: Math.round(vmOverall * 1000) / 1000,
        vm_hook_strength: Math.round(hookStrength * 1000) / 1000,
        vm_emotional_resonance: Math.round(emotionalResonance * 1000) / 1000,
        vm_value_density: Math.round(valueDensity * 1000) / 1000,
        vm_shareability: Math.round(shareability * 1000) / 1000,
        vm_trend_alignment: Math.round(trendAlignment * 1000) / 1000,
        vm_pacing_retention: Math.round(pacingRetention * 1000) / 1000,
        vm_authenticity: Math.round(authenticity * 1000) / 1000,
        vm_controversy: Math.round(controversy * 1000) / 1000,
        vm_cta_strength: Math.round(ctaStrength * 1000) / 1000,
        insights,
        latency: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        vm_overall: 0,
        vm_hook_strength: 0,
        vm_emotional_resonance: 0,
        vm_value_density: 0,
        vm_shareability: 0,
        vm_trend_alignment: 0,
        vm_pacing_retention: 0,
        vm_authenticity: 0,
        vm_controversy: 0,
        vm_cta_strength: 0,
        insights: [],
        latency: Date.now() - startTime,
      };
    }
  }
}

export default ViralityMatrix;
