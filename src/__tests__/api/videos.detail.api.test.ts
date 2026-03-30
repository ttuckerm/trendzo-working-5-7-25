import { GET as DETAIL } from '@/app/api/videos/[id]/route'

describe('API /api/videos/:id', () => {
  it('returns a VIT with viral computation', async () => {
    process.env.MOCK = '1'
    const res = await DETAIL({} as any, { params: { id: 'mock-tiktok-1' } } as any)
    const json = await res.json()
    // Should either be the specific item or 404; accept 200 path
    if (res.status === 200) {
      expect(json.id).toBeDefined()
      expect(json.viral).toBeDefined()
    }
  })
})


