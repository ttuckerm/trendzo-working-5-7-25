/**
 * Phase 81: Training Pipeline v2 — Contamination Validator
 *
 * Scans training data feature JSONB keys against the Feature Availability
 * Matrix and prefix rules.  Any feature that resolves to "blocked" or
 * "unknown" triggers a CONTAMINATION finding.
 *
 * Classification chain (handled by classifyFeature):
 *  1. CONTAMINATED_FEATURES list  →  blocked
 *  2. POST_FEATURE_PREFIXES       →  blocked (actual_*)
 *  3. Explicit FEATURE_MATRIX     →  allowed or blocked per available_pre
 *  4. PRE_FEATURE_PREFIXES        →  allowed (ffmpeg_*, gemini_*, llm_*)
 *  5. None of the above           →  unknown → blocked
 *
 * Feature flag: TRAINING_V2_ENABLED
 */

import {
  classifyFeature,
  TRAINING_V2_ENABLED,
  type ContaminationReason,
} from './feature-availability-matrix';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContaminationDetail {
  feature: string;
  reason: string;
  /** Machine-readable classification tag */
  classification: ContaminationReason;
}

export interface ValidationResult {
  /** Did the audit pass (no contamination)? */
  passed: boolean;
  /** Total distinct feature keys checked across all rows */
  features_checked: number;
  /** Count of features that passed (allowed) */
  features_allowed: number;
  /** Feature keys that are contaminated */
  contaminated: string[];
  /** Human-readable details per violation */
  details: ContaminationDetail[];
  /** Summary sentence */
  summary: string;
}

// ---------------------------------------------------------------------------
// Human-readable reason mapping
// ---------------------------------------------------------------------------

const REASON_LABELS: Record<ContaminationReason, string> = {
  allowed_explicit:    'Allowed — cataloged in matrix, available_pre=true',
  allowed_pre_prefix:  'Allowed — matches PRE prefix rule (ffmpeg_/gemini_/llm_)',
  blocked_explicit:    'BLOCKED — cataloged in matrix, available_pre=false (post-execution only)',
  blocked_post_prefix: 'BLOCKED — matches POST prefix rule (actual_*)',
  blocked_contaminated:'BLOCKED — explicitly listed as contaminated post-execution metric',
  unknown_feature:     'BLOCKED — unknown feature, not in matrix and no prefix match',
};

// ---------------------------------------------------------------------------
// Core validator
// ---------------------------------------------------------------------------

/**
 * Validate training features for contamination.
 *
 * @param featureRows - Array of feature JSONB objects (one per training row).
 *                      Each is a Record<string, number> from training_data.features.
 * @returns Validation result with pass/fail and details.
 */
export function validateTrainingFeatures(
  featureRows: Record<string, unknown>[],
): ValidationResult {
  if (!TRAINING_V2_ENABLED()) {
    return {
      passed: true,
      features_checked: 0,
      features_allowed: 0,
      contaminated: [],
      details: [],
      summary: 'TRAINING_V2_ENABLED is off — validation skipped.',
    };
  }

  // Collect all distinct feature keys across every row
  const allKeys = new Set<string>();
  for (const row of featureRows) {
    if (row && typeof row === 'object') {
      for (const key of Object.keys(row)) {
        allKeys.add(key);
      }
    }
  }

  const contaminated: string[] = [];
  const details: ContaminationDetail[] = [];
  let allowedCount = 0;

  for (const key of allKeys) {
    const classification = classifyFeature(key);

    if (classification.allowed) {
      allowedCount++;
    } else {
      contaminated.push(key);
      details.push({
        feature: key,
        reason: REASON_LABELS[classification.reason],
        classification: classification.reason,
      });
    }
  }

  const passed = contaminated.length === 0;

  const summary = passed
    ? `All ${allKeys.size} features are pre-execution safe. No contamination detected.`
    : `CONTAMINATION DETECTED: ${contaminated.length} of ${allKeys.size} feature(s) are post-execution or unknown. ${allowedCount} features passed. Training BLOCKED.`;

  return {
    passed,
    features_checked: allKeys.size,
    features_allowed: allowedCount,
    contaminated,
    details,
    summary,
  };
}
