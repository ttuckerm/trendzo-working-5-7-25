import { classifyByPercentile, classifyByProbability, getViralityThresholds } from '@/lib/virality/contract'

describe('virality contract', () => {
  test('classifyByPercentile uses base thresholds', () => {
    const input = { platform: 'tiktok' as const }
    expect(classifyByPercentile(99.95, input)).toBe('mega-viral')
    expect(classifyByPercentile(99.2, input)).toBe('hyper-viral')
    expect(classifyByPercentile(96, input)).toBe('viral')
    expect(classifyByPercentile(90.1, input)).toBe('trending')
    expect(classifyByPercentile(50, input)).toBe('normal')
  })

  test('classifyByProbability uses default prob thresholds', () => {
    const input = { platform: 'instagram' as const }
    expect(classifyByProbability(0.999, input)).toBe('mega-viral')
    expect(classifyByProbability(0.9901, input)).toBe('hyper-viral')
    expect(classifyByProbability(0.951, input)).toBe('viral')
    expect(classifyByProbability(0.9001, input)).toBe('trending')
    expect(classifyByProbability(0.42, input)).toBe('normal')
  })

  test('niche overrides provide engagement thresholds with 48h window default', () => {
    const t = getViralityThresholds({ platform: 'tiktok', niche: 'fitness' })
    expect(t.windowHours).toBe(48)
    expect(t.engagementRate).toBeTruthy()
    expect(t.percentile.megaViral).toBeGreaterThan(99)
  })
})



