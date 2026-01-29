import { runDay } from '@/lib/scale/simulate'

describe('scale.simulate', () => {
	it('probability sampling produces outcomes in bounds', async () => {
		const session = await runDay('cr_x', 1, [{ templateId:'tpl_hot_01', seedIdea:'x', script:'Hello world', timing:'12:00', targetPlatform:'tiktok' } as any], { niche:'general' })
		expect(session.outcomes.views).toBeGreaterThan(0)
		expect(typeof session.outcomes.viral).toBe('boolean')
	})
})


