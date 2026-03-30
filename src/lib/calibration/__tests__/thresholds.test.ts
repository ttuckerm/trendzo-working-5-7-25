import { thresholdFor } from '@/lib/calibration/thresholds'

describe('thresholdFor', () => {
  it('maps platforms to thresholds', () => {
    expect(thresholdFor('tiktok')).toBe(95)
    expect(thresholdFor('instagram')).toBe(92)
    expect(thresholdFor('youtube')).toBe(90)
    expect(thresholdFor('unknown')).toBe(95)
  })
})


