import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } });
(async () => {
  const { data } = await db.from('scraped_videos').select('*').limit(1).maybeSingle();
  console.log('scraped_videos columns:', Object.keys(data || {}).sort().join(', '));
  const { data: tf } = await db.from('training_features').select('*').limit(1).maybeSingle();
  console.log('training_features has:', Object.keys(tf || {}).filter(k => k.startsWith('speaking') || k.startsWith('hook_') || k.startsWith('audio_') || k === 'visual_to_verbal_ratio').sort().join(', '));
})().catch(e => console.error(e));
