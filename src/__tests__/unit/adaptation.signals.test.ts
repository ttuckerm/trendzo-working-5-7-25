import { computeSignals } from '@/lib/adaptation/signals'

describe('adaptation.signals', () => {
  it('computes PSI/ECE/Accuracy deltas without throwing', () => {
    process.env.MOCK = '1'
    const s = computeSignals()
    expect(s).toHaveProperty('psiProb')
    expect(s).toHaveProperty('psiFeatures')
    expect(s).toHaveProperty('dECE')
    expect(s).toHaveProperty('dAcc')
    expect(s).toHaveProperty('jsTemplate')
    expect(['none','mild','moderate','severe']).toContain(s.severity)
  })
})


