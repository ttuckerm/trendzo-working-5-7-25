-- Allow waitlist-only users to be stored without a plan.
-- The original schema had `plan jsonb NOT NULL` but the waitlist flow
-- inserts rows before a plan is generated.
ALTER TABLE freedom_os_saved_plans ALTER COLUMN plan DROP NOT NULL;
