import { randomUUID } from 'crypto'
import { ViralPredictionModel } from '@/lib/services/viral-prediction-model'
import { applyCalibration, calibrationVersion, cohortString } from '@/lib/recs/calibration'
import type { ExtractedFeatures } from '@/lib/services/feature-extractor'

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin'

export interface RankCandidateInput {
  id: string
  features?: ExtractedFeatures
  creatorId?: string
  topicId?: string
  hoursSinceUpload?: number
  exposureCount?: number
}

export interface RankerRequest {
  platform: Platform
  topK: number
  cohort?: string | null
  candidates: RankCandidateInput[]
}

export interface CI {
  lo: number
  hi: number
  width: number
}

export interface RankerItem {
  id: string
  rank: number
  scores: {
    watch_time_s: number
    share_prob: number
    regret_prob: number
    composite: number
  }
  ci: {
    share_prob: CI
    regret_prob: CI
  }
  reasons: string[]
  constraintsApplied: string[]
  meta?: {
    creatorId?: string
    topicId?: string
  }
}

export interface RankerResponse {
  auditId: string
  alg_version: string
  calibration_version: string
  topK: number
  items: RankerItem[]
}

const ALG_VERSION = 'cap320-v0.1'
const CAL_VERSION = calibrationVersion()

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)) }

function calibrateProbability(p: number): { p: number; ci: CI } {
  // Placeholder calibration: identity with CI based on confidence proxy
  const pp = clamp(p, 0.01, 0.99)
  // Wider CI near extremes to encourage exploration in CAP-330
  const baseWidth = 0.18 - Math.abs(pp - 0.5) * 0.16
  const width = clamp(baseWidth, 0.06, 0.2)
  const lo = clamp(pp - width / 2, 0.0, 1.0)
  const hi = clamp(pp + width / 2, 0.0, 1.0)
  return { p: pp, ci: { lo, hi, width: +(width.toFixed(3)) } }
}

function expectedWatchTimeSeconds(features: ExtractedFeatures, viralProbability: number): number {
  const duration = Number(features?.structural?.duration ?? 30)
  const retention = clamp(0.3 + viralProbability * 0.6, 0.2, 0.95)
  return Math.round(duration * retention)
}

function normalizeWatchTime(wtSeconds: number): number {
  // Normalize to ~[0,1] by capping at 60s
  const capped = Math.min(60, Math.max(1, wtSeconds))
  return capped / 60
}

function freshnessBoost(hoursSinceUpload?: number): number {
  if (hoursSinceUpload == null) return 0
  if (hoursSinceUpload <= 6) return 0.06
  if (hoursSinceUpload <= 24) return 0.03
  if (hoursSinceUpload <= 72) return 0.01
  return 0
}

function noveltyPenalty(exposureCount?: number): number {
  if (exposureCount == null) return 0
  if (exposureCount > 100) return 0.06
  if (exposureCount > 50) return 0.04
  if (exposureCount > 20) return 0.02
  return 0
}

export type ConstraintHit = 'diversity' | 'freshness' | 'regret_floor' | 'novelty' | 'fairness'

interface ScoredCandidate {
  id: string
  creatorId?: string
  topicId?: string
  scores: { watch_time_s: number; share_prob: number; regret_prob: number; composite: number }
  ci: { share_prob: CI; regret_prob: CI }
  reasons: string[]
  constraintsApplied: ConstraintHit[]
  meta: { hoursSinceUpload?: number; exposureCount?: number }
}

function computeComposite(normWatch: number, share: number, regret: number, hoursSinceUpload?: number, exposureCount?: number): { value: number; reasons: string[] } {
  const w1 = 0.6, w2 = 0.5, w3 = 0.8
  const base = w1 * normWatch + w2 * share - w3 * regret
  const boost = freshnessBoost(hoursSinceUpload)
  const penalty = noveltyPenalty(exposureCount)
  const value = base + boost - penalty
  const reasons: string[] = []
  if (boost > 0) reasons.push('freshness_boost')
  if (penalty > 0) reasons.push('novelty_decay')
  return { value, reasons }
}

function applyRegretFloor(items: ScoredCandidate[], tau = 0.35): void {
  for (const it of items) {
    if (it.scores.regret_prob > tau) {
      // Soft-cap by subtracting penalty; keep in list to allow exploration later (CAP-330)
      it.scores.composite -= 0.15
      it.constraintsApplied.push('regret_floor')
    }
  }
}

function applyDiversityAndFairness(items: ScoredCandidate[], topScope = 10, perCreatorCap = 2): void {
  // Enforce at most perCreatorCap per creator in topScope by demoting extras
  const counts = new Map<string, number>()
  // Sort by current composite to examine top scope window
  items.sort((a, b) => b.scores.composite - a.scores.composite)
  for (let i = 0; i < Math.min(items.length, topScope); i++) {
    const it = items[i]
    const creator = it.creatorId || 'unknown'
    const c = (counts.get(creator) || 0) + 1
    counts.set(creator, c)
    if (c > perCreatorCap) {
      // Demote by small penalty; second pass sort will push it down
      it.scores.composite -= 0.08
      it.constraintsApplied.push('fairness')
    }
  }
  // Diversity by topic adjacency: penalize near-duplicate topics among topScope
  const seenTopic = new Set<string>()
  for (let i = 0; i < Math.min(items.length, topScope); i++) {
    const t = items[i].topicId || `unknown:${i}`
    if (seenTopic.has(t)) {
      items[i].scores.composite -= 0.04
      items[i].constraintsApplied.push('diversity')
    } else {
      seenTopic.add(t)
    }
  }
}

async function scoreCandidate(c: RankCandidateInput, cohort: string): Promise<ScoredCandidate> {
  const features: ExtractedFeatures | undefined = c.features
  let viralProbability = 0.5
  let watchTimeSeconds = 30
  if (features) {
    const pred = await ViralPredictionModel.predict(features)
    viralProbability = pred.viralProbability
    watchTimeSeconds = expectedWatchTimeSeconds(features, viralProbability)
  }
  // Heads
  const baseShare = clamp(viralProbability * 0.65 + 0.05, 0.02, 0.95)
  const baseRegret = clamp(0.25 - (viralProbability - 0.5) * 0.3, 0.05, 0.6)
  const shareAdj = applyCalibration('share_prob', baseShare, cohort)
  const regretAdj = applyCalibration('regret_prob', baseRegret, cohort)
  const shareCal = { p: shareAdj.value, ci: { lo: clamp(shareAdj.value - shareAdj.ciWidth/2,0,1), hi: clamp(shareAdj.value + shareAdj.ciWidth/2,0,1), width: +(shareAdj.ciWidth.toFixed(3)) } }
  const regretCal = { p: regretAdj.value, ci: { lo: clamp(regretAdj.value - regretAdj.ciWidth/2,0,1), hi: clamp(regretAdj.value + regretAdj.ciWidth/2,0,1), width: +(regretAdj.ciWidth.toFixed(3)) } }
  const normWatch = normalizeWatchTime(watchTimeSeconds)
  const comp = computeComposite(normWatch, shareCal.p, regretCal.p, c.hoursSinceUpload, c.exposureCount)
  return {
    id: c.id,
    creatorId: c.creatorId,
    topicId: c.topicId,
    scores: { watch_time_s: watchTimeSeconds, share_prob: +(shareCal.p.toFixed(4)), regret_prob: +(regretCal.p.toFixed(4)), composite: comp.value },
    ci: { share_prob: shareCal.ci, regret_prob: regretCal.ci },
    reasons: comp.reasons,
    constraintsApplied: [],
    meta: { hoursSinceUpload: c.hoursSinceUpload, exposureCount: c.exposureCount }
  }
}

export async function rankCandidates(req: RankerRequest): Promise<RankerResponse> {
  const auditId = randomUUID()
  const cohort = cohortString({ platform: req.platform, niche: null, band: 'med' })
  const scored = await Promise.all(req.candidates.map(c => scoreCandidate(c, cohort)))
  // Apply stage-2 constraints
  applyRegretFloor(scored)
  applyDiversityAndFairness(scored, Math.min(10, req.topK))
  // Final sort and take topK
  scored.sort((a, b) => b.scores.composite - a.scores.composite)
  const items: RankerItem[] = scored.slice(0, req.topK).map((it, rankIdx) => ({
    id: it.id,
    rank: rankIdx + 1,
    scores: it.scores,
    ci: it.ci,
    reasons: it.reasons,
    constraintsApplied: it.constraintsApplied,
    meta: { creatorId: it.creatorId, topicId: it.topicId }
  }))
  return {
    auditId,
    alg_version: ALG_VERSION,
    calibration_version: CAL_VERSION,
    topK: req.topK,
    items
  }
}

export function synthesizeCandidates(n: number, platform: Platform = 'tiktok'): RankCandidateInput[] {
  const items: RankCandidateInput[] = []
  for (let i = 0; i < n; i++) {
    const creatorId = `creator_${1 + (i % 4)}`
    const topicId = `topic_${1 + (i % 5)}`
    const hours = Math.round(Math.max(0, (i * 7) % 96))
    const exposure = Math.round((i * 13) % 120)
    // Lightweight synthetic features
    const vertical = platform === 'tiktok' || platform === 'instagram'
    const features: ExtractedFeatures = {
      visual: {
        aspectRatio: vertical ? 1080 / 1920 : 16 / 9,
        colorfulness: 0.55 + (i % 10) / 100,
        brightness: 0.55,
        contrast: 0.65,
        dominantColors: ['rgb(200,60,160)', 'rgb(60,80,230)'],
        faceDetections: 1 + (i % 3),
        objectDetections: 4 + (i % 4),
        visualComplexity: 0.5,
        sceneVariety: 0.5
      },
      audio: {
        hasMusic: true,
        hasSpeech: true,
        volume: 0.7,
        tempo: 120,
        speechClarity: 0.8,
        silencePercentage: 0.06,
        audioQuality: 0.78,
        musicGenre: 'pop'
      },
      text: {
        hasTextOverlay: true,
        textDuration: 8,
        textDensity: 0.25,
        detectedText: ['10 hooks in 30 seconds'],
        readabilityScore: 0.72,
        languageConfidence: 0.9
      },
      structural: {
        duration: 30 + (i % 20),
        hookDuration: 2.5,
        sceneChanges: 5 + (i % 4),
        pacing: 'fast',
        segments: [
          { type: 'hook', duration: 3, confidence: 0.85 },
          { type: 'build', duration: 24, confidence: 0.75 },
          { type: 'cta', duration: 3, confidence: 0.65 }
        ],
        faceScreenTime: 40 + (i % 20),
        textOverlayDuration: 10
      },
      content: {
        emotionalTone: { positive: 0.4, negative: 0.1, neutral: 0.25, surprise: 0.15, excitement: 0.1 },
        complexityScore: 0.55,
        noveltyScore: 0.55,
        engagementTriggers: ['question_hook', 'surprising_fact'],
        contentCategory: 'education',
        viralElements: ['pattern_interrupt', 'text_overlay']
      },
      mlVector: Array(64).fill(0),
      processingTime: 900,
      extractionVersion: 'synthetic-1.0.0'
    }
    items.push({ id: `vid_${i + 1}`, features, creatorId, topicId, hoursSinceUpload: hours, exposureCount: exposure })
  }
  return items
}


