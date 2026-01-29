import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const userId = req.headers.get('x-user-id') || null
  try {
    const { data: cust } = userId
      ? await db.from('billing_customer').select('plan,seats,credits_remaining,delinquent').eq('user_id', userId).limit(1)
      : await db.from('billing_customer').select('plan,seats,credits_remaining,delinquent').limit(1)
    const plan = cust?.[0]?.plan || 'starter'
    const seats = cust?.[0]?.seats || 1
    const credits_remaining = cust?.[0]?.credits_remaining ?? 0
    const delinquent = Boolean(cust?.[0]?.delinquent) || false
    const { data: sub } = await db.from('subscription').select('current_period_end').order('current_period_end', { ascending: false }).limit(1)
    const renews_at = sub?.[0]?.current_period_end || null
    const res = NextResponse.json({ plan, seats, renews_at, delinquent, credits_remaining })
    res.headers.set('X-Usage-Plan', String(plan))
    res.headers.set('X-Quota-Remaining', String(Math.max(0, Number(credits_remaining || 0))))
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}


