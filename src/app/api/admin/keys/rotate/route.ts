import { NextRequest, NextResponse } from 'next/server'
import { rotateKey } from '@/lib/moat/keys'
import { rotateApiKey } from '@/lib/security/key_rotation'

function isAuthorized(req: NextRequest): boolean {
	const bearer = req.headers.get('authorization') || req.headers.get('x-admin-token') || ''
	const apiKeyHeader = req.headers.get('x-api-key') || ''
	const tokenOk = !!(process.env.ADMIN_TOKEN || process.env.SUPABASE_SERVICE_KEY) && bearer === (process.env.ADMIN_TOKEN || process.env.SUPABASE_SERVICE_KEY)
	const apiKeyOk = !!(process.env.ADMIN_API_KEY || process.env.NEXTAUTH_SECRET) && apiKeyHeader === (process.env.ADMIN_API_KEY || process.env.NEXTAUTH_SECRET)
	return tokenOk || apiKeyOk
}

export async function POST(req: NextRequest) {
	if (!isAuthorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
	const body = await req.json().catch(()=>({})) as any
	const keyIdAlt = String(body?.keyId || '')
	const keyId = String(body?.key_id || keyIdAlt)
	if (!keyId) return NextResponse.json({ error: 'missing_key_id' }, { status: 400 })
	try {
		// Prefer new rotateApiKey, fallback to legacy rotateKey
		try {
			const out = await rotateApiKey(keyId)
			return NextResponse.json({ key_id: keyId, ...out })
		} catch {
			const out = rotateKey(keyId)
			if (!out) return NextResponse.json({ error: 'not_found' }, { status: 404 })
			return NextResponse.json({ ok: true, keyId: out.keyId, keyLast4: out.keyLast4, plaintext: out.plaintext })
		}
	} catch {
		return NextResponse.json({ error: 'bad_request' }, { status: 400 })
	}
}









