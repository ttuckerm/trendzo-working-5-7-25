import { DynamicPercentileSystem } from '@/lib/services/viral-prediction/dynamic-percentile-system'

// This test validates that DPS continues to expose category via the central contract mapping

describe('DPS → virality contract mapping', () => {
  test('returns category/thresholdLabel/confidenceLabel fields', async () => {
    const dps = new DynamicPercentileSystem()
    // Use mock inputs to avoid hitting real DB in unit context
    // We guard by environment; these methods fallback when data sparse
    const res: any = await dps.calculateViralScore('vid1', 1000, 10000, 2, 'tiktok')
    expect(res).toHaveProperty('category')
    expect(res).toHaveProperty('thresholdLabel')
    expect(res).toHaveProperty('confidenceLabel')
  })
})



