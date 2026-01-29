import { NextRequest, NextResponse } from 'next/server'
import { simulateAudience, AudienceParams } from '@/lib/simulator/audience'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const video_features = (body?.video_features || {}) as Partial<AudienceParams['videoFeatures']>
    const tokens: string[] = Array.isArray(body?.tokens) ? body.tokens : []

    const params: AudienceParams = {
      niche: body?.niche || 'general',
      cohort: body?.cohort || 'default',
      platform: body?.platform || 'tiktok',
      tokens,
      frameworkProfile: body?.frameworkProfile || { overallScore: Number(body?.frameworkScore ?? 0.6) },
      timingScore: Number(body?.timingScore ?? 1.02),
      personalizationFactor: Number(body?.personalizationFactor ?? 1.01),
      impressions: 10000,
      videoFeatures: {
        hookStrength: Number(video_features?.hookStrength ?? 0.6),
        durationSeconds: Number(video_features?.durationSeconds ?? 22)
      }
    }

    const outcome = simulateAudience(params)

    // Best-effort persistence of simulator snapshot into predictions_audit and last_run marker
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists predictions_audit (id bigserial primary key, prediction_id text, model_version text, cohort_version text, inputs_digest text, outputs_digest text, token_lifts jsonb, timing_score double precision, personalization_factor double precision, alignment_factor double precision, signed_at timestamptz, signature text, simulator_snapshot jsonb);" }) } catch {}
      try { await db.from('predictions_audit').insert({ simulator_snapshot: outcome, signed_at: new Date().toISOString() } as any) } catch {}
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz);" }) } catch {}
      try { await db.from('integration_job_runs').upsert({ job: 'simulator', last_run: new Date().toISOString() } as any) } catch {}
    } catch {}
    const response = {
      impressions: outcome.impressions,
      ctr: outcome.ctr,
      completion: outcome.completion,
      shares: outcome.shares,
      saves: outcome.saves,
      comments: outcome.comments,
      sim_score: outcome.sim_score
    }
    return NextResponse.json(response)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'bad_request' }, { status: 400 })
  }
}


