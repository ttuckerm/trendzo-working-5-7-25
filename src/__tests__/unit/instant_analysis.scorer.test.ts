import { scoreDraft } from '@/lib/analysis/scorer'

describe('scoreDraft', () => {
  it('produces probability and confidence', async () => {
    const r = await scoreDraft({ script: { text: 'Stop scrolling. You need to try this now!' }, metadata: { platform: 'tiktok', caption: 'Focus hack', durationSec: 25 } })
    expect(r.probability).toBeGreaterThanOrEqual(0)
    expect(r.probability).toBeLessThanOrEqual(1)
    expect(r.confidence).toBeGreaterThanOrEqual(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
    expect(Array.isArray(r.reasons)).toBe(true)
  })
})


