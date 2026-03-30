import { GET } from '@/app/api/metrics/route'

describe('/api/metrics', () => {
  it('includes weather status and lastChangeISO', async () => {
    process.env.MOCK = '1'
    const res = await GET()
    const j = await (res as any).json()
    expect(j.weather).toBeTruthy()
    expect(['Stable','Shifting','Storm']).toContain(j.weather.status)
    expect(j.weather.lastChangeISO).toBeTruthy()
  })
})

import { GET as METRICS } from '@/app/api/metrics/route'

describe('API /api/metrics', () => {
  it('returns accuracy, calibration, and weather in MOCK mode', async () => {
    process.env.MOCK = '1'
    const res = await METRICS()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.accuracy).toBeDefined()
    expect(Array.isArray(json.calibration)).toBe(true)
    expect(json.calibration.length).toBeGreaterThan(0)
    expect(json.weather?.status).toBeDefined()
    expect(typeof json.driftIndex).toBe('number')
  })
})


