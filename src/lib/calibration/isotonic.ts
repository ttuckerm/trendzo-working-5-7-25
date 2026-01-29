// Simple isotonic regression (pool adjacent violators) over probability predictions
// Returns piecewise points suitable for interpolation

export interface IsoPoint { x: number; y: number }

export function fitIsotonic(pred: number[], labels: boolean[]): IsoPoint[] {
  const n = pred.length
  if (n === 0) return []
  const pairs = pred.map((p, i) => ({ p: Math.max(0, Math.min(1, p || 0)), y: labels[i] ? 1 : 0 }))
  pairs.sort((a, b) => a.p - b.p)
  // Initialize blocks
  const blocks: Array<{ sumY: number; count: number; pLo: number; pHi: number }> = pairs.map(r => ({ sumY: r.y, count: 1, pLo: r.p, pHi: r.p }))
  // Pool adjacent violators
  let i = 0
  while (i < blocks.length - 1) {
    const avgI = blocks[i].sumY / blocks[i].count
    const avgJ = blocks[i + 1].sumY / blocks[i + 1].count
    if (avgI <= avgJ) {
      i++
    } else {
      // merge i and i+1
      blocks[i].sumY += blocks[i + 1].sumY
      blocks[i].count += blocks[i + 1].count
      blocks[i].pHi = blocks[i + 1].pHi
      blocks.splice(i + 1, 1)
      // step back if possible
      if (i > 0) i--
    }
  }
  // Build piecewise mapping using block midpoints
  const points: IsoPoint[] = []
  for (const b of blocks) {
    const x = (b.pLo + b.pHi) / 2
    const y = b.sumY / b.count
    points.push({ x, y })
  }
  if (points.length === 1) {
    const y = points[0].y
    return [ { x: 0, y }, { x: 1, y } ]
  }
  // Ensure boundary points exist
  if (points[0].x > 0) points.unshift({ x: 0, y: points[0].y })
  if (points[points.length - 1].x < 1) points.push({ x: 1, y: points[points.length - 1].y })
  return points
}



