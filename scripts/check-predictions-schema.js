const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPredictionsSchema() {
  console.log('🔍 Checking predictions table schema...\n');

  // Try to get a sample record
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing predictions table:', error);
    console.log('\n💡 Table might not exist or have permission issues');
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Table exists! Column names:');
    Object.keys(data[0]).forEach(col => {
      const value = data[0][col];
      const type = typeof value;
      console.log(`  - ${col}: ${type}${value === null ? ' (NULL)' : ''}`);
    });
    console.log('\n📄 Sample record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('⚠️  Table exists but is empty');

    // Try a test insert to see what columns are expected
    console.log('\n🧪 Testing insert to identify required columns...');
    const testData = {
      script: 'Test script',
      platform: 'tiktok',
      niche: 'test',
      predicted_dps: 50.0,
      predicted_classification: 'normal',
      confidence: 0.8
    };

    const { error: insertError } = await supabase
      .from('predictions')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Test insert failed:', insertError);
      console.log('\n💡 This tells us what columns are missing or have type mismatches');
    } else {
      console.log('✅ Test insert succeeded!');

      // Delete the test record
      await supabase
        .from('predictions')
        .delete()
        .eq('script', 'Test script');

      console.log('✅ Cleaned up test record');
    }
  }

  // Get count
  const { count } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total predictions: ${count || 0}`);
}

checkPredictionsSchema();
