import { planRetune } from '@/lib/adaptation/policy'
import { applyProposedChange } from '@/lib/adaptation/apply'

describe('adaptation.apply', () => {
  it('creates a candidate model from ProposedChange', async () => {
    process.env.MOCK = '1'
    const { proposed } = await planRetune()
    const res = await applyProposedChange(proposed)
    expect(res.candidate).toBeTruthy()
    expect(res.candidate.version).toBeGreaterThan(res.current.version)
  })
})


