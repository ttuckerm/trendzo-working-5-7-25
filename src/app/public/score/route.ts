import { NextRequest, NextResponse } from 'next/server'
import { validateTelemetryKeyFromRequest, enforceTelemetryQuota } from '@/lib/security/telemetry-keys'
import { getPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders() })
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'public/score' }, { headers: corsHeaders() })
}

export async function POST(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Strict key validation + enforcement (burst + daily quotas)
  const quota = await enforceTelemetryQuota(req, '/public/score', 'score/public')
  if (!quota.allowed) {
    const code = quota.status === 401 ? 'ERR_UNAUTHORIZED' : quota.status === 429 ? 'quota_exceeded' : 'plan_insufficient'
    return NextResponse.json({ error: code }, { status: quota.status === 429 ? 402 : quota.status, headers: { ...corsHeaders(), ...(quota.retryAfter ? { 'Retry-After': String(quota.retryAfter) } : {}) } })
  }
  try {
    const body = await req.json()
    const { url, features, format: reqFormat } = body || {}
    if (!url && !features) {
      return NextResponse.json({ error: 'missing_payload', code: 'ERR_BAD_REQUEST' }, { status: 400, headers: corsHeaders() })
    }
    // Optional lightweight rate meter
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists usage_events (id bigserial primary key, ts timestamptz not null default now(), event text, result text);" })
      await db.from('usage_events').insert({ event: 'public_score', result: 'ok' } as any)
    } catch {}

    // Build prediction input from features or defaults
    const engine = getPredictionEngine()
    const frameworkScores = features?.frameworkScores || features?.framework_scores || undefined
    const contentFeatures = features?.contentFeatures || features?.content_features || undefined
    const niche = features?.niche || 'general'
    const platform = features?.platform || 'tiktok'
    const input = {
      viewCount: Number(features?.viewCount ?? 10000),
      likeCount: Number(features?.likeCount ?? 800),
      commentCount: Number(features?.commentCount ?? 120),
      shareCount: Number(features?.shareCount ?? 90),
      followerCount: Number(features?.followerCount ?? 50000),
      platform,
      hoursSinceUpload: Number(features?.hoursSinceUpload ?? 2),
      contentFeatures,
      frameworkScores,
      niche
    } as any

    // Format detect or use provided
    try {
      const { detectFormat } = await import('@/lib/formats/detection')
      const fmt = reqFormat || detectFormat({ ...input, caption: features?.caption, hashtags: features?.hashtags, durationSeconds: features?.durationSeconds })
      ;(input as any).format = fmt
    } catch {}

    const result = await engine.predict(input)
    const framework_top3 = (frameworkScores?.topFrameworks || []).slice(0,3).map((f:any)=>({ name:f.name, score:f.score }))
    const timing_score = result.breakdown.timingScore
    const personalization_factor = result.breakdown.personalizationFactor
    const payload = {
      score: result.viralScore,
      probability: result.viralProbability,
      calibrated_probability: result.calibratedProbability,
      format: (result as any).format || (input as any).format || 'short_video',
      format_breakdown: (result as any).format_breakdown || null,
      framework_top3,
      timing_score,
      personalization_factor
    }
    return NextResponse.json(payload, { headers: corsHeaders() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error', code: 'ERR_SERVER' }, { status: 500, headers: corsHeaders() })
  }
}


