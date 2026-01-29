import { GET as SUMMARY } from '@/app/api/public/accuracy/summary/route'

describe('API /api/public/accuracy/summary', () => {
	it('always returns 200 with valid shape', async () => {
		process.env.MOCK = '1'
		const res: any = await SUMMARY()
		expect(res.status).toBe(200)
		const j = await res.json()
		expect(j).toHaveProperty('ok', true)
		expect(j).toHaveProperty('summary')
		expect(typeof j.summary.accuracy).toBe('number')
		expect(Array.isArray(j.summary.bins)).toBe(true)
		expect(j.summary.bins.length).toBeGreaterThanOrEqual(10)
	})
})


