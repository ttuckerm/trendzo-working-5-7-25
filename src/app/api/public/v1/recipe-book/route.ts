import { NextRequest, NextResponse } from 'next/server'
import { getFlags } from '@/lib/moat/flags'
import { issueKey, findKey, recordUsage } from '@/lib/moat/keys'
import { enforce } from '@/lib/moat/rate'
import { generateRecipeBook } from '@/lib/templates/service'
import { ensureFixtures } from '@/lib/data/init-fixtures'

export async function GET(req: NextRequest) {
	try {
		const flags = getFlags()
		if (!flags.publicApi) return NextResponse.json({ ok: false, message: 'disabled' }, { status: 403 })
		const apiKey = req.headers.get('x-api-key') || ''
		let planLimits = { rpm: 30, rpd: 1000 }
		let keyId = 'anon'
		if (apiKey) {
			const rec = findKey(apiKey)
			if (!rec || rec.revoked) return NextResponse.json({ ok: false, message: 'invalid_key' }, { status: 401 })
			keyId = rec.keyId
			planLimits = rec.limits
			const gate = enforce(keyId, planLimits, 1)
			if (!gate.ok) return NextResponse.json({ ok: false, message: gate.reason === 'rpm' ? 'rate_limited_rpm' : 'rate_limited_rpd' }, { status: 429 })
		}
		if (process.env.MOCK === '1') try { ensureFixtures() } catch {}
		const url = new URL(req.url)
		const window = (url.searchParams.get('window') as any) || '30d'
		const platform = url.searchParams.get('platform') || undefined
		const niche = url.searchParams.get('niche') || undefined
		try {
			const rb = await generateRecipeBook({ window, platform, niche })
			if (keyId !== 'anon') recordUsage(keyId, 1)
			return NextResponse.json(rb)
		} catch {
			// fallback to MOCK output safe shape
			try { ensureFixtures() } catch {}
			const rb = await generateRecipeBook({ window: '30d' as any })
			return NextResponse.json(rb)
		}
	} catch {
		return NextResponse.json({ generatedAtISO: new Date().toISOString(), counts: { hot: 0, cooling: 0, newly: 0, uses: 0, viral: 0 }, hot: [], cooling: [], newly: [] })
	}
}


