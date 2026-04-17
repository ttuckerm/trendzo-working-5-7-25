import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { runTriageForAllAgencies, runTriageForAgency } from '@/lib/triage/overnight-triage'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

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
    const agencyId = await getUserAgencyId(userId)
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
