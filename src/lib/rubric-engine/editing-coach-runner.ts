/**
 * Pack 2: Editing Coach Runner
 * Generates actionable improvement suggestions from Pack 1 rubric output
 */

import { GoogleGenAI } from '@google/genai';
import {
  EditingCoachInput,
  EditingCoachResult,
  EditingCoachExecutionResult,
  EditChange,
  RUBRIC_WEIGHTS,
  CONSERVATIVE_FACTOR,
} from './editing-coach-types';
import { UnifiedGradingResult } from './unified-grading-types';
import {
  EDITING_COACH_SYSTEM_PROMPT,
  buildEditingCoachUserPrompt,
} from './prompts/editing-coach-prompt';
import { PackMetadata } from './pack-metadata';
import type { CreatorContext } from '@/lib/prediction/creator-context';

// ============================================================================
// Configuration
// ============================================================================

const MODEL_NAME = 'gemini-2.5-flash';

// ============================================================================
// Runner
// ============================================================================

export async function runEditingCoach(
  input: EditingCoachInput,
  options?: {
    apiKey?: string;
    modelName?: string;
    useMock?: boolean;
    temperature?: number;
  }
): Promise<EditingCoachExecutionResult> {
  const startTime = Date.now();

  // Use mock for testing
  if (options?.useMock) {
    const mockResult = createMockEditingCoachResult(input);
    const latency = Date.now() - startTime;
    return {
      success: true,
      result: mockResult,
      latencyMs: latency,
      _meta: {
        source: 'mock',
        provider: 'mock',
        latency_ms: latency,
      },
    };
  }

  const apiKey = options?.apiKey || process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const modelName = options?.modelName || MODEL_NAME;

  if (!apiKey) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      error: 'GOOGLE_AI_API_KEY not configured',
      latencyMs: latency,
      _meta: {
        source: 'mock',
        provider: 'mock',
        latency_ms: latency,
      },
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = buildEditingCoachUserPrompt(
      input.rubric,
      input.predicted_score,
      input.top_drivers,
      input.creator_context
    );

    const result = await ai.models.generateContent({
      model: modelName,
      config: options?.temperature !== undefined ? { temperature: options.temperature } : undefined,
      contents: [
        { role: 'user', parts: [{ text: EDITING_COACH_SYSTEM_PROMPT }, { text: userPrompt }] },
      ],
    });

    const responseText = result.text || '';
    const parsed = parseJsonResponse(responseText);

    if (!parsed || !isValidEditingCoachResult(parsed)) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        error: 'Failed to parse editing coach response',
        latencyMs: latency,
        _meta: {
          source: 'real',
          provider: 'google-ai',
          latency_ms: latency,
        },
      };
    }

    const latency = Date.now() - startTime;
    return {
      success: true,
      result: parsed as EditingCoachResult,
      latencyMs: latency,
      _meta: {
        source: 'real',
        provider: 'google-ai',
        latency_ms: latency,
      },
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return {
      success: false,
      error: error.message || 'Unknown error',
      latencyMs: latency,
      _meta: {
        source: 'real',
        provider: 'google-ai',
        latency_ms: latency,
      },
    };
  }
}

// ============================================================================
// Lift Estimation (rule-based, no LLM needed)
// ============================================================================

/**
 * Estimate lift for a specific field improvement
 */
export function estimateLift(
  currentScore: number,
  targetField: string,
  changeConfidence: number = 0.7
): number {
  const weight = RUBRIC_WEIGHTS[targetField] || 0.05;
  const improvementHeadroom = 10 - currentScore;

  // Weight-based lift with conservative calibration
  // Convert to VPS scale (0-100)
  const theoreticalLift = improvementHeadroom * weight * 100;
  const conservativeLift = theoreticalLift * CONSERVATIVE_FACTOR * changeConfidence;

  return Math.round(conservativeLift * 10) / 10;
}

/**
 * Generate suggestions using rule-based approach (no LLM)
 */
export function generateRuleBasedSuggestions(
  rubric: UnifiedGradingResult,
  predictedScore: number,
  creatorContext?: CreatorContext | null
): EditingCoachResult {
  const suggestions: EditChange[] = [];

  // Find lowest scoring attributes
  const sortedAttrs = [...rubric.attribute_scores].sort(
    (a, b) => a.score - b.score
  );

  // Generate suggestions for lowest 3
  for (let i = 0; i < Math.min(3, sortedAttrs.length); i++) {
    const attr = sortedAttrs[i];
    if (attr.score >= 8) continue; // Skip if already high

    const suggestion = generateSuggestionForAttribute(attr, i + 1);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  // Add hook suggestion if weak
  if (rubric.hook.clarity_score < 6 && suggestions.length < 3) {
    const hookExample = getPersonalizedHookExample(rubric, creatorContext);
    suggestions.push({
      priority: suggestions.length + 1,
      what_to_change: 'Opening hook',
      how_to_change: `Replace "${rubric.hook.type}" hook with a stronger pattern interrupt or curiosity-gap opener`,
      example: hookExample,
      targets: ['rubric.hook.clarity_score', 'rubric.attribute_scores[4]'],
      estimated_lift: estimateLift(rubric.hook.clarity_score, 'hook_strength'),
      confidence: 0.8,
    });
  }

  // Personalize suggestion text when creator context is available
  if (creatorContext) {
    personalizeSuggestions(suggestions, creatorContext);
  }

  const totalLift = suggestions.reduce((sum, s) => sum + s.estimated_lift, 0);

  return {
    pack: '2',
    predicted_before: predictedScore,
    predicted_after_estimate: Math.min(100, predictedScore + totalLift),
    changes: suggestions.slice(0, 3),
    notes: `Focus on ${suggestions[0]?.what_to_change || 'hook'} first for maximum impact.`,
    _meta: {
      source: 'real',
      provider: 'rule-based',
      latency_ms: 0, // Synchronous rule-based execution
    },
  };
}

function generateSuggestionForAttribute(
  attr: { attribute: string; score: number; evidence: string },
  priority: number
): EditChange | null {
  const templates: Record<string, { what: string; how: string; example: string }> = {
    hook_strength: {
      what: 'Opening hook',
      how: 'Add a pattern interrupt, bold claim, or direct question in the first 2 seconds',
      example: 'Stop scrolling - this changed everything for me.',
    },
    curiosity_gaps: {
      what: 'Open loops',
      how: 'Add 2-3 teaser statements that promise reveals later in the video',
      example: 'But wait until you see what happens next...',
    },
    shareability: {
      what: 'Shareable moment',
      how: 'Include one quotable line or visual that viewers would screenshot or send to friends',
      example: 'The best [topic] advice I ever got: [insight]',
    },
    tam_resonance: {
      what: 'Audience relevance',
      how: 'Make the content more specific to your target audience pain points',
      example: 'If you struggle with [specific problem], this is for you.',
    },
    value_density: {
      what: 'Value per second',
      how: 'Cut filler content and pack more insights into shorter segments',
      example: 'Remove "so basically" and "you know" - get to the point faster',
    },
    emotional_journey: {
      what: 'Emotional arc',
      how: 'Add a clear before/after transformation or emotional pivot point',
      example: 'Start with the struggle, end with the breakthrough.',
    },
    pacing_rhythm: {
      what: 'Pacing',
      how: 'Vary sentence length and add visual/audio cuts every 2-3 seconds',
      example: 'Short. Punchy. Then expand with detail.',
    },
    clear_payoff: {
      what: 'Payoff clarity',
      how: 'Ensure the main takeaway is crystal clear by the end',
      example: 'End with: "So remember: [key insight]"',
    },
    format_innovation: {
      what: 'Format',
      how: 'Try a different content format (POV, story, list, challenge)',
      example: 'Instead of talking head, try a "day in the life" POV shot',
    },
  };

  const template = templates[attr.attribute];
  if (!template) return null;

  return {
    priority,
    what_to_change: template.what,
    how_to_change: `${template.how}. Current: "${attr.evidence}"`,
    example: template.example,
    targets: [`rubric.attribute_scores.${attr.attribute}`],
    estimated_lift: estimateLift(attr.score, attr.attribute),
    confidence: 0.75,
  };
}

// ============================================================================
// Creator Context Personalization (rule-based)
// ============================================================================

/**
 * Get a hook example personalized to the creator's preferred hook style.
 * Falls back to the rubric's rewrite options or a generic example.
 */
function getPersonalizedHookExample(
  rubric: UnifiedGradingResult,
  creatorContext?: CreatorContext | null
): string {
  const defaultExample =
    rubric.hook.rewrite_options[0] ||
    'What if everything you know about this is wrong?';

  if (!creatorContext?.calibrationProfile?.rawScores?.hookStylePreference) {
    return defaultExample;
  }

  const topStyle = getTopPreference(
    creatorContext.calibrationProfile.rawScores.hookStylePreference
  );
  if (!topStyle) return defaultExample;

  const hookExamples: Record<string, string> = {
    'bold-claim': 'This one thing changed everything about [topic].',
    'authority': 'As someone who has [credential], here\'s what nobody tells you...',
    'question': 'Have you ever wondered why [topic] works so differently than you think?',
    'story': 'I was doing [common mistake] for 3 years until someone told me this...',
    'statistic': 'Only 2% of people know this about [topic].',
    'contrarian': 'Everyone is wrong about [topic]. Here\'s why.',
    'myth-busting': 'This popular advice about [topic] is actually making things worse.',
    'pain-point': 'If you\'re struggling with [pain point], stop doing THIS.',
    'curiosity': 'I found something that nobody talks about...',
    'social-proof': 'I helped 500+ people do [outcome]. Here\'s the secret.',
  };

  return hookExamples[topStyle] || defaultExample;
}

/**
 * Personalize suggestion text based on creator context.
 * Only modifies text/notes — never changes lift estimates or confidence.
 */
function personalizeSuggestions(
  suggestions: EditChange[],
  creatorContext: CreatorContext
): void {
  // For newer creators, emphasize shareability
  if (
    creatorContext.creatorStage === 'new' ||
    creatorContext.creatorStage === 'growing'
  ) {
    for (const s of suggestions) {
      if (s.what_to_change === 'Shareable moment') {
        s.how_to_change +=
          '. As a growing account, shareability is your #1 growth lever';
      }
    }
  }

  // If creator prefers a specific content format, note it in format suggestions
  const topFormat = creatorContext.calibrationProfile?.rawScores
    ?.contentFormatPreference
    ? getTopPreference(
        creatorContext.calibrationProfile.rawScores.contentFormatPreference
      )
    : null;

  if (topFormat) {
    for (const s of suggestions) {
      if (s.what_to_change === 'Format') {
        s.how_to_change = `Consider adapting to your preferred "${topFormat}" format. ${s.how_to_change}`;
      }
    }
  }
}

function getTopPreference(prefs: Record<string, number>): string | null {
  const entries = Object.entries(prefs).sort(([, a], [, b]) => b - a);
  return entries.length > 0 && entries[0][1] > 50 ? entries[0][0] : null;
}

// ============================================================================
// Helpers
// ============================================================================

function parseJsonResponse(text: string): unknown | null {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    return JSON.parse(cleanText.trim());
  } catch {
    return null;
  }
}

function isValidEditingCoachResult(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.pack === '2' &&
    typeof obj.predicted_before === 'number' &&
    typeof obj.predicted_after_estimate === 'number' &&
    Array.isArray(obj.changes)
  );
}

// ============================================================================
// Mock for Testing
// ============================================================================

export function createMockEditingCoachResult(
  input: EditingCoachInput
): EditingCoachResult {
  const rubric = input.rubric;

  // Find actual low scores
  const lowestAttr = [...rubric.attribute_scores].sort((a, b) => a.score - b.score)[0];

  return {
    pack: '2',
    predicted_before: input.predicted_score,
    predicted_after_estimate: Math.min(100, input.predicted_score + 12),
    changes: [
      {
        priority: 1,
        what_to_change: 'Opening hook',
        how_to_change: 'Replace weak opening with a pattern interrupt or curiosity-gap question',
        example: 'What if everything you know about [topic] is backwards?',
        targets: ['rubric.hook.clarity_score', 'rubric.attribute_scores[4]'],
        estimated_lift: 6.5,
        confidence: 0.85,
      },
      {
        priority: 2,
        what_to_change: lowestAttr?.attribute || 'curiosity_gaps',
        how_to_change: `Improve ${lowestAttr?.attribute || 'curiosity gaps'} - current score ${lowestAttr?.score || 5}/10`,
        example: 'But wait until you see what happens next...',
        targets: [`rubric.attribute_scores.${lowestAttr?.attribute || 'curiosity_gaps'}`],
        estimated_lift: 3.5,
        confidence: 0.75,
      },
      {
        priority: 3,
        what_to_change: 'Shareable moment',
        how_to_change: 'Add one quotable line that viewers would want to share',
        example: 'The best advice I ever got: [insight]',
        targets: ['rubric.attribute_scores.shareability'],
        estimated_lift: 2.0,
        confidence: 0.7,
      },
    ],
    notes: 'Focus on hook first - it has 18% weight in prediction. Fixing the opening alone could lift score significantly.',
    _meta: {
      source: 'mock',
      provider: 'mock',
      latency_ms: 0,
    },
  };
}
