import Stripe from 'stripe';

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
  cached = new Stripe(key, { apiVersion: '2025-03-31.basil' });
  return cached;
}

export function getStripeOrNull(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return getStripe();
}
