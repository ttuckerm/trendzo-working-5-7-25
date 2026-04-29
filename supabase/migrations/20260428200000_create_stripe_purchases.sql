-- Stripe purchases for the Escape Assessment paid-path checkout.
-- Tracks one-time $97 Stripe Checkout sessions and their lifecycle:
-- pending → paid (webhook fires) → consumed (assessment generated).
--
-- The assessment_id column is a real FK to escape_assessments(assessment_id);
-- it is set when the assessment is generated against a paid session.
-- ON DELETE SET NULL preserves the purchase row even if the assessment is
-- somehow removed.

CREATE TABLE IF NOT EXISTS public.stripe_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'consumed', 'expired')),
  email TEXT,
  assessment_id UUID
    REFERENCES public.escape_assessments(assessment_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS stripe_purchases_session_id_idx
  ON public.stripe_purchases(stripe_session_id);

CREATE INDEX IF NOT EXISTS stripe_purchases_status_idx
  ON public.stripe_purchases(status);

CREATE INDEX IF NOT EXISTS stripe_purchases_email_idx
  ON public.stripe_purchases(email);

ALTER TABLE public.stripe_purchases ENABLE ROW LEVEL SECURITY;

-- No public policies. All reads/writes are server-side via the service role.
