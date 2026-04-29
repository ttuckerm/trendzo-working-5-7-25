-- Redemption codes for the Escape Assessment code-gated path.
--
-- Replaces the placeholder validation in /api/landing/code-validate (which
-- accepted any 5-letter string). Codes are generated offline by an admin
-- script (scripts/generate-codes.ts) and distributed via YouTube descriptions
-- or direct invitations. Redemption is single-use by default.
--
-- Mirrors the lifecycle pattern used by stripe_purchases:
--   created → redeemed (count incremented + redemption row inserted) →
--   linked  (assessment_id set when the assessment is generated).
--
-- All access is via the service role; no public RLS policies.

-- ─── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.redemption_codes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT UNIQUE NOT NULL,
  source            TEXT,
  max_redemptions   INTEGER NOT NULL DEFAULT 1
                      CHECK (max_redemptions > 0),
  redemption_count  INTEGER NOT NULL DEFAULT 0
                      CHECK (redemption_count >= 0),
  expires_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS redemption_codes_code_idx
  ON public.redemption_codes(code);

CREATE INDEX IF NOT EXISTS redemption_codes_source_idx
  ON public.redemption_codes(source);

CREATE TABLE IF NOT EXISTS public.code_redemptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id        UUID NOT NULL
                   REFERENCES public.redemption_codes(id) ON DELETE CASCADE,
  redeemed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assessment_id  UUID
                   REFERENCES public.escape_assessments(assessment_id)
                   ON DELETE SET NULL,
  ip_address     TEXT
);

CREATE INDEX IF NOT EXISTS code_redemptions_code_id_idx
  ON public.code_redemptions(code_id);

CREATE INDEX IF NOT EXISTS code_redemptions_assessment_id_idx
  ON public.code_redemptions(assessment_id);

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;
-- No public policies. Service-role only.

-- ─── Atomic redeem RPC ─────────────────────────────────────────────────────
--
-- Locks the code row, validates state, inserts a redemption, and increments
-- the count — all in one transaction. Raises a generic exception on any
-- failure mode (not found / revoked / expired / exhausted) so the API can
-- map all to the same opaque "invalid code" response without leaking which
-- check failed.
--
-- Returns the new code_redemptions.id so the caller can embed it in the
-- signed cookie and link the eventual assessment back to this redemption.

CREATE OR REPLACE FUNCTION public.redeem_code(p_code TEXT, p_ip TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code           public.redemption_codes%ROWTYPE;
  v_redemption_id  UUID;
BEGIN
  SELECT * INTO v_code
  FROM public.redemption_codes
  WHERE code = upper(p_code)
  FOR UPDATE;

  IF NOT FOUND
     OR v_code.revoked_at IS NOT NULL
     OR (v_code.expires_at IS NOT NULL AND v_code.expires_at <= NOW())
     OR v_code.redemption_count >= v_code.max_redemptions
  THEN
    RAISE EXCEPTION 'invalid_code' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.code_redemptions (code_id, ip_address)
  VALUES (v_code.id, p_ip)
  RETURNING id INTO v_redemption_id;

  UPDATE public.redemption_codes
     SET redemption_count = redemption_count + 1
   WHERE id = v_code.id;

  RETURN v_redemption_id;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_code(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_code(TEXT, TEXT) FROM anon, authenticated;
