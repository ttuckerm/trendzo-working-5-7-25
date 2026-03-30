import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { evaluateFlag } from '@/lib/flags'
import { ensureBillingTables, checkAndConsume } from '@/lib/billing/enforcement'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getDb()
    const tenantId = req.headers.get('x-tenant-id') || null
    await ensureBillingTables()
    const enforcement = await checkAndConsume('/api/pixel/collect', req.headers.get('x-api-key'), 'pixel:write')
    if (!enforcement.allowed) return NextResponse.json({ error: enforcement.reason }, { status: enforcement.status })
    if (!(await evaluateFlag('attribution_pixel', tenantId))) {
      return NextResponse.json({ error: 'feature_disabled' }, { status: 403 })
    }
    const body = await req.json();
    const { type, template_id, sku, campaign_id, value_cents, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referral_code } = body || {};
    if (!type || !['view','click','purchase'].includes(type)) {
      return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
    }
    try { await (supabase as any).rpc?.('exec_sql', { query: "alter table if exists pixel_event add column if not exists utm_source text; alter table if exists pixel_event add column if not exists utm_medium text; alter table if exists pixel_event add column if not exists utm_campaign text; alter table if exists pixel_event add column if not exists utm_term text; alter table if exists pixel_event add column if not exists utm_content text; alter table if exists pixel_event add column if not exists referral_code text;" }) } catch {}
    await supabase.from('pixel_event').insert({ type, template_id, sku, campaign_id, value_cents: value_cents || null, utm_source, utm_medium, utm_campaign, utm_term, utm_content, referral_code } as any);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'pixel_collect_failed' }, { status: 500 });
  }
}


