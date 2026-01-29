import { make30DayPlan } from '@/lib/scale/plan'

describe('scale.plan', () => {
	it('is deterministic under MOCK seed', async () => {
		const creator = { id:'cr_test', handle:'test', niche:'fitness', platformSet:['tiktok','instagram','youtube'], createdAtISO:new Date().toISOString() }
		const p1 = await make30DayPlan(creator as any, { seed: 123 })
		const p2 = await make30DayPlan(creator as any, { seed: 123 })
		expect(JSON.stringify(p1)).toBe(JSON.stringify(p2))
	})
})


