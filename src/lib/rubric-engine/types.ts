/**
 * Rubric Engine Types
 *
 * Defines the schema for LLM-based rubric evaluation system.
 * Each pack evaluates multiple criteria with evidence-based scoring.
 */

/**
 * Evidence anchor linking a score to specific content
 */
export interface EvidenceAnchor {
  /** Direct quote from the source material (minimum 10 characters) */
  quote: string;
  /** Type of evidence source */
  type: 'transcript' | 'visual' | 'audio' | 'metadata';
  /** Optional start timestamp in seconds */
  startSeconds?: number;
  /** Optional end timestamp in seconds */
  endSeconds?: number;
}

/**
 * Score for a single criterion with evidence and reasoning
 */
export interface CriterionScore {
  /** Criterion identifier (e.g., "tam_resonance") */
  criterion: string;
  /** Score from 1-10 */
  score: number;
  /** Evidence anchors supporting this score (at least 1 required) */
  evidence: EvidenceAnchor[];
  /** Reasoning for the score (minimum 50 characters, 2-3 sentences) */
  reasoning: string;
  /** Confidence in this score (0.0-1.0) */
  confidence: number;
  /** Optional improvement suggestions */
  suggestions?: string[];
}

/**
 * Complete rubric pack evaluation result
 */
export interface RubricPackResult {
  /** Pack identifier */
  packId: string;
  /** Pack version */
  packVersion: string;
  /** Scores for all required criteria */
  criteria: CriterionScore[];
  /** Overall summary (minimum 100 characters) */
  summary: string;
  /** Overall confidence across all criteria (0.0-1.0) */
  overallConfidence: number;
  /** List of key strengths */
  strengths?: string[];
  /** List of key weaknesses */
  weaknesses?: string[];
  /** Evaluation metadata */
  metadata?: {
    model?: string;
    evaluatedAt?: string;
    latencyMs?: number;
  };
}

/**
 * Input data for rubric pack evaluation
 */
export interface RubricPackInput {
  /** Video ID */
  videoId: string;
  /** Video transcript */
  transcript: string;
  /** Optional video metadata */
  metadata?: {
    duration?: number;
    title?: string;
    description?: string;
    platform?: string;
    [key: string]: any;
  };
  /** Optional visual analysis data */
  visualData?: any;
  /** Optional audio analysis data */
  audioData?: any;
}

/**
 * Configuration for a rubric pack
 */
export interface RubricPackConfig {
  /** Unique pack identifier */
  packId: string;
  /** Pack version */
  version: string;
  /** Display name */
  name: string;
  /** Pack description */
  description: string;
  /** LLM model to use */
  model: string;
  /** Required criteria for this pack */
  requiredCriteria: string[];
  /** System prompt template */
  systemPrompt: string;
  /** User prompt template (can use {{transcript}}, {{metadata}}, etc.) */
  userPrompt: string;
  /** Expected output schema */
  responseSchema: any;
}

/**
 * Validation result for a rubric pack
 */
export interface RubricValidationResult {
  /** Whether the result is valid */
  valid: boolean;
  /** List of validation errors (hard fails) */
  errors: RubricValidationError[];
  /** List of validation warnings (soft fails, non-blocking) */
  warnings?: string[];
}

/**
 * Validation error or warning
 */
export interface RubricValidationError {
  /** Error type */
  type: 'missing_criteria' | 'score_out_of_range' | 'confidence_out_of_range' |
        'missing_evidence' | 'invalid_json' | 'low_effort';
  /** Error message */
  message: string;
  /** Affected criterion (if applicable) */
  criterion?: string;
  /** Expected value (if applicable) */
  expected?: unknown;
  /** Actual value (if applicable) */
  actual?: unknown;
}

// ============================================================================
// Pack A: Content Quality
// ============================================================================

/**
 * Pack A evaluates content quality across 11 criteria
 */
export const PACK_A_CRITERIA = [
  'tam_resonance',
  'shareability',
  'value_density',
  'emotional_journey',
  'clear_payoff',
  'topic_clarity',
  'topic_relevance',
  'angle_uniqueness',
  'angle_intrigue',
  'style_identification',
  'style_execution'
] as const;

/**
 * Pack B evaluates packaging and format (future)
 */
export const PACK_B_CRITERIA = [
  'hook_strength',
  'pacing_optimization',
  'retention_curve',
  'cta_placement',
  'thumbnail_alignment',
  'title_alignment',
  'duration_optimization',
  'segment_flow'
] as const;

/**
 * Pack C evaluates viral mechanics (future)
 */
export const PACK_C_CRITERIA = [
  'pattern_match',
  'trend_alignment',
  'novelty_score',
  'controversy_potential',
  'memetic_potential',
  'algorithm_signals',
  'engagement_triggers',
  'distribution_fit'
] as const;

/**
 * JSON schema for rubric pack response
 */
export const RUBRIC_PACK_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['packId', 'packVersion', 'criteria', 'summary', 'overallConfidence'],
  properties: {
    packId: { type: 'string' },
    packVersion: { type: 'string' },
    criteria: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['criterion', 'score', 'evidence', 'reasoning', 'confidence'],
        properties: {
          criterion: { type: 'string' },
          score: { type: 'number', minimum: 1, maximum: 10 },
          evidence: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['quote', 'type'],
              properties: {
                quote: { type: 'string', minLength: 10 },
                type: { enum: ['transcript', 'visual', 'audio', 'metadata'] },
                startSeconds: { type: 'number', minimum: 0 },
                endSeconds: { type: 'number', minimum: 0 }
              }
            }
          },
          reasoning: { type: 'string', minLength: 50 },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          suggestions: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    summary: { type: 'string', minLength: 100 },
    overallConfidence: { type: 'number', minimum: 0, maximum: 1 },
    strengths: {
      type: 'array',
      items: { type: 'string' }
    },
    weaknesses: {
      type: 'array',
      items: { type: 'string' }
    },
    metadata: {
      type: 'object',
      properties: {
        model: { type: 'string' },
        evaluatedAt: { type: 'string' },
        latencyMs: { type: 'number' }
      }
    }
  }
};
