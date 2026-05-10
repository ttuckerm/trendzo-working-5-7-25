import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
export const dynamic = 'force-dynamic';

// Readback endpoint for the unified event log (Stage 2 of substrate pivot).
// Middleware already gates /api/admin/* to chairman / sub_admin roles.
// Filters: type, agency_id, correlation_id, entity_type. Limit capped at 500.

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const type = sp.get('type')
  const agencyId = sp.get('agency_id')
  const correlationId = sp.get('correlation_id')
  const entityType = sp.get('entity_type')
  const limitRaw = Number(sp.get('limit') ?? '100')
  const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 100, 1), 500)

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  })

  let query = db
    .from('platform_events')
    .select('id, event_type, actor_id, actor_type, agency_id, correlation_id, entity_type, entity_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('event_type', type)
  if (agencyId) query = query.eq('agency_id', agencyId)
  if (correlationId) query = query.eq('correlation_id', correlationId)
  if (entityType) query = query.eq('entity_type', entityType)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: data?.length ?? 0, events: data ?? [] })
}
