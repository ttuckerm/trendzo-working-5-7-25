import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function POST(req: NextRequest){
  try {
    const supabase = getDb()
    const body = await req.json();
    const round = body.round || Math.floor(Date.now()/1000);
    const round_id = String(round);
    const clients = Number(body.clients || 5);
    const model = body.model || 'default';
    await supabase.from('federated_round').upsert({ round_id, status: 'running', clients, model, started_at: new Date().toISOString() });
    return NextResponse.json({ round_id, status: 'running' });
  } catch (err: any) {
    return NextResponse.json({ error: 'start_failed' }, { status: 500 });
  }
}


