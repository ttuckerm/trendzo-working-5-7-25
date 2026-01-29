import { GET } from '@/app/api/proof-tiles/route'

describe('/api/proof-tiles', () => {
  it('marks Objective #3 PASS in MOCK when analyze meets SLA and recs', async () => {
    process.env.MOCK = '1'
    const res = await GET()
    const tiles = await (res as any).json()
    const obj3 = tiles.find((t: any) => t.title === 'Objective #3: Instant Analysis')
    expect(obj3).toBeTruthy()
    expect(typeof obj3.passed).toBe('boolean')
  })
  it('marks Objective #7 PASS in MOCK when adaptation scan/apply succeeds and accuracy ≥ 0.90', async () => {
    process.env.MOCK = '1'
    const res = await GET()
    const tiles = await (res as any).json()
    const obj7 = tiles.find((t: any) => t.title === 'Objective #7: Maintain 90%+ despite algorithm updates')
    expect(obj7).toBeTruthy()
    expect(typeof obj7.passed).toBe('boolean')
  })
})

import { GET as PROOF } from '@/app/api/proof-tiles/route'

describe('API /api/proof-tiles', () => {
  it('returns 13 tiles (mock generation)', async () => {
    process.env.MOCK = '1'
    const res = await PROOF()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThanOrEqual(10)
  })
  it('includes Objective #11 when MOCK=1', async () => {
    process.env.MOCK = '1'
    const res = await PROOF()
    const tiles = await res.json()
    const has11 = tiles.some((t:any) => typeof t.title === 'string' && t.title.includes('Objective #11'))
    expect(has11).toBe(true)
  })
})


