/**
 * DPS v2 — Unit Tests
 */
import {
  deriveDpsV2Signals,
  computeEffectiveWeights,
  computeCompositeEngagement,
  computeCohortStatsFromValues,
  computeMedian,
  computeMAD,
  computeShrinkageWeight,
  applyShrinkage,
  computeViralScore,
  applyTimeDecay,
  classifyDpsV2,
  computeDpsV2,
  computeFollowerTierBounds,
  buildDpsV2LabelPayload,
  labelPredictionRunWithDpsV2,
  calculateReachScore,
  computePercentileRank,
  selectWeightTier,
  zScoreToDisplayDps,
  DEFAULT_THRESHOLDS,
  DPS_V2_FORMULA_VERSION,
  type DpsV2RawMetrics,
  type DpsV2CohortStats,
  type DpsV2PopulationStats,
  type DpsV2ThresholdSet,
  type DpsV2SignalInputs,
} from '../dps-v2';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRaw(overrides: Partial<DpsV2RawMetrics> = {}): DpsV2RawMetrics {
  return {
    views: 10000,
    likes: 500,
    comments: 50,
    shares: 100,
    saves: 200,
    follower_count: 5000,
    avg_watch_time_seconds: 12,
    video_duration_seconds: 15,
    interactions_first_3h: 900,
    hours_since_post: 6,
    ...overrides,
  };
}

function makeCohortStats(overrides: Partial<DpsV2CohortStats> = {}): DpsV2CohortStats {
  return {
    sample_size: 100,
    median_log_engagement: -3.0,
    spread: 0.5,
    ...overrides,
  };
}

function makePopulationStats(overrides: Partial<DpsV2PopulationStats> = {}): DpsV2PopulationStats {
  return {
    sample_size: 10000,
    median_log_engagement: -2.8,
    spread: 0.6,
    ...overrides,
  };
}

function makeSignals(overrides: Partial<DpsV2SignalInputs> = {}): DpsV2SignalInputs {
  return {
    completion_rate: 0.8,
    share_rate: 0.01,
    save_rate: 0.02,
    velocity_score: 300,
    view_to_follower_ratio: 2.0,
    comment_rate: 0.005,
    reach_score: 0.63,
    view_percentile_within_cohort: 0.75,
    ...overrides,
  };
}

// ── Signal Derivation ────────────────────────────────────────────────────────

describe('deriveDpsV2Signals', () => {
  it('computes all signals from complete raw metrics', () => {
    const raw = makeRaw();
    const signals = deriveDpsV2Signals(raw);

    expect(signals.completion_rate).toBeCloseTo(12 / 15, 6);
    expect(signals.share_rate).toBeCloseTo(100 / 10000, 6);
    expect(signals.save_rate).toBeCloseTo(200 / 10000, 6);
    expect(signals.velocity_score).toBeCloseTo(900 / 3, 4);
    expect(signals.view_to_follower_ratio).toBeCloseTo(10000 / 5000, 6);
    expect(signals.comment_rate).toBeCloseTo(50 / 10000, 6);
  });

  it('computes reach_score from view count', () => {
    const raw = makeRaw({ views: 10000 });
    const signals = deriveDpsV2Signals(raw);
    expect(signals.reach_score).toBeCloseTo(Math.log10(10001) / Math.log10(100_000_000), 4);
  });

  it('returns null for reach_score when views are zero', () => {
    const raw = makeRaw({ views: 0 });
    const signals = deriveDpsV2Signals(raw);
    expect(signals.reach_score).toBeNull();
  });

  it('always returns null for view_percentile_within_cohort (computed later)', () => {
    const raw = makeRaw();
    const signals = deriveDpsV2Signals(raw);
    expect(signals.view_percentile_within_cohort).toBeNull();
  });

  it('returns null for completion_rate when watch time is missing', () => {
    const raw = makeRaw({ avg_watch_time_seconds: null });
    const signals = deriveDpsV2Signals(raw);
    expect(signals.completion_rate).toBeNull();
  });

  it('returns null for rates when views are zero', () => {
    const raw = makeRaw({ views: 0 });
    const signals = deriveDpsV2Signals(raw);
    expect(signals.share_rate).toBeNull();
    expect(signals.save_rate).toBeNull();
    expect(signals.comment_rate).toBeNull();
  });

  it('returns null for view_to_follower_ratio when follower_count is zero', () => {
    const raw = makeRaw({ follower_count: 0 });
    const signals = deriveDpsV2Signals(raw);
    expect(signals.view_to_follower_ratio).toBeNull();
  });

  it('returns null for velocity_score when interactions_first_3h is missing', () => {
    const raw = makeRaw({ interactions_first_3h: null });
    const signals = deriveDpsV2Signals(raw);
    expect(signals.velocity_score).toBeNull();
  });

  it('caps completion_rate at 1.0', () => {
    const raw = makeRaw({ avg_watch_time_seconds: 20, video_duration_seconds: 15 });
    const signals = deriveDpsV2Signals(raw);
    expect(signals.completion_rate).toBe(1.0);
  });
});

// ── Reach Score ──────────────────────────────────────────────────────────────

describe('calculateReachScore', () => {
  it('returns 0 for 0 views', () => {
    expect(calculateReachScore(0)).toBe(0);
  });

  it('returns 0 for negative views', () => {
    expect(calculateReachScore(-100)).toBe(0);
  });

  it('returns ~0.38 for 1K views', () => {
    expect(calculateReachScore(1000)).toBeCloseTo(0.375, 2);
  });

  it('returns ~0.63 for 100K views', () => {
    expect(calculateReachScore(100000)).toBeCloseTo(0.625, 2);
  });

  it('returns ~0.75 for 1M views', () => {
    expect(calculateReachScore(1000000)).toBeCloseTo(0.75, 2);
  });

  it('returns ~0.88 for 10M views', () => {
    expect(calculateReachScore(10000000)).toBeCloseTo(0.875, 2);
  });

  it('clamps at 1.0 for very high view counts', () => {
    expect(calculateReachScore(500_000_000)).toBe(1.0);
  });
});

// ── Percentile Rank ──────────────────────────────────────────────────────────

describe('computePercentileRank', () => {
  it('returns 0.5 for empty distribution', () => {
    expect(computePercentileRank(100, [])).toBe(0.5);
  });

  it('returns 0 for value below all entries', () => {
    expect(computePercentileRank(1, [10, 20, 30, 40])).toBe(0);
  });

  it('returns 1.0 for value above all entries', () => {
    expect(computePercentileRank(100, [10, 20, 30, 40])).toBe(1.0);
  });

  it('returns 0.5 for median value in odd-length distribution', () => {
    expect(computePercentileRank(30, [10, 20, 30, 40, 50])).toBeCloseTo(0.5, 6);
  });

  it('handles single-element distribution', () => {
    expect(computePercentileRank(50, [50])).toBe(0.5); // midpoint: (0 + 1/2) / 1
  });

  it('handles duplicate values correctly', () => {
    // 3 below, 2 equal => (3 + 2/2) / 6 = 4/6 = 0.667
    expect(computePercentileRank(50, [10, 20, 30, 50, 50, 60])).toBeCloseTo(4 / 6, 6);
  });
});

// ── Weight Tier Selection ────────────────────────────────────────────────────

describe('selectWeightTier', () => {
  it('selects tier 1 when velocity_score is null', () => {
    const signals = makeSignals({ velocity_score: null, completion_rate: null });
    const result = selectWeightTier(signals);
    expect(result.tier).toBe(1);
    expect(result.baseWeights.velocity_score).toBe(0);
    expect(result.baseWeights.completion_rate).toBe(0);
  });

  it('selects tier 2 when velocity_score is present but completion_rate is null', () => {
    const signals = makeSignals({ velocity_score: 300, completion_rate: null });
    const result = selectWeightTier(signals);
    expect(result.tier).toBe(2);
    expect(result.baseWeights.velocity_score).toBe(0.18);
    expect(result.baseWeights.completion_rate).toBe(0);
  });

  it('selects tier 3 when both velocity_score and completion_rate are present', () => {
    const signals = makeSignals({ velocity_score: 300, completion_rate: 0.8 });
    const result = selectWeightTier(signals);
    expect(result.tier).toBe(3);
    expect(result.baseWeights.velocity_score).toBe(0.15);
    expect(result.baseWeights.completion_rate).toBe(0.10);
  });

  it('tier 1 weights sum to 1.0', () => {
    const signals = makeSignals({ velocity_score: null, completion_rate: null });
    const { baseWeights } = selectWeightTier(signals);
    const sum = Object.values(baseWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('tier 2 weights sum to 1.0', () => {
    const signals = makeSignals({ velocity_score: 300, completion_rate: null });
    const { baseWeights } = selectWeightTier(signals);
    const sum = Object.values(baseWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('tier 3 weights sum to 1.0', () => {
    const signals = makeSignals({ velocity_score: 300, completion_rate: 0.8 });
    const { baseWeights } = selectWeightTier(signals);
    const sum = Object.values(baseWeights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

// ── Weight Redistribution ────────────────────────────────────────────────────

describe('computeEffectiveWeights', () => {
  it('returns tier weights when all signals available', () => {
    const signals = makeSignals();
    const result = computeEffectiveWeights(signals);
    expect(result.redistributed).toBe(false);
    const sum = Object.values(result.effective_weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('redistributes weight from null signals to available ones', () => {
    const signals = makeSignals({ view_percentile_within_cohort: null });
    const result = computeEffectiveWeights(signals);
    expect(result.redistributed).toBe(true);
    expect(result.effective_weights.view_percentile_within_cohort).toBe(0);
    expect(result.availability.view_percentile_within_cohort).toBe(false);
    const sum = Object.values(result.effective_weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('does not redistribute weight to zero-base-weight signals', () => {
    // Tier 1: velocity_score and completion_rate have base weight 0
    const signals = makeSignals({
      velocity_score: null,
      completion_rate: null,
      view_percentile_within_cohort: null, // This has non-zero base weight, should redistribute
    });
    const { tier, baseWeights } = selectWeightTier(signals);
    expect(tier).toBe(1);
    const result = computeEffectiveWeights(signals, baseWeights);
    // velocity and completion have 0 base weight in tier 1, stay 0
    expect(result.effective_weights.velocity_score).toBe(0);
    expect(result.effective_weights.completion_rate).toBe(0);
    // sum of available non-zero-base signals should be 1.0
    const sum = Object.values(result.effective_weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('handles all signals missing', () => {
    const signals: DpsV2SignalInputs = {
      completion_rate: null,
      share_rate: null,
      save_rate: null,
      velocity_score: null,
      view_to_follower_ratio: null,
      comment_rate: null,
      reach_score: null,
      view_percentile_within_cohort: null,
    };
    const result = computeEffectiveWeights(signals);
    expect(result.redistributed).toBe(true);
    const sum = Object.values(result.effective_weights).reduce((a, b) => a + b, 0);
    expect(sum).toBe(0);
  });

  it('accepts explicit base weights parameter', () => {
    const signals = makeSignals();
    const customWeights: Record<string, number> = {
      completion_rate: 0.5,
      share_rate: 0.5,
      save_rate: 0,
      velocity_score: 0,
      view_to_follower_ratio: 0,
      comment_rate: 0,
      reach_score: 0,
      view_percentile_within_cohort: 0,
    };
    const result = computeEffectiveWeights(signals, customWeights as any);
    expect(result.effective_weights.completion_rate).toBeCloseTo(0.5, 6);
    expect(result.effective_weights.share_rate).toBeCloseTo(0.5, 6);
    expect(result.effective_weights.save_rate).toBe(0);
  });
});

// ── Composite Engagement ─────────────────────────────────────────────────────

describe('computeCompositeEngagement', () => {
  it('computes weighted sum correctly', () => {
    const signals: DpsV2SignalInputs = {
      completion_rate: 1.0,
      share_rate: 1.0,
      save_rate: 1.0,
      velocity_score: 1.0,
      view_to_follower_ratio: 1.0,
      comment_rate: 1.0,
      reach_score: 1.0,
      view_percentile_within_cohort: 1.0,
    };
    const weights: Record<string, number> = {
      completion_rate: 0.10,
      share_rate: 0.18,
      save_rate: 0.11,
      velocity_score: 0.15,
      view_to_follower_ratio: 0.10,
      comment_rate: 0.06,
      reach_score: 0.12,
      view_percentile_within_cohort: 0.18,
    };
    const result = computeCompositeEngagement(signals, weights as any);
    expect(result).toBeCloseTo(1.0, 10);
  });

  it('skips null signals', () => {
    const signals: DpsV2SignalInputs = {
      completion_rate: null,
      share_rate: 0.5,
      save_rate: null,
      velocity_score: null,
      view_to_follower_ratio: null,
      comment_rate: null,
      reach_score: null,
      view_percentile_within_cohort: null,
    };
    const weights: Record<string, number> = {
      completion_rate: 0,
      share_rate: 1.0,
      save_rate: 0,
      velocity_score: 0,
      view_to_follower_ratio: 0,
      comment_rate: 0,
      reach_score: 0,
      view_percentile_within_cohort: 0,
    };
    const result = computeCompositeEngagement(signals, weights as any);
    expect(result).toBeCloseTo(0.5, 10);
  });
});

// ── Median / MAD ─────────────────────────────────────────────────────────────

describe('computeMedian', () => {
  it('returns median for odd-length array', () => {
    expect(computeMedian([1, 3, 5])).toBe(3);
  });

  it('returns median for even-length array', () => {
    expect(computeMedian([1, 3, 5, 7])).toBe(4);
  });

  it('returns 0 for empty array', () => {
    expect(computeMedian([])).toBe(0);
  });

  it('handles unsorted input', () => {
    expect(computeMedian([5, 1, 3])).toBe(3);
  });
});

describe('computeMAD', () => {
  it('computes MAD correctly', () => {
    expect(computeMAD([1, 2, 3, 4, 5], 3)).toBe(1);
  });

  it('returns 0 for empty array', () => {
    expect(computeMAD([], 0)).toBe(0);
  });

  it('returns 0 when all values are the same', () => {
    expect(computeMAD([5, 5, 5], 5)).toBe(0);
  });
});

describe('computeCohortStatsFromValues', () => {
  it('computes log-space median and MAD-based spread', () => {
    const values = [1, 2, 3, 4, 5];
    const stats = computeCohortStatsFromValues(values);

    expect(stats.sample_size).toBe(5);
    const logValues = values.map((v) => Math.log(v));
    const expectedMedian = logValues.sort((a, b) => a - b)[2];
    expect(stats.median_log_engagement).toBeCloseTo(expectedMedian, 6);
    expect(stats.spread).toBeGreaterThan(0);
  });

  it('returns min spread for empty input', () => {
    const stats = computeCohortStatsFromValues([]);
    expect(stats.sample_size).toBe(0);
    expect(stats.spread).toBe(0.01);
  });

  it('filters out non-positive values', () => {
    const stats = computeCohortStatsFromValues([0, -1, 5, 10]);
    expect(stats.sample_size).toBe(2);
  });

  it('returns min spread when all values are the same', () => {
    const stats = computeCohortStatsFromValues([5, 5, 5]);
    expect(stats.spread).toBe(0.01);
  });
});

// ── Shrinkage ────────────────────────────────────────────────────────────────

describe('shrinkage', () => {
  describe('computeShrinkageWeight', () => {
    it('returns 0 for zero sample size', () => {
      expect(computeShrinkageWeight(0)).toBe(0);
    });

    it('returns ~0.5 at n=30', () => {
      expect(computeShrinkageWeight(30)).toBeCloseTo(0.5, 6);
    });

    it('approaches 1.0 for large cohorts', () => {
      expect(computeShrinkageWeight(1000)).toBeGreaterThan(0.97);
    });

    it('is small for very small cohorts', () => {
      expect(computeShrinkageWeight(3)).toBeCloseTo(3 / 33, 6);
    });
  });

  describe('applyShrinkage', () => {
    it('returns population stats when cohort is empty', () => {
      const cohort = makeCohortStats({ sample_size: 0 });
      const pop = makePopulationStats();
      const result = applyShrinkage(cohort, pop);
      expect(result.shrinkageWeight).toBe(0);
      expect(result.median).toBe(pop.median_log_engagement);
      expect(result.spread).toBe(pop.spread);
    });

    it('returns mostly cohort stats for large cohorts', () => {
      const cohort = makeCohortStats({ sample_size: 1000 });
      const pop = makePopulationStats();
      const result = applyShrinkage(cohort, pop);
      expect(result.shrinkageWeight).toBeGreaterThan(0.97);
      expect(result.median).toBeCloseTo(cohort.median_log_engagement, 1);
    });

    it('blends evenly at n=30', () => {
      const cohort = makeCohortStats({ sample_size: 30, median_log_engagement: -4.0, spread: 0.4 });
      const pop = makePopulationStats({ median_log_engagement: -2.0, spread: 0.8 });
      const result = applyShrinkage(cohort, pop);
      expect(result.shrinkageWeight).toBeCloseTo(0.5, 6);
      expect(result.median).toBeCloseTo(-3.0, 6);
      expect(result.spread).toBeCloseTo(0.6, 6);
    });
  });
});

// ── Viral Score ──────────────────────────────────────────────────────────────

describe('computeViralScore', () => {
  it('returns 0 deviation when engagement equals cohort median', () => {
    const median = Math.log(0.05);
    const score = computeViralScore(0.05, median, 0.5);
    expect(score).toBeCloseTo(0, 6);
  });

  it('returns positive for above-median engagement', () => {
    const median = Math.log(0.05);
    const score = computeViralScore(0.10, median, 0.5);
    expect(score).toBeGreaterThan(0);
  });

  it('returns negative for below-median engagement', () => {
    const median = Math.log(0.05);
    const score = computeViralScore(0.01, median, 0.5);
    expect(score).toBeLessThan(0);
  });

  it('returns -Infinity for zero engagement', () => {
    expect(computeViralScore(0, -3.0, 0.5)).toBe(-Infinity);
  });
});

// ── Time Decay ───────────────────────────────────────────────────────────────

describe('applyTimeDecay', () => {
  it('returns viral score unchanged at t=0 with alpha=0', () => {
    const result = applyTimeDecay(2.5, 0, 0);
    expect(result.timeAdjustedScore).toBeCloseTo(2.5, 10);
    expect(result.decayFactor).toBe(1.0);
  });

  it('decays score over time', () => {
    const early = applyTimeDecay(2.5, 1, 0.15);
    const late = applyTimeDecay(2.5, 24, 0.15);
    expect(late.timeAdjustedScore).toBeLessThan(early.timeAdjustedScore);
  });

  it('decay factor is (hours+1)^(-alpha)', () => {
    const result = applyTimeDecay(1.0, 9, 0.5);
    expect(result.decayFactor).toBeCloseTo(1 / Math.sqrt(10), 6);
    expect(result.timeAdjustedScore).toBeCloseTo(1.0 / Math.sqrt(10), 6);
  });

  it('handles negative hours gracefully (clamps to 0)', () => {
    const result = applyTimeDecay(2.0, -5, 0.15);
    expect(result.decayFactor).toBeCloseTo(1.0, 10);
  });
});

// ── Classification ───────────────────────────────────────────────────────────

describe('classifyDpsV2', () => {
  it('classifies mega-viral at 3.1', () => {
    const result = classifyDpsV2(3.1);
    expect(result.classification).toBe('mega-viral');
    expect(result.threshold_version).toBe(DEFAULT_THRESHOLDS.version);
  });

  it('classifies hyper-viral at 2.5', () => {
    expect(classifyDpsV2(2.5).classification).toBe('hyper-viral');
  });

  it('classifies viral at 1.7', () => {
    expect(classifyDpsV2(1.7).classification).toBe('viral');
  });

  it('classifies above-average at 1.0', () => {
    expect(classifyDpsV2(1.0).classification).toBe('above-average');
  });

  it('classifies above-average at 1.58', () => {
    expect(classifyDpsV2(1.58).classification).toBe('above-average');
  });

  it('classifies average at 0.0', () => {
    expect(classifyDpsV2(0.0).classification).toBe('average');
  });

  it('classifies below-average at -1.0', () => {
    expect(classifyDpsV2(-1.0).classification).toBe('below-average');
  });

  it('classifies poor for deeply negative scores', () => {
    expect(classifyDpsV2(-2.0).classification).toBe('poor');
  });

  it('respects custom thresholds', () => {
    const custom: DpsV2ThresholdSet = {
      version: 'custom-v1',
      viral: 1.0,
      hyper_viral: 2.0,
      mega_viral: 3.0,
      above_average: 0.5,
      average: -0.5,
      below_average: -1.5,
    };
    expect(classifyDpsV2(1.5, custom).classification).toBe('viral');
    expect(classifyDpsV2(1.5, custom).threshold_version).toBe('custom-v1');
  });
});

// ── Z-Score to Display Score ─────────────────────────────────────────────────

describe('zScoreToDisplayDps', () => {
  it('returns 50.0 for z=0 (cohort average)', () => {
    expect(zScoreToDisplayDps(0)).toBe(50.0);
  });

  it('returns ~95.0 for z=1.645 (viral threshold)', () => {
    const result = zScoreToDisplayDps(1.645);
    expect(result).toBeGreaterThan(94.5);
    expect(result).toBeLessThan(95.5);
  });

  it('returns ~99.0 for z=2.326 (hyper-viral threshold)', () => {
    const result = zScoreToDisplayDps(2.326);
    expect(result).toBeGreaterThan(98.5);
    expect(result).toBeLessThan(99.5);
  });

  it('returns ~99.9 for z=3.090 (mega-viral threshold)', () => {
    const result = zScoreToDisplayDps(3.090);
    expect(result).toBeGreaterThanOrEqual(99.9);
  });

  it('returns ~100.0 for z=7.77 (extreme viral)', () => {
    expect(zScoreToDisplayDps(7.77)).toBe(100.0);
  });

  it('returns ~15.9 for z=-1.0', () => {
    const result = zScoreToDisplayDps(-1.0);
    expect(result).toBeGreaterThan(15.4);
    expect(result).toBeLessThan(16.4);
  });

  it('is approximately symmetric: f(x) + f(-x) ~ 100', () => {
    const testValues = [0.5, 1.0, 1.5, 2.0];
    for (const z of testValues) {
      const sum = zScoreToDisplayDps(z) + zScoreToDisplayDps(-z);
      expect(sum).toBeCloseTo(100.0, 0);
    }
  });
});

// ── Follower Tier Bounds ─────────────────────────────────────────────────────

describe('computeFollowerTierBounds', () => {
  it('computes ±0.3 in log10 space', () => {
    const bounds = computeFollowerTierBounds(10000);
    expect(bounds.min).toBeCloseTo(Math.pow(10, 3.7), 0);
    expect(bounds.max).toBeCloseTo(Math.pow(10, 4.3), 0);
  });

  it('handles zero followers', () => {
    const bounds = computeFollowerTierBounds(0);
    expect(bounds.min).toBe(0);
    expect(bounds.max).toBe(10);
  });

  it('supports custom half-width', () => {
    const bounds = computeFollowerTierBounds(1000, 0.5);
    expect(bounds.min).toBeCloseTo(Math.pow(10, 2.5), 0);
    expect(bounds.max).toBeCloseTo(Math.pow(10, 3.5), 0);
  });
});

// ── Full Pipeline (computeDpsV2) ─────────────────────────────────────────────

describe('computeDpsV2', () => {
  it('produces a complete breakdown with all metadata fields', () => {
    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });

    const b = result.breakdown;
    expect(b.formula_version).toBe(DPS_V2_FORMULA_VERSION);
    expect(b.formula_version).toBe('2.1.0');

    // All original signal fields present
    expect(b.signals.completion_rate).not.toBeNull();
    expect(b.signals.share_rate).not.toBeNull();
    expect(b.signals.save_rate).not.toBeNull();
    expect(b.signals.velocity_score).not.toBeNull();
    expect(b.signals.view_to_follower_ratio).not.toBeNull();
    expect(b.signals.comment_rate).not.toBeNull();

    // v2.1 signals
    expect(b.signals.reach_score).not.toBeNull();
    // view_percentile_within_cohort should be null (no cohort_view_counts provided)
    expect(b.signals.view_percentile_within_cohort).toBeNull();

    // Weight fields
    expect(b.weight_was_redistributed).toBe(true); // view_percentile is null -> redistributed
    expect(Object.values(b.effective_weights).reduce((a, c) => a + c, 0)).toBeCloseTo(1.0, 10);

    // v2.1 breakdown fields
    expect(b.weight_tier).toBe(3); // velocity + completion both present
    expect(b.reach_score).not.toBeNull();
    expect(b.view_percentile_within_cohort).toBeNull();
    expect(typeof b.display_score).toBe('number');
    expect(b.display_score).toBeGreaterThanOrEqual(0);
    expect(b.display_score).toBeLessThanOrEqual(100);

    // Result has display_score
    expect(typeof result.display_score).toBe('number');

    // Scores
    expect(typeof b.composite_engagement).toBe('number');
    expect(typeof b.log_engagement).toBe('number');
    expect(typeof b.viral_score).toBe('number');
    expect(typeof b.time_adjusted_score).toBe('number');

    // Cohort
    expect(b.cohort_sample_size).toBe(100);
    expect(b.shrinkage_weight).toBeGreaterThan(0.7);

    // Classification
    expect(['mega-viral', 'hyper-viral', 'viral', 'above-average', 'average', 'below-average', 'poor']).toContain(result.tier);
    expect(b.threshold_version).toBe(DEFAULT_THRESHOLDS.version);
  });

  it('computes view_percentile_within_cohort when cohort_view_counts provided', () => {
    const cohortViews = [100, 500, 1000, 5000, 10000, 50000, 100000];
    const result = computeDpsV2({
      raw: makeRaw({ views: 10000 }),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
      cohort_view_counts: cohortViews,
    });

    expect(result.breakdown.signals.view_percentile_within_cohort).not.toBeNull();
    expect(result.breakdown.view_percentile_within_cohort).not.toBeNull();
    // 10000 views: 4 below (100,500,1000,5000), 1 equal (10000) => (4 + 0.5)/7 ~ 0.643
    expect(result.breakdown.signals.view_percentile_within_cohort).toBeCloseTo(4.5 / 7, 3);
  });

  it('leaves view_percentile null when no cohort_view_counts', () => {
    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });
    expect(result.breakdown.signals.view_percentile_within_cohort).toBeNull();
    expect(result.breakdown.view_percentile_within_cohort).toBeNull();
  });

  it('leaves view_percentile null when cohort_view_counts is empty', () => {
    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
      cohort_view_counts: [],
    });
    expect(result.breakdown.signals.view_percentile_within_cohort).toBeNull();
  });

  it('selects correct weight tier based on signal availability', () => {
    // Tier 3: velocity + completion present
    const tier3 = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });
    expect(tier3.breakdown.weight_tier).toBe(3);

    // Tier 2: velocity present, completion absent
    const tier2 = computeDpsV2({
      raw: makeRaw({ avg_watch_time_seconds: null, video_duration_seconds: null }),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });
    expect(tier2.breakdown.weight_tier).toBe(2);

    // Tier 1: velocity absent
    const tier1 = computeDpsV2({
      raw: makeRaw({ interactions_first_3h: null, avg_watch_time_seconds: null, video_duration_seconds: null }),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });
    expect(tier1.breakdown.weight_tier).toBe(1);
  });

  it('returns incomplete when follower_count is zero', () => {
    const raw = makeRaw({
      views: 0,
      avg_watch_time_seconds: null,
      interactions_first_3h: null,
      follower_count: 0,
    });
    const result = computeDpsV2({
      raw,
      cohortStats: makeCohortStats({ sample_size: 5 }),
      populationStats: makePopulationStats(),
    });

    expect(result.tier).toBe('incomplete');
    expect(result.score).toBeNull();
    expect(result.display_score).toBeNull();
    expect(result.breakdown).toBeNull();
    expect(result.dps_v2_incomplete).toBe(true);
    expect(result.dps_v2_incomplete_reason).toContain('follower_count');
  });

  it('applies shrinkage for small cohorts', () => {
    const smallCohort = makeCohortStats({ sample_size: 5, median_log_engagement: -5.0 });
    const pop = makePopulationStats({ median_log_engagement: -2.0 });

    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: smallCohort,
      populationStats: pop,
    });

    expect(result.breakdown.shrinkage_weight).toBeCloseTo(5 / 35, 3);
    expect(result.breakdown.effective_median).toBeGreaterThan(-5.0);
    expect(result.breakdown.effective_median).toBeLessThan(-2.0);
  });

  it('respects custom alpha for time decay', () => {
    const base = computeDpsV2({
      raw: makeRaw({ hours_since_post: 24 }),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
      alpha: 0.1,
    });
    const steep = computeDpsV2({
      raw: makeRaw({ hours_since_post: 24 }),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
      alpha: 0.5,
    });

    expect(Math.abs(steep.breakdown.time_adjusted_score)).toBeLessThan(
      Math.abs(base.breakdown.time_adjusted_score)
    );
  });

  it('uses custom thresholds when provided', () => {
    const lenient: DpsV2ThresholdSet = {
      version: 'lenient-v1',
      viral: 0.1,
      hyper_viral: 0.5,
      mega_viral: 1.0,
    };
    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
      thresholds: lenient,
    });
    expect(result.breakdown.threshold_version).toBe('lenient-v1');
  });

  it('display_score matches zScoreToDisplayDps of time_adjusted_score', () => {
    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });
    const expected = zScoreToDisplayDps(result.breakdown.time_adjusted_score);
    expect(result.display_score).toBe(expected);
    expect(result.breakdown.display_score).toBe(expected);
  });
});

// ── Label Write Payload ──────────────────────────────────────────────────────

describe('buildDpsV2LabelPayload', () => {
  it('builds a complete payload matching schema columns', () => {
    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });
    const payload = buildDpsV2LabelPayload({
      run_id: 'test-run-123',
      raw_metrics: makeRaw(),
      breakdown: result.breakdown,
      dps_score: result.score,
      tier: result.tier,
      label_trust: 'high',
      training_weight: 1.0,
    });

    expect(payload.dps_formula_version).toBe(DPS_V2_FORMULA_VERSION);
    expect(payload.dps_label_trust).toBe('high');
    expect(payload.dps_training_weight).toBe(1.0);
    expect(payload.actual_dps).toBe(result.score);
    expect(payload.actual_tier).toBe(result.tier);
    expect(payload.dps_v2_breakdown).toBe(result.breakdown);
    expect(payload.actual_hours_since_post).toBe(6);
    expect(payload.dps_cohort_sample_size).toBe(100);
    expect(payload.dps_threshold_version).toBe(DEFAULT_THRESHOLDS.version);

    // v2.1 additions
    expect(payload.actual_reach_score).toBe(result.breakdown.signals.reach_score);
    expect(payload.actual_view_percentile_within_cohort).toBe(result.breakdown.signals.view_percentile_within_cohort);
    expect(payload.dps_v2_weight_tier).toBe(result.breakdown.weight_tier);
    expect(payload.dps_v2_display_score).toBe(result.breakdown.display_score);
  });

  it('builds incomplete payload when follower_count is missing', () => {
    const raw = makeRaw({ views: 0, avg_watch_time_seconds: null, interactions_first_3h: null, follower_count: 0 });
    const result = computeDpsV2({
      raw,
      cohortStats: makeCohortStats({ sample_size: 3 }),
      populationStats: makePopulationStats(),
    });

    expect(result.dps_v2_incomplete).toBe(true);

    const payload = buildDpsV2LabelPayload({
      run_id: 'test',
      raw_metrics: raw,
      breakdown: result.breakdown,
      dps_score: result.score,
      tier: result.tier,
      label_trust: 'low',
      training_weight: 0.1,
      dps_v2_incomplete: result.dps_v2_incomplete,
      dps_v2_incomplete_reason: result.dps_v2_incomplete_reason,
    });

    expect(payload.dps_v2_incomplete).toBe(true);
    expect(payload.actual_dps).toBeNull();
    expect(payload.dps_v2_display_score).toBeNull();
    expect(payload.actual_tier).toBe('incomplete');
    expect(payload.dps_training_weight).toBe(0);
  });
});

// ── Label Write (DB stub) ────────────────────────────────────────────────────

describe('labelPredictionRunWithDpsV2', () => {
  it('calls supabase update and returns success', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockClient = {
      from: jest.fn().mockReturnValue({ update: mockUpdate }),
    };

    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });

    const writeResult = await labelPredictionRunWithDpsV2(mockClient, {
      run_id: 'run-abc',
      raw_metrics: makeRaw(),
      breakdown: result.breakdown,
      dps_score: result.score,
      tier: result.tier,
      label_trust: 'medium',
      training_weight: 0.5,
    });

    expect(writeResult.success).toBe(true);
    expect(writeResult.run_id).toBe('run-abc');
    expect(mockClient.from).toHaveBeenCalledWith('prediction_runs');
  });

  it('returns error on DB failure', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    });
    const mockClient = {
      from: jest.fn().mockReturnValue({ update: mockUpdate }),
    };

    const result = computeDpsV2({
      raw: makeRaw(),
      cohortStats: makeCohortStats(),
      populationStats: makePopulationStats(),
    });

    const writeResult = await labelPredictionRunWithDpsV2(mockClient, {
      run_id: 'run-fail',
      raw_metrics: makeRaw(),
      breakdown: result.breakdown,
      dps_score: result.score,
      tier: result.tier,
      label_trust: 'low',
      training_weight: 0.0,
    });

    expect(writeResult.success).toBe(false);
    expect(writeResult.error).toBe('DB error');
  });
});
