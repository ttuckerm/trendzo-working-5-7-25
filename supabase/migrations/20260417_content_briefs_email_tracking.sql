-- Phase 1, Step 11-12: Email delivery tracking for content briefs
-- Complements existing delivery_status column (20260413). Records operator/creator
-- engagement with brief emails so overnight triage can surface "Jake opened the
-- brief but didn't respond" signal.
--
-- Known limitation: most clients block images by default. Three-state tracking:
--   "opened"         → tracking pixel loaded (confirmed)
--   "delivered"      → email sent OK, no open signal yet (unknown)
--   "not delivered"  → bounce or send failure (delivery_status column)

ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS opened_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clicked_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS open_count  INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_content_briefs_opened_at
  ON content_briefs(opened_at) WHERE opened_at IS NOT NULL;

COMMENT ON COLUMN content_briefs.opened_at IS
  'First time a creator/operator loaded the brief email tracking pixel. NULL = no confirmed open. Triage shows "delivered [N] days ago (no open confirmation)" when delivery_status=delivered and opened_at IS NULL.';

COMMENT ON COLUMN content_briefs.clicked_at IS
  'First time a tracked link in the brief email was clicked. Stronger engagement signal than opened_at (clicks are not image-blocked).';

COMMENT ON COLUMN content_briefs.open_count IS
  'Total pixel loads. Higher count = creator keeps referencing the brief. Operator signal of interest vs. one-and-done.';
