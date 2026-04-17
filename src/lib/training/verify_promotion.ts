import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } });

(async () => {
  const { data: active } = await db.from('model_variants')
    .select('id, model_version, spearman_score, is_active, promoted_at, training_data_stats')
    .is('niche', null).eq('is_active', true).maybeSingle();
  console.log('ACTIVE global model:');
  console.log(`  id:            ${active?.id}`);
  console.log(`  model_version: ${active?.model_version}`);
  console.log(`  spearman:      ${active?.spearman_score}`);
  console.log(`  promoted_at:   ${active?.promoted_at}`);
  console.log(`  feature_count: ${(active?.training_data_stats as any)?.feature_count}`);

  const { data: backup } = await db.from('model_variants')
    .select('id, model_version, spearman_score, deactivated_at, replaced_by')
    .is('niche', null).eq('is_active', false)
    .order('deactivated_at', { ascending: false }).limit(1).maybeSingle();
  console.log('\nBACKUP (rollback target):');
  console.log(`  id:              ${backup?.id}`);
  console.log(`  model_version:   ${backup?.model_version}`);
  console.log(`  spearman:        ${backup?.spearman_score}`);
  console.log(`  deactivated_at:  ${backup?.deactivated_at}`);
  console.log(`  replaced_by:     ${backup?.replaced_by}`);

  const { data: log } = await db.from('model_promotion_log')
    .select('id, action, variant_id, previous_variant_id, before_spearman, after_spearman, delta, reason, created_at')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  console.log('\nMOST RECENT PROMOTION LOG:');
  console.log(`  action:              ${log?.action}`);
  console.log(`  variant_id:          ${log?.variant_id}`);
  console.log(`  previous_variant_id: ${log?.previous_variant_id}`);
  console.log(`  before_spearman:     ${log?.before_spearman}`);
  console.log(`  after_spearman:      ${log?.after_spearman}`);
  console.log(`  delta:               ${log?.delta}`);
  console.log(`  reason:              ${log?.reason}`);
  console.log(`  created_at:          ${log?.created_at}`);
})().catch(e => { console.error(e); process.exit(1); });
