import { NextRequest, NextResponse } from 'next/server'
import { BanditOrchestrator } from '@/lib/bandit/orchestrator'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

function requireApiKey(req: NextRequest): boolean {
	const key = req.headers.get('x-api-key') || ''
	const expected = process.env.BANDIT_API_KEY || process.env.NEXTAUTH_SECRET || ''
	return !!expected && key === expected
}

export async function POST(req: NextRequest) {
	if (!requireApiKey(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
	try {
		const body = await req.json().catch(()=>({})) as any
		const experimentId = String(body?.experiment_id || '')
		const variantId = String(body?.variant_id || '')
		const metrics = body?.metrics || null
		if (!experimentId || !variantId || !metrics) return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
		// Stateless update: compute reward and persist into a table for history
		try {
			const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
			await (db as any).rpc?.('exec_sql', { query: "create table if not exists bandit_events (id bigserial primary key, experiment_id text, variant_id text, metrics jsonb, reward double precision, ts timestamptz default now());" })
			const orch = new BanditOrchestrator()
			const reward = orch.computeReward(metrics)
			await db.from('bandit_events').insert({ experiment_id: experimentId, variant_id: variantId, metrics, reward } as any)
		} catch {}
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'bad_request' }, { status: 400 })
	}
}












