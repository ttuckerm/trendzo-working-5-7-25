// Expected first-hour telemetry mapping and aggregation utilities

export type ExpectedFirstHourProfile = {
  retentionSlope: number; // negative slope per hour (e.g., -0.12)
  sharesPer1k: number; // shares per 1000 views in first hour
  rewatchesRate: number; // fraction of viewers who rewatch in first hour
};

export type TokenToExpectedFirstHour = Record<string, ExpectedFirstHourProfile>;

// Baseline per-token expected first-hour profiles
// These are conservative, research-derived defaults that can be tuned over time.
export const EXPECTED_FIRST_HOUR_BY_TOKEN: TokenToExpectedFirstHour = {
  // Core pattern/framework tokens
  hook: { retentionSlope: -0.11, sharesPer1k: 7.0, rewatchesRate: 0.055 },
  story: { retentionSlope: -0.095, sharesPer1k: 7.8, rewatchesRate: 0.062 },
  pov: { retentionSlope: -0.108, sharesPer1k: 6.2, rewatchesRate: 0.056 },
  before_after: { retentionSlope: -0.125, sharesPer1k: 8.6, rewatchesRate: 0.068 },
  tutorial: { retentionSlope: -0.142, sharesPer1k: 5.2, rewatchesRate: 0.046 },
  controversy: { retentionSlope: -0.088, sharesPer1k: 9.5, rewatchesRate: 0.073 },
  challenge: { retentionSlope: -0.12, sharesPer1k: 8.2, rewatchesRate: 0.060 },
  duet: { retentionSlope: -0.115, sharesPer1k: 6.8, rewatchesRate: 0.058 },
  greenscreen: { retentionSlope: -0.135, sharesPer1k: 5.6, rewatchesRate: 0.050 },
  listicle: { retentionSlope: -0.118, sharesPer1k: 6.9, rewatchesRate: 0.057 },
  reaction: { retentionSlope: -0.112, sharesPer1k: 7.3, rewatchesRate: 0.060 },
  behind_the_scenes: { retentionSlope: -0.105, sharesPer1k: 6.4, rewatchesRate: 0.054 },
  educational: { retentionSlope: -0.138, sharesPer1k: 5.4, rewatchesRate: 0.047 },
  giveaway: { retentionSlope: -0.11, sharesPer1k: 7.9, rewatchesRate: 0.061 },
  skit: { retentionSlope: -0.107, sharesPer1k: 7.1, rewatchesRate: 0.059 },
  review: { retentionSlope: -0.13, sharesPer1k: 6.0, rewatchesRate: 0.052 },

  // Generic trend tokens (down-weighted via weights below)
  fyp: { retentionSlope: -0.12, sharesPer1k: 6.0, rewatchesRate: 0.05 },
  viral: { retentionSlope: -0.12, sharesPer1k: 6.0, rewatchesRate: 0.05 },
  trending: { retentionSlope: -0.12, sharesPer1k: 6.0, rewatchesRate: 0.05 },
};

// Token weights: emphasize concrete framework patterns; de-emphasize generic tags
const TOKEN_WEIGHTS: Record<string, number> = {
  // Generic, low-signal tokens
  fyp: 0.2,
  viral: 0.2,
  trending: 0.2,
  // Slight boost to concrete frameworks/patterns
  hook: 1.2,
  story: 1.2,
  pov: 1.1,
  before_after: 1.3,
  tutorial: 1.1,
  controversy: 1.3,
  challenge: 1.2,
  duet: 1.1,
  greenscreen: 1.1,
  listicle: 1.15,
  reaction: 1.15,
  behind_the_scenes: 1.1,
  educational: 1.05,
  giveaway: 1.1,
  skit: 1.15,
  review: 1.05,
};

export function mergeExpectedFirstHourForTokens(tokens: string[]): ExpectedFirstHourProfile | null {
  const normed = tokens
    .map(t => t?.toLowerCase?.().trim?.())
    .filter(Boolean);
  const items = normed
    .map(t => ({ t, p: EXPECTED_FIRST_HOUR_BY_TOKEN[t!], w: TOKEN_WEIGHTS[t!] ?? 1.0 }))
    .filter(x => Boolean(x.p));
  if (items.length === 0) return null;
  let wsum = 0;
  const sum = items.reduce((acc, x) => {
    const w = Math.max(0.05, x.w);
    wsum += w;
    acc.retentionSlope += x.p!.retentionSlope * w;
    acc.sharesPer1k += x.p!.sharesPer1k * w;
    acc.rewatchesRate += x.p!.rewatchesRate * w;
    return acc;
  }, { retentionSlope: 0, sharesPer1k: 0, rewatchesRate: 0 } as ExpectedFirstHourProfile);
  return {
    retentionSlope: sum.retentionSlope / wsum,
    sharesPer1k: sum.sharesPer1k / wsum,
    rewatchesRate: sum.rewatchesRate / wsum,
  };
}

export type FirstHourTelemetryPoint = {
  ts: string; // ISO timestamp
  views: number;
  unique_viewers: number;
  avg_watch_pct: number; // 0..1
  completion_rate: number; // 0..1
  rewatches: number;
  shares: number;
  saves: number;
  comments: number;
};

export function computeAlignmentFactor(
  telemetryPoints: FirstHourTelemetryPoint[],
  expected: ExpectedFirstHourProfile
): { alignmentFactor: number; details: Record<string, number> } {
  if (!telemetryPoints?.length) return { alignmentFactor: 1.0, details: {} };

  // Use latest point for instantaneous rates and rough slope from last two points
  const sorted = [...telemetryPoints].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : latest;

  const views = Math.max(1, latest.views);
  const sharesPer1k = (latest.shares / views) * 1000;
  const rewatchesRate = Math.max(0, Math.min(1, latest.rewatches / Math.max(1, latest.unique_viewers)));

  // Estimate retention slope per hour from avg_watch_pct change per minute window
  const dtHours = Math.max(1 / 60, (new Date(latest.ts).getTime() - new Date(prev.ts).getTime()) / 3600000);
  const retentionSlope = (latest.avg_watch_pct - prev.avg_watch_pct) / dtHours; // typically negative

  // Z of slope vs expected, normalized; and delta of shares per 1k vs expected
  const slopeDelta = retentionSlope - expected.retentionSlope; // closer to 0 is good
  const slopeZ = slopeDelta / Math.max(0.01, Math.abs(expected.retentionSlope) * 0.5); // tolerate 50% band
  const sharesDelta = (sharesPer1k - expected.sharesPer1k) / Math.max(1, expected.sharesPer1k);
  const rewatchesDelta = (rewatchesRate - expected.rewatchesRate) / Math.max(0.01, expected.rewatchesRate);

  // Combine into alignment factor around 1.0, weighted
  let factor = 1 + (Math.max(-2, Math.min(2, -slopeZ)) * 0.02) + (sharesDelta * 0.10) + (rewatchesDelta * 0.05);

  // Clamp to [0.85, 1.15]
  factor = Math.max(0.85, Math.min(1.15, factor));

  return {
    alignmentFactor: Number(factor.toFixed(4)),
    details: {
      slopeZ: Number(Math.max(-9, Math.min(9, slopeZ)).toFixed(3)),
      sharesPer1k: Number(sharesPer1k.toFixed(3)),
      rewatchesRate: Number(rewatchesRate.toFixed(4)),
    }
  };
}


