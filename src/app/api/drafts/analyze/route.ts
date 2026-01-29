import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAccess } from '@/middleware/rbac'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest){
	try{
		const body = await req.json().catch(()=> ({}))

		// If transcript/script provided, use real XGBoost predictions
		const transcript = body?.transcript || body?.script || body?.scriptText
		if (transcript) {
			const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/predict`, {
				method:'POST',
				headers:{ 'content-type':'application/json' },
				body: JSON.stringify({ transcript, title: body?.title, metadata: body?.metadata })
			})
			const j = await r.json().catch(()=>({}))
			return NextResponse.json(j, { status: r.status })
		}

		// Fallback to old fake scoring
		const payload = { videoUrl: body?.url || body?.videoUrl, scriptText: body?.script || body?.scriptText, platform: body?.platform || 'tiktok', niche: body?.niche || 'general' }
		const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/analyze`, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify(payload) })
		const j = await r.json().catch(()=>({}))
		return NextResponse.json(j, { status: r.status })
	}catch(e:any){
		return NextResponse.json({ error: String(e?.message||e) }, { status: 200 })
	}
}
