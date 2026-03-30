-- Drop old viral_genomes table if it exists (data migration if needed)
DROP TABLE IF EXISTS viral_genomes CASCADE;

-- Create viral_genomes table for storing extracted video "DNA"
CREATE TABLE viral_genomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_video_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  
  -- 7 Idea Legos
  topic TEXT,
  angle TEXT,
  hook_spoken TEXT,
  hook_text TEXT,
  hook_visual TEXT,
  story_structure TEXT,
  visual_format TEXT,
  key_visuals TEXT[],
  audio_description TEXT,
  
  -- Nine Attributes (1-10 scores)
  tam_resonance DECIMAL,
  sharability DECIMAL,
  hook_strength DECIMAL,
  format_innovation DECIMAL,
  value_density DECIMAL,
  pacing_rhythm DECIMAL,
  curiosity_gaps DECIMAL,
  emotional_journey DECIMAL,
  clear_payoff DECIMAL,
  
  -- Metadata
  dps_score DECIMAL,
  viral_patterns TEXT[],
  extraction_model TEXT,
  extracted_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(source_video_id)
);

-- Add indexes for efficient queries
CREATE INDEX idx_viral_genomes_niche ON viral_genomes(niche);
CREATE INDEX idx_viral_genomes_dps_score ON viral_genomes(dps_score DESC);
CREATE INDEX idx_viral_genomes_source_video ON viral_genomes(source_video_id);












