import { z } from 'zod'
import { llmWrapper } from './wrapper'
import { JudgeInputSchema, JudgeOutputSchema } from './schemas'
import { ensureJudgeCritiquesTable, writeJudgeCritique } from './audit'

const JudgeAnalysisSchema = JudgeOutputSchema

async function _runJudgeDetailed({
  auditId,
  model,
  doerOutput,
  rubric,
  constraints,
  predictionId
}: {
  auditId: string
  model: { provider: 'openai'|'anthropic'; name: string }
  doerOutput: { prediction: { score: number; probability: number; confidence: number }, features: Record<string, unknown> }
  rubric?: Array<{ token: string; weight: number }>
  constraints?: { safety?: boolean; alignment?: boolean }
  predictionId?: string | null
}) {
  const prompt = JSON.stringify({
    task: 'critique_prediction',
    doerOutput,
    rubric: rubric || [],
    constraints: constraints || {}
  })

  let result: any
  try {
    const { data } = await llmWrapper.callLLM({
      ctx: {
        auditId,
        role: 'Judge',
        model,
        budget: { maxOutputTokens: 800 }
      },
      schema: JudgeAnalysisSchema,
      messages: [
        { role: 'system', content: 'You are the Judge. Respond ONLY with JSON matching the required schema for verdict, issues, and recommendations.' },
        { role: 'user', content: `Critique the following Doer prediction based on rubric/constraints. Return strictly valid JSON.\nRequired JSON schema:\n{"verdict":"pass|fail|needs_review","issues":[{"code":"string","severity":"low|medium|high","rationale":"string"}],"recommendations":["string"]}\n\nINPUT:\n${prompt}` }
      ],
      maxTokens: 800
    })
    result = data
  } catch (e: any) {
    result = {
      verdict: 'needs_review',
      issues: [ { code: 'schema_validation_failed', severity: 'medium', rationale: String(e?.message || e) } ],
      recommendations: ['Return valid JSON strictly matching the required schema']
    }
  }

  await ensureJudgeCritiquesTable()
  await writeJudgeCritique({
    auditId,
    prediction_id: predictionId || null,
    verdict: result.verdict,
    issues: result.issues || [],
    recommendations: result.recommendations || []
  })

  return result
}

export async function callJudge({ messages, maxTokens }: { messages: any[]; maxTokens?: number }) {
  const isMock = (process.env.LLM_PROVIDER ?? 'mock') === 'mock'
  const schemaToUse = isMock ? z.any() : (JudgeOutputSchema as z.ZodType<any>)
  const { data } = await llmWrapper.callLLM({
    ctx: {
      auditId: 'judge_' + Date.now(),
      role: 'Judge',
      model: { provider: 'openai', name: 'gpt-4o' },
      budget: { maxOutputTokens: maxTokens ?? 800 }
    },
    schema: schemaToUse,
    messages,
    maxTokens: maxTokens ?? 800
  })
  return data
}

export async function runJudgeOrchestrator(input: { messages: any[]; maxTokens?: number }) {
  const teacher = await (await import('./teacher')).callTeacher(input)
  const critique = await callJudge({
    messages: [
      { role: 'system', content: 'Critique the teacher output strictly by rubric' },
      { role: 'user', content: JSON.stringify(teacher) }
    ],
    maxTokens: input.maxTokens ?? 300
  })
  await ensureJudgeCritiquesTable()
  await writeJudgeCritique({ auditId: 'judge_' + Date.now(), prediction_id: null, verdict: critique.verdict, issues: critique.issues || [], recommendations: critique.recommendations || [] })
  return { teacher, critique }
}

// Overloaded runJudge supporting both detailed and messages-only inputs
export async function runJudge(input: any): Promise<any> {
  if (Array.isArray(input?.messages)) {
    const { teacher, critique } = await runJudgeOrchestrator({ messages: input.messages, maxTokens: input.maxTokens })
    return { teacher, critique }
  }
  return _runJudgeDetailed(input)
}


