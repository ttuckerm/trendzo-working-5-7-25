/**
 * Rubric Validation Engine
 *
 * Hard-fails on:
 * - Missing required criteria
 * - Missing or insufficient evidence
 * - Scores out of range (1-10)
 * - Confidence out of range (0.0-1.0)
 * - Low-effort responses (generic evidence, all same scores)
 *
 * Ticket R1 + R1.1
 */

import {
  RubricPackResult,
  RubricValidationResult,
  RubricValidationError,
  PACK_A_CRITERIA,
  PACK_B_CRITERIA,
  PACK_C_CRITERIA
} from './types';

/**
 * Minimum reasoning length (characters)
 */
const MIN_REASONING_LENGTH = 50;

/**
 * Minimum evidence quote length (characters)
 */
const MIN_EVIDENCE_QUOTE_LENGTH = 10;

/**
 * Maximum allowed identical scores before flagging as low-effort
 * (e.g., if 8 out of 11 criteria all have score 8, flag as suspicious)
 */
const MAX_IDENTICAL_SCORE_RATIO = 0.7;

/**
 * Generic phrases that indicate low-effort reasoning
 */
const LOW_EFFORT_PHRASES = [
  'good content',
  'nice video',
  'well done',
  'great job',
  'seems fine',
  'looks good',
  'pretty good',
  'not bad',
  'okay',
  'decent'
];

/**
 * Get required criteria for a pack
 */
function getRequiredCriteria(packId: string): readonly string[] {
  switch (packId) {
    case 'content-quality':
    case 'pack-a':
      return PACK_A_CRITERIA;
    case 'packaging-format':
    case 'pack-b':
      return PACK_B_CRITERIA;
    case 'viral-mechanics':
    case 'pack-c':
      return PACK_C_CRITERIA;
    default:
      throw new Error(`Unknown pack ID: ${packId}`);
  }
}

/**
 * Validate raw LLM output before parsing
 *
 * @param rawOutput - Raw string output from LLM
 * @returns Validation result
 */
export function validateRawOutput(rawOutput: string): RubricValidationResult {
  const errors: RubricValidationError[] = [];

  // Check if output is empty
  if (!rawOutput || rawOutput.trim().length === 0) {
    errors.push({
      type: 'invalid_json',
      message: 'LLM returned empty output',
      expected: 'Valid JSON object',
      actual: 'Empty string'
    });
    return { valid: false, errors, warnings: [] };
  }

  // Check if output is valid JSON
  try {
    JSON.parse(rawOutput);
  } catch (e: unknown) {
    errors.push({
      type: 'invalid_json',
      message: `LLM returned invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`,
      expected: 'Valid JSON object',
      actual: rawOutput.substring(0, 200)
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * Validate a rubric pack result
 *
 * @param result - The rubric pack result to validate
 * @returns Validation result with errors
 */
export function validateRubricPack(result: RubricPackResult): RubricValidationResult {
  const errors: RubricValidationError[] = [];
  const warnings: string[] = [];

  // 1. Check for missing required criteria
  const requiredCriteria = getRequiredCriteria(result.packId);
  const providedCriteria = new Set(result.criteria.map(c => c.criterion));

  for (const required of requiredCriteria) {
    if (!providedCriteria.has(required)) {
      errors.push({
        type: 'missing_criteria',
        criterion: required,
        message: `Required criterion '${required}' is missing from evaluation`,
        expected: requiredCriteria,
        actual: Array.from(providedCriteria)
      });
    }
  }

  // 2. Validate each criterion score
  for (const criterion of result.criteria) {
    // 2a. Check score range (1-10)
    if (criterion.score < 1 || criterion.score > 10) {
      errors.push({
        type: 'score_out_of_range',
        criterion: criterion.criterion,
        message: `Score must be between 1 and 10, got ${criterion.score}`,
        expected: [1, 10],
        actual: criterion.score
      });
    }

    // 2b. Check confidence range (0.0-1.0)
    if (criterion.confidence < 0 || criterion.confidence > 1) {
      errors.push({
        type: 'confidence_out_of_range',
        criterion: criterion.criterion,
        message: `Confidence must be between 0.0 and 1.0, got ${criterion.confidence}`,
        expected: [0, 1],
        actual: criterion.confidence
      });
    }

    // 2c. Check for missing evidence
    if (!criterion.evidence || criterion.evidence.length === 0) {
      errors.push({
        type: 'missing_evidence',
        criterion: criterion.criterion,
        message: `Criterion '${criterion.criterion}' has no evidence anchors`,
        expected: 'At least 1 evidence anchor',
        actual: 0
      });
    }

    // 2d. Check evidence quality
    if (criterion.evidence) {
      for (let i = 0; i < criterion.evidence.length; i++) {
        const evidence = criterion.evidence[i];

        // Check quote length
        if (!evidence.quote || evidence.quote.length < MIN_EVIDENCE_QUOTE_LENGTH) {
          errors.push({
            type: 'missing_evidence',
            criterion: criterion.criterion,
            message: `Evidence quote #${i + 1} for '${criterion.criterion}' is too short (min ${MIN_EVIDENCE_QUOTE_LENGTH} chars)`,
            expected: `>= ${MIN_EVIDENCE_QUOTE_LENGTH} characters`,
            actual: evidence.quote?.length || 0
          });
        }

        // Check timestamp validity
        if (evidence.startSeconds !== undefined && evidence.endSeconds !== undefined) {
          if (evidence.startSeconds > evidence.endSeconds) {
            errors.push({
              type: 'missing_evidence',
              criterion: criterion.criterion,
              message: `Invalid timestamp range in evidence #${i + 1}: start (${evidence.startSeconds}) > end (${evidence.endSeconds})`,
              expected: 'startSeconds <= endSeconds',
              actual: { start: evidence.startSeconds, end: evidence.endSeconds }
            });
          }
        }
      }
    }

    // 2e. Check reasoning quality
    if (!criterion.reasoning || criterion.reasoning.length < MIN_REASONING_LENGTH) {
      errors.push({
        type: 'low_effort',
        criterion: criterion.criterion,
        message: `Reasoning for '${criterion.criterion}' is too short (min ${MIN_REASONING_LENGTH} chars)`,
        expected: `>= ${MIN_REASONING_LENGTH} characters`,
        actual: criterion.reasoning?.length || 0
      });
    }

    // 2f. Check for low-effort reasoning phrases
    if (criterion.reasoning) {
      const lowerReasoning = criterion.reasoning.toLowerCase();
      const foundPhrases = LOW_EFFORT_PHRASES.filter(phrase => lowerReasoning.includes(phrase));

      if (foundPhrases.length > 0) {
        warnings.push(
          `Criterion '${criterion.criterion}' uses generic phrases: ${foundPhrases.join(', ')}`
        );
      }
    }
  }

  // 3. Check overall confidence range
  if (result.overallConfidence < 0 || result.overallConfidence > 1) {
    errors.push({
      type: 'confidence_out_of_range',
      message: `Overall confidence must be between 0.0 and 1.0, got ${result.overallConfidence}`,
      expected: [0, 1],
      actual: result.overallConfidence
    });
  }

  // 4. Check for suspiciously uniform scores (low-effort indicator)
  if (result.criteria.length > 0) {
    const scoreFrequency = new Map<number, number>();

    for (const criterion of result.criteria) {
      const count = scoreFrequency.get(criterion.score) || 0;
      scoreFrequency.set(criterion.score, count + 1);
    }

    // Find most common score
    let maxCount = 0;
    let mostCommonScore = 0;
    for (const [score, count] of scoreFrequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonScore = score;
      }
    }

    const uniformRatio = maxCount / result.criteria.length;

    if (uniformRatio > MAX_IDENTICAL_SCORE_RATIO) {
      errors.push({
        type: 'low_effort',
        message: `Suspiciously uniform scores: ${maxCount} out of ${result.criteria.length} criteria have score ${mostCommonScore} (${(uniformRatio * 100).toFixed(0)}%)`,
        expected: `< ${MAX_IDENTICAL_SCORE_RATIO * 100}% identical scores`,
        actual: `${(uniformRatio * 100).toFixed(0)}% have score ${mostCommonScore}`
      });
    }
  }

  // 5. Check summary quality
  if (!result.summary || result.summary.length < 100) {
    errors.push({
      type: 'low_effort',
      message: `Summary is too short (min 100 chars)`,
      expected: '>= 100 characters',
      actual: result.summary?.length || 0
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Helper: Format validation errors for display
 *
 * @param result - Validation result
 * @returns Human-readable error summary
 */
export function formatValidationErrors(result: RubricValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push('Validation passed');
  } else {
    lines.push('Rubric validation failed:');

    for (const error of result.errors) {
      const criterionInfo = error.criterion ? ` (criterion: ${error.criterion})` : '';
      lines.push(`  - [${error.type}]${criterionInfo} ${error.message}`);
    }
  }

  // Add warnings regardless of valid status
  if (result.warnings && result.warnings.length > 0) {
    lines.push('\nWarnings:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join('\n');
}
