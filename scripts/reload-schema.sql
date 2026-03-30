-- Force Supabase PostgREST to reload schema cache
-- Run this in Supabase SQL Editor

NOTIFY pgrst, 'reload schema';

-- Verify the negative_pool structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'negative_pool'
ORDER BY ordinal_position;
