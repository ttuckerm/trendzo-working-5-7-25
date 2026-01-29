const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkPatternsTable() {
  console.log('🔍 Checking viral_patterns table...\n');

  // Try to query the table
  const { data, error } = await supabase
    .from('viral_patterns')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Table does not exist or cannot be accessed:');
    console.error(`   ${error.message}\n`);
    console.log('💡 Need to run migrations:');
    console.log('   - supabase/migrations/20251003_feat003_pattern_extraction.sql');
    console.log('   - supabase/migrations/20251006_enhanced_video_patterns.sql\n');
    return false;
  }

  console.log(`✅ Table exists! Current row count: ${data?.length || 0}\n`);
  return true;
}

checkPatternsTable().catch(console.error);
