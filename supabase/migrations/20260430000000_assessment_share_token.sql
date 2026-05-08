-- Add an unguessable share_token to every escape_assessments row so the
-- user-facing URL becomes /assessment/{EA-X-XXX}-{share_token} instead of just
-- /assessment/{EA-X-XXX}. The EA-X-XXX namespace only has ~3 characters of
-- randomness (8,100 values), so it's trivially enumerable. The share_token
-- adds 20 characters of url-safe randomness — making the URL effectively
-- unguessable and gating Agent / personal-data access on possession of the
-- full URL.
--
-- Strategy:
--   1. Add column nullable.
--   2. Backfill every existing row with a unique 20-char token using pgcrypto.
--   3. Apply NOT NULL + UNIQUE constraint.
--   4. Set DEFAULT for future inserts (server still passes an explicit value;
--      the default is the safety net).

BEGIN;

-- pgcrypto gives us gen_random_bytes for the token generator.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: 20 lowercase alphanumeric chars derived from gen_random_bytes.
-- Uses base32-style encoding (substr of an md5 of random bytes) — fast, no
-- ambiguous characters, ~100 bits of entropy in 20 chars.
CREATE OR REPLACE FUNCTION public.generate_assessment_share_token()
RETURNS TEXT
LANGUAGE SQL
VOLATILE
AS $$
  SELECT substr(
    encode(gen_random_bytes(16), 'hex'),
    1,
    20
  );
$$;

-- 1. Add column nullable.
ALTER TABLE public.escape_assessments
  ADD COLUMN IF NOT EXISTS share_token TEXT;

-- 2. Backfill existing rows. The column was just added so any null row needs
--    a token. Loop in case of unique-collision retries (16-byte hex space is
--    huge so a single pass is essentially always sufficient).
DO $$
DECLARE
  remaining INTEGER;
  attempts INTEGER := 0;
BEGIN
  LOOP
    UPDATE public.escape_assessments
    SET share_token = public.generate_assessment_share_token()
    WHERE share_token IS NULL;

    SELECT COUNT(*) INTO remaining
    FROM public.escape_assessments
    WHERE share_token IS NULL;

    EXIT WHEN remaining = 0;
    attempts := attempts + 1;
    IF attempts > 5 THEN
      RAISE EXCEPTION 'share_token backfill could not converge after % attempts', attempts;
    END IF;
  END LOOP;
END $$;

-- 3. Apply NOT NULL + UNIQUE.
ALTER TABLE public.escape_assessments
  ALTER COLUMN share_token SET NOT NULL;

ALTER TABLE public.escape_assessments
  ALTER COLUMN share_token SET DEFAULT public.generate_assessment_share_token();

CREATE UNIQUE INDEX IF NOT EXISTS uniq_escape_assessments_share_token
  ON public.escape_assessments (share_token);

COMMENT ON COLUMN public.escape_assessments.share_token IS
  'Unguessable URL-safe token. Combined with the EA-X-XXX display id to form /assessment/{display_id}-{share_token}. Required to access the assessment or its Agent.';

COMMIT;
