import { NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
	const items = Array.from({ length: 10 }, (_, i) => ({ id: `scr_${i+1}`, title: `Pattern ${i+1}`, updated_at: new Date(Date.now() - i*3600_000).toISOString() }))
	return NextResponse.json({ items })
}

