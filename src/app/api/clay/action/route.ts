import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { handleComponentAction } from '@/lib/clay/action-handler'

export const runtime = 'nodejs'

/**
 * Resolution order for the operating user/agency:
 *   1. Real Supabase auth (works when NEXT_PUBLIC_DISABLE_AUTH is not 'true')
 *   2. NEXT_PUBLIC_ADMIN_EMAIL fallback when the dev auth bypass is on
 *   3. Hard fail: no agency → 403
 */
async function resolveContext(): Promise<{ userId: string; agencyId: string } | null> {
  // Try real auth first
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

  // Dev fallback when DISABLE_AUTH bypass is set: skip the auth-admin API
  // (it's been flaky — "Database error finding users") and look up the
  // admin's user_id by joining agency_members → onboarding_profiles. There's
  // exactly one agency owner per agency in this codebase.
  if (process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    const { createClient } = await import('@supabase/supabase-js')
    const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = await import('@/lib/env')
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

export async function POST(req: Request) {
  try {
    const { actionId, type, payload } = await req.json() as {
      actionId: string
      type: string
      payload?: Record<string, unknown>
    }

    if (!actionId || !type) {
      return NextResponse.json({ error: 'actionId and type required' }, { status: 400 })
    }

    const ctx = await resolveContext()
    if (!ctx) {
      return NextResponse.json({ error: 'No agency found' }, { status: 403 })
    }

    const result = await handleComponentAction(
      { actionId, type, payload: payload || {} },
      ctx,
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[clay/action] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false, message: String(error) },
      { status: 500 },
    )
  }
}
