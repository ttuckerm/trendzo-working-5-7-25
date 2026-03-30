const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function applyMigration() {
  console.log('📋 Applying predictions table migration...\n')

  const sql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20251008_predictions_table.sql'),
    'utf8'
  )

  try {
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Predictions table created successfully!')

    // Verify the table exists
    const { data, error: verifyError } = await supabase
      .from('predictions')
      .select('*')
      .limit(1)

    if (verifyError) {
      console.error('⚠️ Table verification failed:', verifyError)
    } else {
      console.log('✅ Table verified and ready to use')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
    process.exit(1)
  }
}

applyMigration()
