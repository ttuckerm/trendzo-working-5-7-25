import { z } from 'zod'
import { TeacherOutputSchema, ScoutOutputSchema, JudgeOutputSchema } from '@/lib/llm/schemas'

describe('LLM contracts validation', () => {
  it('rejects free-text for TeacherOutput', () => {
    const res = TeacherOutputSchema.safeParse('not json')
    expect(res.success).toBe(false)
  })

  it('accepts valid TeacherOutput JSON', () => {
    const sample = {
      candidates: [{ id: 'x', name: 'T', scriptOutline: ['a'], expectedHooks: ['h'], rationale: 'r' }],
      confidence: 0.8,
      meta: { cacheHit: false }
    }
    const res = TeacherOutputSchema.safeParse(sample)
    expect(res.success).toBe(true)
  })

  it('accepts ScoutOutput JSON', () => {
    const sample = {
      rubric: [{ token: 'trend', weight: 1, description: 'desc' }],
      coverage: { knownTrendsCovered: 1, newSignals: 0, freshnessHours: 2 },
      confidence: 0.7,
      meta: { cacheHit: false }
    }
    const res = ScoutOutputSchema.safeParse(sample)
    expect(res.success).toBe(true)
  })

  it('accepts JudgeOutput JSON', () => {
    const sample = {
      verdict: 'pass',
      issues: [],
      meta: { cacheHit: false }
    }
    const res = JudgeOutputSchema.safeParse(sample)
    expect(res.success).toBe(true)
  })
})



