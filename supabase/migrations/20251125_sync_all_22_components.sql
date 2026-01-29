-- Sync all 22 KAI Orchestrator components to component_reliability table
-- This ensures the Algorithm IQ Dashboard shows ALL components

-- Insert all 22 components (ON CONFLICT DO NOTHING keeps existing data)
INSERT INTO component_reliability (component_id, component_name, component_type, enabled) VALUES
  -- Quantitative (6 components)
  ('xgboost', 'XGBoost 118 Features', 'quantitative', true),
  ('feature-extraction', 'Feature Extraction Engine', 'quantitative', true),
  ('ffmpeg', 'FFmpeg Visual Analysis', 'quantitative', true),
  ('dps-engine', 'DPS Calculator', 'quantitative', true),
  ('audio-analyzer', 'Audio Analysis Engine', 'quantitative', true),
  ('visual-scene-detector', 'Visual Scene Detection', 'quantitative', true),

  -- Qualitative (3 components)
  ('gpt4', 'GPT-4 Analysis', 'qualitative', true),
  ('claude', 'Claude Analysis', 'qualitative', true),
  ('gemini', 'Gemini 3 Pro Analysis', 'qualitative', true),

  -- Pattern (6 components)
  ('7-legos', '7 Idea Legos', 'pattern', true),
  ('9-attributes', '9 Attributes Scorer', 'pattern', true),
  ('24-styles', '24 Video Styles', 'pattern', true),
  ('pattern-extraction', 'Pattern Extraction', 'pattern', true),
  ('virality-matrix', 'Virality Matrix', 'pattern', true),
  ('hook-scorer', 'Hook Strength Scorer', 'pattern', true),

  -- Historical (2 components)
  ('historical', 'Historical Comparison', 'historical', true),
  ('niche-keywords', 'Niche Keywords', 'historical', true),

  -- NEW: Missing components (5 components)
  ('whisper', 'Whisper Transcription', 'quantitative', true),
  ('competitor-benchmark', 'Competitor Benchmark', 'historical', true),
  ('trend-timing-analyzer', 'Trend Timing Analyzer', 'pattern', true),
  ('thumbnail-analyzer', 'Thumbnail Analyzer', 'quantitative', true),
  ('posting-time-optimizer', 'Posting Time Optimizer', 'pattern', true)

ON CONFLICT (component_id) DO UPDATE SET
  enabled = true,
  component_name = EXCLUDED.component_name,
  component_type = EXCLUDED.component_type;

-- Verify count
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM component_reliability WHERE enabled = true;
  RAISE NOTICE 'Total enabled components: %', v_count;
END $$;
















