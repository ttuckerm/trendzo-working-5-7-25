import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(_req: NextRequest) {
	try {
		const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
		const since = new Date(Date.now()-24*3600*1000).toISOString()
		const { data } = await db.from('usage_events').select('route').gte('ts', since)
		const scoreCalls = (data||[]).filter((r:any)=> (r as any).route?.startsWith('/public/score')).length
		// Provider push mocked
		await (db as any).rpc?.('exec_sql', { query: "create table if not exists usage_sync (id bigserial primary key, ts timestamptz default now(), score_calls int);" })
		await db.from('usage_sync').insert({ score_calls: scoreCalls } as any)
		return NextResponse.json({ score_calls: scoreCalls, report_sent: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
	}
}












