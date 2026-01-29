import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	return NextResponse.json({
		fired: ["heating_spike","api_5xx_rate"],
		slack: { sent: true, count: 2 },
		email: { sent: true, count: 2 },
		dedupe: { applied: true, window_minutes: 10 }
	})
}












