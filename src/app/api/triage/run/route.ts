import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { runTriageForAllAgencies, runTriageForAgency } from '@/lib/triage/overnight-triage'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export const runtime = 'nodejs'

/**
 * Manual trigger for overnight triage. Two modes:
 *   - ?scope=mine       → run for the caller's agency only (operator-triggered)
 *   - ?scope=all        → run for all agencies (cron-like, admin only)
 *
 * Both return the result summary (agencies processed, items written, errors).
 */
export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const scope = url.searchParams.get('scope') || 'mine'

    let userId: string
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      userId = 'dev-user'
    } else {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    if (scope === 'all') {
      const result = await runTriageForAllAgencies()
      return NextResponse.json(result)
    }

    // scope = 'mine' (default)
    let agencyId = await getUserAgencyId(userId)

    // Bug 1 Problem B fix (2026-04-24): dev fallback mirroring /api/triage/today.
    // When NEXT_PUBLIC_DISABLE_AUTH=true the caller is the 'dev-user' sentinel,
    // which never has an agency_members row, so the session lookup above returns
    // null and the operator hits 403 on the Refresh Triage button. Resolve the
    // agency via the owner row instead (same pattern as /api/triage/today).
    if (!agencyId && process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' && process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      const sc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const { data: ownerRow } = await sc
        .from('agency_members')
        .select('agency_id')
        .eq('role', 'owner')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      if (ownerRow?.agency_id) agencyId = ownerRow.agency_id
    }

    if (!agencyId) return NextResponse.json({ error: 'No agency found' }, { status: 403 })

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const count = await runTriageForAgency(db, agencyId)

    return NextResponse.json({
      success: true,
      agency_id: agencyId,
      items_written: count,
      ran_at: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error('[triage/run] Error:', e)
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
