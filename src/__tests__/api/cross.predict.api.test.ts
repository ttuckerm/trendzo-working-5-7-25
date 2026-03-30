import { POST } from '@/app/api/cross/predict/route'

describe('/api/cross/predict', () => {
  it('returns prediction for seed', async () => {
    process.env.MOCK = '1'
    const res = await POST({ json: async ()=> ({ platform:'tiktok' }) } as any)
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(typeof j.probIG).toBe('number')
    expect(typeof j.probYT).toBe('number')
  })
})


