-- Disable RLS on viral filter tables (they're admin-only anyway)
ALTER TABLE viral_pool DISABLE ROW LEVEL SECURITY;
ALTER TABLE negative_pool DISABLE ROW LEVEL SECURITY;
ALTER TABLE viral_filter_runs DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON viral_pool TO anon, authenticated;
GRANT ALL ON negative_pool TO anon, authenticated;
GRANT ALL ON viral_filter_runs TO anon, authenticated;

-- Reload schema
NOTIFY pgrst, 'reload schema';
