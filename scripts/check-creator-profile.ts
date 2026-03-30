/**
 * Check Creator Profile Status
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('tiktok_username', 'sidehustlereview')
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data) {
    console.log('No profile found for @sidehustlereview');
    return;
  }

  console.log('Creator Profile Found:');
  console.log('ID:', data.id);
  console.log('Username:', data.tiktok_username);
  console.log('Status:', data.analysis_status);
  console.log('Total Videos:', data.total_videos);
  console.log('Baseline DPS:', data.baseline_dps);
  console.log('Last Scraped:', data.last_scraped_at);
  console.log('\nFull Data:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
