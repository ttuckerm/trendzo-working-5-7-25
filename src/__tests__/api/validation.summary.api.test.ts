import { GET } from '@/app/api/validation/summary/route'

describe('/api/validation/summary', () => {
  it('returns live summary', async () => {
    const res = await GET()
    const j = await (res as any).json()
    expect(j).toHaveProperty('validated')
    expect(Array.isArray(j.bins)).toBe(true)
  })
})


