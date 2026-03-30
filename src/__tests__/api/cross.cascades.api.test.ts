import { GET } from '@/app/api/cross/cascades/route'

describe('/api/cross/cascades', () => {
  it('returns cascades list', async () => {
    process.env.MOCK = '1'
    const res = await GET({ url: 'http://local/api/cross/cascades?window=30d' } as any)
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(Array.isArray(j.cascades)).toBe(true)
  })
})


