import { LearningModel } from './types'
import { getCurrentModel, saveCandidate } from './store'
import { readAllPredictions, readAllValidations, PredictionEvent, ValidationRecord } from '@/lib/validation/store'
import { computeAUROC, computeReliabilityBins } from '@/lib/validation/metrics'

type Joined = ValidationRecord & { features?: { hook?: number; cuts?: number; pacing?: string } }

function mapPacing(p?: string): number { return p==='fast'?1:p==='medium'?0.6:p==='slow'?0.3:0.5 }

function modelProb(w: { hook:number; clarity:number; pacing:number; novelty:number; platformFit:number; socialProof:number }, j: Joined): number {
  const hook = Math.max(0, Math.min(1, j.features?.hook ?? 0.5))
  const pacing = mapPacing(j.features?.pacing)
  const novelty = Math.max(0, Math.min(1, (j.features?.cuts ?? 10) / 20))
  const clarity = hook > 0.6 ? 0.8 : 0.6
  const platformFit = 1
  const socialProof = 0.5
  const sumW = w.hook + w.clarity + w.pacing + w.novelty + w.platformFit + w.socialProof
  const linear = (w.hook*hook + w.clarity*clarity + w.pacing*pacing + w.novelty*novelty + w.platformFit*platformFit + w.socialProof*socialProof) / Math.max(1e-6, sumW)
  return Math.max(0, Math.min(1, linear))
}

function brier(yTrue: number[], yProb: number[]): number {
  let s = 0
  for (let i=0;i<yTrue.length;i++) { const d = yProb[i] - yTrue[i]; s += d*d }
  return yTrue.length? s / yTrue.length : 0.25
}

function computeRatesAtThreshold(probs: number[], yTrue: number[], t: number): { tp:number; fp:number; tn:number; fn:number; acc:number; precision:number; recall:number; tpr:number; fpr:number } {
  let tp=0, fp=0, tn=0, fn=0
  for (let i=0;i<yTrue.length;i++) {
    const pred = probs[i] >= t
    if (pred && yTrue[i]===1) tp++; else if (pred && yTrue[i]===0) fp++; else if (!pred && yTrue[i]===0) tn++; else fn++
  }
  const precision = tp+fp>0? tp/(tp+fp):0
  const recall = tp+fn>0? tp/(tp+fn):0
  const tpr = recall
  const fpr = fp/(fp+tn || 1)
  const acc = (tp+tn)/(tp+tn+fp+fn || 1)
  return { tp, fp, tn, fn, acc, precision, recall, tpr, fpr }
}

function tuneThreshold(probs: number[], yTrue: number[], fpCapAbs: number): { threshold:number; accuracy:number } {
  let bestT = 0.5, bestF1 = -1, bestJ = -1, bestAcc = 0
  for (let t=0.4;t<=0.700001;t+=0.01) {
    const { precision, recall, tpr, fpr, acc } = computeRatesAtThreshold(probs, yTrue, Number(t.toFixed(2)))
    if (fpr > fpCapAbs + 1e-9) continue
    const f1 = precision+recall>0? 2*precision*recall/(precision+recall):0
    const J = tpr - fpr
    if (f1>bestF1 || (f1===bestF1 && J>bestJ)) { bestF1=f1; bestJ=J; bestT=t; bestAcc=acc }
  }
  return { threshold: Number(bestT.toFixed(2)), accuracy: bestAcc }
}

function coordinateAscent(initial: { hook:number; clarity:number; pacing:number; novelty:number; platformFit:number; socialProof:number }, joined: Joined[], y: number[]): { weights: LearningModel['weights']; probs:number[] } {
  let w = { ...initial }
  const grid = [0.6,0.8,1.0,1.2,1.4]
  let probs = joined.map(j=>modelProb(w, j))
  let best = brier(y, probs)
  const keys: (keyof typeof w)[] = ['hook','clarity','pacing','novelty','platformFit','socialProof']
  for (let pass=0; pass<2; pass++) {
    for (const k of keys) {
      let bestLocal = best
      let bestVal = w[k]
      for (const gv of grid) {
        const wTry = { ...w, [k]: gv }
        const pTry = joined.map(j=>modelProb(wTry, j))
        const loss = brier(y, pTry)
        if (loss < bestLocal - 1e-6) { bestLocal = loss; bestVal = gv; probs = pTry }
      }
      w[k] = bestVal
      best = bestLocal
    }
  }
  return { weights: w, probs }
}

export async function runTrainer(): Promise<{ candidate: LearningModel; deltas: { accuracy:number; ece:number; auroc:number; brier:number } }> {
  const current = await getCurrentModel()
  const preds = readAllPredictions()
  const vals = readAllValidations()
  const predById = new Map<string, PredictionEvent>()
  preds.forEach(p=>predById.set(p.id, p))
  const joined: Joined[] = vals.map(v => ({ ...v, features: predById.get(v.predictionId)?.features as any }))
  const y = joined.map(j=> j.actualViral ? 1 : 0)

  // Weight search
  const { weights, probs } = coordinateAscent(current.weights, joined, y)

  // Calibration bins from validations using new probs
  const recordsForMetrics = joined.map((j, i)=>({ probability: probs[i], actualViral: j.actualViral, predictedViral: probs[i] >= current.threshold, platform: j.platform, predictionId: j.predictionId, madeAtISO: j.madeAtISO, maturedAtISO: j.maturedAtISO })) as any as ValidationRecord[]
  const auroc = computeAUROC(recordsForMetrics)
  const { bins, ece } = computeReliabilityBins(recordsForMetrics, 10)

  // Threshold tuning
  // Compute base FP at current threshold; cap is baseFP + 0.03 absolute
  const baseRates = computeRatesAtThreshold(probs, y, current.threshold)
  const fpCapAbs = Math.min(1, baseRates.fpr + 0.03)
  const { threshold, accuracy } = tuneThreshold(probs, y, fpCapAbs)

  const cand: LearningModel = {
    version: current.version + 1,
    parentVersion: current.version,
    createdAtISO: new Date().toISOString(),
    weights,
    calibrationBins: bins.map((b, i, arr)=>({ lo:i/arr.length, hi:(i+1)/arr.length, frac:b.frac_positive, count:b.count })),
    threshold,
    metricsAtBuild: { accuracy, auroc, ece, brier: brier(y, probs), validated: y.length }
  }

  await saveCandidate(cand)

  const d = {
    accuracy: (cand.metricsAtBuild.accuracy - (current.metricsAtBuild?.accuracy || 0)),
    ece: (cand.metricsAtBuild.ece - (current.metricsAtBuild?.ece || 0)),
    auroc: (cand.metricsAtBuild.auroc - (current.metricsAtBuild?.auroc || 0)),
    brier: (cand.metricsAtBuild.brier - (current.metricsAtBuild?.brier || 0)),
  }
  return { candidate: cand, deltas: d }
}


