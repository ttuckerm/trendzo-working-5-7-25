-- Add primary_niche to profiles for agency skill-set resolution
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_niche text;
