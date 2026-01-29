/**
 * Component 17: Hook Strength Scorer
 *
 * Analyzes the first 3 seconds of transcript to detect and score viral hook patterns.
 * 
 * v2 UPGRADE (Phase 4): Added LLM-powered quality assessment
 * - Legacy regex scoring: 1.7pt variance (model can't learn)
 * - NEW LLM scoring: 40+pt variance (model can learn)
 * 
 * Hook types and their max scores:
 * - Question hooks: 8
 * - Statistic hooks: 9
 * - Story hooks: 7
 * - Claim hooks: 8
 *
 * Returns: hookType, hookScore, hookConfidence, + NEW quality scores
 */

import OpenAI from 'openai';

export interface HookQualityScores {
  quality_score: number;        // 0-100 overall quality
  scroll_stop_power: number;    // 0-100 would this stop scrolling?
  curiosity_creation: number;   // 0-100 genuine curiosity created
  value_promise: number;        // 0-100 clear value promised
  specificity: number;          // 0-100 specific numbers/claims
  reasoning?: string;           // Brief explanation
}

export interface HookScorerResult {
  success: boolean;
  hookType: 'question' | 'statistic' | 'story' | 'claim' | 'weak' | null;
  hookScore: number; // 0-10 (legacy regex score)
  hookConfidence: number; // 0-1
  hookText: string;
  insights: string[];
  error?: string;
  // NEW: LLM quality scores (Phase 4 upgrade)
  quality_score?: number;        // 0-100
  scroll_stop_power?: number;    // 0-100
  curiosity_creation?: number;   // 0-100
  value_promise?: number;        // 0-100
  specificity?: number;          // 0-100
  llm_reasoning?: string;
}

export class HookScorer {
  // Question hook patterns
  private static QUESTION_PATTERNS = [
    /^(what|how|why|when|where|who|which|do you|have you|did you|can you|would you|should you|are you|is it|will you)/i,
    /\?$/,
    /(ever wonder|want to know|know what|know how|guess what)/i
  ];

  // Statistic hook patterns
  private static STATISTIC_PATTERNS = [
    /(\d+%|\d+ percent)/i,
    /(\d+x|\d+ times)/i,
    /(\$\d+|\d+ dollars)/i,
    /(\d+ out of \d+)/i,
    /(million|billion|trillion)/i,
    /(doubled|tripled|increased|grew by)/i
  ];

  // Story hook patterns
  private static STORY_PATTERNS = [
    /^(so |okay so |alright so )/i,
    /(let me tell you|story time|here's what happened|this happened)/i,
    /(i remember when|one time|last week|yesterday|today)/i,
    /(imagine|picture this)/i
  ];

  // Claim hook patterns
  private static CLAIM_PATTERNS = [
    /(nobody tells you|they don't want you to know|secret|truth is)/i,
    /(best|worst|easiest|hardest|fastest|slowest)/i,
    /(will change|life-changing|game-changer)/i,
    /(you need to|you have to|you must|you should)/i,
    /(mistake|wrong|lie|scam)/i
  ];

  /**
   * Estimate transcript length for first 3 seconds
   * Average speaking rate: 150 words per minute = 2.5 words per second
   * First 3 seconds ≈ 7-8 words
   */
  private static extractFirst3Seconds(transcript: string): string {
    const words = transcript.trim().split(/\s+/);
    const first3SecWords = words.slice(0, 8);
    return first3SecWords.join(' ');
  }

  /**
   * Score question hooks (max: 8)
   */
  private static scoreQuestionHook(hookText: string): number {
    let score = 0;

    // Check for question mark (strong signal)
    if (/\?$/.test(hookText)) {
      score += 4;
    }

    // Check for question words at start (strong signal)
    if (/^(what|how|why)/i.test(hookText)) {
      score += 3;
    } else if (/^(when|where|who|which)/i.test(hookText)) {
      score += 2;
    }

    // Check for second-person question patterns
    if (/(do you|have you|did you|can you|would you|should you|are you)/i.test(hookText)) {
      score += 2;
    }

    // Check for curiosity triggers
    if (/(ever wonder|want to know|know what|know how|guess what)/i.test(hookText)) {
      score += 2;
    }

    return Math.min(8, score);
  }

  /**
   * Score statistic hooks (max: 9)
   */
  private static scoreStatisticHook(hookText: string): number {
    let score = 0;
    let hasStatistic = false;

    // Percentage (very strong)
    if (/\d+%|\d+ percent/i.test(hookText)) {
      score += 5;
      hasStatistic = true;
    }

    // Dollar amounts (very strong)
    if (/\$[\d,]+|\d+ dollars/i.test(hookText)) {
      score += 5;
      hasStatistic = true;
    }

    // Multipliers (strong)
    if (/\d+x|\d+ times/i.test(hookText)) {
      score += 4;
      hasStatistic = true;
    }

    // Fractions (strong)
    if (/\d+ out of \d+/i.test(hookText)) {
      score += 4;
      hasStatistic = true;
    }

    // Large numbers (strong)
    if (/(million|billion|trillion)/i.test(hookText)) {
      score += 3;
      hasStatistic = true;
    }

    // Growth language (moderate)
    if (/(doubled|tripled|increased|grew by)/i.test(hookText)) {
      score += 2;
    }

    return Math.min(9, score);
  }

  /**
   * Score story hooks (max: 7)
   */
  private static scoreStoryHook(hookText: string): number {
    let score = 0;

    // Direct story signals (strong)
    if (/(let me tell you|story time|here's what happened|this happened)/i.test(hookText)) {
      score += 4;
    }

    // Time-based narrative (moderate)
    if (/(i remember when|one time|last week|yesterday|today)/i.test(hookText)) {
      score += 3;
    }

    // Conversational starters (moderate)
    if (/^(so |okay so |alright so )/i.test(hookText)) {
      score += 2;
    }

    // Imagination triggers (moderate)
    if (/(imagine|picture this)/i.test(hookText)) {
      score += 3;
    }

    return Math.min(7, score);
  }

  /**
   * Score claim hooks (max: 8)
   */
  private static scoreClaimHook(hookText: string): number {
    let score = 0;

    // Secrecy/conspiracy (very strong)
    if (/(nobody tells you|they don't want you to know|secret|truth is)/i.test(hookText)) {
      score += 5;
    }

    // Superlatives (strong)
    if (/(best|worst|easiest|hardest|fastest|slowest)/i.test(hookText)) {
      score += 4;
    }

    // Transformational language (strong)
    if (/(will change|life-changing|game-changer|change your life)/i.test(hookText)) {
      score += 4;
    }

    // Directive language (moderate)
    if (/(you need to|you have to|you must|you should)/i.test(hookText)) {
      score += 2;
    }

    // Negative framing (moderate)
    if (/(mistake|wrong|lie|scam)/i.test(hookText)) {
      score += 2;
    }

    return Math.min(8, score);
  }

  /**
   * Main hook analysis function
   */
  public static analyze(transcript: string | undefined): HookScorerResult {
    if (!transcript || transcript.trim().length === 0) {
      return {
        success: false,
        hookType: null,
        hookScore: 0,
        hookConfidence: 0,
        hookText: '',
        insights: ['No transcript available'],
        error: 'No transcript provided'
      };
    }

    // Extract first 3 seconds
    const hookText = this.extractFirst3Seconds(transcript);

    if (hookText.length < 3) {
      return {
        success: false,
        hookType: 'weak',
        hookScore: 1,
        hookConfidence: 0.3,
        hookText,
        insights: ['Hook too short to analyze effectively']
      };
    }

    // Score each hook type
    const questionScore = this.scoreQuestionHook(hookText);
    const statisticScore = this.scoreStatisticHook(hookText);
    const storyScore = this.scoreStoryHook(hookText);
    const claimScore = this.scoreClaimHook(hookText);

    // Determine dominant hook type
    const scores = [
      { type: 'question' as const, score: questionScore, max: 8 },
      { type: 'statistic' as const, score: statisticScore, max: 9 },
      { type: 'story' as const, score: storyScore, max: 7 },
      { type: 'claim' as const, score: claimScore, max: 8 }
    ];

    scores.sort((a, b) => b.score - a.score);
    const dominant = scores[0];

    // If no strong hook detected (threshold: score <= 2)
    if (dominant.score === 0 || dominant.score <= 2) {
      return {
        success: true,
        hookType: 'weak',
        hookScore: 2,
        hookConfidence: 0.5,
        hookText,
        insights: [
          'No strong hook pattern detected',
          'Consider starting with a question, statistic, story, or bold claim',
          'First 3 seconds are critical for retention'
        ]
      };
    }

    // Calculate normalized hook score (0-10)
    const normalizedScore = (dominant.score / dominant.max) * 10;

    // Calculate confidence based on score strength and pattern clarity
    const confidence = Math.min(0.95, (dominant.score / dominant.max) * 0.9 + 0.3);

    // Generate insights
    const insights: string[] = [];

    if (dominant.type === 'question') {
      if (dominant.score >= 6) {
        insights.push('Strong question hook - excellent for engagement');
        insights.push('Questions trigger viewer curiosity and retention');
      } else {
        insights.push('Question hook detected but could be stronger');
        insights.push('Consider adding "?" or more direct phrasing');
      }
    } else if (dominant.type === 'statistic') {
      if (dominant.score >= 7) {
        insights.push('Powerful statistic hook - data grabs attention');
        insights.push('Numbers create credibility and curiosity');
      } else {
        insights.push('Statistic hook present but could be more impactful');
        insights.push('Consider adding percentages or dollar amounts');
      }
    } else if (dominant.type === 'story') {
      if (dominant.score >= 5) {
        insights.push('Strong story hook - narratives drive engagement');
        insights.push('Personal stories create emotional connection');
      } else {
        insights.push('Story elements detected but hook could be clearer');
        insights.push('Consider starting with "Let me tell you..." or time markers');
      }
    } else if (dominant.type === 'claim') {
      if (dominant.score >= 6) {
        insights.push('Bold claim hook - creates intrigue and controversy');
        insights.push('Strong claims trigger emotional responses');
      } else {
        insights.push('Claim hook detected but could be bolder');
        insights.push('Consider superlatives or transformational language');
      }
    }

    // Add general insight based on score
    if (normalizedScore >= 8) {
      insights.push(`Excellent hook strength (${normalizedScore.toFixed(1)}/10)`);
    } else if (normalizedScore >= 6) {
      insights.push(`Good hook strength (${normalizedScore.toFixed(1)}/10)`);
    } else if (normalizedScore >= 4) {
      insights.push(`Moderate hook strength (${normalizedScore.toFixed(1)}/10)`);
    } else {
      insights.push(`Weak hook strength (${normalizedScore.toFixed(1)}/10) - needs improvement`);
    }

    return {
      success: true,
      hookType: dominant.type,
      hookScore: parseFloat(normalizedScore.toFixed(1)),
      hookConfidence: parseFloat(confidence.toFixed(2)),
      hookText,
      insights
    };
  }

  /**
   * NEW: LLM-powered hook quality assessment (Phase 4 upgrade)
   * Provides 40+pt variance vs 1.7pt from regex - model can actually learn
   */
  public static async scoreHookQuality(hookText: string): Promise<HookQualityScores | null> {
    // Skip if hook text is too short
    if (!hookText || hookText.trim().length < 5) {
      return null;
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[HookScorer] No OpenAI API key - skipping LLM quality assessment');
      return null;
    }

    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',  // Fast and cheap
        messages: [{
          role: 'user',
          content: `Rate this TikTok hook (first 3 seconds of script) on a 0-100 scale.

Hook text: "${hookText}"

SCORING RUBRIC:
1. Scroll-Stop Power (0-100): Would this make someone STOP scrolling? 
   - 0-30: Generic, easily ignored
   - 31-60: Somewhat interesting but not compelling
   - 61-80: Strong attention grab
   - 81-100: Impossible to scroll past

2. Curiosity Creation (0-100): Does it create genuine "I NEED to know" feeling?
   - 0-30: No curiosity generated
   - 31-60: Mild interest
   - 61-80: Strong curiosity
   - 81-100: Burning need to know the answer

3. Value Promise (0-100): Is there a clear payoff promised?
   - 0-30: No clear value
   - 31-60: Vague value hint
   - 61-80: Clear value proposition
   - 81-100: Irresistible value promise

4. Specificity (0-100): Are there specific numbers, names, claims?
   - 0-30: Completely generic
   - 31-60: Some specificity
   - 61-80: Good specific details
   - 81-100: Highly specific and credible

Return ONLY valid JSON:
{
  "quality_score": <0-100 overall>,
  "scroll_stop_power": <0-100>,
  "curiosity_creation": <0-100>,
  "value_promise": <0-100>,
  "specificity": <0-100>,
  "reasoning": "<brief explanation>"
}`
        }],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      const result = JSON.parse(content);
      
      return {
        quality_score: Math.min(100, Math.max(0, result.quality_score || 50)),
        scroll_stop_power: Math.min(100, Math.max(0, result.scroll_stop_power || 50)),
        curiosity_creation: Math.min(100, Math.max(0, result.curiosity_creation || 50)),
        value_promise: Math.min(100, Math.max(0, result.value_promise || 50)),
        specificity: Math.min(100, Math.max(0, result.specificity || 50)),
        reasoning: result.reasoning || ''
      };
    } catch (error: any) {
      console.error('[HookScorer] LLM quality assessment failed:', error.message);
      return null;
    }
  }

  /**
   * Async version of analyze that includes LLM quality scoring
   */
  public static async analyzeAsync(transcript: string | undefined): Promise<HookScorerResult> {
    // Get base analysis from regex method
    const baseResult = this.analyze(transcript);
    
    // If base analysis failed, return as-is
    if (!baseResult.success || !baseResult.hookText) {
      return baseResult;
    }

    // Try to get LLM quality scores
    const qualityScores = await this.scoreHookQuality(baseResult.hookText);
    
    if (qualityScores) {
      return {
        ...baseResult,
        quality_score: qualityScores.quality_score,
        scroll_stop_power: qualityScores.scroll_stop_power,
        curiosity_creation: qualityScores.curiosity_creation,
        value_promise: qualityScores.value_promise,
        specificity: qualityScores.specificity,
        llm_reasoning: qualityScores.reasoning,
        insights: [
          ...baseResult.insights,
          `LLM Quality Score: ${qualityScores.quality_score}/100`
        ]
      };
    }

    return baseResult;
  }

  /**
   * Convert hook analysis to DPS prediction
   * Hook strength correlates with retention, which drives engagement
   */
  public static toDPS(result: HookScorerResult): number {
    if (!result.success || result.hookScore === 0) {
      return 35; // Weak hook = low predicted DPS
    }

    // Hook score to DPS mapping
    // Strong hooks (8-10) -> 70-85 DPS
    // Good hooks (6-8) -> 55-70 DPS
    // Moderate hooks (4-6) -> 40-55 DPS
    // Weak hooks (0-4) -> 25-40 DPS

    const baseDPS = 25 + (result.hookScore * 6);

    // Boost for high-performing hook types
    let typeBoost = 0;
    if (result.hookType === 'statistic') {
      typeBoost = 5; // Stats perform best
    } else if (result.hookType === 'question') {
      typeBoost = 3; // Questions perform well
    } else if (result.hookType === 'claim') {
      typeBoost = 2;
    } else if (result.hookType === 'story') {
      typeBoost = 1;
    }

    const finalDPS = Math.min(85, Math.max(25, baseDPS + typeBoost));

    return parseFloat(finalDPS.toFixed(1));
  }
}
