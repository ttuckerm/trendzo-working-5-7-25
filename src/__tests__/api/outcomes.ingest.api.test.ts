import { POST as INGEST } from '@/app/api/outcomes/ingest/route'

describe('/api/outcomes/ingest', () => {
  it('accepts outcome and returns label+percentile', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service-placeholder'
    const req = new Request('http://test/outcomes/ingest', {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'tmp_123',
        variantId: 'vA',
        platform: 'tiktok',
        metrics: { views: 12000, watchTimePct: 41.2, retention3s: 0.76 },
        capturedAt: new Date().toISOString()
      })
    }) as any
    const res = await INGEST(req)
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j).toHaveProperty('label')
    expect(j).toHaveProperty('percentile')
  })
})



