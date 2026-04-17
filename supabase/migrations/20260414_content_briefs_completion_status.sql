-- Brief completion lifecycle: delivered -> acknowledged -> in_production -> published
-- Separate from `delivery_status` (email send state) and `status` (workflow state).

ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS completion_status  text DEFAULT 'delivered',
  ADD COLUMN IF NOT EXISTS acknowledged_at    timestamptz,
  ADD COLUMN IF NOT EXISTS in_production_at   timestamptz,
  ADD COLUMN IF NOT EXISTS published_at       timestamptz,
  ADD COLUMN IF NOT EXISTS published_url      text;

CREATE INDEX IF NOT EXISTS idx_content_briefs_completion_status
  ON content_briefs(completion_status);
