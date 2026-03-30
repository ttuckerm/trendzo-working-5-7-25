import { POST } from '@/app/api/predict/log/route'

describe('/api/predict/log', () => {
  it('logs a prediction', async () => {
    const req = { json: async () => ({ platform:'tiktok', probability:0.55, threshold:0.5 }) } as any
    const res = await POST(req)
    const j = await (res as any).json()
    expect(j.ok).toBe(true)
    expect(j.prediction).toHaveProperty('id')
  })
})


