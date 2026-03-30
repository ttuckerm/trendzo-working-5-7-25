import { POST } from '@/app/api/analyze/route'

describe('/api/analyze', () => {
  it('returns 200 with expected shape in MOCK', async () => {
    process.env.MOCK = '1'
    const req = { json: async () => ({ platform: 'tiktok', scriptText: 'Stop scrolling', caption: 'Try this', durationSec: 25 }) } as any
    const res = await POST(req)
    const json = await (res as any).json()
    expect(json).toHaveProperty('probability')
    expect(json).toHaveProperty('confidence')
    expect(json).toHaveProperty('recommendations')
    expect(json.timings?.metSLA).toBe(true)
  })
})


