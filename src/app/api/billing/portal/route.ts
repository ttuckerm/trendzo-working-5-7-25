import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
	const provider = (process.env.BILLING_PROVIDER || 'mock').toLowerCase()
	if (provider === 'stripe') {
		try {
			const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
			const { data } = await db.from('billing_customer').select('stripe_customer_id').limit(1)
			const cus = data?.[0]?.stripe_customer_id || 'mock_cus'
			return NextResponse.json({ url: `https://billing.stripe.com/p/session/${cus}` })
		} catch {}
		return NextResponse.json({ url: 'https://billing.stripe.com/p/session/mock' })
	}
	return NextResponse.json({ url: 'https://mock/portal' })
}







