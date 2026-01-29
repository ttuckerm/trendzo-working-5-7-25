import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	return NextResponse.json({ versions: ['v1','v2'], deprecation: { version: 'v1', sunset_in_days: 90 }, smoke: { plugins_tested: 3, fail: 0 } })
}












