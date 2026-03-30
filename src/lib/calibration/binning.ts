export interface ReliabilityBin {
  lo: number
  hi: number
  center: number
  n: number
  positives: number
  empirical: number
}

export function buildBins(k: number = 10): ReliabilityBin[] {
  const bins: ReliabilityBin[] = []
  for (let i = 0; i < k; i++) {
    const lo = i / k
    const hi = (i + 1) / k
    const center = (lo + hi) / 2
    bins.push({ lo, hi, center, n: 0, positives: 0, empirical: 0 })
  }
  return bins
}

export function aggregateIntoBins(pred: number[], labels: boolean[], k: number = 10): ReliabilityBin[] {
  const bins = buildBins(k)
  for (let i = 0; i < pred.length; i++) {
    const p = Math.max(0, Math.min(1, pred[i] || 0))
    const idx = Math.min(k - 1, Math.floor(p * k))
    bins[idx].n += 1
    bins[idx].positives += labels[i] ? 1 : 0
  }
  for (const b of bins) {
    b.empirical = b.n > 0 ? b.positives / b.n : 0
  }
  return bins
}



