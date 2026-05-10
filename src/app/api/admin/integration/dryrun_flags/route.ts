import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
	return NextResponse.json({ user: 'demo', plan: 'starter', cohorts: ['beta'], flags: { simulator: true, coach: false, algorithm_weather: true } })
}












