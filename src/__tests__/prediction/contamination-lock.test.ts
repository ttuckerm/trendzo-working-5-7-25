import {
  deriveIngestMode,
  sanitizeVideoInput,
  generateContaminationProof,
  CONTAMINATION_LOCK_VERSION,
} from '@/lib/prediction/contamination-lock';
import type { VideoInput } from '@/lib/orchestration/kai-orchestrator';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeVideoInput(overrides?: Partial<VideoInput>): VideoInput {
  return {
    videoId: 'test-video-123',
    transcript: 'This is a test transcript for contamination testing',
    niche: 'fitness',
    goal: 'engagement',
    title: 'My Workout',
    description: 'A great workout video',
    hashtags: ['#fitness', '#workout'],
    videoPath: '/tmp/test.mp4',
    ...overrides,
  };
}

// ─── deriveIngestMode ────────────────────────────────────────────────────────

describe('deriveIngestMode', () => {
  it('returns "clean" for training_ingest source', () => {
    expect(deriveIngestMode('training_ingest')).toBe('clean');
  });

  it('returns "clean" for manual source', () => {
    expect(deriveIngestMode('manual')).toBe('clean');
  });

  it('returns "clean" for api source', () => {
    expect(deriveIngestMode('api')).toBe('clean');
  });

  it('returns null for unknown source', () => {
    expect(deriveIngestMode('scraping')).toBeNull();
  });

  it('returns null for undefined source', () => {
    expect(deriveIngestMode(undefined)).toBeNull();
  });
});

// ─── sanitizeVideoInput ──────────────────────────────────────────────────────

describe('sanitizeVideoInput', () => {
  it('returns CLEAN_INGEST_CONFIRMED when no actualMetrics present (clean)', () => {
    const input = makeVideoInput();
    const { sanitized, flags } = sanitizeVideoInput(input, true);

    expect(flags).toEqual(['CLEAN_INGEST_CONFIRMED']);
    expect(sanitized.actualMetrics).toBeUndefined();
  });

  it('strips actualMetrics from clone and returns METRICS_CONTAMINATION_BLOCKED (clean)', () => {
    const input = makeVideoInput({
      actualMetrics: { views: 10000, likes: 500, comments: 50, shares: 25, saves: 10 },
    });
    const { sanitized, flags } = sanitizeVideoInput(input, true);

    expect(flags).toEqual(['METRICS_CONTAMINATION_BLOCKED']);
    expect(sanitized.actualMetrics).toBeUndefined();
  });

  it('preserves actualMetrics when NOT clean ingest', () => {
    const metrics = { views: 10000, likes: 500, comments: 50, shares: 25, saves: 10 };
    const input = makeVideoInput({ actualMetrics: metrics });
    const { sanitized, flags } = sanitizeVideoInput(input, false);

    expect(flags).toEqual([]);
    expect(sanitized.actualMetrics).toEqual(metrics);
  });

  it('NEVER mutates the original VideoInput', () => {
    const metrics = { views: 999, likes: 100, comments: 10, shares: 5, saves: 3 };
    const input = makeVideoInput({ actualMetrics: metrics });
    const originalJSON = JSON.stringify(input);

    sanitizeVideoInput(input, true);

    // Original must be completely unchanged
    expect(JSON.stringify(input)).toBe(originalJSON);
    expect(input.actualMetrics).toEqual(metrics);
  });

  it('returns empty flags when not clean ingest and no metrics', () => {
    const input = makeVideoInput();
    const { flags } = sanitizeVideoInput(input, false);
    expect(flags).toEqual([]);
  });
});

// ─── generateContaminationProof ──────────────────────────────────────────────

describe('generateContaminationProof', () => {
  it('produces a 64-char hex hash', () => {
    const input = makeVideoInput();
    const proof = generateContaminationProof(input, ['CLEAN_INGEST_CONFIRMED']);

    expect(proof.inputs_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('includes pipeline version', () => {
    const input = makeVideoInput();
    const proof = generateContaminationProof(input, ['CLEAN_INGEST_CONFIRMED']);

    expect(proof.pipeline_version).toBe(CONTAMINATION_LOCK_VERSION);
  });

  it('includes passed flags', () => {
    const input = makeVideoInput();
    const proof = generateContaminationProof(input, ['METRICS_CONTAMINATION_BLOCKED']);

    expect(proof.flags).toEqual(['METRICS_CONTAMINATION_BLOCKED']);
  });

  it('includes generated_at timestamp', () => {
    const input = makeVideoInput();
    const proof = generateContaminationProof(input, ['CLEAN_INGEST_CONFIRMED']);

    expect(proof.generated_at).toBeDefined();
    expect(new Date(proof.generated_at).getTime()).not.toBeNaN();
  });

  it('includes checked_fields list', () => {
    const input = makeVideoInput();
    const proof = generateContaminationProof(input, ['CLEAN_INGEST_CONFIRMED']);

    expect(proof.checked_fields).toContain('actualMetrics');
    expect(proof.checked_fields).toContain('videoId');
    expect(proof.checked_fields).toContain('transcript');
  });

  it('produces deterministic hash — same inputs yield same hash', () => {
    const input1 = makeVideoInput();
    const input2 = makeVideoInput();

    const proof1 = generateContaminationProof(input1, ['CLEAN_INGEST_CONFIRMED']);
    const proof2 = generateContaminationProof(input2, ['CLEAN_INGEST_CONFIRMED']);

    // Hash must be identical (no timestamp in hash computation)
    expect(proof1.inputs_hash).toBe(proof2.inputs_hash);
  });

  it('produces different hashes for different video IDs', () => {
    const input1 = makeVideoInput({ videoId: 'video-aaa' });
    const input2 = makeVideoInput({ videoId: 'video-bbb' });

    const proof1 = generateContaminationProof(input1, ['CLEAN_INGEST_CONFIRMED']);
    const proof2 = generateContaminationProof(input2, ['CLEAN_INGEST_CONFIRMED']);

    expect(proof1.inputs_hash).not.toBe(proof2.inputs_hash);
  });

  it('produces different hashes when metricsPresent differs', () => {
    const cleanInput = makeVideoInput();
    const dirtyInput = makeVideoInput({
      actualMetrics: { views: 1, likes: 0, comments: 0, shares: 0, saves: 0 },
    });

    const proof1 = generateContaminationProof(cleanInput, ['CLEAN_INGEST_CONFIRMED']);
    const proof2 = generateContaminationProof(dirtyInput, ['METRICS_CONTAMINATION_BLOCKED']);

    expect(proof1.inputs_hash).not.toBe(proof2.inputs_hash);
  });
});
