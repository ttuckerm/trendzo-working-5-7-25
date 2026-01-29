import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('Environment Variables:');
console.log('  SUPABASE_URL:', SUPABASE_URL);
console.log('  SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'SET (length: ' + SUPABASE_SERVICE_KEY.length + ')' : 'NOT SET');
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('Querying database for videos with transcripts...\n');

  // Count videos
  const { count, error: countError } = await supabase
    .from('scraped_videos')
    .select('*', { count: 'exact', head: true })
    .not('transcript_text', 'is', null);

  if (countError) {
    console.error('Error counting:', countError);
  } else {
    console.log('Count result:', count);
  }

  // Get sample videos
  const { data, error } = await supabase
    .from('scraped_videos')
    .select('video_id, transcript_text')
    .not('transcript_text', 'is', null)
    .limit(5);

  if (error) {
    console.error('Error querying:', error);
  } else {
    console.log('\nSample videos:');
    data?.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.video_id} - ${v.transcript_text?.substring(0, 50)}...`);
    });
  }
}

main();
