import { z } from 'zod'
import { llmWrapper } from './wrapper'
import { ScoutOutputSchema } from './contracts'

export async function callScout({ messages, maxTokens }: { messages: any[]; maxTokens?: number }) {
  const isMock = (process.env.LLM_PROVIDER ?? 'mock') === 'mock'
  const schemaToUse = isMock ? z.any() : (ScoutOutputSchema as z.ZodType<any>)
  const { data } = await llmWrapper.callLLM({
    ctx: {
      auditId: 'scout_' + Date.now(),
      role: 'Scout',
      model: { provider: 'openai', name: 'gpt-4o' },
      budget: { maxOutputTokens: maxTokens ?? 800 }
    },
    schema: schemaToUse,
    messages,
    maxTokens: maxTokens ?? 800
  })
  return data
}


