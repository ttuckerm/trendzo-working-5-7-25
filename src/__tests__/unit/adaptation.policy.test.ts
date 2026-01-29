import { planRetune } from '@/lib/adaptation/policy'

describe('adaptation.policy', () => {
  it('returns signals and a ProposedChange with required fields', async () => {
    process.env.MOCK = '1'
    const { signals, proposed } = await planRetune()
    expect(signals).toBeTruthy()
    expect(proposed).toBeTruthy()
    expect(typeof proposed.versionFrom).toBe('number')
    expect(typeof proposed.versionTo).toBe('number')
    expect(['Stable','Shifting','Storm']).toContain(proposed.severity)
    expect(typeof proposed.newThreshold).toBe('number')
    expect(typeof proposed.newWeights).toBe('object')
    expect(Array.isArray(proposed.newCalibrationBins)).toBe(true)
    expect(typeof proposed.expected?.accuracy).toBe('number')
  })
})


