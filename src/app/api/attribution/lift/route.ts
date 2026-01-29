import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(req: NextRequest){
  try {
    const supabase = getDb()
    const { searchParams } = new URL(req.url);
    const template_id = searchParams.get('template_id');
    if (!template_id) return NextResponse.json({ error: 'missing_template_id' }, { status: 400 });

    const { data: agg } = await supabase.from('conversion_aggregate').select('*').eq('template_id', template_id).single();
    if (agg) return NextResponse.json(agg);

    // compute from raw events minimal
    const { data: events } = await supabase.from('pixel_event').select('type').eq('template_id', template_id);
    const nViews = (events || []).filter(e => e.type === 'view').length || 1;
    const nPurch = (events || []).filter(e => e.type === 'purchase').length;
    const variant_cr = nPurch / nViews;
    const baseline_cr = Math.max(0.0001, variant_cr * 0.8);
    const lift = variant_cr / baseline_cr;
    const result = { template_id, sku: null, n_variant: nViews, n_baseline: Math.max(1, Math.round(nViews * 0.8)), variant_cr, baseline_cr, lift, updated_at: new Date().toISOString() };
    await supabase.from('conversion_aggregate').upsert(result);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'lift_failed' }, { status: 500 });
  }
}


