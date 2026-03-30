import { describe, it, expect } from 'vitest'

function topKPrecision(yTrue: number[], yScore: number[], k: number) {
  const idx = yScore.map((s,i)=>[s,i]).sort((a,b)=>b[0]-a[0]).slice(0,k).map(x=>x[1])
  const hits = idx.reduce((acc,i)=> acc + (yTrue[i]===1 ? 1 : 0), 0)
  return hits / Math.max(1, Math.min(k, yTrue.length))
}

describe('selector utils', () => {
  it('computes precision@k', () => {
    const y = [1,0,1,0,1]
    const p = [0.9,0.8,0.7,0.6,0.1]
    const v = topKPrecision(y,p,2)
    expect(v).toBeGreaterThan(0)
    expect(v).toBeLessThanOrEqual(1)
  })
})


