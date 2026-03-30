import { ScriptFeatures } from './features'
import { getModelForScorer, applyCalibration } from '@/lib/learning/apply'
import type { LearningModel } from '@/lib/learning/types'
import { SCRIPT_PATTERNS } from './patterns'

type Confidence = 'low'|'med'|'high'

export async function scoreScript(args: {
  features: ScriptFeatures
  platform: string
  niche?: string
  matchedPatterns: { id: string; score: number }[]
  recipeSupport?: number // 0..1 from recipe-book SR
  model?: LearningModel
}) {
  const model = args.model || await getModelForScorer()
  const platform = (args.platform || 'tiktok').toLowerCase()
  const top = args.matchedPatterns[0]
  const hookSub = computeHookSub(args.features)
  const claritySub = computeClaritySub(args.features)
  const pacingSub = computePacingSub(args.features, platform)
  const noveltySub = Math.max(0, Math.min(1, args.features.uniqueNgrams / Math.max(1, args.features.words)))
  const platformFitSub = computePlatformFit(platform, top?.id, args.features)
  const ctaSub = args.features.ctaDetected ? 0.8 : 0.2
  const recipeSub = Math.max(0, Math.min(1, args.recipeSupport ?? 0.5))

  const linear = 0.30*hookSub + 0.18*claritySub + 0.18*pacingSub + 0.14*noveltySub + 0.12*platformFitSub + 0.08*ctaSub
  let prob = clamp(0.15 + 0.85*linear, 0, 1)

  // Blend using learning model weights (map to available names)
  const subsAsModel = {
    hook: hookSub,
    clarity: claritySub,
    pacing: pacingSub,
    novelty: noveltySub,
    platformFit: platformFitSub,
    socialProof: recipeSub
  }
  prob = clamp(0.5 * prob + 0.5 * weightedCombine(subsAsModel, model), 0, 1)

  // Boost if strong match to top patterns
  if (top && top.score >= 0.85) prob = clamp(prob + 0.05, 0, 1)

  // Apply calibration
  prob = applyCalibration(prob, model)

  const confidence: Confidence = prob >= 0.75 ? 'high' : prob >= 0.5 ? 'med' : 'low'

  return {
    probScript: prob,
    confidence,
    breakdown: {
      Hook: round2(hookSub),
      Clarity: round2(claritySub),
      Pacing: round2(pacingSub),
      Novelty: round2(noveltySub),
      PlatformFit: round2(platformFitSub),
      CTA: round2(ctaSub)
    },
    matchedPatterns: args.matchedPatterns
  }
}

function computeHookSub(f: ScriptFeatures): number {
  const strongQuestion = f.questions > 0 ? 0.75 : 0
  const numbers = f.numbers > 0 ? 0.2 : 0
  const pov = f.povDetected ? 0.15 : 0
  const exclaim = Math.min(0.1, f.exclaims * 0.05)
  return clamp(strongQuestion + numbers + pov + exclaim, 0, 1)
}

function computeClaritySub(f: ScriptFeatures): number {
  const lenPenalty = f.avgWordsPerSentence <= 20 ? 1 : f.avgWordsPerSentence <= 28 ? 0.8 : 0.6
  return clamp(0.5 * f.readingScore + 0.5 * lenPenalty, 0, 1)
}

function computePacingSub(f: ScriptFeatures, platform: string): number {
  // Target words per minute: TT/IG ~120–140, YT ~140–160, LI ~120–140. Estimate duration from 140 wpm baseline
  const wpmTarget = platform.includes('youtube') ? 150 : 130
  const estSec = Math.max(10, Math.round((f.words / wpmTarget) * 60))
  const diff = Math.abs(estSec - idealDuration(platform))
  return clamp(1 - diff / Math.max(20, idealDuration(platform)), 0, 1)
}

function computePlatformFit(platform: string, patternId: string|undefined, f: ScriptFeatures): number {
  const pat = SCRIPT_PATTERNS.find(p => p.id === patternId)
  const fit = pat?.platformFits?.[platform as any]
  const wpm = 135
  const estSec = Math.max(10, Math.round((f.words / wpm) * 60))
  if (!fit) return 0.6
  const within = estSec >= fit.durationRange[0] && estSec <= fit.durationRange[1]
  return within ? 1 : 0.6
}

function idealDuration(platform: string): number {
  if (platform.includes('youtube')) return 90
  if (platform.includes('linkedin')) return 60
  return 30
}

function weightedCombine(subs: { [k: string]: number }, model: LearningModel): number {
  const w = model.weights
  const total = (subs.hook||0)*w.hook + (subs.clarity||0)*w.clarity + (subs.pacing||0)*w.pacing + (subs.novelty||0)*w.novelty + (subs.platformFit||0)*w.platformFit + (subs.socialProof||0)*(w as any).socialProof
  const denom = w.hook + w.clarity + w.pacing + w.novelty + w.platformFit + (w as any).socialProof
  return denom > 0 ? total / denom : 0.5
}

function clamp(x: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, x)) }
function round2(x: number) { return Math.round(x * 100) / 100 }








































































































































