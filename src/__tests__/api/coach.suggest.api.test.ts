import { POST as SUGGEST } from '@/app/api/coach/suggest/route'

describe('API /api/coach/suggest', () => {
	it('returns 3+ suggestions with expectedLift', async () => {
		process.env.MOCK = '1'
		const req = new Request('http://local', { method:'POST', body: JSON.stringify({ platform:'tiktok', scriptText:'Stop scrolling...', caption:'Quick tip', durationSec:25 }) }) as any
		const res = await SUGGEST(req)
		expect((res as any).status).toBe(200)
		const j = await (res as any).json()
		expect(Array.isArray(j.suggestions)).toBe(true)
		expect(j.suggestions.length).toBeGreaterThanOrEqual(3)
		expect(typeof j.suggestions[0].expectedLift).toBe('number')
	})
})


