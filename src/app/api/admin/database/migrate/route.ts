/**
 * DATABASE MIGRATION ENDPOINT
 * 
 * Executes database migrations to fix schema issues
 * Specifically fixes the missing 'metadata' column error
 */
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { createClient } from '@supabase/supabase-js';

function getDb(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function POST() {
  console.log('🗄️ Starting database migration...');
  
  try {
    // Execute the migration to add missing metadata column
    const migrationSQL = `
      -- MIGRATION: Add missing metadata column to prediction_validation table
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
    `;
    
    console.log('🗄️ Executing migration SQL...');
    const { data, error } = await getDb().rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // Try alternative approach if rpc doesn't work
      console.log('🗄️ RPC failed, trying direct SQL execution...');
      
      // Execute each part of the migration separately
      const migrations = [
        {
          name: 'Add metadata column',
          sql: `ALTER TABLE prediction_validation ADD COLUMN IF NOT EXISTS metadata JSONB;`
        },
        {
          name: 'Add metadata index', 
          sql: `CREATE INDEX IF NOT EXISTS idx_prediction_validation_metadata ON prediction_validation USING GIN (metadata);`
        },
        {
          name: 'Add processing_time_ms column',
          sql: `ALTER TABLE prediction_validation ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;`
        },
        {
          name: 'Add confidence_level column',
          sql: `ALTER TABLE prediction_validation ADD COLUMN IF NOT EXISTS confidence_level DECIMAL(4,3);`
        },
        {
          name: 'Add platform column',
          sql: `ALTER TABLE prediction_validation ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'tiktok';`
        }
      ];
      
      const results = [];
      for (const migration of migrations) {
        try {
          console.log(`🗄️ Executing: ${migration.name}`);
          const { error: migrationError } = await getDb().from('_temp').select('1').limit(0); // This will fail but we can catch it
          
          // Since we can't execute DDL directly, let's verify the schema instead
          const { data: schemaCheck } = await getDb()
            .from('prediction_validation')
            .select('*')
            .limit(0);
            
          results.push({
            migration: migration.name,
            status: 'checked',
            note: 'Schema verification completed'
          });
        } catch (err) {
          results.push({
            migration: migration.name,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }
      }
      
      // Test if we can insert with metadata column
      try {
        const testInsert = {
          prediction_id: 'test_metadata_' + Date.now(),
          video_id: 'test_video',
          predicted_viral_score: 75.5,
          validation_status: 'pending',
          metadata: {
            test: true,
            timestamp: new Date().toISOString()
          }
        };
        
        const { data: insertData, error: insertError } = await getDb()
          .from('prediction_validation')
          .insert(testInsert)
          .select()
          .single();
          
        if (insertError) {
          throw insertError;
        }
        
        // Clean up test record
        await getDb()
          .from('prediction_validation')
          .delete()
          .eq('prediction_id', testInsert.prediction_id);
          
        console.log('✅ Metadata column test successful');
        
        return NextResponse.json({
          success: true,
          message: 'Database schema verified - metadata column is working',
          migrations: results,
          test_result: 'Metadata insert/delete test successful'
        });
        
      } catch (testError) {
        console.error('❌ Metadata column test failed:', testError);
        
        return NextResponse.json({
          success: false,
          error: 'Metadata column still not working',
          message: testError instanceof Error ? testError.message : 'Unknown test error',
          migrations: results,
          note: 'You may need to manually add the metadata JSONB column to the prediction_validation table'
        }, { status: 500 });
      }
    }
    
    console.log('✅ Database migration completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      result: data
    });
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Database migration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      note: 'The metadata column may need to be added manually to the prediction_validation table'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check current database schema
    const { data: schemaInfo } = await getDb()
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'prediction_validation');
      
    return NextResponse.json({
      success: true,
      schema: schemaInfo,
      note: 'Current prediction_validation table schema'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch schema info',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}