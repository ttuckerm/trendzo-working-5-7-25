/**
 * Canonical Training Label Eligibility Policy
 *
 * Single source of truth for determining whether a prediction_runs row
 * is eligible for v2 training, evaluation, and export.
 *
 * This mirrors the SQL `training_label_eligible` computed column in the
 * `prediction_runs_enriched` view (Step 1 migration), but provides
 * TypeScript-level filtering for in-memory rows and query building.
 *
 * ## Eligibility Rule
 *
 * A row is training-label-eligible when ALL of:
 *   1. dps_formula_version starts with '2' (i.e. DPS v2)
 *   2. dps_label_trust is NOT 'untrusted' (low/medium/high are all OK)
 *   3. dps_training_weight > 0
 *
 * ## Label Categories (post-Step 6 archival)
 *
 * - **legacy_v1**: dps_formula_version does NOT start with '2'
 *   (includes NULL before archival, 'legacy_v1' after archival, or any other non-v2 value)
 * - **v2_untrusted**: version='2.x' but trust='untrusted' or weight=0
 * - **v2_degraded**: version='2.x', trust='low', weight > 0 (eligible but low confidence)
 * - **v2_trusted**: version='2.x', trust='medium'|'high', weight > 0
 * - **insufficient_signal**: actual_dps IS NULL (no label at all)
 *
 * @module training-eligibility
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type LabelCategory =
  | 'v2_trusted'
  | 'v2_degraded'
  | 'v2_untrusted'
  | 'legacy_v1'
  | 'insufficient_signal';

export interface LabelCategoryBreakdown {
  v2_trusted: number;
  v2_degraded: number;
  v2_untrusted: number;
  legacy_v1: number;
  insufficient_signal: number;
  total: number;
  /** v2_trusted + v2_degraded */
  total_v2_eligible: number;
}

/** Minimal row shape needed for eligibility classification. */
export interface EligibilityRow {
  actual_dps?: number | null;
  dps_formula_version?: string | null;
  dps_label_trust?: string | null;
  dps_training_weight?: number | null;
}

// ── Classification ───────────────────────────────────────────────────────────

/**
 * Classify a single row into a label category.
 */
export function classifyLabelCategory(row: EligibilityRow): LabelCategory {
  if (row.actual_dps == null) return 'insufficient_signal';

  const version = row.dps_formula_version;
  const isV2 = version != null && version.startsWith('2');

  if (!isV2) return 'legacy_v1';

  const trust = row.dps_label_trust ?? 'untrusted';
  const weight = row.dps_training_weight ?? 0;

  if (trust === 'untrusted' || weight <= 0) return 'v2_untrusted';
  if (trust === 'low') return 'v2_degraded';
  return 'v2_trusted'; // medium or high
}

/**
 * Check if a row is eligible for v2 training/evaluation.
 * Includes both trusted and degraded (low-confidence) v2 labels.
 */
export function isTrainingLabelEligible(row: EligibilityRow): boolean {
  const cat = classifyLabelCategory(row);
  return cat === 'v2_trusted' || cat === 'v2_degraded';
}

/**
 * Check if a row is a trusted v2 label (medium/high trust only).
 * Use this for official Spearman evaluation.
 */
export function isTrustedV2Label(row: EligibilityRow): boolean {
  return classifyLabelCategory(row) === 'v2_trusted';
}

/**
 * Check if a row is a legacy (pre-v2) label.
 */
export function isLegacyLabel(row: EligibilityRow): boolean {
  return classifyLabelCategory(row) === 'legacy_v1';
}

// ── Breakdown ────────────────────────────────────────────────────────────────

/**
 * Compute a breakdown of label categories for an array of rows.
 */
export function computeLabelBreakdown(rows: EligibilityRow[]): LabelCategoryBreakdown {
  const breakdown: LabelCategoryBreakdown = {
    v2_trusted: 0,
    v2_degraded: 0,
    v2_untrusted: 0,
    legacy_v1: 0,
    insufficient_signal: 0,
    total: rows.length,
    total_v2_eligible: 0,
  };

  for (const row of rows) {
    const cat = classifyLabelCategory(row);
    breakdown[cat]++;
  }

  breakdown.total_v2_eligible = breakdown.v2_trusted + breakdown.v2_degraded;
  return breakdown;
}

// ── Supabase Query Helpers ───────────────────────────────────────────────────

/**
 * SQL WHERE clause fragment for v2-eligible rows.
 * Use in raw SQL or RPC calls.
 */
export const V2_ELIGIBLE_SQL = `
  dps_formula_version IS NOT NULL
  AND dps_formula_version LIKE '2%'
  AND COALESCE(dps_label_trust, 'untrusted') <> 'untrusted'
  AND COALESCE(dps_training_weight, 0) > 0
`.trim();

/**
 * SQL WHERE clause fragment for trusted-only v2 rows (medium/high trust).
 */
export const V2_TRUSTED_SQL = `
  dps_formula_version IS NOT NULL
  AND dps_formula_version LIKE '2%'
  AND dps_label_trust IN ('medium', 'high')
  AND COALESCE(dps_training_weight, 0) > 0
`.trim();

/**
 * Apply v2-eligible filters to a Supabase query builder.
 * For use with .from('prediction_runs').select(...).
 *
 * Matches the canonical SQL: dps_formula_version LIKE '2%'
 * AND trust != 'untrusted' AND weight > 0.
 *
 * After Step 6 archival, legacy rows have dps_formula_version='legacy_v1'
 * (non-null), so a simple not-null check would incorrectly include them.
 * The .like('2%') filter explicitly requires DPS v2 rows.
 */
export function applyV2EligibleFilter<T extends { like: Function; neq: Function; gt: Function }>(
  query: T,
): T {
  return query
    .like('dps_formula_version', '2%')
    .neq('dps_label_trust', 'untrusted')
    .gt('dps_training_weight', 0) as T;
}

// ── DPS v2 Breakdown Field Names ─────────────────────────────────────────────

/**
 * Column names for the full v2 breakdown export package.
 * Consumers that export training data should include ALL of these.
 */
export const DPS_V2_EXPORT_COLUMNS = [
  // Core label
  'actual_dps',
  'actual_tier',
  'dps_formula_version',
  'dps_label_trust',
  'dps_training_weight',

  // Six signal values
  'actual_completion_rate',
  'actual_share_rate',
  'actual_save_rate',
  'actual_velocity_score',
  'actual_view_to_follower_ratio',
  'actual_comment_rate',

  // Signal quality
  'dps_signal_confidence',
  'dps_signal_availability',
  'dps_weight_redistribution',

  // Cohort context
  'dps_cohort_sample_size',
  'dps_threshold_version',
  'dps_within_cohort_percentile',
  'dps_population_percentile',

  // Timing
  'actual_hours_since_post',
  'actual_posted_at',
  'actual_collected_at',

  // Full breakdown JSONB
  'dps_v2_breakdown',
] as const;

/**
 * Select string for Supabase queries that need the full v2 export package.
 */
export const DPS_V2_EXPORT_SELECT = DPS_V2_EXPORT_COLUMNS.join(', ');
