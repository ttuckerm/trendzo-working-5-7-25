import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { handleComponentAction } from '@/lib/clay/action-handler'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    // Authenticate
    let userId: string
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      userId = 'dev-user'
    } else {
      const supabase = await createServerSupabaseClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    }

    const { actionId, type, payload } = await req.json() as {
      actionId: string
      type: string
      payload?: Record<string, unknown>
    }

    if (!actionId || !type) {
      return NextResponse.json({ error: 'actionId and type required' }, { status: 400 })
    }

    const agencyId = await getUserAgencyId(userId)
    if (!agencyId) {
      return NextResponse.json({ error: 'No agency found' }, { status: 403 })
    }

    const result = await handleComponentAction(
      { actionId, type, payload: payload || {} },
      { agencyId, userId },
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
