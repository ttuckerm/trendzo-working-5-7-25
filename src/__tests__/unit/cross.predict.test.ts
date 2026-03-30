import { predictCrossPlatform } from '@/lib/cross/predict'

describe('cross.predict', () => {
  it('returns probs, confidence, and recommended lags', () => {
    const out = predictCrossPlatform({ platform: 'tiktok', video: null as any, templateId: 'tpl-1', niche: 'fitness' } as any)
    expect(typeof out.probIG).toBe('number')
    expect(typeof out.probYT).toBe('number')
    expect(['low','med','high']).toContain(out.confidence)
    expect(typeof out.recommendedLags.toIG).toBe('number')
  })
})


