/**
 * Unified Grading Runner
 *
 * Main execution logic for the unified grading rubric system.
 * Calls LLM (Gemini by default) with structured prompt and validates response.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  UnifiedGradingInput,
  UnifiedGradingResult,
  FeatureSnapshot,
  validateUnifiedGradingResult,
  toRubricPackResult
} from './unified-grading-types';
import {
  UNIFIED_GRADING_SYSTEM_PROMPT,
  buildUnifiedGradingPrompt,
  UNIFIED_GRADING_CONFIG
} from './prompts/unified-grading-prompt';
import { validateRubricPack, formatValidationErrors } from './validator';

/**
 * Options for unified grading execution
 */
export interface UnifiedGradingOptions {
  /** LLM model to use */
  model?: 'gemini' | 'gemini-flash' | 'gpt4o';
  /** Temperature for LLM generation (0.0-1.0) */
  temperature?: number;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Whether to validate using RubricPackResult validator */
  validateAsRubricPack?: boolean;
}

/**
 * Result from unified grading execution
 */
export interface UnifiedGradingExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  /** Grading result (if successful) */
  result?: UnifiedGradingResult;
  /** Error message (if failed) */
  error?: string;
  /** Validation errors (if any) */
  validationErrors?: string[];
  /** Execution latency in ms */
  latencyMs: number;
  /** Model used */
  model: string;
}

/**
 * Default empty result for fallback cases
 */
function getDefaultResult(niche: string, goal: string): UnifiedGradingResult {
  return {
    rubric_version: '1.0',
    niche,
    goal,
    style_classification: { label: 'unknown', confidence: 0 },
    idea_legos: {
      lego_1: false,
      lego_2: false,
      lego_3: false,
      lego_4: false,
      lego_5: false,
      lego_6: false,
      lego_7: false,
      notes: ''
    },
    attribute_scores: Array.from({ length: 9 }, (_, i) => ({
      attribute: `attr_${i + 1}`,
      score: 0,
      evidence: ''
    })),
    hook: {
      type: '',
      clarity_score: 0,
      pattern: '',
      evidence: '',
      rewrite_options: []
    },
    pacing: { score: 0, evidence: '' },
    clarity: { score: 0, evidence: '' },
    novelty: { score: 0, evidence: '' },
    compliance_flags: [],
    warnings: ['Grading failed - using default values'],
    grader_confidence: 0
  };
}

/**
 * Parse LLM response to UnifiedGradingResult
 */
function parseResponse(text: string): UnifiedGradingResult {
  // Remove markdown code blocks if present
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

  return JSON.parse(cleanText) as UnifiedGradingResult;
}

/**
 * Call Gemini API for unified grading
 */
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  options: UnifiedGradingOptions
): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set GOOGLE_GEMINI_AI_API_KEY in environment.');
  }

  const client = new GoogleGenerativeAI(apiKey);
  // Use gemini-2.0-flash-exp for better availability, fallback options available
  const modelName = options.model === 'gemini-flash' ? 'gemini-2.0-flash-exp' : 'gemini-1.5-pro-latest';

  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature ?? UNIFIED_GRADING_CONFIG.temperature,
      maxOutputTokens: options.maxTokens ?? UNIFIED_GRADING_CONFIG.maxTokens,
    },
    systemInstruction: systemPrompt
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  return response.text();
}

/**
 * Run unified grading on input data
 *
 * @param input - Input data including niche, goal, transcript, and features
 * @param options - Execution options
 * @returns Execution result with grading data or error
 */
export async function runUnifiedGrading(
  input: UnifiedGradingInput,
  options: UnifiedGradingOptions = {}
): Promise<UnifiedGradingExecutionResult> {
  const startTime = Date.now();
  const modelName = options.model === 'gemini-flash' ? 'gemini-1.5-flash' :
    options.model === 'gpt4o' ? 'gpt-4o' : 'gemini-1.5-pro';

  try {
    // Validate input
    if (!input.transcript || input.transcript.length < 10) {
      return {
        success: false,
        error: 'Transcript is too short (minimum 10 characters)',
        latencyMs: Date.now() - startTime,
        model: modelName
      };
    }

    // Build prompts
    const systemPrompt = UNIFIED_GRADING_SYSTEM_PROMPT;
    const userPrompt = buildUnifiedGradingPrompt(
      input.niche,
      input.goal,
      input.transcript,
      input.feature_snapshot
    );

    console.log('[UnifiedGrading] Starting grading with model:', modelName);
    console.log('[UnifiedGrading] Transcript length:', input.transcript.length);

    // Call LLM
    let rawResponse: string;
    if (options.model === 'gpt4o') {
      // GPT-4o support could be added here
      throw new Error('GPT-4o not yet implemented. Use gemini or gemini-flash.');
    } else {
      rawResponse = await callGemini(systemPrompt, userPrompt, options);
    }

    console.log('[UnifiedGrading] Received response, length:', rawResponse.length);

    // Parse response
    let result: UnifiedGradingResult;
    try {
      result = parseResponse(rawResponse);
    } catch (parseError: any) {
      console.error('[UnifiedGrading] Failed to parse response:', parseError.message);
      console.error('[UnifiedGrading] Raw response:', rawResponse.substring(0, 500));
      return {
        success: false,
        error: `Failed to parse LLM response: ${parseError.message}`,
        latencyMs: Date.now() - startTime,
        model: modelName
      };
    }

    // Validate result structure
    const structureValidation = validateUnifiedGradingResult(result);
    if (!structureValidation.valid) {
      console.warn('[UnifiedGrading] Structure validation warnings:', structureValidation.errors);
      // Add warnings to result but don't fail
      result.warnings = [
        ...(result.warnings || []),
        ...structureValidation.errors.map(e => `Validation: ${e}`)
      ];
    }

    // Optionally validate as RubricPackResult
    if (options.validateAsRubricPack) {
      const packResult = toRubricPackResult(result);
      const packValidation = validateRubricPack(packResult);
      if (!packValidation.valid) {
        console.warn('[UnifiedGrading] RubricPack validation errors:');
        console.warn(formatValidationErrors(packValidation));
        return {
          success: false,
          result,
          error: 'RubricPack validation failed',
          validationErrors: packValidation.errors.map(e => e.message),
          latencyMs: Date.now() - startTime,
          model: modelName
        };
      }
    }

    console.log('[UnifiedGrading] Grading complete, confidence:', result.grader_confidence);

    return {
      success: true,
      result,
      latencyMs: Date.now() - startTime,
      model: modelName
    };

  } catch (error: any) {
    console.error('[UnifiedGrading] Execution error:', error.message);
    return {
      success: false,
      error: error.message,
      latencyMs: Date.now() - startTime,
      model: modelName
    };
  }
}

/**
 * Run unified grading with fallback to default on failure
 *
 * @param input - Input data
 * @param options - Execution options
 * @returns Grading result (default values on failure)
 */
export async function runUnifiedGradingWithFallback(
  input: UnifiedGradingInput,
  options: UnifiedGradingOptions = {}
): Promise<UnifiedGradingResult> {
  const execResult = await runUnifiedGrading(input, options);

  if (execResult.success && execResult.result) {
    return execResult.result;
  }

  console.warn('[UnifiedGrading] Using fallback result due to:', execResult.error);
  const fallback = getDefaultResult(input.niche, input.goal);
  fallback.warnings.push(`Error: ${execResult.error}`);
  return fallback;
}
