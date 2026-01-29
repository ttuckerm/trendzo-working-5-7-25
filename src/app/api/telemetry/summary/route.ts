import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getDb()
    const { searchParams } = new URL(req.url);
    const video_id = searchParams.get('video_id');
    if (!video_id) return NextResponse.json({ error: 'missing_video_id' }, { status: 400 });

    const { data: summary } = await supabase.from('telemetry_summary').select('*').eq('video_id', video_id).single();
    if (summary) return NextResponse.json(summary);

    // derive from raw events if no summary exists
    const { data: events } = await supabase.from('telemetry_event').select('*').eq('video_id', video_id).limit(5000);
    const sample = events?.length || 0;
    const loops = (events || []).filter(e => e.type === 'ended').length;
    const perSec: Record<number, number> = {};
    (events || []).forEach(e => {
      const sec = Math.floor((e.position_ms || 0) / 1000);
      perSec[sec] = (perSec[sec] || 0) + 1;
    });
    const maxSec = Math.max(0, ...Object.keys(perSec).map(n => Number(n)));
    const retention = Array.from({ length: maxSec + 1 }).map((_, i) => ({ sec: i, pct: sample ? Math.round((perSec[i] || 0) / sample * 100) : 0 }));
    const result = { video_id, retention, loops, share_to_view: 0, sample };
    // upsert summary
    await supabase.from('telemetry_summary').upsert({ video_id, retention, loops, share_to_view: 0, sample, updated_at: new Date().toISOString() });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'telemetry_summary_failed' }, { status: 500 });
  }
}


