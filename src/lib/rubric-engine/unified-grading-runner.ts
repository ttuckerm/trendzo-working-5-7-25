/**
 * Pack 1: Unified Grading Rubric Runner
 * Executes LLM-based content grading with retry/repair loop
 */

import { GoogleGenAI } from '@google/genai';
import {
  UnifiedGradingInput,
  UnifiedGradingResult,
  UnifiedGradingExecutionResult,
  ATTRIBUTE_NAMES,
} from './unified-grading-types';
import { validateUnifiedGradingResult } from './unified-grading-schema';
import {
  UNIFIED_GRADING_SYSTEM_PROMPT,
  buildUnifiedGradingUserPrompt,
  buildRepairPrompt,
} from './prompts/unified-grading-prompt';
import { PackMetadata } from './pack-metadata';

// ============================================================================
// Configuration
// ============================================================================

const MAX_RETRIES = 3;
const MODEL_NAME = 'gemini-2.5-flash';

// ============================================================================
// Runner
// ============================================================================

export async function runUnifiedGrading(
  input: UnifiedGradingInput,
  options?: {
    apiKey?: string;
    modelName?: string;
    temperature?: number;
  }
): Promise<UnifiedGradingExecutionResult> {
  const startTime = Date.now();
  const apiKey = options?.apiKey || process.env.GOOGLE_GEMINI_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  const modelName = options?.modelName || MODEL_NAME;

  if (!apiKey) {
    return {
      success: false,
      error: 'GOOGLE_AI_API_KEY not configured',
      latencyMs: Date.now() - startTime,
      model: modelName,
      retryCount: 0,
      _meta: {
        source: 'mock',
        provider: 'mock',
        latency_ms: Date.now() - startTime,
      },
    };
  }

  if (!input.transcript || input.transcript.length < 10) {
    return {
      success: false,
      error: 'Transcript too short (minimum 10 characters)',
      latencyMs: Date.now() - startTime,
      model: modelName,
      retryCount: 0,
      _meta: {
        source: 'real',
        provider: 'google-ai',
        latency_ms: Date.now() - startTime,
      },
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  let lastError: string | undefined;
  let lastResponse: string = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Build prompt
      let userPrompt: string;
      if (attempt === 1) {
        userPrompt = buildUnifiedGradingUserPrompt(
          input.transcript,
          input.niche,
          input.goal
        );
      } else {
        // Repair attempt - send validation errors back
        userPrompt = buildRepairPrompt(lastResponse, lastError ? [lastError] : []);
      }

      // Call LLM
      const result = await ai.models.generateContent({
        model: modelName,
        config: options?.temperature !== undefined ? { temperature: options.temperature } : undefined,
        contents: [
          { role: 'user', parts: [{ text: UNIFIED_GRADING_SYSTEM_PROMPT }, { text: userPrompt }] },
        ],
      });

      const responseText = result.text || '';
      lastResponse = responseText;

      // Parse JSON from response
      const parsed = parseJsonResponse(responseText);

      if (!parsed) {
        lastError = 'Failed to parse JSON from response';
        console.warn(`[UnifiedGrading] Attempt ${attempt}: ${lastError}`);
        continue;
      }

      // Validate against schema
      const validation = validateUnifiedGradingResult(parsed);

      if (validation.success && validation.data) {
        const latency = Date.now() - startTime;
        return {
          success: true,
          result: validation.data,
          latencyMs: latency,
          model: modelName,
          retryCount: attempt - 1,
          _meta: {
            source: 'real',
            provider: 'google-ai',
            latency_ms: latency,
          },
        };
      }

      // Validation failed
      lastError = validation.errors?.join('; ') || 'Schema validation failed';
      console.warn(`[UnifiedGrading] Attempt ${attempt}: ${lastError}`);

    } catch (error: any) {
      lastError = error.message || 'Unknown error';
      console.error(`[UnifiedGrading] Attempt ${attempt} error:`, lastError);
    }
  }

  // All retries exhausted
  const latency = Date.now() - startTime;
  return {
    success: false,
    error: `Schema validation failed after ${MAX_RETRIES} attempts: ${lastError}`,
    validationErrors: lastError ? [lastError] : [],
    latencyMs: latency,
    model: modelName,
    retryCount: MAX_RETRIES,
    _meta: {
      source: 'real',
      provider: 'google-ai',
      latency_ms: latency,
    },
  };
}

// ============================================================================
// Helpers
// ============================================================================

function parseJsonResponse(text: string): unknown | null {
  try {
    // Clean markdown code blocks
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
    cleanText = cleanText.trim();

    return JSON.parse(cleanText);
  } catch {
    return null;
  }
}

// ============================================================================
// Mock for Testing
// ============================================================================

/**
 * Creates a mock result for testing without LLM calls
 */
export function createMockUnifiedGradingResult(
  input: UnifiedGradingInput
): UnifiedGradingResult {
  return {
    rubric_version: '1.0',
    niche: input.niche || 'general',
    goal: input.goal || 'engagement',
    style_classification: {
      label: 'educational',
      confidence: 0.85,
    },
    idea_legos: {
      lego_1: true,
      lego_2: true,
      lego_3: false,
      lego_4: true,
      lego_5: false,
      lego_6: true,
      lego_7: false,
      notes: 'Missing unique angle, story structure, and CTA',
    },
    attribute_scores: ATTRIBUTE_NAMES.map((attr, i) => ({
      attribute: attr,
      score: 5 + (i % 4), // Varies 5-8
      evidence: `Mock evidence for ${attr}`,
    })),
    hook: {
      type: 'question',
      clarity_score: 7,
      pattern: 'curiosity_gap',
      evidence: input.transcript.substring(0, 50),
      rewrite_options: [
        'What if I told you this changes everything?',
        'Stop scrolling - this is important.',
      ],
    },
    pacing: { score: 6, evidence: 'Moderate pacing throughout' },
    clarity: { score: 7, evidence: 'Clear main message' },
    novelty: { score: 5, evidence: 'Familiar topic, standard approach' },
    compliance_flags: [],
    warnings: [],
    grader_confidence: 0.8,
    _meta: {
      source: 'mock',
      provider: 'mock',
      latency_ms: 0,
    },
  };
}

// ============================================================================
// Derived Scores
// ============================================================================

/**
 * Compute aggregate score from idea legos (how many are present)
 */
export function computeLegoScore(legos: UnifiedGradingResult['idea_legos']): number {
  const count = [
    legos.lego_1,
    legos.lego_2,
    legos.lego_3,
    legos.lego_4,
    legos.lego_5,
    legos.lego_6,
    legos.lego_7,
  ].filter(Boolean).length;

  // 0 legos = 1, 7 legos = 10
  return Math.max(1, Math.round((count / 7) * 9 + 1));
}

/**
 * Compute average attribute score
 */
export function computeAverageAttributeScore(
  attributes: UnifiedGradingResult['attribute_scores']
): number {
  if (attributes.length === 0) return 5;
  const sum = attributes.reduce((acc, attr) => acc + attr.score, 0);
  return Math.round((sum / attributes.length) * 10) / 10;
}
