import { POST as UPDATE } from '@/app/api/learning/update/route'
import { POST as PROMOTE } from '@/app/api/learning/promote/route'
import { getCurrentModel } from '@/lib/learning/store'

describe('/api/learning/promote', () => {
  it('promotes candidate and current reflects new version', async () => {
    process.env.MOCK = '1'
    await UPDATE()
    const res = await PROMOTE()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.version).toBeGreaterThan(0)
    const cur = await getCurrentModel()
    expect(cur.version).toBe(json.version)
  })
})








































































































































