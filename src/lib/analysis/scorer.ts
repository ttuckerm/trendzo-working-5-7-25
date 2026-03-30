import { VIT } from '@/lib/vit/vit'
import { VIRAL_RULE } from '@/lib/vit/compute'
import { extractFeatures, FeatureSummary } from './features'
import { getModelForScorer, applyCalibration, weightedCombine } from '@/lib/learning/apply'
import { VIRAL_PERCENTILE_THRESHOLDS, PLATFORM_WEIGHTS } from '@/config/viral-thresholds'

export interface ScoreInput {
  videoVIT?: VIT
  script?: { text?: string }
  metadata?: { platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'; niche?: string; durationSec?: number; fps?: number; caption?: string }
}

export interface ScoreOutput {
  probability: number
  confidence: number
  reasons: string[]
  frameworkMatches: Array<{ id: string; score: number; name: string }>
  features: FeatureSummary
}

function sigmoid(x: number): number { return 1 / (1 + Math.exp(-x)) }

export async function scoreDraft(input: ScoreInput): Promise<ScoreOutput> {
  const model = await getModelForScorer()
  const f = extractFeatures({ videoVIT: input.videoVIT, script: input.script, metadata: input.metadata })

  // Base probability from hook, pacing, cuts, caption density, CTA
  const hook = f.hookStrength
  const pacingScore = f.pacing === 'fast' ? 1 : f.pacing === 'medium' ? 0.6 : 0.3
  const cutScore = Math.min(f.estimatedCuts / 20, 1)
  const captionScore = f.captionDensity
  const ctaScore = f.hasCTA ? 0.7 : 0
  const frameworkBoost = f.keywordMatches.length > 0 ? Math.min(f.keywordMatches[0].score, 1) : 0

  // Platform weight
  const platform = input.metadata?.platform || input.videoVIT?.platform || 'tiktok'
  const platformWeight = (PLATFORM_WEIGHTS as any)[platform] || 1

  const linear = 0.35 * hook + 0.20 * pacingScore + 0.15 * cutScore + 0.10 * captionScore + 0.10 * ctaScore + 0.10 * frameworkBoost
  const baseProb = sigmoid((linear * 2.5 - 1) * platformWeight)

  // Learning model weights blend (subscores normalized to [0,1])
  const subs = {
    hook,
    clarity: Math.max(0, Math.min(1, captionScore)),
    pacing: pacingScore,
    novelty: cutScore,
    platformFit: Math.max(0, Math.min(1, platformWeight / 1.2)),
    socialProof: Math.max(0, Math.min(1, (input.videoVIT?.baselines?.percentile ?? 50) / 100))
  }
  const weighted = weightedCombine(subs as any, model)
  let combined = Math.max(0, Math.min(1, 0.5 * baseProb + 0.5 * weighted))

  // Calibrated with viral rule and percentile threshold (mock-friendly)
  const meetsRule = (input.videoVIT?.baselines?.zScore ?? 0) >= VIRAL_RULE.z && (input.videoVIT?.baselines?.percentile ?? 0) >= VIRAL_RULE.p
  const percentile = input.videoVIT?.baselines?.percentile ?? Math.round(baseProb * 100)
  const nearViral = percentile >= VIRAL_PERCENTILE_THRESHOLDS.trending
  let probability = clamp(combined + (meetsRule ? 0.15 : nearViral ? 0.05 : 0), 0, 1)
  probability = applyCalibration(probability, model)

  // Confidence: quality of inputs + alignment with frameworks
  const infoQuality = 0.4 * (input.script?.text ? 1 : 0.6) + 0.4 * (f.durationSec > 0 ? 1 : 0.5) + 0.2 * (f.keywordMatches.length > 0 ? 1 : 0.6)
  const calibrationAdj = meetsRule ? 0.2 : 0
  const confidence = clamp(infoQuality + calibrationAdj, 0, 1)

  const reasons: string[] = []
  if (hook >= 0.6) reasons.push('strong opening hook')
  if (f.pacing === 'fast') reasons.push('fast pacing aligns with platform norms')
  if (f.hasCTA) reasons.push('explicit CTA present')
  if (frameworkBoost > 0.5) reasons.push('matches high-performing framework')
  if (percentile >= VIRAL_PERCENTILE_THRESHOLDS.viral) reasons.push('projected ≥95th percentile performance')

  return { probability, confidence, reasons, frameworkMatches: f.keywordMatches, features: f }
}

function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)) }


