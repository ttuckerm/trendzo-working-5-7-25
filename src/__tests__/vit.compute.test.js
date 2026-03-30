const { computeViral, VIRAL_RULE } = require('../../src/lib/vit/compute')

function baseVIT() {
  return {
    id: 't1',
    platform: 'tiktok',
    platformVideoId: 'v1',
    creatorId: 'c1',
    publishTs: new Date().toISOString(),
    metrics: [
      { window: '48h', views: 1000, likes: 100, comments: 10, shares: 5, saves: 3 },
    ],
    vitVersion: '1.0.0',
  }
}

describe('computeViral', () => {
  it('returns true when z >= 2 and percentile >= 95', () => {
    const v = baseVIT()
    v.baselines = { zScore: VIRAL_RULE.z, percentile: VIRAL_RULE.p }
    const res = computeViral(v)
    expect(res.viral).toBe(true)
  })

  it('returns false when only z is high', () => {
    const v = baseVIT()
    v.baselines = { zScore: VIRAL_RULE.z + 1, percentile: VIRAL_RULE.p - 1 }
    const res = computeViral(v)
    expect(res.viral).toBe(false)
  })

  it('returns false when only percentile is high', () => {
    const v = baseVIT()
    v.baselines = { zScore: VIRAL_RULE.z - 0.1, percentile: VIRAL_RULE.p + 1 }
    const res = computeViral(v)
    expect(res.viral).toBe(false)
  })
})


