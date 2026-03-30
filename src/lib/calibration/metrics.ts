import { ReliabilityBin, aggregateIntoBins } from './binning'

export function expectedCalibrationError(pred: number[], labels: boolean[], k: number = 10): { ece: number; bins: ReliabilityBin[] } {
  const bins = aggregateIntoBins(pred, labels, k)
  const n = pred.length || 1
  let ece = 0
  for (const b of bins) {
    const w = b.n / n
    const pMean = (b.lo + b.hi) / 2
    ece += w * Math.abs(b.empirical - pMean)
  }
  return { ece, bins }
}

export function areaUnderRoc(pred: number[], labels: boolean[]): number {
  // Compute AUROC via pairwise comparison (Wilcoxon-Mann-Whitney)
  const pos: number[] = []
  const neg: number[] = []
  for (let i = 0; i < pred.length; i++) (labels[i] ? pos : neg).push(pred[i] || 0)
  if (pos.length === 0 || neg.length === 0) return 0.5
  let wins = 0
  for (const p of pos) {
    for (const n of neg) {
      if (p > n) wins += 1
      else if (p === n) wins += 0.5
    }
  }
  return wins / (pos.length * neg.length)
}



