import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
	const provider = (process.env.BILLING_PROVIDER || 'mock').toLowerCase()
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	try {
		const payload = await req.json().catch(()=>({})) as any
		if (provider === 'stripe') {
			// Note: In production, verify signature using STRIPE_WEBHOOK_SECRET
		}
		// Normalize basic events (mock-friendly)
		const type = payload?.type || 'invoice.paid'
		if (type.startsWith('customer.subscription.')) {
			const userId = payload?.data?.object?.metadata?.user_id || payload?.user_id || null
			const plan = payload?.data?.object?.plan || payload?.plan || 'starter'
			const status = payload?.data?.object?.status || payload?.status || 'active'
			const end = payload?.data?.object?.current_period_end ? new Date(payload.data.object.current_period_end*1000).toISOString() : new Date(Date.now()+30*24*3600*1000).toISOString()
			if (userId) await db.from('billing_subscriptions').upsert({ user_id: userId, subscription_id: payload?.data?.object?.id || 'mock_sub', plan, status, current_period_end: end } as any)
		}
		if (type === 'invoice.paid') {
			const userId = payload?.data?.object?.metadata?.user_id || payload?.user_id || 'demo'
			const totalCents = Number(payload?.data?.object?.total || payload?.total_cents || 12900)
			await db.from('billing_invoices').upsert({ id: payload?.data?.object?.id || 'mock_inv', user_id: userId, total_cents: totalCents, status: 'paid' } as any)
			return NextResponse.json({ event: 'invoice.paid', total_cents: totalCents })
		}
		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'error' }, { status: 500 })
	}
}












