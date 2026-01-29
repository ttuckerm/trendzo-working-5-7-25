import { GET as BADGE } from '@/app/widget/badge/route'

describe('API /widget/badge', () => {
	it('returns HTML containing Accuracy % placeholder', async () => {
		process.env.MOCK = '1'
		const res: any = await BADGE()
		expect(res.status).toBe(200)
		const html = await res.text()
		expect(html).toContain('Accuracy')
	})
})


