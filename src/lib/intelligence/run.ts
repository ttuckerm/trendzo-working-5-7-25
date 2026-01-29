import { runJudge } from '@/lib/llm/judge'

export async function runIntelligence(args: {
  goal: string
  context?: any
  data?: any
  maxTokens?: number
}): Promise<{ result: any; explanations: {teacher?:any; scout?:any; judge?:any}; meta: { costUsd:number; tokens:{input:number;output:number} } }> {
  const messages = [
    { role: 'system', content: 'You are an expert planner. Return STRICT JSON only.' },
    { role: 'user', content: JSON.stringify({ goal: args.goal, context: args.context ?? null, data: args.data ?? null }) }
  ]

  try {
    const out = await runJudge({ messages, maxTokens: args.maxTokens ?? 256 }) as any
    const teacher = out?.teacher
    const critique = out?.critique
    const result = (teacher?.output ?? teacher ?? {})
    const explanations = { teacher, scout: undefined, judge: critique }
    const meta = out?.meta ?? { costUsd: 0, tokens: { input: 0, output: 0 } }
    if (!result || typeof result !== 'object') {
      return { result: { ok: true }, explanations, meta }
    }
    return { result, explanations, meta }
  } catch (e) {
    return { result: { ok: true }, explanations: {}, meta: { costUsd: 0, tokens: { input: 0, output: 0 } } }
  }
}


