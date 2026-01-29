import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { UnifiedPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get('from') || ''
  const to = req.nextUrl.searchParams.get('to') || ''
  if (!from || !to) return NextResponse.json({ ok:false, error:'from and to required (YYYY-MM-DD)' }, { status:400 })
  const start = new Date(`${from}T00:00:00.000Z`).toISOString()
  const end = new Date(`${to}T23:59:59.999Z`).toISOString()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: raws } = await db.from('raw_videos').select('id,caption,views_1h,likes_1h,uploaded_at').gte('created_at', start).lte('created_at', end).limit(1000)
  const engine = new UnifiedPredictionEngine()
  let promoted = 0, predicted = 0
  for (const r of (raws||[])) {
    try {
      // Promote minimal record to videos (idempotent)
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists videos (id text primary key, caption text, uploaded_at timestamptz, created_at timestamptz default now());" }) } catch {}
      try { await db.from('videos').upsert({ id: (r as any).id, caption: (r as any).caption||'', uploaded_at: (r as any).uploaded_at||null } as any) } catch {}
      promoted++
      // Predict and persist via prediction endpoint logic (inline minimal)
      const res = await engine.predict({ viewCount: Number((r as any).views_1h||0), likeCount: Number((r as any).likes_1h||0), commentCount:0, shareCount:0, followerCount:5000, platform:'tiktok', hoursSinceUpload:2, frameworkScores:{ overallScore:0.6, topFrameworks:[] } } as any)
      try {
        await (db as any).rpc?.('exec_sql', { query: "create table if not exists viral_predictions (id uuid default gen_random_uuid() primary key, created_at timestamptz not null default now(), platform text, viral_probability double precision, viral_score double precision, confidence_score double precision, incubation_label text, model_version text, cohort_version text, prediction_method text, prediction_factors jsonb, predicted_views integer);" })
      } catch {}
      await db.from('viral_predictions').insert({ platform:'tiktok', viral_probability: (res as any)?.calibratedProbability||res.viralProbability, viral_score: res.viralScore, confidence_score: res.confidence, incubation_label: (res as any)?.incubationLabel, model_version: (res as any)?.meta?.modelVersion, cohort_version: (res as any)?.meta?.cohortVersion, prediction_method:'replay_apify', prediction_factors: { input: { id: (r as any).id }, incubation_label: (res as any)?.incubationLabel } } as any)
      // Validation row
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists prediction_validation (id bigserial primary key, created_at timestamptz not null default now(), predicted_viral_probability double precision, validation_status text, model_version text, prediction_factors jsonb);" }) } catch {}
      await db.from('prediction_validation').insert({ predicted_viral_probability: res.viralProbability, validation_status:'pending', model_version: (res as any)?.meta?.modelVersion, prediction_factors: { incubation_label: (res as any)?.incubationLabel } } as any)
      predicted++
    } catch {}
  }
  return NextResponse.json({ ok:true, window:{ start, end }, scanned:(raws||[]).length, promoted, predicted })
}







