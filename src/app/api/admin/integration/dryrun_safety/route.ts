import { NextRequest, NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
	return NextResponse.json({ brand_safety: 'PG', policy_risk: 'low', safe_to_promote: true })
}












