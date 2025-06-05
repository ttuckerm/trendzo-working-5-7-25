-- Add viral-related columns to tiktok_templates table
ALTER TABLE tiktok_templates 
ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS viral_score INTEGER DEFAULT 0 CHECK (viral_score >= 0 AND viral_score <= 100),
ADD COLUMN IF NOT EXISTS sound_id TEXT,
ADD COLUMN IF NOT EXISTS sound_title TEXT,
ADD COLUMN IF NOT EXISTS sound_author TEXT;

-- Update views and likes from engagement_metrics JSONB if they exist
UPDATE tiktok_templates 
SET 
  views = COALESCE((engagement_metrics->>'views')::BIGINT, 0),
  likes = COALESCE((engagement_metrics->>'likes')::BIGINT, 0)
WHERE engagement_metrics IS NOT NULL;

-- Calculate initial viral scores based on engagement
UPDATE tiktok_templates 
SET viral_score = LEAST(100, GREATEST(0, 
  CASE 
    WHEN views > 1000000 THEN 90 + (likes::FLOAT / views::FLOAT * 100)::INTEGER / 10
    WHEN views > 100000 THEN 70 + (likes::FLOAT / views::FLOAT * 100)::INTEGER / 3
    WHEN views > 10000 THEN 50 + (likes::FLOAT / views::FLOAT * 100)::INTEGER / 5
    ELSE 30 + (likes::FLOAT / GREATEST(views, 1)::FLOAT * 100)::INTEGER / 10
  END
));

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS tiktok_templates_views_idx ON tiktok_templates(views DESC);
CREATE INDEX IF NOT EXISTS tiktok_templates_likes_idx ON tiktok_templates(likes DESC);
CREATE INDEX IF NOT EXISTS tiktok_templates_viral_score_idx ON tiktok_templates(viral_score DESC);
CREATE INDEX IF NOT EXISTS tiktok_templates_sound_id_idx ON tiktok_templates(sound_id);

-- Create a view for templates that matches our expected naming
CREATE OR REPLACE VIEW templates AS
SELECT 
  id::TEXT as id,
  title,
  COALESCE(category, 'Uncategorized') as category,
  description,
  thumbnail_url as "thumbnailUrl",
  video_url as "videoUrl", 
  views,
  likes,
  viral_score,
  COALESCE(duration::TEXT || 's', '15s') as duration,
  sound_id,
  sound_title,
  sound_author,
  created_at,
  updated_at
FROM tiktok_templates;

-- Grant permissions on the view
GRANT SELECT ON templates TO anon;
GRANT SELECT ON templates TO authenticated; 