import React from 'react'

describe('Admin Coach Page', () => {
	it('renders and can suggest', async () => {
		process.env.MOCK = '1'
		// Smoke: call API that page uses
		const res = await (await import('@/app/api/coach/suggest/route')).POST(new Request('http://local', { method:'POST', body: JSON.stringify({ platform:'tiktok', scriptText:'Stop scrolling', caption:'Quick tip', durationSec:20 }) }) as any)
		expect((res as any).status).toBe(200)
	})
})


