-- Run these AFTER confirming viral_templates and module_health tables are working

-- 4. Create prediction_accuracy table (only if video_predictions exists)
CREATE TABLE IF NOT EXISTS prediction_accuracy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID, -- Remove foreign key for safety, add it later if needed
  predicted_score INTEGER NOT NULL,
  actual_views INTEGER,
  actual_likes INTEGER,
  actual_shares INTEGER,
  accuracy_percentage DECIMAL(5,2),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create script_patterns table (only if video_predictions exists)
CREATE TABLE IF NOT EXISTS script_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID, -- Remove foreign key for safety, add it later if needed
  transcript_text TEXT,
  viral_score INTEGER,
  framework_type TEXT,
  pattern_keywords TEXT[],
  success_indicators TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create recipe_book_daily table
CREATE TABLE IF NOT EXISTS recipe_book_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  hot_templates JSONB,
  cooling_templates JSONB,  
  new_templates JSONB,
  total_videos_analyzed INTEGER DEFAULT 0,
  system_accuracy DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add foreign keys ONLY if video_predictions table exists
-- Run this separately after confirming video_predictions exists:
/*
ALTER TABLE prediction_accuracy 
  ADD CONSTRAINT fk_prediction_accuracy_video_id 
  FOREIGN KEY (video_id) 
  REFERENCES video_predictions(id);

ALTER TABLE script_patterns 
  ADD CONSTRAINT fk_script_patterns_video_id 
  FOREIGN KEY (video_id) 
  REFERENCES video_predictions(id);
*/