const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkExactScore() {
  const { data, error } = await supabase
    .from('dps_calculations')
    .select('video_id, viral_score, classification')
    .eq('video_id', '7556687934095723798')
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Query failed:', error.message);
    return;
  }

  console.log('Exact score details:');
  console.log(`  Video ID: ${data.video_id}`);
  console.log(`  Viral Score (raw): ${data.viral_score}`);
  console.log(`  Viral Score (JSON): ${JSON.stringify(data.viral_score)}`);
  console.log(`  Classification: ${data.classification}`);
  console.log(`  Is >= 80: ${data.viral_score >= 80}`);
  console.log(`  Is < 80: ${data.viral_score < 80}`);
  console.log(`  Exact comparison: ${data.viral_score === 80}`);
}

checkExactScore().catch(console.error);
