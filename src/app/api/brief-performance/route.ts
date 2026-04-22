import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { emitEvent } from '@/lib/events/emit'

export const dynamic = 'force-dynamic'

interface PerformancePayload {
  briefId?: string
  actualViews?: number | string
  actualEngagementRate?: number | string
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

// GET /api/brief-performance?period=<week|month|all>&creator_name=<name>
// Returns aggregate performance across logged published briefs: total, avg delta,
// top performer, biggest miss, plus the raw rows behind the aggregate.
export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
  }

  const url = new URL(req.url)
  const periodParam = (url.searchParams.get('period') || 'all').toLowerCase()
  const creatorName = url.searchParams.get('creator_name')?.trim() || ''

  let sinceIso: string | null = null
  if (periodParam === 'week') {
    sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  } else if (periodParam === 'month') {
    sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  } else if (periodParam !== 'all') {
    return NextResponse.json({ error: "period must be 'week', 'month' or 'all'" }, { status: 400 })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  let query = db
    .from('content_briefs')
    .select('id, user_id, brief_content, vps_prediction, predicted_vps, actual_views, actual_engagement_rate, performance_delta, performance_measured_at')
    .eq('completion_status', 'published')
    .not('performance_measured_at', 'is', null)
    .order('performance_measured_at', { ascending: false })
    .limit(100)

  if (sinceIso) {
    query = query.gte('performance_measured_at', sinceIso)
  }

  const { data: briefs, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = [...new Set((briefs || []).map((b: any) => b.user_id).filter(Boolean))]
  let nameMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('onboarding_profiles')
      .select('user_id, business_name')
      .in('user_id', userIds)
    ;(profiles || []).forEach((p: any) => {
      nameMap[p.user_id] = p.business_name || 'Unknown'
    })
  }

  const needle = creatorName.toLowerCase()
  const rows = (briefs || [])
    .map((b: any) => ({
      id: b.id,
      creator: nameMap[b.user_id] || 'Unknown',
      title: b.brief_content?.title || b.brief_content?.campaign_name || 'Untitled Brief',
      vps_prediction: b.vps_prediction ?? b.predicted_vps ?? null,
      actual_views: b.actual_views ?? null,
      actual_engagement_rate: b.actual_engagement_rate ?? null,
      performance_delta: b.performance_delta ?? null,
      measured_at: b.performance_measured_at,
    }))
    .filter((r) => !needle || r.creator.toLowerCase().includes(needle))

  // Aggregates
  const withDelta = rows.filter((r) => typeof r.performance_delta === 'number')
  const avgDelta = withDelta.length > 0
    ? Math.round(withDelta.reduce((s, r) => s + (r.performance_delta as number), 0) / withDelta.length)
    : null

  let topPerformer: { creator: string; title: string; delta: number } | null = null
  let biggestMiss: { creator: string; title: string; delta: number } | null = null
  for (const r of withDelta) {
    const d = r.performance_delta as number
    if (!topPerformer || d > topPerformer.delta) topPerformer = { creator: r.creator, title: r.title, delta: d }
    if (!biggestMiss || d < biggestMiss.delta) biggestMiss = { creator: r.creator, title: r.title, delta: d }
  }

  return NextResponse.json({
    period: periodParam,
    creator_filter: creatorName || null,
    total_measured: rows.length,
    avg_performance_delta: avgDelta,
    top_performer: topPerformer,
    biggest_miss: biggestMiss,
    rows,
  })
}

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ success: false, error: 'Missing Supabase config' }, { status: 500 })
  }

  // ── Session auth ─────────────────────────────────────────────────────────
  const authSupabase = await createServerSupabaseClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  }

  // ── Agency membership ────────────────────────────────────────────────────
  const operatorAgencyId = await getUserAgencyId(user.id)
  if (!operatorAgencyId) {
    return NextResponse.json({ success: false, error: 'Operator not assigned to an agency' }, { status: 403 })
  }

  let body: PerformancePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { briefId } = body
  if (!briefId || typeof briefId !== 'string') {
    return NextResponse.json({ success: false, error: 'briefId required' }, { status: 400 })
  }

  const actualViews = toNumberOrNull(body.actualViews)
  const actualEngagementRate = toNumberOrNull(body.actualEngagementRate)

  if (actualViews === null && actualEngagementRate === null) {
    return NextResponse.json(
      { success: false, error: 'At least one of actualViews or actualEngagementRate must be provided' },
      { status: 400 },
    )
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  const { data: brief, error: fetchErr } = await db
    .from('content_briefs')
    .select('id, vps_prediction, predicted_vps, completion_status, agency_id')
    .eq('id', briefId)
    .single()

  if (fetchErr || !brief) {
    return NextResponse.json({ success: false, error: 'Brief not found' }, { status: 404 })
  }

  // ── Agency ownership ────────────────────────────────────────────────────
  // Uses content_briefs.agency_id populated by Fix 1 migration 20260421.
  if (brief.agency_id !== operatorAgencyId) {
    return NextResponse.json({ success: false, error: 'Brief belongs to a different agency' }, { status: 403 })
  }

  // vps_prediction is the performance-loop column; fall back to predicted_vps if not set
  // (briefs approved before the performance-loop migration wrote only predicted_vps).
  const prediction = toNumberOrNull(brief.vps_prediction) ?? toNumberOrNull(brief.predicted_vps)
  const performanceDelta =
    prediction !== null && actualViews !== null ? actualViews - prediction : null

  const update: Record<string, unknown> = {
    actual_views: actualViews,
    actual_engagement_rate: actualEngagementRate,
    performance_delta: performanceDelta,
    performance_measured_at: new Date().toISOString(),
    performance_source: 'manual',
  }

  const { data: updated, error: updateErr } = await db
    .from('content_briefs')
    .update(update)
    .eq('id', briefId)
    .select('id, vps_prediction, predicted_vps, actual_views, actual_engagement_rate, performance_delta, performance_measured_at, performance_source, completion_status')
    .single()

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  // Audit log — fire-and-forget (emitEvent is non-throwing).
  emitEvent({
    eventType: 'brief.performance_logged_via_api',
    payload: {
      briefId,
      actual_views: actualViews,
      actual_engagement_rate: actualEngagementRate,
      performance_delta: performanceDelta,
      prediction_basis: prediction,
    },
    actorId: user.id,
    actorType: 'user',
    agencyId: operatorAgencyId,
    entityType: 'content_brief',
    entityId: briefId,
  })

  return NextResponse.json({ success: true, brief: updated })
}
