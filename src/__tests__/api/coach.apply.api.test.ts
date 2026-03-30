import { POST as APPLY } from '@/app/api/coach/apply/route'

describe('API /api/coach/apply', () => {
	it('returns variant and experimentId', async () => {
		process.env.MOCK = '1'
		const body = { suggestionId:'s1', input:{ platform:'tiktok', scriptText:'a', caption:'b', durationSec:20 }, edit:{ caption:'b cta' } }
		const res = await APPLY(new Request('http://local', { method:'POST', body: JSON.stringify(body) }) as any)
		expect((res as any).status).toBe(200)
		const j = await (res as any).json()
		expect(j.variant).toBeTruthy()
		expect(j.experimentId).toBeTruthy()
	})
})


