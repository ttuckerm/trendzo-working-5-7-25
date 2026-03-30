import { NextRequest, NextResponse } from 'next/server'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { requireRole } from '@/lib/auth/server-auth'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
	const rl = await commonRateLimiters.admin(req)
	if (rl) return rl
	const guard = await requireRole(req, ['chairman', 'sub_admin'])
	if (guard) return guard
	let audit_id: string | null = null
	const schedule_id = `sch_${Math.random().toString(36).slice(2,8)}${Date.now()}`
	try {
		const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
		const body = await req.json().catch(()=>({}))
		const ins = await db.from('pipeline_control_actions').insert({ action: 'opt_schedule', user_id: req.headers.get('x-user-id') || null, params: { schedule_id, input: body } } as any).select('id').limit(1)
		audit_id = (ins.data as any)?.[0]?.id || null
	} catch {}
	return NextResponse.json({ schedule_id, audit_id })
}

