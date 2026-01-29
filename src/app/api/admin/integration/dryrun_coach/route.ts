import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const sample = {
    suggestions: [
      { video_id: 'vid_123', platform: 'tiktok', estimated_delta: 0.12, suggestion: { action: 'tighten_hook', note: 'Front-load payoff' } },
      { video_id: 'vid_456', platform: 'instagram', estimated_delta: 0.07, suggestion: { action: 'add_caption_cta', note: 'Drive shares' } }
    ]
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const edits = { add_tokens: ['AUTHORITY@<3s>','CUTS>=3/5s'], remove_tokens: ['HASHTAG_GENERIC'] }
  const variants = [{ id: 'v1', predicted_delta_score: +4.0 }]
  const simulate = { old_score: 71, new_score: 75 }
  let logged = false
  try {
    const ins = await db.from('prediction_events').insert({ event: 'coach_applied', payload: { tokens_add: edits.add_tokens, tokens_remove: edits.remove_tokens, variant_id: 'v1', predicted_delta: variants[0].predicted_delta_score } } as any)
    logged = !(ins as any).error
  } catch { logged = false }
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz not null);" }) } catch {}
  try { await db.from('integration_job_runs').upsert({ job: 'coach', last_run: new Date().toISOString() } as any) } catch {}
  return NextResponse.json({ ok: true, sample, edits, variants, simulate, logged })
}


