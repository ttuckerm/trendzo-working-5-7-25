import { GET as RB } from '@/app/api/recipe-book/route'
import { GET as LB } from '@/app/api/templates/leaderboard/route'
import { GET as TD } from '@/app/api/templates/[id]/route'

describe('Recipe Book API', () => {
  it('returns sections with generatedAtISO', async () => {
    process.env.MOCK = '1'
    const res = await RB(new Request('http://localhost/api/recipe-book?window=30d') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.generatedAtISO).toBeDefined()
    expect(Array.isArray(json.hot)).toBe(true)
    expect(Array.isArray(json.cooling)).toBe(true)
    expect(Array.isArray(json.newly)).toBe(true)
  })

  it('leaderboard returns sorted items', async () => {
    process.env.MOCK = '1'
    const res = await LB(new Request('http://localhost/api/templates/leaderboard?limit=20') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })
})


