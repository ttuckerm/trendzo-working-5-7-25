import { NextRequest, NextResponse } from 'next/server'
import { getPlan } from '@/lib/billing/plans'

export async function POST(req: NextRequest) {
	const body = await req.json().catch(()=>({})) as any
	const planId = String(body?.plan || 'starter')
	const plan = getPlan(planId)
	const provider = (process.env.BILLING_PROVIDER || 'mock').toLowerCase()
	if (provider === 'stripe' && process.env.STRIPE_SECRET_KEY) {
		// Minimal: return mock-like URL but formatted as stripe redirect for now
		return NextResponse.json({ url: `https://billing.stripe.com/session/${plan.id}` })
	}
	// Mock provider
	return NextResponse.json({ url: `https://mock/checkout/${plan.id}` })
}












