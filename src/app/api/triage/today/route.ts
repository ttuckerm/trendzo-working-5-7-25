import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { readTriageForAgency } from '@/lib/triage/overnight-triage'

export const runtime = 'nodejs'

export async function GET() {
  try {
    let userId: string
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      userId = 'dev-user'
    } else {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      userId = user.id
    }

    const agencyId = await getUserAgencyId(userId)
    if (!agencyId) return NextResponse.json({ error: 'No agency found' }, { status: 403 })

    const triage = await readTriageForAgency(agencyId)
    return NextResponse.json(triage)
  } catch (e: any) {
    console.error('[triage/today] Error:', e)
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
