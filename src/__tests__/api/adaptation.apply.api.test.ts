import { POST as SCAN } from '@/app/api/adaptation/scan/route'
import { POST as APPLY } from '@/app/api/adaptation/apply/route'

describe('/api/adaptation/apply', () => {
  it('applies last proposal and returns candidate', async () => {
    process.env.MOCK = '1'
    await SCAN()
    const res = await APPLY(new Request('http://local', { method:'POST', body: JSON.stringify({}) }) as any)
    expect((res as any).status).toBe(200)
    const j = await (res as any).json()
    expect(j.candidate).toBeTruthy()
  })
})


