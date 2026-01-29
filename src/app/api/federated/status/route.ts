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
    const round_id = searchParams.get('round_id');
    if (!round_id) return NextResponse.json({ error: 'missing_round_id' }, { status: 400 });
    const { data: round } = await supabase.from('federated_round').select('*').eq('round_id', round_id).single();
    if (!round) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    // Simulate progress and evaluation if running
    const since = Date.now() - new Date(round.started_at).getTime();
    const clients_done = Math.min(round.clients, Math.floor(since / 2000));
    const loss_curve = Array.from({ length: clients_done + 1 }).map((_, i) => Math.max(0.1, 1.0 - i * 0.1));
    const evalm = clients_done >= round.clients ? { auc: 0.82, acc: 0.88 } : null;
    const status = clients_done >= round.clients ? 'completed' : 'running';
    if (status === 'completed' && !round.eval) {
      await supabase.from('federated_round').update({ status, completed_at: new Date().toISOString(), eval: evalm }).eq('round_id', round_id);
    }
    return NextResponse.json({ status, clients_done, loss_curve, eval: evalm || round.eval || {} });
  } catch (err: any) {
    return NextResponse.json({ error: 'status_failed' }, { status: 500 });
  }
}


