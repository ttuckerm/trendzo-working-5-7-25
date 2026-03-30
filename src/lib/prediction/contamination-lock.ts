/**
 * Contamination Lock — per-run cryptographic proof of clean prediction
 *
 * Ensures predictions run without metrics contamination and produces
 * a deterministic, auditable proof hash for each clean ingest run.
 */

import { createHash } from 'crypto';
import type { VideoInput } from '@/lib/orchestration/kai-orchestrator';
import type { QCFlag } from './normalize-component-result';

// ─── Public types ────────────────────────────────────────────────────────────

export type IngestMode = 'clean' | 'dirty_allowed';

export interface ContaminationProof {
  inputs_hash: string;
  pipeline_version: string;
  flags: QCFlag[];
  checked_fields: string[];
  generated_at: string;
}

export const CONTAMINATION_LOCK_VERSION = 'lock-v1.0';

// Fields on VideoInput that are checked for contamination
const CHECKED_FIELDS = [
  'videoId', 'transcript', 'title', 'description', 'hashtags',
  'niche', 'goal', 'videoPath', 'actualMetrics',
] as const;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Derive ingest mode from the pipeline source.
 * Returns 'clean' for known clean origins, null for unknown.
 */
export function deriveIngestMode(
  source: string | undefined,
): IngestMode | null {
  switch (source) {
    case 'training_ingest':
    case 'manual':
    case 'api':
      return 'clean';
    default:
      return null;
  }
}

/**
 * Sanitize a VideoInput for clean ingest. Returns a CLONE — never mutates the original.
 *
 * - If `isClean` is true and `actualMetrics` is present, deletes it from the clone
 *   and returns `METRICS_CONTAMINATION_BLOCKED`.
 * - If `isClean` is true and no metrics present, returns `CLEAN_INGEST_CONFIRMED`.
 * - If `isClean` is false, returns the clone unchanged with no flags.
 */
export function sanitizeVideoInput(
  videoInput: VideoInput,
  isClean: boolean,
): { sanitized: VideoInput; flags: QCFlag[] } {
  // Shallow clone — VideoInput has no nested mutable objects we need to deep-clone
  const sanitized = { ...videoInput };
  const flags: QCFlag[] = [];

  if (isClean) {
    if (sanitized.actualMetrics != null) {
      delete sanitized.actualMetrics;
      flags.push('METRICS_CONTAMINATION_BLOCKED');
    } else {
      flags.push('CLEAN_INGEST_CONFIRMED');
    }
  }

  return { sanitized, flags };
}

/**
 * Generate a deterministic contamination proof.
 * The hash input is a canonical JSON with sorted keys — NO timestamp in hash.
 * `generated_at` is stored separately in the proof object.
 */
export function generateContaminationProof(
  sanitizedInput: VideoInput,
  flags: QCFlag[],
): ContaminationProof {
  // Build deterministic hash input (sorted keys, no timestamp)
  const hashInput = {
    descriptionLength: sanitizedInput.description?.length ?? 0,
    goal: sanitizedInput.goal ?? null,
    hashtagCount: sanitizedInput.hashtags?.length ?? 0,
    hasTranscript: (sanitizedInput.transcript?.length ?? 0) > 0,
    hasVideoPath: !!sanitizedInput.videoPath,
    metricsPresent: sanitizedInput.actualMetrics != null,
    niche: sanitizedInput.niche ?? null,
    title: sanitizedInput.title ?? null,
    transcriptLength: sanitizedInput.transcript?.length ?? 0,
    videoId: sanitizedInput.videoId,
  };

  const canonical = JSON.stringify(hashInput, Object.keys(hashInput).sort());
  const inputs_hash = createHash('sha256').update(canonical).digest('hex');

  return {
    inputs_hash,
    pipeline_version: CONTAMINATION_LOCK_VERSION,
    flags,
    checked_fields: [...CHECKED_FIELDS],
    generated_at: new Date().toISOString(),
  };
}
