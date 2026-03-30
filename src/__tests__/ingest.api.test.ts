import { NextRequest } from 'next/server'
import { POST as upsertPost } from '@/app/api/ingest/upsert/route'

describe('Ingest upsert API', () => {
  it('rejects invalid payload', async () => {
    // @ts-ignore
    const req = { json: async () => ({}) } as NextRequest
    // @ts-ignore
    const res = await upsertPost(req)
    // @ts-ignore
    expect(res.status).toBe(400)
  })
})


