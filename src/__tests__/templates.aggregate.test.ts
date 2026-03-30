const { aggregateTemplates } = require('../lib/templates/aggregate')

function makeV(id, viral) {
  return {
    id, platform:'tiktok', platformVideoId:id, creatorId:'c', publishTs: new Date().toISOString(), caption: viral? 'POV: 3 steps' : 'hello', durationSec: 20,
    metrics: [{ window:'48h', views:1, likes:0, comments:0, shares:0, saves:0 }], vitVersion:'1.0.0', baselines:{ zScore: viral? 2.2: 1.0, percentile: viral? 97: 50 }
  }
}

describe('aggregateTemplates', () => {
  it('computes SR and states correctly', () => {
    const vids = []
    for (let i=0;i<12;i++) vids.push(makeV('v'+i, i<10))
    const map = aggregateTemplates(vids, '30d')
    const first = map.values().next().value
    expect(first.uses).toBeGreaterThan(0)
    expect(first.successRate).toBeGreaterThan(0)
    expect(['HOT','COOLING','NEW']).toContain(first.state)
  })
})


