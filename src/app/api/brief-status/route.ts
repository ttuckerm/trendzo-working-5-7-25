import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { emitEvent } from '@/lib/events/emit'

export const dynamic = 'force-dynamic'

type TargetStatus = 'acknowledged' | 'in_production' | 'published'

const VALID_TRANSITIONS: Record<TargetStatus, string[]> = {
  acknowledged: ['delivered'],
  in_production: ['acknowledged'],
  published: ['in_production'],
}

// AM Step 2 (2026-04-24): resolve operator context so the GET list is scoped
// to the caller's agency. Mirrors src/app/api/clay/action/route.ts:19-53 —
// intentional inline copy, not a shared helper (out of scope for this fix).
async function resolveContextForStatusGet(): Promise<{ userId: string; agencyId: string } | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.id) {
      const agencyId = await getUserAgencyId(user.id)
      if (agencyId) return { userId: user.id, agencyId }
    }
  } catch {
    // ignore
  }

  if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' && process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    const sc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: ownerRow } = await sc
      .from('agency_members')
      .select('user_id, agency_id')
      .eq('role', 'owner')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    if (ownerRow?.user_id && ownerRow?.agency_id) {
      return { userId: ownerRow.user_id, agencyId: ownerRow.agency_id }
    }
  }

  return null
}

// GET /api/brief-status?status=<delivered|acknowledged|in_production|published|pending|failed>&creator_name=<name>
// Returns content_briefs filtered by the given status (routed to completion_status or delivery_status
// based on the value) and optionally by creator business name. Scoped to the caller's agency.
export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ briefs: [], error: 'Missing Supabase config' }, { status: 500 })
  }

  // ── Session auth + agency scope ─────────────────────────────────────────
  const ctx = await resolveContextForStatusGet()
  if (!ctx) {
    const hasSession = await (async () => {
      try {
        const s = await createServerSupabaseClient()
        const { data: { user } } = await s.auth.getUser()
        return !!user?.id
      } catch { return false }
    })()
    if (!hasSession) {
      return NextResponse.json({ briefs: [], error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ briefs: [], error: 'No agency found' }, { status: 403 })
  }
  const { agencyId } = ctx

  const url = new URL(req.url)
  const status = url.searchParams.get('status')?.trim() || ''
  const creatorName = url.searchParams.get('creator_name')?.trim() || ''

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  let query = db
    .from('content_briefs')
    .select('id, user_id, brief_content, completion_status, delivery_status, published_url, created_at, acknowledged_at, in_production_at, published_at, performance_measured_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })
    .limit(50)

  const COMPLETION_VALUES = new Set(['delivered', 'acknowledged', 'in_production', 'published'])
  const DELIVERY_VALUES = new Set(['pending', 'failed'])

  if (status) {
    if (COMPLETION_VALUES.has(status)) {
      query = query.eq('completion_status', status)
    } else if (DELIVERY_VALUES.has(status)) {
      query = query.eq('delivery_status', status)
    } else {
      return NextResponse.json({ briefs: [], error: `Invalid status: ${status}` }, { status: 400 })
    }
  }

  const { data: briefs, error } = await query
  if (error) {
    return NextResponse.json({ briefs: [], error: error.message }, { status: 500 })
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
      completion_status: b.completion_status || 'delivered',
      delivery_status: b.delivery_status || null,
      published_url: b.published_url || null,
      created_at: b.created_at,
      acknowledged_at: b.acknowledged_at,
      in_production_at: b.in_production_at,
      published_at: b.published_at,
      performance_measured_at: b.performance_measured_at,
    }))
    .filter((r) => !needle || r.creator.toLowerCase().includes(needle))

  return NextResponse.json({ briefs: rows, count: rows.length })
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

  let body: { briefId?: string; status?: TargetStatus; publishedUrl?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { briefId, status, publishedUrl } = body

  if (!briefId || typeof briefId !== 'string') {
    return NextResponse.json({ success: false, error: 'briefId required' }, { status: 400 })
  }
  if (status !== 'acknowledged' && status !== 'in_production' && status !== 'published') {
    return NextResponse.json({ success: false, error: "status must be 'acknowledged', 'in_production' or 'published'" }, { status: 400 })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  const { data: brief, error: fetchErr } = await db
    .from('content_briefs')
    .select('id, completion_status, agency_id')
    .eq('id', briefId)
    .single()

  if (fetchErr || !brief) {
    return NextResponse.json({ success: false, error: 'Brief not found' }, { status: 404 })
  }

  // ── Agency ownership ────────────────────────────────────────────────────
  // Uses content_briefs.agency_id populated by Fix 1 migration 20260421.
  // Briefs with agency_id = NULL (unaffiliated creators) are intentionally not
  // mutable via operator APIs.
  if (brief.agency_id !== operatorAgencyId) {
    return NextResponse.json({ success: false, error: 'Brief belongs to a different agency' }, { status: 403 })
  }

  const current = brief.completion_status || 'delivered'
  const allowedFrom = VALID_TRANSITIONS[status]
  if (!allowedFrom.includes(current)) {
    return NextResponse.json(
      { success: false, error: `Invalid transition: ${current} -> ${status}` },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { completion_status: status }
  if (status === 'acknowledged') update.acknowledged_at = now
  if (status === 'in_production') update.in_production_at = now
  if (status === 'published') {
    update.published_at = now
    if (typeof publishedUrl === 'string' && publishedUrl.trim()) {
      update.published_url = publishedUrl.trim()
    }
  }

  const { error: updateErr } = await db
    .from('content_briefs')
    .update(update)
    .eq('id', briefId)

  if (updateErr) {
    return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })
  }

  // Audit log — fire-and-forget (emitEvent is non-throwing).
  emitEvent({
    eventType: 'brief.status_updated_via_api',
    payload: {
      briefId,
      previous_status: current,
      new_status: status,
      published_url: (update.published_url as string | undefined) ?? null,
    },
    actorId: user.id,
    actorType: 'user',
    agencyId: operatorAgencyId,
    entityType: 'content_brief',
    entityId: briefId,
  })

  return NextResponse.json({ success: true })
}
