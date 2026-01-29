import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
	return NextResponse.json({
		checkout_url: 'https://mock/checkout/starter',
		subscription: { user_id: 'demo', plan: 'starter', status: 'active' },
		usage_sync: { score_calls: 1200, report_sent: true },
		webhook: { event: 'invoice.paid', total_cents: 12900 },
		enforcement_check: { plan: 'starter', quota_remaining: { score: 8800, coach: 500, sim: 200 } }
	})
}












