/**
 * QC Harness: Normalized Component Result
 *
 * Guarantees every component result has the same shape before DB write
 * and before the QC gating step.  Keeps the original `features` blob
 * intact for rich storage while exposing a flat `key_features` summary
 * for quick comparison across runs.
 */

import { ComponentResult } from '@/lib/orchestration/kai-orchestrator';

// ─── Public contract ──────────────────────────────────────────────────────────

export type ComponentStatus = 'success' | 'failed' | 'skipped' | 'disabled';

export interface NormalizedComponentResult {
  component_id: string;
  status: ComponentStatus;
  prediction: number | null;     // DPS score (0-100), null if N/A
  confidence: number;            // 0-1, default 0
  reason: string | null;         // Why failed/skipped/disabled, null if success
  latency_ms: number;
  /** Flat 2-5 important fields for quick comparison across runs */
  key_features: Record<string, number | string | boolean>;
}

// ─── QC flags that the pipeline can attach at the run level ────────────────

export type QCFlag =
  | 'NO_TRANSCRIPT'
  | 'SHORT_TRANSCRIPT'
  | 'LOW_SIGNAL_COVERAGE'
  | 'LOW_CONFIDENCE_LLM'
  | 'MANY_COMPONENTS_FAILED'
  | 'MANY_COMPONENTS_SKIPPED'
  | 'DETERMINISTIC_MODE'
  | 'LLM_EXCLUDED_FROM_AGGREGATE'
  | 'LLM_DISAGREEMENT'
  | 'TWO_LANE_ACTIVE'
  | 'CLEAN_INGEST_CONFIRMED'
  | 'METRICS_CONTAMINATION_BLOCKED'
  | 'XGBOOST_V7_COMPONENT'
  | 'XGBOOST_V7_FAILED'
  | 'XGBOOST_V7_SKIPPED_NO_VIDEO';

// ─── Two-Lane architecture: lane classification ──────────────────────────────

/** IDs of components whose predictions land in the "coach" lane (never influence VPS) */
export const COACH_LANE_COMPONENT_IDS = new Set([
  'gpt4',
  'gemini',
  'claude',
  'unified-grading',   // Pack 1
  'editing-coach',     // Pack 2
  // NOTE: 9-attributes and 7-legos moved to score lane (Scoring Rescue, 2026-03-11)
  // They are deterministic/rule-based components, not LLMs.
]);

export type Lane = 'score' | 'coach';

/** Classify a component into the score lane or the coach lane. */
export function classifyLane(componentId: string): Lane {
  return COACH_LANE_COMPONENT_IDS.has(componentId) ? 'coach' : 'score';
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

export function normalizeComponentResult(raw: ComponentResult): NormalizedComponentResult {
  const status = deriveStatus(raw);
  return {
    component_id: raw.componentId,
    status,
    prediction: raw.prediction ?? null,
    confidence: raw.confidence ?? 0,
    reason: raw.error || raw.skipReason || null,
    latency_ms: raw.latency ?? 0,
    key_features: extractKeyFeatures(raw.componentId, raw.features),
  };
}

// ─── QC gating ────────────────────────────────────────────────────────────────

export interface QCGateResult {
  /** Should this component influence the final DPS? */
  influence: boolean;
  /** Human-readable reason when influence=false */
  gate_reason: string | null;
}

/**
 * Decide whether a normalised component should influence final DPS.
 *
 * Rules:
 *  1. failed / skipped / disabled  →  cannot influence
 *  2. confidence < 0.6             →  cannot influence (still shown in UI)
 */
export function qcGate(norm: NormalizedComponentResult): QCGateResult {
  if (norm.status !== 'success') {
    return { influence: false, gate_reason: `status=${norm.status}` };
  }
  if (norm.confidence < 0.6) {
    return { influence: false, gate_reason: `low_confidence=${norm.confidence}` };
  }
  return { influence: true, gate_reason: null };
}

/**
 * Compute run-level QC flags from the full set of normalized results
 * plus transcript metadata.
 */
export function computeRunQCFlags(
  norms: NormalizedComponentResult[],
  transcript: { length: number; source: string } | null,
): QCFlag[] {
  const flags: QCFlag[] = [];

  // Transcript flags
  if (!transcript || transcript.length === 0 || transcript.source === 'none') {
    flags.push('NO_TRANSCRIPT');
  } else if (transcript.length < 50) {
    flags.push('SHORT_TRANSCRIPT');
  }

  // Component coverage
  const total = norms.length;
  const succeeded = norms.filter(n => n.status === 'success').length;
  const failed = norms.filter(n => n.status === 'failed').length;
  const skipped = norms.filter(n => n.status === 'skipped').length;

  if (total > 0 && succeeded / total < 0.5) {
    flags.push('LOW_SIGNAL_COVERAGE');
  }
  if (failed > total * 0.3) {
    flags.push('MANY_COMPONENTS_FAILED');
  }
  if (skipped > total * 0.3) {
    flags.push('MANY_COMPONENTS_SKIPPED');
  }

  // LLM confidence check (for the LLM-based components)
  const llmIds = new Set(['gpt4', 'gemini', 'claude', 'unified-grading', 'editing-coach']);
  const llmResults = norms.filter(n => llmIds.has(n.component_id) && n.status === 'success');
  if (llmResults.length > 0) {
    const avgConf = llmResults.reduce((s, n) => s + n.confidence, 0) / llmResults.length;
    if (avgConf < 0.7) {
      flags.push('LOW_CONFIDENCE_LLM');
    }
  }

  return flags;
}

// ─── Helpers (private) ────────────────────────────────────────────────────────

function deriveStatus(raw: ComponentResult): ComponentStatus {
  if (raw.skipped) return 'skipped';
  if (raw.error?.includes('disabled') || raw.error?.includes('Component disabled')) return 'disabled';
  if (raw.error?.includes('not registered') || raw.error?.includes('Component not registered')) return 'disabled';
  if (raw.success) return 'success';
  return 'failed';
}

/**
 * Extract 2-5 important fields from the component-specific features blob.
 * This is intentionally shallow: just the top signals for side-by-side comparison.
 */
function extractKeyFeatures(
  componentId: string,
  features?: Record<string, any>,
): Record<string, number | string | boolean> {
  if (!features) return {};

  switch (componentId) {
    case 'gpt4':
      return pick(features, ['viral_probability', 'hook_effectiveness', 'emotional_appeal', 'audience_match']);

    case 'gemini':
      return pick(features, ['hookStrength', 'shareability', 'platformFit', 'authenticity']);

    case 'claude':
      return pick(features, ['viral_probability', 'hook_effectiveness', 'emotional_appeal']);

    case 'unified-grading':
      return {
        grader_confidence: features.grader_confidence ?? 0,
        hook_clarity: features.hook?.clarity_score ?? 0,
        pacing: features.pacing?.score ?? 0,
        novelty: features.novelty?.score ?? 0,
      };

    case 'editing-coach':
      return {
        predicted_before: features.predicted_before ?? 0,
        predicted_after: features.predicted_after_estimate ?? 0,
        num_suggestions: features.changes?.length ?? 0,
      };

    case 'visual-rubric':
      return {
        overall: features.overall_visual_score ?? 0,
        hook: features.visual_hook_score?.score ?? 0,
        pacing: features.pacing_score?.score ?? 0,
      };

    case '9-attributes':
      return pick(features, ['tamResonance', 'sharability', 'attentionScore', 'retentionScore']);

    case '7-legos':
      return { lego_count: features.matchedLegos?.length ?? features.legoCount ?? 0 };

    case 'xgboost-virality-ml':
      return pick(features, ['predicted_dps', 'confidence', 'model_version']);

    case '24-styles':
      return pick(features, ['detected_style', 'execution_score', 'confidence']);

    case 'ffmpeg':
      return pick(features, ['duration', 'fps', 'width', 'height']);

    case 'feature-extraction':
      return { coverage: features.coverage ?? 0, featureCount: features.featureCount ?? 0 };

    default:
      // For any unknown component, try to grab a few numeric fields
      return pickFirstN(features, 3);
  }
}

/** Pick known keys, skip undefined/null */
function pick(
  obj: Record<string, any>,
  keys: string[],
): Record<string, number | string | boolean> {
  const result: Record<string, number | string | boolean> = {};
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')) {
      result[k] = v;
    }
  }
  return result;
}

/** Grab the first N scalar values from an object */
function pickFirstN(
  obj: Record<string, any>,
  n: number,
): Record<string, number | string | boolean> {
  const result: Record<string, number | string | boolean> = {};
  let count = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (count >= n) break;
    if (v !== undefined && v !== null && (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean')) {
      result[k] = v;
      count++;
    }
  }
  return result;
}
