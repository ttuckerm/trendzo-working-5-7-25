/**
 * Check what data is in scraped_videos table
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

async function main() {
  const { data: videos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${videos?.length || 0} videos\n`);

  if (videos && videos.length > 0) {
    console.log('Sample video (first row):');
    console.log(JSON.stringify(videos[0], null, 2));
    console.log('\nColumn values:');
    console.log('play_count:', videos[0].play_count);
    console.log('digg_count:', videos[0].digg_count);
    console.log('comment_count:', videos[0].comment_count);
    console.log('share_count:', videos[0].share_count);
    console.log('collect_count:', videos[0].collect_count);
  }

  // Check if any videos have metrics
  const { data: withMetrics } = await supabase
    .from('scraped_videos')
    .select('*')
    .not('play_count', 'is', null)
    .gt('play_count', 0)
    .limit(5);

  console.log(`\nVideos with play_count > 0: ${withMetrics?.length || 0}`);
}

main().catch(console.error);
