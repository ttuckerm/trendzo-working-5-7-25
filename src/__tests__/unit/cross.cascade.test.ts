import { buildCascades } from '@/lib/cross/service'

describe('cross.cascade', () => {
  it('builds cascades and computes lags/leader', async () => {
    process.env.MOCK = '1'
    const casc = await buildCascades({ windowDays: 30 })
    expect(Array.isArray(casc)).toBe(true)
    if (casc.length > 0) {
      const c = casc[0]
      expect(c.leader).toBeTruthy()
      expect(c.nodes.length).toBeGreaterThanOrEqual(2)
    }
  })
})


