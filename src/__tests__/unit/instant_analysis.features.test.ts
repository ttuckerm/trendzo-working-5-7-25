import { extractFeatures } from '@/lib/analysis/features'

describe('extractFeatures', () => {
  it('computes pacing and CTA', () => {
    const f = extractFeatures({ script: { text: 'Stop scrolling! Do this now. Then next step.' }, metadata: { platform: 'tiktok', caption: 'Try this now', durationSec: 30 } })
    expect(['slow','medium','fast']).toContain(f.pacing)
    expect(typeof f.hasCTA).toBe('boolean')
  })
})


