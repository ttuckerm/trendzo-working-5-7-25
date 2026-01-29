import { NextRequest, NextResponse } from 'next/server'
import { getFlags } from '@/lib/moat/flags'
import { findKey, recordUsage } from '@/lib/moat/keys'
import { enforce } from '@/lib/moat/rate'
import { getUniqueInsightsCached } from '@/lib/insights/service'

export async function GET(req: NextRequest) {
	try {
		const flags = getFlags()
		if (!flags.publicApi || !flags.insights) return NextResponse.json({ ok: false, message: 'disabled' }, { status: 403 })
		const apiKey = req.headers.get('x-api-key') || ''
		if (!apiKey) return NextResponse.json({ ok: false, message: 'missing_key' }, { status: 401 })
		const rec = findKey(apiKey)
		if (!rec || rec.revoked) return NextResponse.json({ ok: false, message: 'invalid_key' }, { status: 401 })
		const gate = enforce(rec.keyId, rec.limits, 1)
		if (!gate.ok) return NextResponse.json({ ok: false, message: gate.reason === 'rpm' ? 'rate_limited_rpm' : 'rate_limited_rpd' }, { status: 429 })
		const url = new URL(req.url)
		const topN = Number(url.searchParams.get('n') || '50')
		const items = await getUniqueInsightsCached(Math.max(1, Math.min(200, topN)))
		recordUsage(rec.keyId, 1)
		return NextResponse.json({ items })
	} catch {
		return NextResponse.json({ items: [] })
	}
}


