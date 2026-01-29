import { enforce } from '@/lib/moat/rate'

describe('rate limiting', () => {
	it('enforces rpm and rpd', () => {
		const key = 'test-key-id'
		const limits = { rpm: 5, rpd: 10 }
		let ok = 0, blocked = 0
		for (let i = 0; i < 7; i++) {
			const r = enforce(key, limits, 1)
			if (r.ok) ok++; else blocked++
		}
		expect(ok).toBeGreaterThan(0)
		expect(blocked).toBeGreaterThan(0)
	})
})


