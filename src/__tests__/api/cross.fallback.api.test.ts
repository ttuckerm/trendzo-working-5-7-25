import { GET as CASCADES } from '@/app/api/cross/cascades/route'
import { POST as PREDICT } from '@/app/api/cross/predict/route'
import { GET as SUMMARY } from '@/app/api/cross/summary/route'

describe('cross APIs fallback', () => {
  it('cascades returns 200 and array even when live fails', async () => {
    process.env.MOCK = '1'
    const req: any = { url: 'http://local/api/cross/cascades?window=30d' }
    const res = await CASCADES(req)
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(Array.isArray(j.cascades)).toBe(true)
  })
  it('predict returns defaulted fields with 200 on error', async () => {
    process.env.MOCK = '1'
    const req: any = { json: async ()=> ({ platform:'tiktok' }) }
    const res = await PREDICT(req)
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(typeof j.probIG).toBe('number')
    expect(j.recommendedLags).toBeTruthy()
  })
  it('summary returns aggregates with 200', async () => {
    process.env.MOCK = '1'
    const res = await SUMMARY()
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(j).toHaveProperty('activeCascades')
  })
})


