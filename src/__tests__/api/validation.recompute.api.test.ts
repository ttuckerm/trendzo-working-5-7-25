import { POST } from '@/app/api/validation/recompute/route'

describe('/api/validation/recompute', () => {
  it('recomputes summary', async () => {
    const res = await POST({} as any)
    const j = await (res as any).json()
    expect(j.ok).toBe(true)
    expect(j.summary).toHaveProperty('validated')
  })
})


