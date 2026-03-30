import { GET as CSV } from '@/app/api/public/accuracy/csv/route'

describe('API /api/public/accuracy/csv', () => {
	it('returns CSV content and 200', async () => {
		process.env.MOCK = '1'
		const res: any = await CSV({} as any)
		expect(res.status).toBe(200)
		const text = await res.text()
		expect(text).toContain('predictionId,videoId,platform')
	})
})


