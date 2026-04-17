-- Add delivery_status to content_briefs for brief email delivery tracking.
-- Values: 'pending' | 'delivered' | 'failed'

ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending';

-- Optional index for querying failed/pending deliveries
CREATE INDEX IF NOT EXISTS idx_content_briefs_delivery_status
  ON content_briefs(delivery_status);
