import { genHookRewrites, genCTAs, genCaptionTighten, genHashtagSet, genTemplateSwap } from '@/lib/coach/generators'

describe('coach.generators', () => {
	it('produces deterministic suggestions in MOCK', () => {
		process.env.MOCK = '1'
		const input = { platform:'tiktok', niche:'general', scriptText:'hello world', caption:'cap', durationSec:20 }
		const a = genHookRewrites(input)
		const b = genHookRewrites(input)
		expect(a[0].preview).toBe(b[0].preview)
		expect(genCTAs(input).length).toBeGreaterThan(0)
		expect(genCaptionTighten(input).length).toBe(1)
		expect(genHashtagSet(input).length).toBe(1)
		expect(genTemplateSwap(input).length).toBe(1)
	})
})


