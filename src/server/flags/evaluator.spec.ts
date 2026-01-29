import { describe, it, expect } from 'vitest'
import { evaluateFlag } from './evaluator'

describe('evaluateFlag (minimal)', () => {
  it('returns false for unknown key', async () => {
    const res = await evaluateFlag('nonexistent_key', {})
    expect(res.enabled).toBe(false)
  })
})







