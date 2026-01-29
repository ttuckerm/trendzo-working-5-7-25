import { applyEdit, computeUnifiedDiff } from '@/lib/coach/apply'

describe('coach.apply', () => {
	it('applies edits immutably', () => {
		const input = { platform:'tiktok', scriptText:'a', caption:'b' }
		const out = applyEdit(input as any, { scriptText:'x' })
		expect(out.scriptText).toBe('x')
		expect(input.scriptText).toBe('a')
	})
	it('produces simple unified diff', () => {
		const diff = computeUnifiedDiff('hello', 'hello world', 'script')
		expect(diff.includes('--- a/script')).toBe(true)
		expect(diff.includes('+++ b/script')).toBe(true)
		expect(diff.includes('+ hello world') || diff.includes('+ world')).toBe(true)
	})
})


