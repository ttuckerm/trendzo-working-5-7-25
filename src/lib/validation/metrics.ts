import { ValidationRecord } from './store'

export type Summary = {
  total: number
  validated: number
  correct: number
  accuracy: number
  tp: number
  fp: number
  tn: number
  fn: number
  auroc: number
  ece: number
  bins: Array<{ p_mid: number; frac_positive: number; count: number }>
  computedAtISO: string
}

export function computeSummary(records: ValidationRecord[]): Summary {
  const validated = records.length
  let tp=0, fp=0, tn=0, fn=0
  for (const r of records) {
    if (r.predictedViral && r.actualViral) tp++
    else if (r.predictedViral && !r.actualViral) fp++
    else if (!r.predictedViral && !r.actualViral) tn++
    else fn++
  }
  const correct = tp+tn
  const accuracy = validated>0 ? correct/validated : 0

  // AUROC via trapezoidal ROC from thresholds over probabilities
  const auroc = computeAUROC(records)
  const { bins, ece } = computeReliabilityBins(records, 10)

  return { total: validated, validated, correct, accuracy, tp, fp, tn, fn, auroc, ece, bins, computedAtISO: new Date().toISOString() }
}

export function computeAUROC(records: ValidationRecord[]): number {
  if (records.length === 0) return 0
  const sorted = [...records].sort((a,b)=> b.probability - a.probability)
  const P = records.filter(r=>r.actualViral).length
  const N = records.length - P
  if (P===0 || N===0) return 0.5
  let tp=0, fp=0
  let prevProb: number | null = null
  const points: Array<{fpr:number; tpr:number}> = []
  for (const r of sorted) {
    if (prevProb!==null && r.probability!==prevProb) {
      points.push({ fpr: fp/N, tpr: tp/P })
    }
    prevProb = r.probability
    if (r.actualViral) tp++
    else fp++
  }
  points.push({ fpr: fp/N, tpr: tp/P })
  // Trapezoidal integration over FPR from 0→1
  points.unshift({ fpr: 0, tpr: 0 })
  points.push({ fpr: 1, tpr: 1 })
  points.sort((a,b)=> a.fpr - b.fpr)
  let auc = 0
  for (let i=1;i<points.length;i++) {
    const x1 = points[i-1].fpr, y1 = points[i-1].tpr
    const x2 = points[i].fpr, y2 = points[i].tpr
    auc += (x2 - x1) * (y1 + y2) / 2
  }
  return Math.max(0, Math.min(1, auc))
}

export function computeReliabilityBins(records: ValidationRecord[], numBins: number): { bins: Array<{ p_mid:number; frac_positive:number; count:number }>; ece:number } {
  const bins: Array<{ sumP:number; sumY:number; count:number }> = Array.from({ length: numBins }, () => ({ sumP:0, sumY:0, count:0 }))
  for (const r of records) {
    const idx = Math.min(numBins-1, Math.max(0, Math.floor(r.probability * numBins)))
    bins[idx].sumP += r.probability
    bins[idx].sumY += r.actualViral ? 1 : 0
    bins[idx].count += 1
  }
  const out = bins.map((b, i) => ({ p_mid: (i+0.5)/numBins, frac_positive: b.count? (b.sumY/b.count) : 0, count: b.count }))
  let ece = 0
  for (let i=0;i<numBins;i++) {
    const p = bins[i].count? (bins[i].sumP / bins[i].count) : ((i+0.5)/numBins)
    const y = out[i].frac_positive
    const w = bins[i].count / Math.max(1, records.length)
    ece += w * Math.abs(p - y)
  }
  return { bins: out, ece }
}


