/**
 * DPS v2 — Canonical Ground-Truth Scoring Module
 *
 * Single source of truth for DPS v2 computation. This module implements
 * the fixed v2 specification exactly. No alternate modes, no legacy formulas.
 *
 * Formula overview:
 *   1. Multi-signal engagement composite (8 weighted signals, 3-tier adaptive)
 *   2. Log-space cohort normalization (median + MAD)
 *   3. Bayesian shrinkage for small cohorts
 *   4. Power-law time decay
 *   5. Bootstrap threshold classification (versioned)
 *   6. CDF transform: z-score -> 0-100 display score
 *
 * @module dps-v2
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const DPS_V2_FORMULA_VERSION = '2.1.0';

/** Master signal name list — single source of truth for all 8 signals. */
const ALL_SIGNAL_NAMES = [
  'completion_rate', 'share_rate', 'save_rate', 'velocity_score',
  'view_to_follower_ratio', 'comment_rate', 'reach_score', 'view_percentile_within_cohort',
] as const;
type SignalName = typeof ALL_SIGNAL_NAMES[number];
const ALL_SIGNALS: SignalName[] = [...ALL_SIGNAL_NAMES];

/** Legacy v2.0 weights — kept for reference only. */
const LEGACY_SIGNAL_WEIGHTS = {
  completion_rate: 0.30,
  share_rate: 0.25,
  save_rate: 0.15,
  velocity_score: 0.15,
  view_to_follower_ratio: 0.10,
  comment_rate: 0.05,
} as const;

// ── 3-Tier Adaptive Weight System ────────────────────────────────────────────

/** Tier 1 — Current Reality (velocity unavailable, up to 6 signals). */
const TIER_1_WEIGHTS: Record<SignalName, number> = {
  view_percentile_within_cohort: 0.25,
  share_rate: 0.25,
  reach_score: 0.17,
  save_rate: 0.15,
  view_to_follower_ratio: 0.12,
  comment_rate: 0.06,
  velocity_score: 0,
  completion_rate: 0,
} as const; // sum = 1.00

/** Tier 2 — Velocity Available (up to 7 signals). */
const TIER_2_WEIGHTS: Record<SignalName, number> = {
  share_rate: 0.20,
  view_percentile_within_cohort: 0.20,
  velocity_score: 0.18,
  reach_score: 0.14,
  save_rate: 0.12,
  view_to_follower_ratio: 0.10,
  comment_rate: 0.06,
  completion_rate: 0,
} as const; // sum = 1.00

/** Tier 3 — Full Signal (all 8 signals). */
const TIER_3_WEIGHTS: Record<SignalName, number> = {
  share_rate: 0.18,
  view_percentile_within_cohort: 0.18,
  velocity_score: 0.15,
  reach_score: 0.12,
  save_rate: 0.11,
  completion_rate: 0.10,
  view_to_follower_ratio: 0.10,
  comment_rate: 0.06,
} as const; // sum = 1.00

type WeightTier = 1 | 2 | 3;

/**
 * Select the weight tier based on signal availability.
 * Tier 3 if both velocity + completion present, Tier 2 if velocity only, Tier 1 otherwise.
 */
export function selectWeightTier(signals: DpsV2SignalInputs): { tier: WeightTier; baseWeights: Record<SignalName, number> } {
  if (signals.velocity_score !== null && signals.completion_rate !== null) {
    return { tier: 3, baseWeights: { ...TIER_3_WEIGHTS } };
  }
  if (signals.velocity_score !== null) {
    return { tier: 2, baseWeights: { ...TIER_2_WEIGHTS } };
  }
  return { tier: 1, baseWeights: { ...TIER_1_WEIGHTS } };
}

/** MAD scaling constant for normal-consistent estimator of spread. */
const MAD_SCALE = 1.4826;

/** Minimum cohort_spread to avoid division by zero (floor). */
const MIN_SPREAD = 0.01;

/** Default time-decay exponent. */
const DEFAULT_ALPHA = 0.15;

// ── Types ────────────────────────────────────────────────────────────────────

/** Raw platform metrics before any rate computation. */
export interface DpsV2RawMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  follower_count: number;
  avg_watch_time_seconds?: number | null;
  video_duration_seconds?: number | null;
  /** Interactions in first 3 hours (for velocity). */
  interactions_first_3h?: number | null;
  hours_since_post: number;
  posted_at?: string | null;
  collected_at?: string | null;
}

/** Derived signal values (rates/ratios), ready for composite scoring. */
export interface DpsV2SignalInputs {
  completion_rate: number | null;
  share_rate: number | null;
  save_rate: number | null;
  velocity_score: number | null;
  view_to_follower_ratio: number | null;
  comment_rate: number | null;
  // v2.1 additions
  reach_score: number | null;
  view_percentile_within_cohort: number | null;
}

/** Cohort definition for percentile computation. */
export interface DpsV2CohortContext {
  niche: string;
  follower_count: number;
  /** Log10 half-width for follower tier (default 0.3). */
  follower_log_half_width?: number;
}

/** Pre-computed cohort statistics (from dps_v2_cohort_stats table or computed on the fly). */
export interface DpsV2CohortStats {
  sample_size: number;
  /** Median of log(Engagement) values in the cohort. */
  median_log_engagement: number;
  /** MAD-based spread: 1.4826 * MAD(log(Engagement)). */
  spread: number;
}

/** Population-level stats for Bayesian shrinkage fallback. */
export interface DpsV2PopulationStats {
  sample_size: number;
  median_log_engagement: number;
  spread: number;
}

/** Canonical tier type for DPS v2.1.0 (7-tier system + incomplete). */
export type DpsV2Tier = 'mega-viral' | 'hyper-viral' | 'viral' | 'above-average' | 'average' | 'below-average' | 'poor' | 'incomplete';

/** Versioned tier thresholds. */
export interface DpsV2ThresholdSet {
  version: string;
  /** Minimum viral_score for each tier. Scores >= threshold qualify. */
  viral: number;         // top 5%
  hyper_viral: number;   // top 1%
  mega_viral: number;    // top 0.1%
  above_average: number; // top 30% (70th percentile)
  average: number;       // top 70% (30th percentile)
  below_average: number; // top 95% (5th percentile)
}

/** Full scoring breakdown with all metadata for traceability. */
export interface DpsV2Breakdown {
  formula_version: string;

  // Signal inputs
  signals: DpsV2SignalInputs;
  signal_availability: Record<SignalName, boolean>;
  original_weights: Record<SignalName, number>;
  effective_weights: Record<SignalName, number>;
  weight_was_redistributed: boolean;

  // Composite
  composite_engagement: number;

  // Cohort normalization
  log_engagement: number;
  cohort_median: number;
  cohort_spread: number;
  cohort_sample_size: number;
  shrinkage_weight: number;
  effective_median: number;
  effective_spread: number;

  // Scores
  viral_score: number;
  hours_since_post: number;
  decay_alpha: number;
  decay_factor: number;
  time_adjusted_score: number;

  // Classification
  classification: DpsV2Tier;
  threshold_version: string;

  // Confidence
  confidence: DpsV2Confidence;

  // v2.1 additions
  weight_tier: 1 | 2 | 3;
  view_percentile_within_cohort: number | null;
  reach_score: number | null;
  display_score: number;
}

export type DpsV2ConfidenceLevel = 'high' | 'medium' | 'low';

export interface DpsV2Confidence {
  level: DpsV2ConfidenceLevel;
  available_signal_count: number;
  total_signal_count: number;
  cohort_sample_size: number;
  shrinkage_applied: boolean;
  reasons: string[];
}

/** Input for writing a v2 label to prediction_runs. */
export interface DpsV2LabelWriteInput {
  run_id: string;
  raw_metrics: DpsV2RawMetrics;
  breakdown: DpsV2Breakdown | null;
  dps_score: number | null;
  tier: DpsV2Tier | string;
  label_trust: 'untrusted' | 'low' | 'medium' | 'high';
  training_weight: number;
  /** Provenance tag identifying the labeling path. */
  source_tag?: string;
  /** When true, score is incomplete due to missing required signals. */
  dps_v2_incomplete?: boolean;
  /** Human-readable reason the score is incomplete. */
  dps_v2_incomplete_reason?: string;
  /** Predicted DPS for error computation. */
  predicted_dps?: number | null;
  prediction_range_low?: number | null;
  prediction_range_high?: number | null;
}

/** Result of a label write operation. */
export interface DpsV2LabelWriteResult {
  success: boolean;
  run_id: string;
  error?: string;
}

// ── Signal Derivation ────────────────────────────────────────────────────────

/** Practical ceiling for reach_score log scaling (100M views). */
const REACH_CEILING = 100_000_000;

/**
 * Calculate absolute view magnitude on a 0-1 log scale.
 * Reference: 1K ~ 0.38, 100K ~ 0.63, 1M ~ 0.75, 10M ~ 0.88, 100M ~ 1.0
 */
export function calculateReachScore(viewCount: number): number {
  if (viewCount <= 0) return 0;
  const score = Math.log10(viewCount + 1) / Math.log10(REACH_CEILING);
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Compute midpoint percentile rank of a value within a distribution.
 * Returns 0.5 (median assumption) when distribution is empty.
 */
export function computePercentileRank(value: number, distribution: number[]): number {
  if (distribution.length === 0) return 0.5;
  const below = distribution.filter(v => v < value).length;
  const equal = distribution.filter(v => v === value).length;
  return (below + equal / 2) / distribution.length;
}

/**
 * Derive rate-based signals from raw metrics.
 * Returns null for signals that cannot be computed from available data.
 * Note: view_percentile_within_cohort is always null here — computed in computeDpsV2().
 */
export function deriveDpsV2Signals(raw: DpsV2RawMetrics): DpsV2SignalInputs {
  const views = raw.views;
  const hasViews = views > 0;
  const hasFollowers = raw.follower_count > 0;

  // Completion rate: avg_watch_time / video_duration
  let completion_rate: number | null = null;
  if (
    raw.avg_watch_time_seconds != null &&
    raw.video_duration_seconds != null &&
    raw.video_duration_seconds > 0
  ) {
    completion_rate = Math.min(raw.avg_watch_time_seconds / raw.video_duration_seconds, 1.0);
  }

  // Share rate: shares / views
  const share_rate = hasViews ? raw.shares / views : null;

  // Save rate: saves / views
  const save_rate = hasViews ? raw.saves / views : null;

  // Velocity score: interactions in first 3h / 3 (normalized per hour)
  let velocity_score: number | null = null;
  if (raw.interactions_first_3h != null && raw.interactions_first_3h >= 0) {
    velocity_score = raw.interactions_first_3h / 3;
  }

  // View-to-follower ratio
  const view_to_follower_ratio = hasFollowers ? views / raw.follower_count : null;

  // Comment rate: comments / views
  const comment_rate = hasViews ? raw.comments / views : null;

  // reach_score: log-scaled absolute view magnitude (0-1)
  const reach_score = hasViews ? calculateReachScore(views) : null;

  // view_percentile_within_cohort: computed later in computeDpsV2 (needs cohort context)
  const view_percentile_within_cohort: number | null = null;

  return {
    completion_rate,
    share_rate,
    save_rate,
    velocity_score,
    view_to_follower_ratio,
    comment_rate,
    reach_score,
    view_percentile_within_cohort,
  };
}

// ── Weight Redistribution ────────────────────────────────────────────────────

interface WeightResult {
  effective_weights: Record<SignalName, number>;
  availability: Record<SignalName, boolean>;
  redistributed: boolean;
}

/**
 * Compute effective weights given signal availability.
 * Missing signals have their weight redistributed proportionally across available signals.
 * Signals with base weight of 0 never receive redistributed weight.
 */
export function computeEffectiveWeights(
  signals: DpsV2SignalInputs,
  baseWeights?: Record<SignalName, number>,
): WeightResult {
  const weights = baseWeights ?? TIER_1_WEIGHTS;
  const availability = {} as Record<SignalName, boolean>;
  let available_total = 0;

  for (const s of ALL_SIGNALS) {
    const available = signals[s] != null;
    availability[s] = available;
    if (available && weights[s] > 0) {
      available_total += weights[s];
    }
  }

  const effective_weights = {} as Record<SignalName, number>;
  let redistributed = false;

  if (available_total <= 0) {
    for (const s of ALL_SIGNALS) {
      effective_weights[s] = 0;
    }
    return { effective_weights, availability, redistributed: true };
  }

  const scale = 1.0 / available_total;

  for (const s of ALL_SIGNALS) {
    if (weights[s] === 0) {
      // Zero-weight signals stay at 0, don't count as redistributed
      effective_weights[s] = 0;
    } else if (availability[s]) {
      effective_weights[s] = weights[s] * scale;
    } else {
      effective_weights[s] = 0;
      redistributed = true;
    }
  }

  return { effective_weights, availability, redistributed };
}

// ── Composite Engagement ─────────────────────────────────────────────────────

/**
 * Compute the weighted composite engagement score.
 */
export function computeCompositeEngagement(
  signals: DpsV2SignalInputs,
  weights: Record<SignalName, number>,
): number {
  let composite = 0;
  for (const s of ALL_SIGNALS) {
    const val = signals[s];
    if (val != null && weights[s] > 0) {
      composite += weights[s] * val;
    }
  }
  return composite;
}

// ── Cohort Statistics (log-space) ────────────────────────────────────────────

/**
 * Compute cohort stats from an array of engagement values.
 * Uses log-space median + MAD for robust normalization.
 */
export function computeCohortStatsFromValues(engagementValues: number[]): DpsV2CohortStats {
  if (engagementValues.length === 0) {
    return { sample_size: 0, median_log_engagement: 0, spread: MIN_SPREAD };
  }

  // Convert to log space, filtering out non-positive values
  const logValues = engagementValues
    .filter((v) => v > 0)
    .map((v) => Math.log(v));

  if (logValues.length === 0) {
    return { sample_size: engagementValues.length, median_log_engagement: 0, spread: MIN_SPREAD };
  }

  const median = computeMedian(logValues);
  const mad = computeMAD(logValues, median);
  const spread = Math.max(MAD_SCALE * mad, MIN_SPREAD);

  return {
    sample_size: logValues.length,
    median_log_engagement: median,
    spread,
  };
}

/** Compute the median of a sorted-copy of the input array. */
export function computeMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/** Compute the Median Absolute Deviation. */
export function computeMAD(values: number[], median: number): number {
  if (values.length === 0) return 0;
  const deviations = values.map((v) => Math.abs(v - median));
  return computeMedian(deviations);
}

// ── Bayesian Shrinkage ───────────────────────────────────────────────────────

/** Minimum cohort size below which shrinkage kicks in. */
const SHRINKAGE_MIN_N = 30;

/**
 * Compute the shrinkage weight for a cohort toward population stats.
 * Returns 1.0 when cohort is large enough, approaches 0 for tiny cohorts.
 *
 * Uses: w = n / (n + SHRINKAGE_MIN_N)
 */
export function computeShrinkageWeight(cohortSampleSize: number): number {
  if (cohortSampleSize <= 0) return 0;
  return cohortSampleSize / (cohortSampleSize + SHRINKAGE_MIN_N);
}

/**
 * Apply Bayesian shrinkage: blend cohort stats toward population stats.
 */
export function applyShrinkage(
  cohort: DpsV2CohortStats,
  population: DpsV2PopulationStats,
): { median: number; spread: number; shrinkageWeight: number } {
  const w = computeShrinkageWeight(cohort.sample_size);
  const median = w * cohort.median_log_engagement + (1 - w) * population.median_log_engagement;
  const spread = w * cohort.spread + (1 - w) * population.spread;
  return { median, spread: Math.max(spread, MIN_SPREAD), shrinkageWeight: w };
}

// ── Viral Score (log-space normalization) ────────────────────────────────────

/**
 * Compute the viral score: (log(Engagement) - cohort_median) / cohort_spread
 */
export function computeViralScore(
  compositeEngagement: number,
  effectiveMedian: number,
  effectiveSpread: number,
): number {
  if (compositeEngagement <= 0) return -Infinity;
  const logEng = Math.log(compositeEngagement);
  return (logEng - effectiveMedian) / Math.max(effectiveSpread, MIN_SPREAD);
}

// ── Power-Law Time Decay ─────────────────────────────────────────────────────

/**
 * Apply power-law time decay:
 *   Time_Adjusted_Score = Viral_Score * (hours_since_post + 1)^(-alpha)
 */
export function applyTimeDecay(
  viralScore: number,
  hoursSincePost: number,
  alpha: number = DEFAULT_ALPHA,
): { timeAdjustedScore: number; decayFactor: number } {
  const decayFactor = Math.pow(Math.max(hoursSincePost, 0) + 1, -alpha);
  return {
    timeAdjustedScore: viralScore * decayFactor,
    decayFactor,
  };
}

// ── Classification ───────────────────────────────────────────────────────────

/** Default bootstrap thresholds (will be replaced by DB-stored versioned thresholds). */
export const DEFAULT_THRESHOLDS: DpsV2ThresholdSet = {
  version: '2.1.0-7tier',
  viral: 1.645,          // ~top 5% of standard normal
  hyper_viral: 2.326,    // ~top 1%
  mega_viral: 3.090,     // ~top 0.1%
  above_average: 0.524,  // ~70th percentile
  average: -0.524,       // ~30th percentile
  below_average: -1.645, // ~5th percentile
};

/**
 * Classify a time-adjusted score into a tier using versioned thresholds.
 */
export function classifyDpsV2(
  timeAdjustedScore: number,
  thresholds: DpsV2ThresholdSet = DEFAULT_THRESHOLDS,
): { classification: DpsV2Tier; threshold_version: string } {
  let classification: DpsV2Tier;
  if (timeAdjustedScore >= thresholds.mega_viral) {
    classification = 'mega-viral';
  } else if (timeAdjustedScore >= thresholds.hyper_viral) {
    classification = 'hyper-viral';
  } else if (timeAdjustedScore >= thresholds.viral) {
    classification = 'viral';
  } else if (timeAdjustedScore >= thresholds.above_average) {
    classification = 'above-average';
  } else if (timeAdjustedScore >= thresholds.average) {
    classification = 'average';
  } else if (timeAdjustedScore >= thresholds.below_average) {
    classification = 'below-average';
  } else {
    classification = 'poor';
  }

  return { classification, threshold_version: thresholds.version };
}

/**
 * Classify a legacy 0-100 DPS score into a display tier.
 * Used for backward-compat display of pre-v2 labels in admin UIs.
 * NOT for writing new labels — use classifyDpsV2 for v2 scores.
 */
export function classifyLegacyDpsTier(dps: number): string {
  if (dps >= 90) return 'mega-viral';
  if (dps >= 70) return 'viral';
  if (dps >= 60) return 'good';
  if (dps >= 40) return 'average';
  return 'low';
}

// ── Z-Score to Display Score ─────────────────────────────────────────────────

/**
 * Convert a z-score to a 0-100 display score using the normal CDF.
 *
 * Maps the time-adjusted z-score to a human-readable scale where:
 *   50 = cohort average
 *   95 = viral threshold (z ~ 1.645)
 *   99 = hyper-viral threshold (z ~ 2.326)
 *   99.9 = mega-viral threshold (z ~ 3.090)
 *
 * Uses the Abramowitz & Stegun rational approximation for the
 * standard normal CDF (accurate to ~1.5e-7).
 */
export function zScoreToDisplayDps(zScore: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = zScore < 0 ? -1 : 1;
  const x = Math.abs(zScore) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;
  const erf = 1 - (a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5) * Math.exp(-x * x);
  const cdf = 0.5 * (1 + sign * erf);

  // Scale to 0-100 with one decimal place, clamp
  return Math.min(Math.max(Math.round(cdf * 1000) / 10, 0), 100);
}

// ── Confidence Assessment ────────────────────────────────────────────────────

function assessConfidence(
  availability: Record<SignalName, boolean>,
  cohortSampleSize: number,
  shrinkageWeight: number,
): DpsV2Confidence {
  const available_signal_count = ALL_SIGNALS.filter((s) => availability[s]).length;
  const total_signal_count = ALL_SIGNALS.length;
  const shrinkage_applied = shrinkageWeight < 1.0;
  const reasons: string[] = [];

  let level: DpsV2ConfidenceLevel = 'high';

  // Signal availability (now out of 8 total)
  if (available_signal_count < total_signal_count) {
    const missing = ALL_SIGNALS.filter((s) => !availability[s]);
    reasons.push(`Missing signals: ${missing.join(', ')}`);
    if (available_signal_count <= 4) {
      level = 'low';
      reasons.push('Fewer than half of signals available');
    } else if (level === 'high') {
      level = 'medium';
    }
  }

  // Cohort size
  if (cohortSampleSize < 10) {
    level = 'low';
    reasons.push(`Cohort sample size very small (${cohortSampleSize})`);
  } else if (cohortSampleSize < SHRINKAGE_MIN_N) {
    if (level === 'high') level = 'medium';
    reasons.push(`Cohort sample size below ideal (${cohortSampleSize} < ${SHRINKAGE_MIN_N})`);
  }

  if (shrinkage_applied) {
    reasons.push(`Bayesian shrinkage applied (weight=${shrinkageWeight.toFixed(3)})`);
  }

  if (reasons.length === 0) {
    reasons.push('All signals available, cohort size adequate');
  }

  return {
    level,
    available_signal_count,
    total_signal_count,
    cohort_sample_size: cohortSampleSize,
    shrinkage_applied,
    reasons,
  };
}

// ── Follower Tier Computation ────────────────────────────────────────────────

/**
 * Compute logarithmic follower tier bounds using +-0.3 in log10 space.
 * Returns [min, max] follower count for the cohort.
 */
export function computeFollowerTierBounds(
  followerCount: number,
  halfWidth: number = 0.3,
): { min: number; max: number } {
  if (followerCount <= 0) {
    return { min: 0, max: 10 };
  }
  const logF = Math.log10(followerCount);
  return {
    min: Math.pow(10, logF - halfWidth),
    max: Math.pow(10, logF + halfWidth),
  };
}

// ── Main Computation ─────────────────────────────────────────────────────────

export interface ComputeDpsV2Input {
  raw: DpsV2RawMetrics;
  cohortStats: DpsV2CohortStats;
  populationStats: DpsV2PopulationStats;
  thresholds?: DpsV2ThresholdSet;
  alpha?: number;
  /** View counts of videos in this creator's cohort (niche + follower tier). Used to compute view_percentile_within_cohort. */
  cohort_view_counts?: number[] | null;
}

export interface ComputeDpsV2Result {
  score: number | null;           // raw time-adjusted z-score (keep for training/analytics)
  display_score: number | null;   // 0-100 human-readable DPS (for UI display)
  tier: DpsV2Tier;
  breakdown: DpsV2Breakdown | null;
  /** True when a required signal (follower count) is missing, making the score unreliable. */
  dps_v2_incomplete?: boolean;
  /** Human-readable reason the score is incomplete. */
  dps_v2_incomplete_reason?: string;
}

/**
 * Compute the full DPS v2 score with breakdown.
 *
 * Steps:
 *   1. Derive signals from raw metrics (includes reach_score)
 *   2. Compute view_percentile_within_cohort if cohort view data provided
 *   3. Select weight tier based on signal availability
 *   4. Redistribute weights for missing signals
 *   5. Compute composite engagement
 *   6. Apply cohort normalization in log space (with shrinkage)
 *   7. Apply power-law time decay
 *   8. Classify using versioned thresholds
 *   9. Compute display score (z-score -> 0-100)
 */
export function computeDpsV2(input: ComputeDpsV2Input): ComputeDpsV2Result {
  const {
    raw,
    cohortStats,
    populationStats,
    thresholds = DEFAULT_THRESHOLDS,
    alpha = DEFAULT_ALPHA,
    cohort_view_counts,
  } = input;

  // Follower count validation gate — view_to_follower_ratio is a top-weighted signal
  const followerCount = raw.follower_count;
  if (!followerCount || followerCount <= 0) {
    return {
      score: null,
      display_score: null,
      tier: 'incomplete',
      breakdown: null,
      dps_v2_incomplete: true,
      dps_v2_incomplete_reason: 'Missing actual_follower_count — view_to_follower_ratio cannot be computed',
    };
  }

  // 1. Derive signals (reach_score computed here, view_percentile_within_cohort is null)
  const signals = deriveDpsV2Signals(raw);

  // 2. Compute view_percentile_within_cohort if cohort view data provided
  if (cohort_view_counts && cohort_view_counts.length > 0 && raw.views > 0) {
    signals.view_percentile_within_cohort = computePercentileRank(raw.views, cohort_view_counts);
  }

  // 3. Select weight tier
  const { tier: weightTier, baseWeights } = selectWeightTier(signals);

  // 4. Weight redistribution
  const { effective_weights, availability, redistributed } = computeEffectiveWeights(signals, baseWeights);

  // 5. Composite engagement
  const composite = computeCompositeEngagement(signals, effective_weights);

  // 6. Log-space normalization with shrinkage
  const logEngagement = composite > 0 ? Math.log(composite) : 0;
  const { median: effectiveMedian, spread: effectiveSpread, shrinkageWeight } =
    applyShrinkage(cohortStats, populationStats);

  const viralScore = composite > 0
    ? (logEngagement - effectiveMedian) / Math.max(effectiveSpread, MIN_SPREAD)
    : 0;

  // 7. Time decay
  const { timeAdjustedScore, decayFactor } = applyTimeDecay(viralScore, raw.hours_since_post, alpha);

  // 8. Classification
  const { classification, threshold_version } = classifyDpsV2(timeAdjustedScore, thresholds);

  // 9. Confidence
  const confidence = assessConfidence(availability, cohortStats.sample_size, shrinkageWeight);

  // 10. Display score (z-score -> 0-100)
  const displayScore = zScoreToDisplayDps(timeAdjustedScore);

  const originalWeights = { ...baseWeights } as Record<SignalName, number>;

  const breakdown: DpsV2Breakdown = {
    formula_version: DPS_V2_FORMULA_VERSION,
    signals,
    signal_availability: availability,
    original_weights: originalWeights,
    effective_weights,
    weight_was_redistributed: redistributed,
    composite_engagement: composite,
    log_engagement: logEngagement,
    cohort_median: cohortStats.median_log_engagement,
    cohort_spread: cohortStats.spread,
    cohort_sample_size: cohortStats.sample_size,
    shrinkage_weight: shrinkageWeight,
    effective_median: effectiveMedian,
    effective_spread: effectiveSpread,
    viral_score: viralScore,
    hours_since_post: raw.hours_since_post,
    decay_alpha: alpha,
    decay_factor: decayFactor,
    time_adjusted_score: timeAdjustedScore,
    classification,
    threshold_version,
    confidence,
    // v2.1 additions
    weight_tier: weightTier,
    view_percentile_within_cohort: signals.view_percentile_within_cohort,
    reach_score: signals.reach_score,
    display_score: displayScore,
  };

  return {
    score: timeAdjustedScore,
    display_score: displayScore,
    tier: classification,
    breakdown,
  };
}

// ── Label Write Helper ───────────────────────────────────────────────────────

/**
 * Build the update payload for writing a DPS v2 label to prediction_runs.
 * Returns the column-value map. Caller is responsible for executing the DB write.
 *
 * This is the canonical write surface — route handlers and scripts call this
 * to get a consistent payload shape.
 */
export function buildDpsV2LabelPayload(input: DpsV2LabelWriteInput): Record<string, unknown> {
  const {
    raw_metrics, breakdown, dps_score, tier, label_trust, training_weight,
    source_tag, predicted_dps, prediction_range_low, prediction_range_high,
    dps_v2_incomplete, dps_v2_incomplete_reason,
  } = input;

  // If incomplete, write a minimal row preserving raw metrics but no score
  if (dps_v2_incomplete) {
    return {
      dps_formula_version: DPS_V2_FORMULA_VERSION,
      dps_label_trust: label_trust,
      dps_training_weight: 0,
      actual_dps: null,
      actual_tier: 'incomplete',
      dps_v2_display_score: null,
      dps_v2_incomplete: true,
      dps_v2_incomplete_reason: dps_v2_incomplete_reason ?? 'Unknown',
      // Still write raw engagement counts for future re-scoring
      actual_views: raw_metrics.views,
      actual_likes: raw_metrics.likes,
      actual_comments: raw_metrics.comments,
      actual_shares: raw_metrics.shares,
      actual_saves: raw_metrics.saves,
      actual_follower_count: raw_metrics.follower_count > 0 ? raw_metrics.follower_count : null,
      actual_hours_since_post: raw_metrics.hours_since_post,
      actuals_entered_at: new Date().toISOString(),
      ...(source_tag ? { labeling_mode: source_tag } : {}),
    };
  }

  // Prediction error computation
  let prediction_error: number | null = null;
  let prediction_error_pct: number | null = null;
  let within_range: boolean | null = null;

  if (predicted_dps != null && dps_score != null) {
    prediction_error = Math.round((dps_score - predicted_dps) * 100) / 100;
    prediction_error_pct = predicted_dps > 0
      ? Math.round((prediction_error / predicted_dps) * 10000) / 100
      : 0;
  }
  if (prediction_range_low != null && prediction_range_high != null && dps_score != null) {
    within_range = dps_score >= prediction_range_low && dps_score <= prediction_range_high;
  }

  return {
    // Provenance
    dps_formula_version: DPS_V2_FORMULA_VERSION,
    dps_label_trust: label_trust,
    dps_training_weight: training_weight,

    // Score
    actual_dps: dps_score,
    actual_tier: tier,

    // Raw engagement counts
    actual_views: raw_metrics.views,
    actual_likes: raw_metrics.likes,
    actual_comments: raw_metrics.comments,
    actual_shares: raw_metrics.shares,
    actual_saves: raw_metrics.saves,

    // Prediction error context
    prediction_error,
    prediction_error_pct,
    within_range,
    actuals_entered_at: new Date().toISOString(),

    // Labeling mode / source
    ...(source_tag ? { labeling_mode: source_tag } : {}),

    // Completeness tracking
    dps_v2_incomplete: false,
    dps_v2_incomplete_reason: null,

    // Signal quality
    dps_signal_confidence: breakdown!.confidence.level === 'high' ? 1.0
      : breakdown!.confidence.level === 'medium' ? 0.6 : 0.3,
    dps_signal_availability: breakdown!.signal_availability,
    dps_weight_redistribution: breakdown!.weight_was_redistributed
      ? breakdown!.effective_weights : null,

    // Full breakdown
    dps_v2_breakdown: breakdown,

    // Granular rate metrics
    actual_completion_rate: breakdown!.signals.completion_rate,
    actual_share_rate: breakdown!.signals.share_rate,
    actual_save_rate: breakdown!.signals.save_rate,
    actual_velocity_score: breakdown!.signals.velocity_score,
    actual_view_to_follower_ratio: breakdown!.signals.view_to_follower_ratio,
    actual_comment_rate: breakdown!.signals.comment_rate,
    actual_avg_watch_time_seconds: raw_metrics.avg_watch_time_seconds ?? null,
    actual_video_duration_seconds: raw_metrics.video_duration_seconds ?? null,
    actual_follower_count: raw_metrics.follower_count > 0 ? raw_metrics.follower_count : null,
    actual_interactions_first_3h: raw_metrics.interactions_first_3h ?? null,
    actual_hours_since_post: raw_metrics.hours_since_post,
    actual_posted_at: raw_metrics.posted_at ?? null,
    actual_collected_at: raw_metrics.collected_at ?? null,

    // Cohort context
    dps_cohort_sample_size: breakdown!.cohort_sample_size,
    dps_threshold_version: breakdown!.threshold_version,

    // v2.1 additions
    actual_reach_score: breakdown!.signals.reach_score,
    actual_view_percentile_within_cohort: breakdown!.signals.view_percentile_within_cohort,
    dps_v2_weight_tier: breakdown!.weight_tier,
    dps_v2_display_score: breakdown!.display_score,
  };
}

/**
 * Write a DPS v2 label to prediction_runs.
 *
 * Stub: accepts a Supabase-like client. The actual DB call will be wired
 * when routes are connected in a later step.
 */
export async function labelPredictionRunWithDpsV2(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseClient: any,
  input: DpsV2LabelWriteInput,
  extraFields?: Record<string, unknown>,
): Promise<DpsV2LabelWriteResult> {
  const payload = { ...buildDpsV2LabelPayload(input), ...extraFields };

  try {
    const { error } = await supabaseClient
      .from('prediction_runs')
      .update(payload)
      .eq('id', input.run_id);

    if (error) {
      return { success: false, run_id: input.run_id, error: error.message };
    }
    return { success: true, run_id: input.run_id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, run_id: input.run_id, error: message };
  }
}

// ── Bridge Helpers (cohort data -> v2 stats) ──────────────────────────────────

/** Shape of a scraped_videos row for cohort computation. */
export interface ScrapedVideoRow {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  follower_count?: number;
}

/** Bootstrap population stats — used when no population-level data is available yet. */
export const BOOTSTRAP_POPULATION_STATS: DpsV2PopulationStats = {
  sample_size: 1000,
  median_log_engagement: Math.log(0.05),
  spread: 0.8,
};

/**
 * Build DpsV2CohortStats from scraped_videos rows.
 * Derives v2 signals per row, computes composite engagement,
 * then builds log-space cohort statistics.
 */
export function buildCohortStatsFromRows(rows: ScrapedVideoRow[]): DpsV2CohortStats {
  const composites: number[] = [];

  for (const row of rows) {
    if (row.views <= 0) continue;

    const raw: DpsV2RawMetrics = {
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      shares: row.shares,
      saves: row.saves,
      follower_count: row.follower_count ?? 0,
      hours_since_post: 0,
    };

    const signals = deriveDpsV2Signals(raw);
    const { effective_weights } = computeEffectiveWeights(signals);
    const composite = computeCompositeEngagement(signals, effective_weights);

    if (composite > 0) {
      composites.push(composite);
    }
  }

  return computeCohortStatsFromValues(composites);
}

/**
 * Convenience: compute DPS v2 from scraped cohort rows + raw metrics.
 * Handles cohort stats derivation and population bootstrap internally.
 * Extracts cohort view counts from rows for view_percentile_within_cohort.
 */
export function computeDpsV2FromRows(
  raw: DpsV2RawMetrics,
  cohortRows: ScrapedVideoRow[],
  populationStats?: DpsV2PopulationStats,
): ComputeDpsV2Result {
  const cohortStats = buildCohortStatsFromRows(cohortRows);
  const cohortViewCounts = cohortRows.filter(r => r.views > 0).map(r => r.views);
  return computeDpsV2({
    raw,
    cohortStats,
    populationStats: populationStats ?? BOOTSTRAP_POPULATION_STATS,
    cohort_view_counts: cohortViewCounts,
  });
}
