import { orchestrator } from '@/lib/jarvis/orchestrator'

describe('Jarvis Orchestrator', () => {
  it('dispatches clear cache intent', async () => {
    const out = await orchestrator.dispatchIntent({ utterance: 'Clear cache', mode: 'text', actor: { id: 't', role: 'super_admin' } })
    expect(out.skillId).toBe('cache_clear')
  })
})









