import { GET as LIST } from '@/app/api/videos/route'

describe('API /api/videos', () => {
  it('returns items with MOCK=1', async () => {
    process.env.MOCK = '1'
    const req = new Request('http://localhost/api/videos?limit=5')
    const res = await LIST(req as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.items)).toBe(true)
    expect(json.items.length).toBeGreaterThan(0)
  })
})


