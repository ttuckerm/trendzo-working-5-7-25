import { NextRequest, NextResponse } from 'next/server'
import { BanditOrchestrator, BanditArm } from '@/lib/bandit/orchestrator'
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
		const variants: BanditArm[] = Array.isArray(body?.variants) ? body.variants : []
		if (!variants.length) return NextResponse.json({ error: 'no_variants' }, { status: 400 })
		const expId = body?.experiment_id || `exp_${Date.now()}`
		const orchestrator = new BanditOrchestrator()
		const plan = orchestrator.allocate(variants)
		// Best-effort persist bandit snapshot on predictions if video_id provided
		try {
			const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
			await (db as any).rpc?.('exec_sql', { query: "alter table if exists predictions add column if not exists bandit_snapshot jsonb;" })
			if (body?.video_id) {
				await db.from('predictions').update({ bandit_snapshot: { experiment_id: expId, plan } } as any).eq('video_id', String(body.video_id))
			}
			await (db as any).rpc?.('exec_sql', { query: "create table if not exists bandit_experiments (id text primary key, last_decision timestamptz, snapshot jsonb);" })
			await db.from('bandit_experiments').upsert({ id: expId, last_decision: new Date().toISOString(), snapshot: plan } as any)
		} catch {}
		return NextResponse.json({ arms: plan.arms.map(a=>a.id), allocations: plan.allocations, winner: plan.winner, bandit_lift: plan.bandit_lift })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'bad_request' }, { status: 400 })
	}
}












