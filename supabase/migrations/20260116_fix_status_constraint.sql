-- ============================================================================
-- Fix prediction_runs status constraint
-- ============================================================================
-- Problem: Code was writing 'completed' but DB constraint only allows 'success'
-- Solution: Update constraint to allow both, and backfill stuck rows
-- Date: 2026-01-16
-- ============================================================================

-- Step 1: Drop the existing check constraint (if it exists)
-- The constraint name might vary, so we use a DO block to find and drop it
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the check constraint on the status column
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
  WHERE con.conrelid = 'prediction_runs'::regclass
    AND con.contype = 'c'
    AND att.attname = 'status';

  -- Drop it if found
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE prediction_runs DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No check constraint found on status column';
  END IF;
END $$;

-- Step 2: Add the new constraint with all valid values
-- Allows: pending, running, success, completed, failed
-- 'completed' and 'success' are treated as equivalent (completed is legacy)
ALTER TABLE prediction_runs
ADD CONSTRAINT prediction_runs_status_check
CHECK (status IN ('pending', 'running', 'success', 'completed', 'failed'));

-- Step 3: Backfill stuck 'running' rows older than 5 minutes
-- These are runs that never finalized properly
UPDATE prediction_runs
SET
  status = 'failed',
  error_message = COALESCE(error_message, 'Run stuck in running state - auto-failed by migration 20260116'),
  completed_at = COALESCE(completed_at, NOW())
WHERE status = 'running'
  AND created_at < NOW() - INTERVAL '5 minutes';

-- Step 4: Log the result
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % stuck running rows to failed', updated_count;
END $$;

-- Step 5: Show current status distribution
-- (This is just for verification in the console)
DO $$
DECLARE
  status_counts TEXT;
BEGIN
  SELECT string_agg(status || ': ' || cnt::TEXT, ', ')
  INTO status_counts
  FROM (
    SELECT status, COUNT(*) as cnt
    FROM prediction_runs
    GROUP BY status
    ORDER BY status
  ) sub;

  RAISE NOTICE 'Current status distribution: %', status_counts;
END $$;
