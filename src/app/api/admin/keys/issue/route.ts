import { NextRequest, NextResponse } from 'next/server'
import { issueKey } from '@/lib/moat/keys'

export async function POST(req: NextRequest) {
	const admin = req.headers.get('authorization') || req.headers.get('x-admin-token') || ''
	if (!admin || admin !== (process.env.ADMIN_TOKEN || process.env.SUPABASE_SERVICE_KEY)) {
		return NextResponse.json({ ok: false, message: 'forbidden' }, { status: 403 })
	}
	try {
		const body = await req.json()
		const plan = (body?.plan || 'free') as any
		const out = issueKey(plan)
		return NextResponse.json({ ok: true, keyId: out.keyId, keyLast4: out.keyLast4, plan: out.plan, limits: out.limits, plaintext: out.plaintext })
	} catch {
		return NextResponse.json({ ok: false, message: 'bad_request' }, { status: 400 })
	}
}


