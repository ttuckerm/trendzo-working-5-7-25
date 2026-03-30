-- MIGRATION: Add missing metadata column to prediction_validation table
-- This fixes the PGRST204 error: "Could not find the 'metadata' column"

-- Check if the column exists and add it if missing
DO $$ 
BEGIN 
    -- Check if metadata column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prediction_validation' 
        AND column_name = 'metadata'
    ) THEN
        -- Add the missing metadata column
        ALTER TABLE prediction_validation 
        ADD COLUMN metadata JSONB;
        
        -- Add GIN index for JSONB performance
        CREATE INDEX IF NOT EXISTS idx_prediction_validation_metadata 
        ON prediction_validation USING GIN (metadata);
        
        -- Add comment
        COMMENT ON COLUMN prediction_validation.metadata IS 'JSONB field storing algorithm inputs, component scores, and diagnostic information';
        
        RAISE NOTICE 'Successfully added metadata column to prediction_validation table';
    ELSE
        RAISE NOTICE 'metadata column already exists in prediction_validation table';
    END IF;
    
    -- Also ensure other commonly needed columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prediction_validation' 
        AND column_name = 'processing_time_ms'
    ) THEN
        ALTER TABLE prediction_validation 
        ADD COLUMN processing_time_ms INTEGER;
        
        RAISE NOTICE 'Added processing_time_ms column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prediction_validation' 
        AND column_name = 'confidence_level'
    ) THEN
        ALTER TABLE prediction_validation 
        ADD COLUMN confidence_level DECIMAL(4,3);
        
        RAISE NOTICE 'Added confidence_level column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'prediction_validation' 
        AND column_name = 'platform'
    ) THEN
        ALTER TABLE prediction_validation 
        ADD COLUMN platform VARCHAR(20) DEFAULT 'tiktok';
        
        RAISE NOTICE 'Added platform column';
    END IF;
    
END $$;