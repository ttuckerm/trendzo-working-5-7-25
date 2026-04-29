import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { getServiceSupabase } from '@/lib/stripe/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[checkout/webhook] STRIPE_WEBHOOK_SECRET not configured');
    return new NextResponse('Webhook not configured', { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return new NextResponse('Missing signature', { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (e) {
    console.error('[checkout/webhook] signature verification failed', e);
    return new NextResponse('Bad signature', { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const supabase = getServiceSupabase();
  if (!supabase) {
    console.error('[checkout/webhook] supabase not configured');
    return NextResponse.json({ received: true });
  }

  const update = {
    status: 'paid' as const,
    paid_at: new Date().toISOString(),
    email: session.customer_details?.email ?? session.customer_email ?? null,
    stripe_customer_id:
      typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null,
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id ?? null,
  };

  const { error: updateErr } = await supabase
    .from('stripe_purchases')
    .update(update)
    .eq('stripe_session_id', session.id);

  if (updateErr) {
    console.error('[checkout/webhook] update failed', updateErr);
    // Still 200 so Stripe doesn't keep retrying — log and reconcile manually.
  }

  return NextResponse.json({ received: true });
}
