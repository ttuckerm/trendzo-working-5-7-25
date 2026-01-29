const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function clearOldPatterns() {
  console.log('🧹 Clearing old patterns from database...\n');

  // First, check how many patterns exist
  const { data: existing, error: countError, count } = await supabase
    .from('viral_patterns')
    .select('id', { count: 'exact' })
    .eq('niche', 'personal-finance');

  if (countError) {
    console.error('❌ Failed to count patterns:', countError.message);
    return;
  }

  console.log(`Found ${count || 0} existing patterns for personal-finance niche`);

  if (count && count > 0) {
    // Delete old patterns
    const { error: deleteError } = await supabase
      .from('viral_patterns')
      .delete()
      .eq('niche', 'personal-finance');

    if (deleteError) {
      console.error('❌ Failed to delete patterns:', deleteError.message);
      return;
    }

    console.log(`✅ Deleted ${count} old patterns\n`);
  } else {
    console.log('ℹ️  No existing patterns to delete\n');
  }
}

clearOldPatterns().catch(console.error);
