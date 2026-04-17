/**
 * Prompt 42 — Admin agency pattern preload API
 *
 * POST /api/admin/agencies/[id]/preload-patterns
 *   Body: { limit?: number }  (default 20)
 *   Returns: PreloadResult
 *
 * Manually triggers cross-niche pattern preload into memory_extractions
 * for a specific agency. Admin-only; not wired into agency creation
 * automatically per Prompt 42 scope.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { preloadAgencyPatterns } from '@/lib/memory/preload-agency-patterns'

export const dynamic = 'force-dynamic'

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...(init || {}), cache: 'no-store' }),
    },
  })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const db = getServiceDb()
  if (!db) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { id: agencyId } = await context.params
  if (!agencyId || typeof agencyId !== 'string') {
    return NextResponse.json({ error: 'agency id required' }, { status: 400 })
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine
  }
  const limit =
    typeof body?.limit === 'number' && body.limit > 0 && body.limit <= 200 ? body.limit : 20

  const result = await preloadAgencyPatterns(db, agencyId, limit)
  return NextResponse.json(result, { status: result.ok ? 200 : 500 })
}
