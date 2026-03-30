-- Create the recipe_book_daily table for storing daily generated content recipes

CREATE TABLE IF NOT EXISTS recipe_book_daily (
    -- Primary identification
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Recipe details
    title TEXT NOT NULL,
    description TEXT,
    success_rate FLOAT NOT NULL,
    
    -- The patterns that make up this recipe
    -- Stored as JSONB for flexibility
    patterns JSONB,
    
    -- Foreign key to link to a template if one is generated from this
    -- This can be added later
    -- viral_template_id UUID REFERENCES viral_templates(id) ON DELETE SET NULL,

    -- Metadata
    generation_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_recipe_book_daily_generation_date ON recipe_book_daily(generation_date DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_book_daily_success_rate ON recipe_book_daily(success_rate DESC);

-- Ensure only one set of recipes per day
-- This might be too restrictive if we re-run it, so leaving it out for now.
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_book_daily_one_per_day ON recipe_book_daily(generation_date);


COMMENT ON TABLE recipe_book_daily IS 'Stores the daily generated content recipes from the Template Discovery Engine.';
COMMENT ON COLUMN recipe_book_daily.success_rate IS 'Predicted success rate (0 to 1) of a video following this recipe.';
COMMENT ON COLUMN recipe_book_daily.patterns IS 'The viral patterns (sounds, hashtags, etc.) that constitute this recipe.'; 