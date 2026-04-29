import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getServiceSupabase } from '@/lib/stripe/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AMOUNT_CENTS = 9700;

export async function POST() {
  const priceId = process.env.STRIPE_PRICE_ID_ESCAPE_ASSESSMENT;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!priceId || !siteUrl) {
    console.error('[checkout/create-session] missing env', {
      hasPriceId: Boolean(priceId),
      hasSiteUrl: Boolean(siteUrl),
    });
    return NextResponse.json(
      { ok: false, error: 'Checkout is not configured.' },
      { status: 500 },
    );
  }

  const base = siteUrl.replace(/\/$/, '');
  const stripe = (() => {
    try {
      return getStripe();
    } catch (e) {
      console.error('[checkout/create-session] stripe init failed', e);
      return null;
    }
  })();
  if (!stripe) {
    return NextResponse.json(
      { ok: false, error: 'Checkout unavailable, try again in a moment.' },
      { status: 503 },
    );
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/welcome?source=paid&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?checkout=cancelled`,
      allow_promotion_codes: false,
    });
  } catch (e) {
    console.error('[checkout/create-session] stripe error', e);
    return NextResponse.json(
      { ok: false, error: 'Checkout unavailable, try again in a moment.' },
      { status: 503 },
    );
  }

  if (!session.url) {
    console.error('[checkout/create-session] no session url returned');
    return NextResponse.json(
      { ok: false, error: 'Checkout unavailable, try again in a moment.' },
      { status: 503 },
    );
  }

  const supabase = getServiceSupabase();
  if (supabase) {
    const { error: insertErr } = await supabase
      .from('stripe_purchases')
      .insert({
        stripe_session_id: session.id,
        amount_paid_cents: AMOUNT_CENTS,
        status: 'pending',
      });
    if (insertErr) {
      // If the row failed to land, the webhook still has a Stripe-side record
      // and we can reconcile, but verify-session won't recognize the session.
      // Surface a soft failure rather than blocking the user from paying.
      console.error('[checkout/create-session] supabase insert failed', insertErr);
    }
  } else {
    console.warn('[checkout/create-session] supabase not configured — purchase row not recorded');
  }

  return NextResponse.json({ ok: true, url: session.url });
}
