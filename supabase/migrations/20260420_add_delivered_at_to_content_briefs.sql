-- Phase 1 Build 1C prep: real delivered_at timestamp on content_briefs.
-- Until now the overnight triage and any "hours since delivery" calculation
-- has had to fall back to created_at as a proxy. After this migration,
-- src/lib/email/send-brief.ts writes delivered_at = now() at the same
-- moment delivery_status flips to 'delivered'.

ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Backfill: assume delivered_at = created_at for any brief already marked
-- delivered. Rough but defensible — these rows had no other timestamp to
-- anchor to. Future deliveries will set delivered_at accurately.
UPDATE content_briefs
SET delivered_at = created_at
WHERE delivery_status = 'delivered'
  AND delivered_at IS NULL;

COMMENT ON COLUMN content_briefs.delivered_at IS
  'Set when delivery_status flips to ''delivered'' (see src/lib/email/send-brief.ts). '
  'Rows existing prior to 2026-04-20 were backfilled from created_at.';
