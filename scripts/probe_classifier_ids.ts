import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });
async function main() {
  const { data: events } = await db.from('cultural_events').select('id, niche, source_trend_ids, created_at').order('id');
  console.log('cultural_events:');
  for (const e of events ?? []) console.log(`  event_id=${e.id} niche=${e.niche} source_trend_ids=${JSON.stringify(e.source_trend_ids)} at=${e.created_at}`);

  const { data: trends } = await db.from('detected_trends').select('id, niche, detected_date, created_at').order('id');
  console.log('\ndetected_trends:');
  for (const t of trends ?? []) console.log(`  trend_id=${t.id} niche=${t.niche} detected_date=${t.detected_date} at=${t.created_at}`);

  // Build the set the classifier builds
  const alreadyClassified = new Set<number>();
  (events || []).forEach((e: any) => (e.source_trend_ids || []).forEach((id: number) => alreadyClassified.add(id)));
  console.log('\nClassifier sees as already-classified trend ids:', [...alreadyClassified].sort((a,b)=>a-b));

  // What would classifier see for niche=fitness, limit 20?
  const { data: fitnessTrends } = await db.from('detected_trends')
    .select('id, niche, detected_date').eq('niche', 'fitness').order('detected_date', { ascending: false }).limit(20);
  console.log('\nclassifier candidate pool (niche=fitness, order detected_date desc, limit 20):');
  for (const t of fitnessTrends ?? []) {
    const classified = alreadyClassified.has(t.id);
    console.log(`  trend_id=${t.id} detected_date=${t.detected_date} classified=${classified}`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
