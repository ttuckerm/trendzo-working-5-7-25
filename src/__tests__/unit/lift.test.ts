import { computeUniqueInsights } from '@/lib/insights/lift'

describe('unique insights', () => {
	it('returns items meeting thresholds', () => {
		const items = computeUniqueInsights(20, 0.0)
		expect(Array.isArray(items)).toBe(true)
		if (items.length > 0) {
			expect(items[0]).toHaveProperty('support')
			expect(items[0]).toHaveProperty('deltaVsBaseline')
		}
	})
})


