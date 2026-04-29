import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { verifyBriefAckToken } from '@/lib/email/brief-ack-token'
import { emitEvent } from '@/lib/events/emit'

export const dynamic = 'force-dynamic'

function htmlResponse(opts: { title: string; heading: string; body: string; status?: number }) {
  const { title, heading, body, status = 200 } = opts
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:48px 16px;background:#ffffff;font-family:'IBM Plex Sans',Arial,sans-serif;color:#282929;">
  <div style="max-width:560px;margin:0 auto;">
    <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6C92A0;font-weight:500;">Trendzo</div>
    <h1 style="font-size:24px;font-weight:500;margin:16px 0 12px 0;">${heading}</h1>
    <p style="font-size:15px;line-height:1.6;color:#282929;">${body}</p>
  </div>
</body></html>`
  return new NextResponse(html, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const inviteId = params.id

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return htmlResponse({
      title: 'Configuration error — Trendzo',
      heading: "We couldn't record your acceptance.",
      body: 'Server configuration is missing. Please contact your agency.',
      status: 500,
    })
  }

  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return htmlResponse({
      title: 'Link invalid — Trendzo',
      heading: 'This link is missing its signature.',
      body: 'The invitation link in your email is incomplete. Please use the original email, or contact your agency to resend.',
      status: 401,
    })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  // Load invite first — need creator_email for signature verification (option A:
  // creator_email NOT in URL). Mirrors brief-acknowledge pattern.
  const { data: invite, error: fetchErr } = await db
    .from('agency_invites')
    .select('id, agency_id, creator_email, status')
    .eq('id', inviteId)
    .single()

  if (fetchErr || !invite) {
    return htmlResponse({
      title: 'Invite not found — Trendzo',
      heading: 'We could not find that invitation.',
      body: 'The link may be expired or invalid. Please check your email or contact your agency.',
      status: 404,
    })
  }

  // Verify signature against invite.creator_email. timingSafeEqual inside.
  let valid: boolean
  try {
    valid = verifyBriefAckToken(invite.id, invite.creator_email, token)
  } catch {
    return htmlResponse({
      title: 'Configuration error — Trendzo',
      heading: "We couldn't verify this link.",
      body: 'Signature validation is not configured on the server. Please contact your agency.',
      status: 500,
    })
  }

  if (!valid) {
    return htmlResponse({
      title: 'Link invalid — Trendzo',
      heading: 'This invitation link could not be verified.',
      body: 'The link signature does not match. Please use the original email link, or contact your agency to resend.',
      status: 401,
    })
  }

  const alreadyAccepted = invite.status === 'accepted'

  if (!alreadyAccepted) {
    try {
      await db
        .from('agency_invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', inviteId)
        .in('status', ['sent', 'pending'])
    } catch (err) {
      console.error('[invite-acknowledge] update failed:', err)
    }

    // Audit log — fire-and-forget (emitEvent is non-throwing).
    emitEvent({
      eventType: 'invite.accepted_via_email_link',
      payload: { inviteId },
      actorType: 'user',
      agencyId: invite.agency_id ?? undefined,
      entityType: 'agency_invite',
      entityId: inviteId,
    })
  }

  return htmlResponse({
    title: 'Accepted — Trendzo',
    heading: 'Got it. Your invitation has been accepted.',
    body: alreadyAccepted
      ? 'This invitation was already accepted. You can close this tab.'
      : "Thanks for accepting. Your agency will be in touch with onboarding next steps. You can close this tab.",
  })
}
