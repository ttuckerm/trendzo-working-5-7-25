const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 Checking viral_patterns schema...\n');

  // Get first pattern to see structure
  const { data, error } = await supabase
    .from('viral_patterns')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Column names:');
    Object.keys(data[0]).forEach(col => {
      console.log(`- ${col}: ${typeof data[0][col]}`);
    });
    console.log('\nSample record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No patterns found in table');
  }

  // Get count
  const { count } = await supabase
    .from('viral_patterns')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal patterns: ${count}`);
}

checkSchema();
