import { GET as LB } from '@/app/api/templates/leaderboard/route'

describe('API /api/templates/leaderboard', () => {
  it('returns normalized shape with items in MOCK', async () => {
    process.env.MOCK = '1'
    const res = await LB(new Request('http://localhost/api/templates/leaderboard') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(typeof json.updatedAtISO).toBe('string')
    expect(Array.isArray(json.items)).toBe(true)
    expect(json.items.length).toBeGreaterThan(0)
    const it = json.items[0]
    expect(typeof it.id).toBe('string')
    expect(['HOT','COOLING','NEW']).toContain(it.state)
    expect(typeof it.successRate).toBe('number')
    expect(typeof it.uses).toBe('number')
  })
})


