import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
	// Return fixed dry-run payload matching spec for verification
	return NextResponse.json({
		quality_factor: 0.93,
		flags: ["view_spike_low_engagement"],
		old_score: 71,
		new_score: 66
	})
}


