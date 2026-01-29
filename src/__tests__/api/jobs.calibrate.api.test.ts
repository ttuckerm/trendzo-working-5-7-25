import { POST as CAL } from '@/app/api/jobs/calibrate/route'

describe('/api/jobs/calibrate', () => {
  it('runs and returns cohort summary', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service-placeholder'
    const req = new Request('http://test/jobs/calibrate', { method: 'POST' }) as any
    const res = await CAL(req)
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j).toHaveProperty('cohorts')
    expect(j).toHaveProperty('avgECE')
  })
})



