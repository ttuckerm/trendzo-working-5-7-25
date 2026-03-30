/**
 * Pack 1: Unified Grading Rubric Types
 * LLM-based content scoring with 9 attributes, 7 idea legos, hook analysis
 */

import { PackMetadata } from './pack-metadata';

// ============================================================================
// Input Types
// ============================================================================

export interface UnifiedGradingInput {
  transcript: string;
  niche?: string;
  goal?: string;
  videoMetadata?: {
    duration_seconds?: number;
    has_audio?: boolean;
    resolution?: string;
  };
}

// ============================================================================
// Output Types
// ============================================================================

export interface IdeaLegos {
  lego_1: boolean; // Clear topic identified
  lego_2: boolean; // Relevant to target audience
  lego_3: boolean; // Unique angle presented
  lego_4: boolean; // Intriguing hook present
  lego_5: boolean; // Story structure exists
  lego_6: boolean; // Visual format matches content
  lego_7: boolean; // Call-to-action present
  notes: string;
}

export interface AttributeScore {
  attribute: string;
  score: number; // 1-10
  evidence: string;
}

export interface HookAnalysis {
  type: 'question' | 'statistic' | 'story' | 'claim' | 'visual' | 'contrast' | 'mystery' | 'direct' | 'weak';
  clarity_score: number; // 1-10
  pattern: string;
  evidence: string;
  rewrite_options: string[];
}

export interface DimensionScore {
  score: number; // 1-10
  evidence: string;
}

export interface UnifiedGradingResult {
  rubric_version: string;
  niche: string;
  goal: string;
  style_classification: {
    label: string;
    confidence: number; // 0-1
  };
  idea_legos: IdeaLegos;
  attribute_scores: AttributeScore[];
  hook: HookAnalysis;
  pacing: DimensionScore;
  clarity: DimensionScore;
  novelty: DimensionScore;
  compliance_flags: string[];
  warnings: string[];
  grader_confidence: number; // 0-1
  /** Runtime metadata (added by runner, may be undefined if from legacy code) */
  _meta?: PackMetadata;
}

// ============================================================================
// Execution Result (includes metadata)
// ============================================================================

export interface UnifiedGradingExecutionResult {
  success: boolean;
  result?: UnifiedGradingResult;
  error?: string;
  validationErrors?: string[];
  latencyMs: number;
  model: string;
  retryCount: number;
  /** Runtime metadata for distinguishing real vs mock execution */
  _meta: PackMetadata;
}

// ============================================================================
// Attribute Names (canonical list)
// ============================================================================

export const ATTRIBUTE_NAMES = [
  'tam_resonance',      // Target audience match
  'shareability',       // Likelihood to share
  'value_density',      // Value per second
  'emotional_journey',  // Emotional arc
  'hook_strength',      // Opening power
  'format_innovation',  // Creative format use
  'pacing_rhythm',      // Flow and timing
  'curiosity_gaps',     // Open loops
  'clear_payoff',       // Satisfying conclusion
] as const;

export type AttributeName = typeof ATTRIBUTE_NAMES[number];
