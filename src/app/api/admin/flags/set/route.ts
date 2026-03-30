import { NextRequest, NextResponse } from 'next/server'
import { setFlag } from '@/lib/moat/flags'

export async function POST(req: NextRequest) {
	const admin = req.headers.get('authorization') || req.headers.get('x-admin-token') || ''
	if (!admin || admin !== (process.env.ADMIN_TOKEN || process.env.SUPABASE_SERVICE_KEY)) {
		return NextResponse.json({ ok: false, message: 'forbidden' }, { status: 403 })
	}
	try {
		const body = await req.json()
		const name = String(body?.name)
		const value = !!body?.value
		if (!name) return NextResponse.json({ ok: false, message: 'missing_name' }, { status: 400 })
		const next = setFlag(name as any, value)
		return NextResponse.json({ ok: true, flags: next })
	} catch {
		return NextResponse.json({ ok: false, message: 'bad_request' }, { status: 400 })
	}
}


