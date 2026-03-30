import { POST } from '@/app/api/adaptation/scan/route'

describe('/api/adaptation/scan', () => {
  it('returns signals and proposed change', async () => {
    process.env.MOCK = '1'
    const res = await POST()
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(j.signals).toBeTruthy()
    expect(j.proposed).toBeTruthy()
  })
})


