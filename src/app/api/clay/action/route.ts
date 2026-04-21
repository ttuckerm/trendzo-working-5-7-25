import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { handleComponentAction } from '@/lib/clay/action-handler'
import { emitEventStrict } from '@/lib/events/emit'

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

    // Stage 3 Phase 2: agent proposal-confirm branch.
    // When the click carries a proposal_id (only the agent's propose_* tools
    // set this), we DO NOT execute the underlying write here. Instead we
    // write an `agent.proposal_confirmed` event to platform_events — the
    // real <action> tool on the agent's NEXT turn will find that event via
    // the consume_agent_proposal RPC and execute atomically. Any non-agent
    // click (ActionButton rendered from a list) has no proposal_id and keeps
    // the direct-execute path below unchanged.
    const p = (payload || {}) as Record<string, unknown>
    const proposalId = typeof p.proposal_id === 'string' ? p.proposal_id : null
    const payloadHash = typeof p.payload_hash === 'string' ? p.payload_hash : null
    const correlationId = typeof p.correlation_id === 'string' ? p.correlation_id : undefined
    if (proposalId && payloadHash) {
      try {
        await emitEventStrict({
          eventType: 'agent.proposal_confirmed',
          payload: {
            proposal_id: proposalId,
            payload_hash: payloadHash,
            action_id: type,
            // Strip gate-metadata from action payload so the agent sees the original args.
            action_payload: Object.fromEntries(
              Object.entries(p).filter(([k]) => k !== 'proposal_id' && k !== 'payload_hash' && k !== 'correlation_id'),
            ),
            consumed: false,
          },
          actorType: 'user',
          actorId: ctx.userId,
          agencyId: ctx.agencyId,
          correlationId,
        })
      } catch (err) {
        console.error('[clay/action] proposal_confirmed strict emit failed:', err)
        return NextResponse.json(
          { error: 'Could not record your confirmation. Please try again.', success: false },
          { status: 500 },
        )
      }
      return NextResponse.json({
        success: true,
        message: 'Confirmed. Tell the agent "go" (or anything) and it will execute the action.',
      })
    }

    const result = await handleComponentAction(
      { actionId, type, payload: p },
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
