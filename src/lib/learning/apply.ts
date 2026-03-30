import { LearningModel } from './types'
import fs from 'fs'
import path from 'path'
import { getCurrentModel } from './store'

export type Subscores = {
  hook:number
  clarity:number
  pacing:number
  novelty:number
  platformFit:number
  socialProof:number
}

export async function getModelForScorer(): Promise<LearningModel> {
  try { return await getCurrentModel() } catch { return {
    version: 1,
    createdAtISO: new Date().toISOString(),
    weights: { hook:1, clarity:1, pacing:1, novelty:1, platformFit:1, socialProof:1 },
    calibrationBins: Array.from({ length: 10 }, (_, i)=>({ lo:i/10, hi:(i+1)/10, frac:(i+0.5)/10, count:0 })),
    threshold: 0.5,
    metricsAtBuild: { accuracy:0, auroc:0, ece:0, brier:0.25, validated:0 }
  } }
}

export function getModelForScorerSync(): LearningModel {
  try {
    const file = path.join(process.cwd(), 'fixtures', 'learning', 'model_current.json')
    const raw = fs.readFileSync(file, 'utf8')
    return JSON.parse(raw) as LearningModel
  } catch {
    return {
      version: 1,
      createdAtISO: new Date().toISOString(),
      weights: { hook:1, clarity:1, pacing:1, novelty:1, platformFit:1, socialProof:1 },
      calibrationBins: Array.from({ length: 10 }, (_, i)=>({ lo:i/10, hi:(i+1)/10, frac:(i+0.5)/10, count:0 })),
      threshold: 0.5,
      metricsAtBuild: { accuracy:0, auroc:0, ece:0, brier:0.25, validated:0 }
    }
  }
}

export function applyCalibration(prob: number, model: LearningModel): number {
  // Map probability by nearest calibration bin (isotonic-like lookup)
  const bin = model.calibrationBins[Math.min(model.calibrationBins.length-1, Math.max(0, Math.floor(prob * model.calibrationBins.length)))]
  const pMid = (bin.lo + bin.hi) / 2
  const delta = (bin.frac - pMid)
  const adjusted = Math.max(0, Math.min(1, prob + delta))
  return adjusted
}

export function weightedCombine(sub: Subscores, model: LearningModel): number {
  const w = model.weights
  const sumW = w.hook + w.clarity + w.pacing + w.novelty + w.platformFit + w.socialProof
  const linear = (w.hook*sub.hook + w.clarity*sub.clarity + w.pacing*sub.pacing + w.novelty*sub.novelty + w.platformFit*sub.platformFit + w.socialProof*sub.socialProof) / Math.max(1e-6, sumW)
  return Math.max(0, Math.min(1, linear))
}


