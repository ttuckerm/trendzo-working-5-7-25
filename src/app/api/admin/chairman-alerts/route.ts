/**
 * Chairman Alerts API (Prompts 33 + 35)
 *
 * GET  /api/admin/chairman-alerts
 *   Query params:
 *     view         — 'active' (default, open+acknowledged, not snoozed) |
 *                    'snoozed' | 'history' (resolved+dismissed) | 'all'
 *     status       — specific status filter (overrides view)
 *     severity     — info | warning | critical
 *     alert_type   — exact match
 *     agency_id    — exact match ('null' for platform-wide only)
 *     q            — text search in title/body (ILIKE)
 *     since / until — ISO date range on created_at
 *     limit        — default 50, max 200
 *     offset       — default 0 (for Load More pagination)
 *
 * POST /api/admin/chairman-alerts?action=ACTION&id=UUID
 *   Actions: acknowledge | snooze | resolve | dismiss
 *   Body: { resolved_by?, acknowledged_by?, snoozed_by?, hours? }
 *     - hours: for snooze only, default 24
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const LIVE_STATUSES = ['open', 'acknowledged', 'snoozed'] as const
const ACTIVE_STATUSES = ['open', 'acknowledged'] as const // snoozed excluded from active view
const HISTORY_STATUSES = ['resolved', 'dismissed'] as const

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(request: NextRequest) {
  const db = getServiceDb()
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { searchParams } = new URL(request.url)

  const view = searchParams.get('view') || 'active'
  const statusParam = searchParams.get('status')
  const severity = searchParams.get('severity')
  const alertType = searchParams.get('alert_type')
  const agencyId = searchParams.get('agency_id')
  const q = searchParams.get('q')
  const since = searchParams.get('since')
  const until = searchParams.get('until')
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0)

  let query = db
    .from('chairman_alerts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Status / view filter
  if (statusParam) {
    // Explicit status overrides view. Accept comma list for multiple.
    const statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean)
    if (statuses.length === 1) {
      query = query.eq('status', statuses[0])
    } else if (statuses.length > 1) {
      query = query.in('status', statuses)
    }
  } else if (view === 'active') {
    // Active = open or acknowledged, AND not currently snoozed.
    // Snoozed rows are handled by the 'snoozed' view separately.
    query = query.in('status', ACTIVE_STATUSES as unknown as string[])
  } else if (view === 'snoozed') {
    // Currently-snoozed rows only — those whose snoozed_until is still in the future.
    query = query.eq('status', 'snoozed').gt('snoozed_until', new Date().toISOString())
  } else if (view === 'history') {
    query = query.in('status', HISTORY_STATUSES as unknown as string[])
  }
  // view === 'all' applies no status filter

  if (severity) query = query.eq('severity', severity)
  if (alertType) query = query.eq('alert_type', alertType)

  if (agencyId) {
    if (agencyId === 'null') {
      query = query.is('agency_id', null)
    } else {
      query = query.eq('agency_id', agencyId)
    }
  }

  if (q) {
    // Case-insensitive substring match in title OR body
    const pattern = `%${q.replace(/[%_]/g, '\\$&')}%`
    query = query.or(`title.ilike.${pattern},body.ilike.${pattern}`)
  }

  if (since) query = query.gte('created_at', since)
  if (until) query = query.lte('created_at', until)

  const { data, error, count } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    alerts: data || [],
    total: count ?? (data?.length || 0),
    limit,
    offset,
  })
}

export async function POST(request: NextRequest) {
  const db = getServiceDb()
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id query parameter required' }, { status: 400 })
  }

  const validActions = ['acknowledge', 'snooze', 'resolve', 'dismiss']
  if (!action || !validActions.includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${validActions.join(', ')}` },
      { status: 400 },
    )
  }

  let body: any = {}
  try { body = await request.json() } catch { /* no body is fine */ }

  const who = body?.resolved_by || body?.acknowledged_by || body?.snoozed_by || 'chairman'
  const nowIso = new Date().toISOString()

  let update: Record<string, any>

  if (action === 'acknowledge') {
    update = {
      status: 'acknowledged',
      acknowledged_at: nowIso,
      acknowledged_by: who,
    }
  } else if (action === 'snooze') {
    const hours = Math.max(1, Math.min(Number(body?.hours) || 24, 168)) // 1h–7d
    const snoozedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString()
    update = {
      status: 'snoozed',
      snoozed_until: snoozedUntil,
      snoozed_by: who,
    }
  } else if (action === 'resolve') {
    update = {
      status: 'resolved',
      resolved_by: who,
      resolved_at: nowIso,
    }
  } else {
    // dismiss
    update = {
      status: 'dismissed',
      resolved_by: who,
      resolved_at: nowIso,
    }
  }

  const { data, error } = await db
    .from('chairman_alerts')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, alert: data })
}
