import { z } from 'zod'
import { llmWrapper } from './wrapper'
import { TeacherOutputSchema } from './contracts'

export async function callTeacher({ messages, maxTokens }: { messages: any[]; maxTokens?: number }) {
  const isMock = (process.env.LLM_PROVIDER ?? 'mock') === 'mock'
  const schemaToUse = isMock ? z.any() : (TeacherOutputSchema as z.ZodType<any>)
  const { data } = await llmWrapper.callLLM({
    ctx: {
      auditId: 'teacher_' + Date.now(),
      role: 'Teacher',
      model: { provider: 'openai', name: 'gpt-4o' },
      budget: { maxOutputTokens: maxTokens ?? 800 }
    },
    schema: schemaToUse,
    messages,
    maxTokens: maxTokens ?? 800
  })
  return data
}


