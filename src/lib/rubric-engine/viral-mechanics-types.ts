/**
 * Pack 3: Viral Mechanics Types
 *
 * Type definitions for the rule-based viral mechanics analysis.
 * Synthesizes signals from Pack 1, Pack 2, Pack V, and other components
 * to explain WHY a video should perform well.
 */

import { ViralMechanicsStub } from './pack-metadata';
import { PackMetadata } from './pack-metadata';

// ============================================================================
// Constants
// ============================================================================

/** Named viral mechanics detected by Pack 3 */
export const VIRAL_MECHANICS = {
  VISUAL_HOOK: 'Visual Hook',
  CURIOSITY_GAP: 'Curiosity Gap',
  STYLE_FIT: 'Style-Platform Fit',
  PACING_OPTIMAL: 'Optimal Pacing',
  AUDIO_SYNC: 'Audio-Visual Sync',
  TREND_ALIGNMENT: 'Trend Alignment',
  PATTERN_INTERRUPT: 'Pattern Interrupt',
  EMOTIONAL_TRIGGER: 'Emotional Trigger',
  TIMING_ADVANTAGE: 'Posting Time Advantage',
} as const;

// ============================================================================
// Input Types
// ============================================================================

/** Summary of a component result passed into Pack 3 */
export interface ComponentResultSummary {
  componentId: string;
  success: boolean;
  prediction?: number;
  confidence?: number;
  features?: any;
  insights?: string[];
}

/** Input to the Pack 3 viral mechanics runner */
export interface Pack3Input {
  pack1: any | null;
  pack2: any | null;
  packV: any | null;
  componentResults: ComponentResultSummary[];
  hasTranscript: boolean;
  transcriptLength: number;
  niche?: string;
  detectedStyle?: string;
}

// ============================================================================
// Output Types
// ============================================================================

/** A single detected viral mechanic */
export interface ViralMechanic {
  name: string;
  strength: number; // 0-100
  evidence: string[];
  signals_used: string[];
}

/** Full Pack 3 result */
export interface ViralMechanicsResult {
  pack: '3';
  mechanics: ViralMechanic[];
  summary: string;
  confidence: number; // 0-1
  limited_signal_mode: boolean;
  missing_signals?: string[];
  _meta: PackMetadata;
}

// ============================================================================
// Stub Factory (backward compat)
// ============================================================================

/**
 * Creates a stub result for Pack 3 (Viral Mechanics).
 * Used as fallback when the runner doesn't execute.
 */
export function createViralMechanicsStub(): ViralMechanicsStub {
  return {
    pack: '3',
    status: 'not_implemented',
    notes: 'Viral Mechanics (Pack 3) is planned for future release',
  };
}
