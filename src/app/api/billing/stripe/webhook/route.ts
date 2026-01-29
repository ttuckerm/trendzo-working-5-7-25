import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensureBillingTables(db: any) {
  const sql = `
  create table if not exists billing_customer (
    id uuid default gen_random_uuid() primary key,
    user_id uuid,
    stripe_customer_id text unique,
    plan text,
    seats int default 1,
    credits_remaining int default 0,
    delinquent boolean default false,
    created_at timestamptz default now()
  );
  create table if not exists subscription (
    id text primary key,
    customer_id uuid references billing_customer(id) on delete cascade,
    status text,
    current_period_end timestamptz,
    created_at timestamptz default now()
  );
  create table if not exists invoice_event (
    id text primary key,
    customer_id uuid,
    amount_due int,
    amount_paid int,
    currency text,
    status text,
    raw jsonb,
    created_at timestamptz default now()
  );`
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

function verifyStripeSignature(req: NextRequest): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return true
  try {
    const sig = req.headers.get('stripe-signature') || ''
    // Lightweight verification: ensure header present; full verification should use Stripe SDK
    return Boolean(sig)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureBillingTables(db)
  if (!verifyStripeSignature(req)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }
  const payload = await req.json().catch(()=>({})) as any
  const type = String(payload?.type || '')
  try {
    if (type === 'checkout.session.completed') {
      const stripeCustomerId = payload?.data?.object?.customer || payload?.customer || 'mock_cus'
      const plan = payload?.data?.object?.metadata?.plan || 'starter'
      const seats = Number(payload?.data?.object?.metadata?.seats || 1)
      const userId = payload?.data?.object?.metadata?.user_id || null
      const { data: cust } = await db.from('billing_customer').select('id').eq('stripe_customer_id', stripeCustomerId).limit(1)
      let customerId: string | null = cust?.[0]?.id || null
      if (!customerId) {
        const ins = await db.from('billing_customer').insert({ stripe_customer_id: stripeCustomerId, user_id: userId, plan, seats, credits_remaining: 10000 }).select('id').limit(1)
        customerId = ins.data?.[0]?.id || null
      } else {
        await db.from('billing_customer').update({ plan, seats }).eq('id', customerId as any)
      }
      return NextResponse.json({ ok: true })
    }
    if (type === 'invoice.paid' || type === 'invoice.payment_succeeded') {
      const stripeCustomerId = payload?.data?.object?.customer || 'mock_cus'
      const amount_paid = Number(payload?.data?.object?.amount_paid || 0)
      const currency = payload?.data?.object?.currency || 'usd'
      const id = payload?.data?.object?.id || `inv_${Date.now()}`
      const { data: cust } = await db.from('billing_customer').select('id').eq('stripe_customer_id', stripeCustomerId).limit(1)
      const customerId = cust?.[0]?.id || null
      await db.from('invoice_event').upsert({ id, customer_id: customerId, amount_due: amount_paid, amount_paid, currency, status: 'paid', raw: payload } as any)
      return NextResponse.json({ ok: true })
    }
    if (type === 'customer.subscription.updated' || type === 'customer.subscription.created') {
      const sub = payload?.data?.object || {}
      const id = sub?.id || `sub_${Date.now()}`
      const stripeCustomerId = sub?.customer || 'mock_cus'
      const status = sub?.status || 'active'
      const end = sub?.current_period_end ? new Date(sub.current_period_end*1000).toISOString() : new Date(Date.now()+30*24*3600*1000).toISOString()
      const { data: cust } = await db.from('billing_customer').select('id').eq('stripe_customer_id', stripeCustomerId).limit(1)
      const customerId = cust?.[0]?.id || null
      await db.from('subscription').upsert({ id, customer_id: customerId, status, current_period_end: end } as any)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: true, ignored: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}


