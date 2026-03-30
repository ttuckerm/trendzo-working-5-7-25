-- Add follower_count column to bulk_download_items
-- Persists the per-video follower count entered by the user
ALTER TABLE bulk_download_items
  ADD COLUMN IF NOT EXISTS follower_count integer;
