/**
 * Pack 2: Editing Coach Types
 * Generates actionable improvement suggestions from Pack 1 output
 */

import { UnifiedGradingResult } from './unified-grading-types';
import { PackMetadata } from './pack-metadata';
import type { CreatorContext } from '@/lib/prediction/creator-context';

// ============================================================================
// Input Types
// ============================================================================

export interface EditingCoachInput {
  rubric: UnifiedGradingResult;
  predicted_score: number; // Current VPS prediction
  confidence: number;
  top_drivers?: string[]; // Feature names that drove the prediction
  /** Optional creator context for personalized suggestions */
  creator_context?: CreatorContext;
}

// ============================================================================
// Output Types
// ============================================================================

export interface EditChange {
  priority: number; // 1, 2, or 3
  what_to_change: string; // Specific element to change
  how_to_change: string; // Detailed instructions
  example: string; // Concrete example
  targets: string[]; // Rubric field paths
  estimated_lift: number; // Expected VPS improvement
  confidence: number; // 0-1
}

export interface EditingCoachResult {
  pack: '2';
  predicted_before: number;
  predicted_after_estimate: number;
  changes: EditChange[]; // Max 3
  notes: string;
  /** Runtime metadata (added by runner, may be undefined if from legacy code) */
  _meta?: PackMetadata;
}

// ============================================================================
// Execution Result
// ============================================================================

export interface EditingCoachExecutionResult {
  success: boolean;
  result?: EditingCoachResult;
  error?: string;
  latencyMs: number;
  /** Runtime metadata for distinguishing real vs mock execution */
  _meta: PackMetadata;
}

// ============================================================================
// Rubric Weights (from XGBoost feature importance)
// ============================================================================

export const RUBRIC_WEIGHTS: Record<string, number> = {
  hook_strength: 0.18,
  curiosity_gaps: 0.14,
  shareability: 0.12,
  tam_resonance: 0.11,
  value_density: 0.10,
  pacing_rhythm: 0.09,
  emotional_journey: 0.08,
  clear_payoff: 0.08,
  format_innovation: 0.05,
  novelty: 0.03,
  clarity: 0.02,
  hook: 0.15, // Hook analysis overall
  pacing: 0.06,
};

// Conservative calibration factor (tune based on historical data)
export const CONSERVATIVE_FACTOR = 0.5;
