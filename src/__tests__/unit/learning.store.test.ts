import { getCurrentModel, saveCandidate, promoteCandidate, readCandidate } from '@/lib/learning/store'

describe('learning.store', () => {
  it('bootstraps and promotes candidate atomically', async () => {
    process.env.MOCK = '1'
    const cur = await getCurrentModel()
    const cand = { ...cur, version: cur.version + 1, parentVersion: cur.version, createdAtISO: new Date().toISOString() }
    await saveCandidate(cand)
    const readCand = await readCandidate()
    expect(readCand?.version).toBe(cand.version)
    const promoted = await promoteCandidate()
    expect(promoted.version).toBe(cand.version)
    const cur2 = await getCurrentModel()
    expect(cur2.version).toBe(cand.version)
  })
})








































































































































