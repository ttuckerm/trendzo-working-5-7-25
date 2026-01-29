/**
 * Synthetic Audience Simulator (10k viewers)
 *
 * Simulates viewer-level outcomes using:
 * - Token-derived expected first-hour profile (lifts)
 * - Framework profile (overallScore and top frameworks)
 * - Timing score (trend nowcast alignment)
 * - Creator fingerprint/personalization factor
 *
 * Outputs aggregate metrics and a sim_score used by the unified engine.
 */

import { mergeExpectedFirstHourForTokens } from '@/lib/frameworks/mapping_guide'

export type FrameworkProfile = {
  overallScore: number; // 0..1
  topFrameworks?: Array<{ name: string; score: number; weight?: number }>
}

export type AudienceParams = {
  niche?: string;
  cohort?: string; // e.g., follower band label
  platform?: 'tiktok' | 'instagram' | 'youtube';
  tokens?: string[]; // framework/pattern tokens
  frameworkProfile: FrameworkProfile;
  timingScore: number; // ~ [0.9, 1.12]
  personalizationFactor: number; // ~ [0.9, 1.12]
  impressions?: number; // default 10000
  videoFeatures?: {
    hookStrength?: number; // 0..1
    durationSeconds?: number; // used to shape completion
  }
}

export type AudienceOutcome = {
  impressions: number;
  ctr: number; // 0..1
  completion: number; // avg watch % 0..1
  rewatches_rate: number; // fraction of viewers who rewatched at least once
  shares: number; // count over impressions
  saves: number; // count over impressions
  comments: number; // count over impressions
  bounce_rate: number; // left <10%
  shares_per_1k: number;
  saves_per_1k: number;
  comments_per_1k: number;
  sim_score: number; // completion × share/save velocity (per viewer)
  snapshot: {
    expected_profile: { retentionSlope: number; sharesPer1k: number; rewatchesRate: number } | null;
    effective_multipliers: { timingScore: number; personalizationFactor: number; framework: number };
    tokens: string[];
  }
}

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x))
}

function randn(): number {
  // Box-Muller
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export function simulateAudience(params: AudienceParams): AudienceOutcome {
  const impressions = Math.max(1, Math.floor(params.impressions ?? 10000))
  const tokens = Array.isArray(params.tokens) ? params.tokens : []
  const expected = mergeExpectedFirstHourForTokens(tokens) || { retentionSlope: -0.12, sharesPer1k: 6.0, rewatchesRate: 0.05 }

  const framework = clamp(params.frameworkProfile?.overallScore ?? 0.5, 0, 1)
  const timing = clamp(params.timingScore || 1.0, 0.8, 1.2)
  const personal = clamp(params.personalizationFactor || 1.0, 0.8, 1.2)
  const durationSec = Math.max(5, Math.min(120, params.videoFeatures?.durationSeconds ?? 22))
  const hook = clamp(params.videoFeatures?.hookStrength ?? (0.4 + 0.4 * framework), 0, 1)

  // CTR modeled from hook strength and timing/personalization
  const baseCtr = 0.05 + 0.20 * hook // 5% to ~25%
  const ctr = clamp(baseCtr * Math.pow(timing * personal, 0.5), 0.02, 0.35)

  let watches = Math.round(impressions * ctr)
  let totalWatchPct = 0
  let rewatchers = 0
  let shares = 0
  let saves = 0
  let comments = 0
  let bounces = 0

  // Per-viewer propensities derived from expected profile
  const sharePBase = clamp(expected.sharesPer1k / 1000, 0.001, 0.05) // 1 to 50 per 1k baseline
  const rewatchPBase = clamp(expected.rewatchesRate, 0.0, 0.5)
  const savePBase = clamp(sharePBase * 0.8, 0.0005, 0.04)
  const commentPBase = 0.01 + 0.02 * framework // 1% to 3%

  const interestLift = clamp(0.85 + 0.4 * framework, 0.85, 1.25)
  const globalLift = clamp(timing * personal * interestLift, 0.7, 1.4)

  for (let i = 0; i < watches; i++) {
    // Intrinsic interest per viewer
    const interest = clamp(hook * (1 + 0.25 * randn()), 0, 1)
    // Completion shaped by duration and framework
    const durationNorm = clamp(30 / durationSec, 0.5, 1.2)
    const baseCompletion = clamp(0.28 + 0.35 * framework, 0.1, 0.9)
    const completion = clamp(baseCompletion * durationNorm * (1 + 0.15 * randn()) * globalLift, 0, 1)
    totalWatchPct += completion
    if (completion < 0.1) bounces++

    // Rewatch
    const pRewatch = clamp(rewatchPBase * (0.6 + 0.8 * interest) * globalLift, 0, 0.8)
    if (Math.random() < pRewatch) rewatchers++

    // Share, Save, Comment
    const pShare = clamp(sharePBase * (0.5 + 1.1 * completion) * globalLift, 0, 0.5)
    const pSave = clamp(savePBase * (0.4 + 1.0 * completion) * globalLift, 0, 0.4)
    const pComment = clamp(commentPBase * (0.3 + 0.9 * interest) * Math.sqrt(globalLift), 0, 0.3)
    if (Math.random() < pShare) shares++
    if (Math.random() < pSave) saves++
    if (Math.random() < pComment) comments++
  }

  const completionAvg = watches > 0 ? totalWatchPct / watches : 0
  const rewatchesRate = watches > 0 ? rewatchers / watches : 0
  const bounceRate = watches > 0 ? bounces / watches : 0

  const sharesPer1k = impressions > 0 ? (shares / impressions) * 1000 : 0
  const savesPer1k = impressions > 0 ? (saves / impressions) * 1000 : 0
  const commentsPer1k = impressions > 0 ? (comments / impressions) * 1000 : 0

  // sim_score definition: completion × share/save velocity (per viewer), normalized to ~1.0 baseline
  const shareSaveVelocity = (sharesPer1k + 0.5 * savesPer1k) / 1000 // per viewer
  const rawSim = completionAvg * shareSaveVelocity
  const baseline = 0.35 * (7.0 / 1000) // ~0.00245 baseline
  let simScore = rawSim / Math.max(1e-6, baseline)
  // So simScore ~ 1.0 around baseline

  const outcome: AudienceOutcome = {
    impressions,
    ctr: Number(ctr.toFixed(4)),
    completion: Number(completionAvg.toFixed(4)),
    rewatches_rate: Number(rewatchesRate.toFixed(4)),
    shares,
    saves,
    comments,
    bounce_rate: Number(bounceRate.toFixed(4)),
    shares_per_1k: Number(sharesPer1k.toFixed(2)),
    saves_per_1k: Number(savesPer1k.toFixed(2)),
    comments_per_1k: Number(commentsPer1k.toFixed(2)),
    sim_score: Number(simScore.toFixed(3)),
    snapshot: {
      expected_profile: expected,
      effective_multipliers: { timingScore: Number(timing.toFixed(3)), personalizationFactor: Number(personal.toFixed(3)), framework: Number(framework.toFixed(3)) },
      tokens
    }
  }
  return outcome
}

export type CounterfactualVariant = {
  id: string;
  tokens: string[];
  edits: string[];
  delta?: number;
  sim_score?: number;
  summary?: string;
}

export function generateVariants(base: AudienceParams, count = 5): CounterfactualVariant[] {
  const candidates: Array<{ id: string; add: string[]; remove?: string[]; edits: string[]; summary: string }> = [
    { id: 'v1', add: ['hook'], edits: ['Strengthen hook in first 3s'], summary: 'Add strong hook' },
    { id: 'v2', add: ['controversy'], edits: ['Introduce polarizing statement'], summary: 'Add controversy' },
    { id: 'v3', add: ['before_after'], edits: ['Add clear before/after sequence'], summary: 'Add before/after' },
    { id: 'v4', add: ['story'], edits: ['Narrative arc with payoff'], summary: 'Add story arc' },
    { id: 'v5', add: ['tutorial'], edits: ['Tighter instructional pacing'], summary: 'Add tutorial pacing' }
  ]
  const tokens = Array.isArray(base.tokens) ? base.tokens : []
  const rng = candidates.slice(0, count)
  const out: CounterfactualVariant[] = []
  for (const c of rng) {
    const tset = Array.from(new Set([...tokens, ...c.add])).filter(Boolean)
    const params: AudienceParams = { ...base, tokens: tset }
    const sim = simulateAudience(params)
    out.push({ id: c.id, tokens: tset, edits: c.edits, sim_score: sim.sim_score, summary: c.summary })
  }
  // Compute deltas vs baseline
  const baseSim = simulateAudience(base)
  out.forEach(v => { v.delta = Number(((v.sim_score! - baseSim.sim_score) * 100).toFixed(2)) })
  // Sort by sim_score desc
  out.sort((a,b)=> (b.sim_score||0) - (a.sim_score||0))
  return out
}








