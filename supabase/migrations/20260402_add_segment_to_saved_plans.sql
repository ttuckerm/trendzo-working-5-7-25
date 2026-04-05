-- Add funnel segmentation columns to freedom_os_saved_plans
ALTER TABLE freedom_os_saved_plans
ADD COLUMN IF NOT EXISTS segment text CHECK (segment IN ('A', 'B', 'C', 'D'));

CREATE INDEX IF NOT EXISTS idx_freedom_os_segment ON freedom_os_saved_plans(segment);

-- Add waitlist columns for future use
ALTER TABLE freedom_os_saved_plans
ADD COLUMN IF NOT EXISTS waitlist_position integer,
ADD COLUMN IF NOT EXISTS waitlist_joined_at timestamptz;
