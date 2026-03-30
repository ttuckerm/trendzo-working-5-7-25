import { GET as SUMMARY } from '@/app/api/scale/summary/route'

describe('/api/scale/summary', () => {
	it('responds with summary even when empty', async () => {
		const res = await SUMMARY(new Request('http://local') as any)
		const json = await (res as any).json()
		expect(json).toHaveProperty('creators')
		expect(json).toHaveProperty('metrics')
	})
})


