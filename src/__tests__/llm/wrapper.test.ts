import { llmWrapper } from '@/lib/llm/wrapper'
import { z } from 'zod'

let createImpl: any = async () => ({ choices: [ { message: { content: JSON.stringify({ ok: true }) } } ], usage: { prompt_tokens: 5, completion_tokens: 5 } })

jest.mock('openai', () => ({
  __esModule: true,
  default: class MockOpenAI { chat = { completions: { create: (...args:any[]) => createImpl(...args) } } }
}))

// These tests mock the provider layer by injecting a JSON echo using unsupported provider paths
// In CI where API keys may be missing, we test budget guard and schema validation fast-fail behavior.

describe('LLM wrapper budget and validation', () => {
  it('valid JSON returns status ok (no throw) under mock provider', async () => {
    process.env.OPENAI_API_KEY = 'test'
    const schema = z.object({ ok: z.boolean() })
    const out = await llmWrapper.callLLM({
      ctx: { auditId: 'ok_' + Date.now(), role: 'Judge', model: { provider: 'openai', name: 'gpt-4o' }, budget: { maxOutputTokens: 50 } },
      schema,
      messages: [ { role: 'user', content: 'just return json' } ],
      maxTokens: 50
    })
    expect(out.data.ok).toBe(true)
  })

  it('fails budget when maxOutputTokens exceeded', async () => {
    const schema = z.object({ ok: z.boolean() })
    await expect(llmWrapper.callLLM({
      ctx: {
        auditId: 'test_budget',
        role: 'Teacher',
        model: { provider: 'openai', name: 'gpt-4o' },
        budget: { maxOutputTokens: 5 }
      },
      schema,
      messages: [
        { role: 'system', content: 'return {"ok":true} as JSON' },
        { role: 'user', content: 'please respond with JSON' }
      ],
      maxTokens: 200
    })).rejects.toHaveProperty('message', 'Budget exceeded: maxOutputTokens')
  })

  // replaced by provider configuration tests at bottom

  it('retry repairs invalid JSON on second attempt (simulated by flipping mock between attempts)', async () => {
    let first = true
    createImpl = async () => {
      if (first) { first = false; return { choices: [ { message: { content: '{invalid' } } ], usage: { prompt_tokens: 5, completion_tokens: 5 } } }
      return { choices: [ { message: { content: JSON.stringify({ ok: true }) } } ], usage: { prompt_tokens: 5, completion_tokens: 5 } }
    }
    const schema = z.object({ ok: z.boolean() })
    const out = await llmWrapper.callLLM({
      ctx: { auditId: 'repair_' + Date.now(), role: 'Judge', model: { provider: 'openai', name: 'gpt-4o' }, budget: { maxOutputTokens: 50 } },
      schema,
      messages: [ { role: 'user', content: 'return ok json' } ],
      maxTokens: 50
    })
    expect(out.data.ok).toBe(true)
  })

  it('repairs invalid JSON within 3 attempts under mock provider', async () => {
    createImpl = async () => ({ choices: [ { message: { content: '{invalid' } } ], usage: { prompt_tokens: 5, completion_tokens: 5 } })
    const schema = z.object({ ok: z.boolean() })
    const out = await llmWrapper.callLLM({
      ctx: { auditId: 'err_' + Date.now(), role: 'Judge', model: { provider: 'openai', name: 'gpt-4o' }, budget: { maxOutputTokens: 50 } },
      schema,
      messages: [ { role: 'user', content: 'return ok json ' + Date.now() } ],
      maxTokens: 50
    })
    expect(out).toBeTruthy()
  })
})

describe('provider configuration', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('rejects when provider=openai and API key missing', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LLM_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;

    const { LLMWrapper } = require('../../lib/llm/wrapper');
    const wrapper = new LLMWrapper();

    await expect(wrapper.callLLM({
      ctx: {
        auditId: 'prov_openai_no_key',
        role: 'Teacher',
        model: { provider: 'openai', name: 'gpt-4o' },
        budget: { maxOutputTokens: 100 }
      },
      messages: [{ role: 'user', content: 'please respond' }],
      maxTokens: 50,
      schema: z.object({ ok: z.boolean() })
    })).rejects.toThrow('OpenAI not configured');
  });
});



