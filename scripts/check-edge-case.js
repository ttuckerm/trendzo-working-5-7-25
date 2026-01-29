const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkEdgeCase() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('dps_calculations')
    .select('*')
    .gte('calculated_at', `${today}T00:00:00`)
    .gte('viral_score', 79.9)
    .order('viral_score', { ascending: false });

  if (error) {
    console.error('❌ Query failed:', error.message);
    return;
  }

  console.log('Videos near 80 threshold:\n');
  data.forEach(calc => {
    console.log(`Video: ${calc.video_id}`);
    console.log(`  Score: ${calc.viral_score}`);
    console.log(`  Classification: ${calc.classification}`);
    console.log(`  Expected: ${calc.viral_score >= 80 ? 'mega-viral' : 'viral'}`);
    console.log('');
  });
}

checkEdgeCase().catch(console.error);
