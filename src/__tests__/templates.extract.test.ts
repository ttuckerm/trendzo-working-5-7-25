const { featuresFromVIT, matchFrameworks } = require('../lib/templates/extract')

function makeV(caption) {
  return { id:'1', platform:'tiktok', platformVideoId:'v', creatorId:'c', publishTs: new Date().toISOString(), caption, metrics: [{ window:'48h', views:1, likes:0, comments:0, shares:0, saves:0 }], vitVersion:'1.0.0' }
}

describe('featuresFromVIT', () => {
  it('detects POV', () => {
    const f = featuresFromVIT(makeV('POV: You are launching'))
    expect(f.hasPOV).toBe(true)
  })
  it('detects numbers and list', () => {
    const f = featuresFromVIT(makeV('3 reasons your hook fails'))
    expect(f.hasNumbers).toBe(true)
    expect(f.hasList).toBe(true)
  })
  it('detects question', () => {
    const f = featuresFromVIT(makeV('Why does this work?'))
    expect(f.hasQuestion).toBe(true)
  })
})

describe('matchFrameworks', () => {
  it('returns list-of-n for numbered list', () => {
    const v = makeV('3 steps to go viral')
    const f = featuresFromVIT(v)
    const m = matchFrameworks(f, v.caption, '')
    expect(m[0].id).toBeDefined()
  })
})


