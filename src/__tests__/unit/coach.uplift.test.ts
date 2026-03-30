import { scoreBaseline, batchUplift } from '@/lib/coach/uplift'
import { generateAllCandidates } from '@/lib/coach/generators'

describe('coach.uplift', () => {
	it('scores baseline and variants without throwing', async () => {
		process.env.MOCK = '1'
		const input = { platform:'tiktok', scriptText:'Stop scrolling. Tip...', caption:'Quick tip', durationSec:20 }
		const base = await scoreBaseline(input as any)
		expect(typeof base.probability).toBe('number')
		const sug = generateAllCandidates(input as any)
		const scored = await batchUplift(input as any, sug.slice(0,3), base.probability)
		expect(scored.length).toBeGreaterThan(0)
		expect(typeof scored[0].expectedLift).toBe('number')
	})
})


