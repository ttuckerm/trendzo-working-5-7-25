import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getDb()
    const body = await req.json();
    const { session_id, platform, video_id, events } = body || {};
    if (!session_id || !platform || !video_id || !Array.isArray(events)) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
    }
    const rows = events.map((e: any) => ({
      session_id,
      platform,
      video_id,
      t_ms: Number(e.t_ms || 0),
      type: String(e.type || 'unknown'),
      position_ms: e.position_ms != null ? Number(e.position_ms) : null,
      meta: e.meta || null
    }));
    if (rows.length > 0) {
      await supabase.from('telemetry_event').insert(rows);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'telemetry_ingest_failed' }, { status: 500 });
  }
}


