const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
  console.log('Checking viral_pool table...');
  const { data: vp, error: vpErr } = await supabase.from('viral_pool').select('*').limit(1);
  console.log('viral_pool:', vpErr ? 'ERROR - ' + vpErr.message : 'OK');

  console.log('\nChecking negative_pool table...');
  const { data: np, error: npErr } = await supabase.from('negative_pool').select('*').limit(1);
  console.log('negative_pool:', npErr ? 'ERROR - ' + npErr.message : 'OK');

  console.log('\nChecking viral_filter_runs table...');
  const { data: vfr, error: vfrErr } = await supabase.from('viral_filter_runs').select('*').limit(1);
  console.log('viral_filter_runs:', vfrErr ? 'ERROR - ' + vfrErr.message : 'OK');

  // Try to insert test data
  console.log('\n--- Testing insert to negative_pool ---');
  const testData = {
    video_id: 'test_verify_123',
    follower_bucket: '1k-10k',
    engagement_score: 0.5,
    views_1h: 1000,
    likes_1h: 50,
    creator_followers: 5000
  };

  const { data: insertData, error: insertErr } = await supabase
    .from('negative_pool')
    .insert(testData)
    .select();

  if (insertErr) {
    console.error('Insert ERROR:', insertErr.message);
    console.error('Details:', insertErr);
  } else {
    console.log('Insert SUCCESS:', insertData);
    // Clean up test data
    await supabase.from('negative_pool').delete().eq('video_id', 'test_verify_123');
  }
}

verifyTables();
