import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function check() {
  const { data } = await supabase
    .from('prediction_events')
    .select('created_at, components_used')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('Last 10 predictions:');
  data?.forEach(p => {
    const hasGemini = p.components_used?.includes('gemini');
    console.log(`${p.created_at}: ${hasGemini ? '✅ GEMINI' : '❌ NO GEMINI'} (${p.components_used?.length || 0} total)`);
  });
}

check();
