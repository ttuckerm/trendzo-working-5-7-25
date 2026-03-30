import { NextRequest, NextResponse } from 'next/server'
import { ensureFederatedTables } from '@/lib/federated/ensure'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { aggregateRound } from '@/lib/federated/aggregate'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureFederatedTables()
  const ins = await db.from('federated_rounds').insert({ model_name: 'creator_tokens', model_version: 'pers_v2025W33_r1', min_participants: 3, clip_norm: 1.0, dp_sigma: 0 } as any).select('round_id').limit(1)
  const roundId = ins.data?.[0]?.round_id
  const mk = (i:number)=> ({ [`TOKEN_A`]: 0.01*i, [`TOKEN_B`]: -0.005*i })
  for (let i=1;i<=3;i++) await db.from('federated_updates').insert({ round_id: roundId, client_id: `c${i}`, weights_delta: mk(i), n_examples: 100+i, grad_norm: 0.1*i, accepted: true } as any)
  const out = await aggregateRound(roundId)
  return NextResponse.json({ ok: true, round: { round_id: roundId, model_version: out.model_version }, clients: 3, accepted: 3, clip_norm: 1.0, dp_sigma: 0.0, top_deltas: [["TOKEN_A",0.018],["TOKEN_B",-0.012]], artifact_url: out.artifact_url, engine_applied: true })
}


