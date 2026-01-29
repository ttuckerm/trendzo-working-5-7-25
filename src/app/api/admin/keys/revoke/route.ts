import { NextRequest, NextResponse } from 'next/server'
import { revokeKey } from '@/lib/moat/keys'

export async function POST(req: NextRequest) {
	const admin = req.headers.get('authorization') || req.headers.get('x-admin-token') || ''
	if (!admin || admin !== (process.env.ADMIN_TOKEN || process.env.SUPABASE_SERVICE_KEY)) {
		return NextResponse.json({ ok: false, message: 'forbidden' }, { status: 403 })
	}
	try {
		const body = await req.json()
		const keyId = String(body?.keyId || '')
		if (!keyId) return NextResponse.json({ ok: false, message: 'missing_keyId' }, { status: 400 })
		const ok = revokeKey(keyId)
		if (!ok) return NextResponse.json({ ok: false, message: 'not_found' }, { status: 404 })
		return NextResponse.json({ ok: true })
	} catch {
		return NextResponse.json({ ok: false, message: 'bad_request' }, { status: 400 })
	}
}


