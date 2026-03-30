import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	return NextResponse.json({ brand_safety: 'PG', policy_risk: 'low', safe_to_promote: true })
}












