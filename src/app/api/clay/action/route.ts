import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { handleComponentAction } from '@/lib/clay/action-handler'
import { emitEvent, emitEventStrict } from '@/lib/events/emit'
import { hashPayload } from '@/lib/agent/proposal-gate'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

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

    // Stage 3 Phase 2 (v2): agent proposal-confirm branch.
    // When the click carries proposal_id + payload_hash (only the agent's
    // propose_* tools set these), we ran the action through the hard DB gate:
    //   1. Rehash the non-gate keys → must match payload_hash (detects tampering).
    //   2. Write agent.proposal_confirmed event for audit trail.
    //   3. Call consume_agent_proposal RPC — atomically consumes the original
    //      agent.proposal row. Double-click protection.
    //   4. If consumed, run handleComponentAction with the action payload.
    // Non-agent clicks (no proposal_id) keep the direct-execute path unchanged.
    const p = (payload || {}) as Record<string, unknown>
    const proposalId = typeof p.proposal_id === 'string' ? p.proposal_id : null
    const clientHash = typeof p.payload_hash === 'string' ? p.payload_hash : null
    const correlationId = typeof p.correlation_id === 'string' ? p.correlation_id : undefined

    if (proposalId && clientHash) {
      // Extract the original action args (everything except gate-metadata).
      const actionPayload = Object.fromEntries(
        Object.entries(p).filter(
          ([k]) => k !== 'proposal_id' && k !== 'payload_hash' && k !== 'correlation_id',
        ),
      )

      // 1. Integrity check — rehash the action args, compare to what the propose tool signed.
      const serverHash = hashPayload(actionPayload)
      if (serverHash !== clientHash) {
        emitEvent({
          eventType: 'agent.write_unauthorized',
          payload: { proposal_id: proposalId, reason: 'payload_hash_mismatch', action_id: type },
          actorType: 'user',
          actorId: ctx.userId,
          agencyId: ctx.agencyId,
          correlationId,
        }).catch(() => {})
        return NextResponse.json(
          { success: false, error: 'Payload integrity check failed. The action arguments were altered between proposal and confirm.' },
          { status: 403 },
        )
      }

      // 2. Audit trail — log the confirmation click.
      try {
        await emitEventStrict({
          eventType: 'agent.proposal_confirmed',
          payload: {
            proposal_id: proposalId,
            payload_hash: clientHash,
            action_id: type,
            action_payload: actionPayload,
          },
          actorType: 'user',
          actorId: ctx.userId,
          agencyId: ctx.agencyId,
          correlationId,
        })
      } catch (err) {
        console.error('[clay/action] proposal_confirmed strict emit failed:', err)
        return NextResponse.json(
          { success: false, error: 'Could not record your confirmation. Please try again.' },
          { status: 500 },
        )
      }

      // 3. Atomic consume via RPC — gates against double-clicks and stale proposals.
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
      const { data: consumed, error: rpcError } = await db.rpc('consume_agent_proposal', {
        p_proposal_id: proposalId,
        p_payload_hash: clientHash,
      })
      if (rpcError || consumed !== true) {
        emitEvent({
          eventType: 'agent.write_unauthorized',
          payload: {
            proposal_id: proposalId,
            reason: rpcError ? 'rpc_error' : 'already_consumed_or_expired',
            rpc_error: rpcError?.message,
            action_id: type,
          },
          actorType: 'user',
          actorId: ctx.userId,
          agencyId: ctx.agencyId,
          correlationId,
        }).catch(() => {})
        return NextResponse.json(
          {
            success: false,
            error: rpcError
              ? 'Authorization check failed.'
              : 'This action has already been executed or the proposal expired (10-minute window).',
          },
          { status: 409 },
        )
      }

      // 4. Authorized — run the handler with the original action payload.
      const result = await handleComponentAction(
        { actionId, type, payload: actionPayload },
        ctx,
      )
      return NextResponse.json(result)
    }

    // Non-agent click — existing direct-execute path, unchanged.
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
