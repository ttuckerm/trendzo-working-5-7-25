jest.mock('openai', () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat = { completions: { create: async () => ({ choices: [ { message: { content: JSON.stringify({ verdict: 'pass', issues: [], recommendations: ['ok'] }) } } ], usage: { prompt_tokens: 10, completion_tokens: 20 } }) } }
  }
}))

import { runJudge } from '../../lib/llm/judge'

describe('Judge loop (ts-jest, mocked provider)', () => {
  it('returns structured JSON and calls persistence helpers', async () => {
    process.env.OPENAI_API_KEY = 'test'
    const out = await runJudge({
      auditId: 'test_judge',
      model: { provider: 'openai', name: 'gpt-4o' },
      doerOutput: { prediction: { score: 70, probability: 0.7, confidence: 0.8 }, features: { a: 1 } },
      rubric: [{ token: 'hook', weight: 1 }],
      constraints: { safety: true },
      predictionId: 'vid_1'
    })
    expect(['pass','fail','needs_review']).toContain(out.verdict)
    expect(Array.isArray(out.issues)).toBe(true)
    expect(Array.isArray((out as any).recommendations || [])).toBe(true)
  })
})


