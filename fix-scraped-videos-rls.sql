-- Fix Row Level Security (RLS) for scraped_videos table
-- This allows the admin UI to read the data

-- Enable RLS on the table (if not already enabled)
ALTER TABLE scraped_videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access" ON scraped_videos;
DROP POLICY IF EXISTS "Allow service role all access" ON scraped_videos;

-- Create policy: Allow anyone to READ scraped_videos (for admin UI)
CREATE POLICY "Allow public read access"
ON scraped_videos
FOR SELECT
TO public
USING (true);

-- Create policy: Allow service role to do everything (for API)
CREATE POLICY "Allow service role all access"
ON scraped_videos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'scraped_videos';
