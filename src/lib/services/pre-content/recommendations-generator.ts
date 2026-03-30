/**
 * FEAT-007: Recommendations Generator
 * Analyzes Idea Legos vs top patterns to suggest specific improvements
 */

import { IdeaLegos, PatternMatch } from '@/types/pre-content-prediction';

// ============================================================================
// Recommendation Templates
// ============================================================================

const HOOK_RECOMMENDATIONS = {
  lowScore: [
    'Add a specific number or stat in the first 3 seconds',
    'Open with a provocative question to create curiosity',
    'Start with "You\'re doing X wrong" or similar pattern interrupt',
    'Lead with the transformation or end result first',
  ],
  missingPatterns: [
    'Use "Day X of Y" format for challenge-based content',
    'Try "POV:" format for relatable scenarios',
    'Include "$X in Y days" for financial/achievement hooks',
  ],
};

const STORY_RECOMMENDATIONS = {
  lowScore: [
    'Show before → during → after transformation arc',
    'Include a common mistake or obstacle overcome',
    'Add a plot twist or unexpected result midway',
    'Build tension before revealing the payoff',
  ],
  missingPatterns: [
    'Structure as problem → agitation → solution',
    'Use "Here\'s what happened when..." narrative flow',
    'Include social proof or testimonial moment',
  ],
};

const VISUAL_RECOMMENDATIONS = {
  lowScore: [
    'Show transformation progress in first 3 seconds',
    'Add fast-paced cuts every 2-3 seconds',
    'Include on-screen text for key points',
    'Use B-roll to maintain visual interest',
  ],
  missingPatterns: [
    'Try split-screen before/after comparison',
    'Add reaction shots or facial close-ups',
    'Include POV footage for immersion',
  ],
};

const ANGLE_RECOMMENDATIONS = {
  lowScore: [
    'Add a contrarian take or challenge conventional wisdom',
    'Include personal story or vulnerability',
    'Frame as "insider secret" or "what they don\'t tell you"',
    'Position as "X vs Y" comparison',
  ],
};

const AUDIO_RECOMMENDATIONS = {
  lowScore: [
    'Use trending audio or sound effect',
    'Add upbeat motivational music',
    'Include voice-over for narrative clarity',
    'Sync key moments to music beats',
  ],
};

// ============================================================================
// Pattern Analysis
// ============================================================================

/**
 * Identify which Lego types have weak pattern matches
 */
function identifyWeakLegos(
  legos: IdeaLegos,
  topPatterns: PatternMatch[]
): (keyof IdeaLegos)[] {
  const legoScores: Partial<Record<keyof IdeaLegos, number>> = {
    topic: 0,
    angle: 0,
    hookStructure: 0,
    storyStructure: 0,
    visualFormat: 0,
    keyVisuals: 0,
    audio: 0,
  };

  // Map pattern types to Lego fields
  const typeToLego: Record<string, keyof IdeaLegos> = {
    topic: 'topic',
    angle: 'angle',
    hook_structure: 'hookStructure',
    story_structure: 'storyStructure',
    visual_format: 'visualFormat',
    key_visuals: 'keyVisuals',
    audio: 'audio',
  };

  // Calculate average match score for each Lego
  for (const pattern of topPatterns) {
    const legoField = typeToLego[pattern.type];
    if (legoField) {
      legoScores[legoField] = Math.max(
        legoScores[legoField] || 0,
        pattern.matchScore || 0
      );
    }
  }

  // Identify weak Legos (score < 60)
  const weakLegos: (keyof IdeaLegos)[] = [];
  for (const [lego, score] of Object.entries(legoScores)) {
    if (score < 60) {
      weakLegos.push(lego as keyof IdeaLegos);
    }
  }

  return weakLegos;
}

/**
 * Find missing high-performing patterns
 */
function findMissingPatterns(topPatterns: PatternMatch[]): string[] {
  const missingPatterns: string[] = [];

  // Check if hook_structure patterns are missing
  const hasHookPattern = topPatterns.some(p => p.type === 'hook_structure' && p.matchScore > 70);
  if (!hasHookPattern) {
    missingPatterns.push('hook_structure');
  }

  // Check if story_structure patterns are missing
  const hasStoryPattern = topPatterns.some(p => p.type === 'story_structure' && p.matchScore > 70);
  if (!hasStoryPattern) {
    missingPatterns.push('story_structure');
  }

  // Check if visual patterns are missing
  const hasVisualPattern = topPatterns.some(p =>
    (p.type === 'visual_format' || p.type === 'key_visuals') && p.matchScore > 70
  );
  if (!hasVisualPattern) {
    missingPatterns.push('visual_format');
  }

  return missingPatterns;
}

// ============================================================================
// Specific Recommendation Generators
// ============================================================================

/**
 * Generate hook recommendations
 */
function generateHookRecommendations(
  legos: IdeaLegos,
  topPatterns: PatternMatch[],
  weakLegos: (keyof IdeaLegos)[]
): string[] {
  const recommendations: string[] = [];

  if (weakLegos.includes('hookStructure')) {
    // Low hook score - suggest general improvements
    recommendations.push(...HOOK_RECOMMENDATIONS.lowScore.slice(0, 2));
  }

  // Check for specific missing patterns
  const hookPatterns = topPatterns.filter(p => p.type === 'hook_structure');
  if (hookPatterns.length > 0) {
    const topHookPattern = hookPatterns[0];
    recommendations.push(
      `Consider using "${topHookPattern.description}" pattern (${Math.round(topHookPattern.successRate * 100)}% success rate)`
    );
  } else {
    recommendations.push(HOOK_RECOMMENDATIONS.missingPatterns[0]);
  }

  return recommendations;
}

/**
 * Generate story structure recommendations
 */
function generateStoryRecommendations(
  legos: IdeaLegos,
  topPatterns: PatternMatch[],
  weakLegos: (keyof IdeaLegos)[]
): string[] {
  const recommendations: string[] = [];

  if (weakLegos.includes('storyStructure')) {
    recommendations.push(...STORY_RECOMMENDATIONS.lowScore.slice(0, 2));
  }

  const storyPatterns = topPatterns.filter(p => p.type === 'story_structure');
  if (storyPatterns.length > 0) {
    const topStoryPattern = storyPatterns[0];
    recommendations.push(
      `Try "${topStoryPattern.description}" structure (avg DPS: ${topStoryPattern.avgDPS.toFixed(1)})`
    );
  }

  return recommendations;
}

/**
 * Generate visual recommendations
 */
function generateVisualRecommendations(
  legos: IdeaLegos,
  topPatterns: PatternMatch[],
  weakLegos: (keyof IdeaLegos)[]
): string[] {
  const recommendations: string[] = [];

  if (weakLegos.includes('visualFormat') || weakLegos.includes('keyVisuals')) {
    recommendations.push(...VISUAL_RECOMMENDATIONS.lowScore.slice(0, 2));
  }

  const visualPatterns = topPatterns.filter(
    p => p.type === 'visual_format' || p.type === 'key_visuals'
  );

  if (visualPatterns.length > 0) {
    const topVisualPattern = visualPatterns[0];
    recommendations.push(`Include: ${topVisualPattern.description}`);
  }

  return recommendations;
}

/**
 * Generate angle recommendations
 */
function generateAngleRecommendations(
  legos: IdeaLegos,
  weakLegos: (keyof IdeaLegos)[]
): string[] {
  if (weakLegos.includes('angle')) {
    return [ANGLE_RECOMMENDATIONS.lowScore[0]];
  }
  return [];
}

/**
 * Generate audio recommendations
 */
function generateAudioRecommendations(
  legos: IdeaLegos,
  weakLegos: (keyof IdeaLegos)[]
): string[] {
  if (weakLegos.includes('audio')) {
    return [AUDIO_RECOMMENDATIONS.lowScore[0]];
  }
  return [];
}

// ============================================================================
// Main Recommendation Service
// ============================================================================

/**
 * Generate actionable recommendations to improve viral potential
 */
export function generateRecommendations(
  legos: IdeaLegos,
  topPatterns: PatternMatch[],
  patternMatchScore: number
): string[] {
  const recommendations: string[] = [];

  // Identify weak areas
  const weakLegos = identifyWeakLegos(legos, topPatterns);
  const missingPatterns = findMissingPatterns(topPatterns);

  // Generate recommendations by priority

  // 1. Hook (most critical)
  if (weakLegos.includes('hookStructure') || missingPatterns.includes('hook_structure')) {
    recommendations.push(...generateHookRecommendations(legos, topPatterns, weakLegos));
  }

  // 2. Story structure
  if (weakLegos.includes('storyStructure') || missingPatterns.includes('story_structure')) {
    recommendations.push(...generateStoryRecommendations(legos, topPatterns, weakLegos));
  }

  // 3. Visuals
  if (weakLegos.includes('visualFormat') || weakLegos.includes('keyVisuals') ||
      missingPatterns.includes('visual_format')) {
    recommendations.push(...generateVisualRecommendations(legos, topPatterns, weakLegos));
  }

  // 4. Angle (if weak)
  recommendations.push(...generateAngleRecommendations(legos, weakLegos));

  // 5. Audio (if weak)
  recommendations.push(...generateAudioRecommendations(legos, weakLegos));

  // If overall pattern match is low, add general advice
  if (patternMatchScore < 50) {
    recommendations.unshift(
      'Overall pattern match is low. Consider studying top-performing content in your niche before filming.'
    );
  }

  // Limit to top 5 most impactful recommendations
  return recommendations.slice(0, 5);
}

/**
 * Generate detailed recommendation with reasoning
 * (Optional enhancement for UI display)
 */
export function generateDetailedRecommendation(
  recommendation: string,
  topPatterns: PatternMatch[]
): {
  recommendation: string;
  reasoning: string;
  supportingData?: PatternMatch;
} {
  // Find supporting pattern if recommendation references one
  const supportingPattern = topPatterns.find(p =>
    recommendation.includes(p.description)
  );

  let reasoning = 'Based on analysis of viral patterns in your niche';
  if (supportingPattern) {
    reasoning = `This pattern has a ${Math.round(supportingPattern.successRate * 100)}% success rate and average DPS of ${supportingPattern.avgDPS.toFixed(1)}`;
  }

  return {
    recommendation,
    reasoning,
    supportingData: supportingPattern,
  };
}
