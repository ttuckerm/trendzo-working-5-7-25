import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findRecentVideos() {
  console.log('🔍 Finding most recently scraped videos...\n');

  const { data, error } = await supabase
    .from('scraped_videos')
    .select('video_id, scraped_at, video_file_url')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('❌ No videos found');
    process.exit(1);
  }

  data.forEach((video, index) => {
    const ageMinutes = Math.floor((Date.now() - new Date(video.scraped_at).getTime()) / (1000 * 60));
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDays = Math.floor(ageHours / 24);

    console.log(`${index + 1}. Video ID: ${video.video_id}`);
    console.log(`   Scraped: ${video.scraped_at}`);
    console.log(`   Age: ${ageDays}d ${ageHours % 24}h ${ageMinutes % 60}m`);
    console.log(`   URL: ${video.video_file_url?.substring(0, 80)}...`);

    if (ageHours > 1) {
      console.log('   ⚠️  URL likely EXPIRED');
    } else {
      console.log('   ✅ URL likely VALID');
    }
    console.log();
  });
}

findRecentVideos();
