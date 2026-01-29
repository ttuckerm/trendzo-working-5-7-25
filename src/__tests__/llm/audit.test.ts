import { ensureLLMCallsTable, writeLLMCall, sha256Hex } from '@/lib/llm/audit'

describe('LLM audit helper', () => {
  it('ensures table and writes a record (no-throw)', async () => {
    await expect(ensureLLMCallsTable()).resolves.not.toThrow()
    await expect(writeLLMCall({
      id: 'test_audit',
      role: 'Teacher',
      provider: 'openai',
      model: 'gpt-test',
      input_digest: sha256Hex('in'),
      output_digest: sha256Hex('out'),
      status: 'ok',
      cache_hit: false,
      latency_ms: 1
    })).resolves.not.toThrow()
  })
})



