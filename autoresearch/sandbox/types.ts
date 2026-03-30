/**
 * Autoresearch Sandbox — Shared Types
 *
 * Type definitions for exported data, parameter configs, and evaluation results.
 * No production imports. No runtime dependencies.
 */

// =============================================================================
// EXPORTED DATA TYPES
// =============================================================================

/** A single component result from run_component_results */
export interface ExportedComponentResult {
  run_id: string;
  component_id: string;
  success: boolean;
  prediction: number | null;
  confidence: number | null;
  features: Record<string, any> | null;
}

/** A single prediction run with its component results */
export interface ExportedRun {
  // From prediction_runs
  id: string;
  video_id: string;
  predicted_dps_7d: number;
  actual_dps: number;
  prediction_range_low: number | null;
  prediction_range_high: number | null;
  confidence: number;
  components_used: string[];
  labeling_mode: string | null;
  created_at: string;

  // Parsed from cohort_key (format: "niche:accountSize")
  cohort_key: string | null;
  niche: string | null;
  account_size: string | null;

  // Extracted from raw_result (may be null if truncated)
  adjustments_rawScore: number | null;
  adjustments_nicheFactor: number | null;
  adjustments_accountFactor: number | null;
  score_lane_vps: number | null;
  llm_spread: number | null;
  llm_influence_applied: boolean | null;

  // Transcription info (for calibrator replay)
  transcription_source: string | null;
  transcription_skipped: boolean | null;

  // Joined from run_component_results
  components: ExportedComponentResult[];
}

/** Top-level export snapshot */
export interface ExportSnapshot {
  exported_at: string;
  filter: string;
  run_count: number;
  runs: ExportedRun[];
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

/** Path weight configuration */
export interface PathWeights {
  quantitative: number;
  qualitative: number;
  pattern_based: number;
  historical: number;
}

/** Context-specific weight overrides, keyed by workflow type */
export interface ContextWeights {
  'content-planning': PathWeights;
  'template-selection': PathWeights;
  'quick-win': PathWeights;
  'immediate-analysis': PathWeights;
  'trending-library': PathWeights;
}

/** Account size tier with follower range and adjustment factor */
export interface AccountSizeTier {
  label: string;
  maxFollowers: number; // upper bound (Infinity for last tier)
  factor: number;
}

/** Calibrator constants */
export interface CalibratorConstants {
  confidencePenaltyNoSpeech: number;
  silentVideoVpsCap: number;
  silentVideoVpsCapVisualFirst: number;
  silentVideoPackvThreshold: number;
  highVpsThreshold: number;
  highVpsScalingFactor: number;
}

/** Complete sandbox configuration — all phase-1 optimizable parameters */
export interface SandboxConfig {
  version: string;
  description: string;
  created_at: string;

  pathBaseWeights: PathWeights;
  contextWeights: ContextWeights;
  nicheDifficultyFactors: Record<string, number>;
  nicheFallbackFactor: number;
  accountSizeTiers: AccountSizeTier[];
  componentReliability: Record<string, number>;
  calibrator: CalibratorConstants;

  /**
   * Per-component weight multipliers. Applied multiplicatively to each component's
   * confidence weight during path aggregation. Default 1.0 = no change.
   * This is the primary optimization lever: controls how much each component
   * contributes to the final score within its path.
   */
  componentWeightMultipliers?: Record<string, number>;

  /**
   * Extreme score boost factor. In production, scores < 30 or > 80 get 1.5x weight.
   * This lets us tune that multiplier.
   */
  extremeScoreBoost?: number;
}

// =============================================================================
// REPLAY TYPES
// =============================================================================

/** Result of replaying aggregation for a single run */
export interface ReplayResult {
  runId: string;
  replayedVps: number;
  replayedConfidence: number;
  actualVps: number;
  originalPredictedVps: number;
  nicheFactor: number;
  accountFactor: number;
  calibrationAdjustments: string[];
}

// =============================================================================
// EVALUATION TYPES
// =============================================================================

/** Spearman evaluation result */
export interface EvalResult {
  n: number;
  spearman_rho: number;
  p_value: number;
  mae: number;
  within_range_pct: number;
  /** Bootstrap 95% CI for rho */
  ci_lower: number;
  ci_upper: number;
  by_niche: Array<{
    niche: string;
    n: number;
    spearman_rho: number;
    mae: number;
  }>;
  computed_at: string;
}

/** A single optimization run record */
export interface OptimizationRecord {
  run_id: string;
  config: SandboxConfig;
  eval: EvalResult;
  started_at: string;
  completed_at: string;
  search_method: 'grid' | 'random' | 'bayesian';
  iteration: number;
}
