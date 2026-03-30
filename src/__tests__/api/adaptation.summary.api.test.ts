import { GET } from '@/app/api/adaptation/summary/route'

describe('/api/adaptation/summary', () => {
  it('returns weather and recentChanges', async () => {
    process.env.MOCK = '1'
    const res = await GET()
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(j.weather).toBeTruthy()
    expect(['Stable','Shifting','Storm']).toContain(j.weather.status)
    expect(j.recentChanges).toBeTruthy()
  })
})


