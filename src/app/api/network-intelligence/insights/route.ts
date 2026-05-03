/**
 * Prompt 44 — Network Intelligence insights API.
 *
 * GET /api/network-intelligence/insights
 *   Query params:
 *     limit       (default 50, max 200)
 *     insight_type (optional filter)
 *     niche_scope  (optional filter)
 *
 * Responses:
 *   200 { insights: [...], tier: 'enterprise', agency_id }
 *   403 { error: 'tier_required', required: 'enterprise', current_tier }
 *   401 { error: 'unauthenticated' }
 *
 * Rows returned are de-duplicated: only the most recent insight per
 * (insight_type, niche_scope) pair is kept, so the UI never shows
 * two rows describing the same slice. Done client-side in the
 * handler since Supabase doesn't have DISTINCT ON via PostgREST.
 *
 * Test override: passing `user_id=<uuid>` as a query param bypasses
 * Supabase session auth and uses that id directly. This is gated
 * on NETWORK_INTELLIGENCE_TEST_MODE=true in the environment and is
 * used only by scripts/verify-prompt44.ts.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEnterprise } from '@/lib/network-intelligence/tier-gate'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function GET(req: Request) {
  const db = getDb()
  const url = new URL(req.url)
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)))
  const typeFilter = url.searchParams.get('insight_type')
  const nicheFilter = url.searchParams.get('niche_scope')

  // Resolve user id. In test mode we accept a direct override so the
  // verification script can hit the route without going through the
  // browser auth flow. Production uses the Supabase SSR cookie client.
  let userId: string | null = null
  const testMode = process.env.NETWORK_INTELLIGENCE_TEST_MODE === 'true'
  if (testMode) {
    userId = url.searchParams.get('user_id')
  } else {
    try {
      const mod = await import('@/lib/auth/api-guard')
      const { user } = await (mod as any).requireAuth()
      userId = user?.id ?? null
    } catch {
      userId = null
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const gate = await requireEnterprise(db, userId)
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: 'tier_required',
        required: 'enterprise',
        current_tier: gate.current_tier,
        reason: gate.reason,
      },
      { status: 403 },
    )
  }

  let query = db
    .from('network_insights')
    .select(
      'id, insight_type, insight_text, statistical_payload, confidence_score, supporting_agency_count, supporting_run_count, niche_scope, llm_model, created_at, expires_at',
    )
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(limit * 3)

  if (typeFilter) query = query.eq('insight_type', typeFilter)
  if (nicheFilter) query = query.eq('niche_scope', nicheFilter)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'query_failed', detail: error.message }, { status: 500 })
  }

  // De-dup by (insight_type, niche_scope): keep first (latest) only.
  const seen = new Set<string>()
  const deduped: any[] = []
  for (const row of data || []) {
    const key = `${row.insight_type}::${row.niche_scope}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(row)
    if (deduped.length >= limit) break
  }

  return NextResponse.json({
    insights: deduped,
    tier: gate.current_tier,
    agency_id: gate.agency_id,
  })
}
