import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function checkFields() {
  const { data } = await supabase
    .from('scraped_videos')
    .select('*')
    .limit(1)
    .single();

  console.log('All fields in scraped_videos:');
  console.log(JSON.stringify(data, null, 2));
}

checkFields();
