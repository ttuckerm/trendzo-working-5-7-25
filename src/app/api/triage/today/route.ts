import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { readTriageForAgency } from '@/lib/triage/overnight-triage'

export const runtime = 'nodejs'

/**
 * GET /api/triage/today?agency_id=<id>
 *
 * Resolution order for the agency to read:
 *   1. ?agency_id query param (the AgencyClient passes this — server-rendered
 *      AgencyPage already resolved the agencyId from real auth)
 *   2. Real Supabase auth → getUserAgencyId
 *   3. NEXT_PUBLIC_ADMIN_EMAIL fallback (when DISABLE_AUTH bypass is on)
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const explicitAgencyId = url.searchParams.get('agency_id') || ''

    let agencyId: string | null = explicitAgencyId || null

    if (!agencyId) {
      // Try real auth (works when NEXT_PUBLIC_DISABLE_AUTH is not 'true')
      try {
        const supabase = await createServerSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) agencyId = await getUserAgencyId(user.id)
      } catch {
        // ignore — fall through to admin lookup
      }
    }

    if (!agencyId && process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      // Dev fallback: when auth bypass is on, look up the admin user's agency
      const { createClient } = await import('@supabase/supabase-js')
      const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('@/lib/env')
      const sc = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const { data: adminList } = await sc.auth.admin.listUsers()
      const adminUser = adminList?.users?.find((u: any) => u.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
      if (adminUser) agencyId = await getUserAgencyId(adminUser.id)
    }

    if (!agencyId) return NextResponse.json({ items: [], triage_date: null, stale: false }, { status: 200 })

    const triage = await readTriageForAgency(agencyId)
    return NextResponse.json(triage)
  } catch (e: any) {
    console.error('[triage/today] Error:', e)
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
