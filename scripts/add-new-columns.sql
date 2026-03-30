-- Migration script to add thumbnail_url and engagement_score columns to existing video_intelligence table

-- Add thumbnail_url column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='video_intelligence' AND column_name='thumbnail_url') THEN
        ALTER TABLE video_intelligence ADD COLUMN thumbnail_url text;
    END IF;
END $$;

-- Add engagement_score column if it doesn't exist  
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='video_intelligence' AND column_name='engagement_score') THEN
        ALTER TABLE video_intelligence ADD COLUMN engagement_score integer DEFAULT 0;
    END IF;
END $$;

-- Add comments for the new columns
COMMENT ON COLUMN video_intelligence.thumbnail_url IS 'URL of the video thumbnail image';
COMMENT ON COLUMN video_intelligence.engagement_score IS 'Calculated viral engagement score (0-100)';

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'video_intelligence' 
ORDER BY ordinal_position;