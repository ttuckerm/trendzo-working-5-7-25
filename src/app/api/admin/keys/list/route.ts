import { NextRequest, NextResponse } from 'next/server'
import { listKeysMasked } from '@/lib/moat/keys'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
	const admin = req.headers.get('authorization') || req.headers.get('x-admin-token') || ''
	if (!admin || admin !== (process.env.ADMIN_TOKEN || process.env.SUPABASE_SERVICE_KEY)) {
		return NextResponse.json({ ok: false, message: 'forbidden' }, { status: 403 })
	}
	try {
		const keys = listKeysMasked()
		return NextResponse.json({ ok: true, keys })
	} catch {
		return NextResponse.json({ ok: false, message: 'error' }, { status: 200 })
	}
}


