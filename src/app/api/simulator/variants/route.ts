import { NextRequest, NextResponse } from 'next/server'
import { generateVariants, AudienceParams } from '@/lib/simulator/audience'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const N = Math.max(1, Math.min(10, Number(body?.N ?? 5)))
    const params: AudienceParams = {
      niche: body?.niche || 'general',
      cohort: body?.cohort || 'default',
      platform: body?.platform || 'tiktok',
      tokens: Array.isArray(body?.tokens) ? body.tokens : [],
      frameworkProfile: body?.frameworkProfile || { overallScore: Number(body?.frameworkScore ?? 0.6) },
      timingScore: Number(body?.timingScore ?? 1.02),
      personalizationFactor: Number(body?.personalizationFactor ?? 1.01),
      impressions: 10000,
      videoFeatures: {
        hookStrength: Number(body?.video_features?.hookStrength ?? 0.6),
        durationSeconds: Number(body?.video_features?.durationSeconds ?? 22)
      }
    }
    const variants = generateVariants(params, N)
    const best = variants[0]

    // Best-effort persistence of simulator activity for status metrics
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const since = new Date().toISOString()
      const rows = variants.map(v => ({
        created_at: since,
        event: 'sim_variant_generated',
        details: { id: v.id, sim_score: v.sim_score, delta: v.delta, tokens: v.tokens }
      }))
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists prediction_events (id bigserial primary key, created_at timestamptz not null, event text, details jsonb);" }) } catch {}
      try { await db.from('prediction_events').insert(rows as any) } catch {}
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz);" }) } catch {}
      try { await db.from('integration_job_runs').upsert({ job: 'simulator', last_run: since } as any) } catch {}
    } catch {}
    return NextResponse.json({ variants, best })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'bad_request' }, { status: 400 })
  }
}


