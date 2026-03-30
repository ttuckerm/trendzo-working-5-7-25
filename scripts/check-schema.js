const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // Try inserting with only the columns Supabase knows about
  console.log('Attempting insert with minimal columns...');
  
  const minimalData = {
    video_id: 'test_minimal_456'
  };

  const { data, error } = await supabase
    .from('negative_pool')
    .insert(minimalData)
    .select();

  if (error) {
    console.error('ERROR:', error.message);
    console.error('Code:', error.code);
    console.error('This tells us what columns ARE allowed');
  } else {
    console.log('SUCCESS with minimal data:', data);
    await supabase.from('negative_pool').delete().eq('video_id', 'test_minimal_456');
  }
}

checkSchema();
