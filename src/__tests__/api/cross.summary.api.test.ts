import { GET } from '@/app/api/cross/summary/route'

describe('/api/cross/summary', () => {
  it('returns aggregates', async () => {
    process.env.MOCK = '1'
    const res = await GET()
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(j).toHaveProperty('topLeader')
  })
})


