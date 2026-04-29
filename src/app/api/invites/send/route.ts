import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { emitEvent } from '@/lib/events/emit'
import { sendInviteFor } from '@/lib/email/send-invite'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ success: false, error: 'Missing Supabase config' }, { status: 500 })
  }

  // ── Session auth ─────────────────────────────────────────────────────────
  const authSupabase = await createServerSupabaseClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  }

  // ── Agency membership ────────────────────────────────────────────────────
  const operatorAgencyId = await getUserAgencyId(user.id)
  if (!operatorAgencyId) {
    return NextResponse.json({ success: false, error: 'Operator not assigned to an agency' }, { status: 403 })
  }

  // ── Body parsing + validation ────────────────────────────────────────────
  let body: { creatorEmail?: unknown; creatorName?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const creatorEmail = typeof body.creatorEmail === 'string' ? body.creatorEmail.trim() : ''
  const creatorName = typeof body.creatorName === 'string' ? body.creatorName.trim() : ''

  if (!creatorEmail) {
    return NextResponse.json({ success: false, error: 'creatorEmail required' }, { status: 400 })
  }
  if (!creatorName) {
    return NextResponse.json({ success: false, error: 'creatorName required' }, { status: 400 })
  }
  if (!creatorEmail.includes('@') || !creatorEmail.includes('.')) {
    return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 })
  }

  // ── Run the shared invite pipeline ───────────────────────────────────────
  const result = await sendInviteFor({
    agencyId: operatorAgencyId,
    userId: user.id,
    creatorEmail,
    creatorName,
  })

  if (!result.ok) {
    emitEvent({
      eventType: 'invite.failed',
      payload: {
        source: 'dashboard-action',
        invite_id: result.inviteId ?? null,
        creator_email: creatorEmail.toLowerCase(),
        creator_name: creatorName,
        error: result.error,
      },
      actorId: user.id,
      actorType: 'user',
      agencyId: operatorAgencyId,
      entityType: 'agency_invite',
      entityId: result.inviteId,
    })
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  emitEvent({
    eventType: 'invite.sent',
    payload: {
      source: 'dashboard-action',
      invite_id: result.inviteId,
      creator_email: creatorEmail.toLowerCase(),
      creator_name: creatorName,
      email_sent: true,
    },
    actorId: user.id,
    actorType: 'user',
    agencyId: operatorAgencyId,
    entityType: 'agency_invite',
    entityId: result.inviteId,
  })

  return NextResponse.json({ success: true, inviteId: result.inviteId }, { status: 200 })
}
