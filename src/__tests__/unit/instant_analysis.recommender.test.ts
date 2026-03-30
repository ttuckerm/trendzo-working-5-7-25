import { generateRecommendations } from '@/lib/analysis/recommender'

describe('generateRecommendations', () => {
  it('returns 3-5 actionable items', () => {
    const recs = generateRecommendations({ durationSec: 20, fpsApprox: 30, estimatedCuts: 2, pacing: 'slow', hookStrength: 0.2, captionDensity: 0.1, hasCTA: false, keywordMatches: [] }, 'tiktok')
    expect(recs.length).toBeGreaterThanOrEqual(3)
    expect(recs.length).toBeLessThanOrEqual(5)
    expect(recs[0]).toHaveProperty('action')
    expect(recs[0]).toHaveProperty('predictedUplift')
  })
})


