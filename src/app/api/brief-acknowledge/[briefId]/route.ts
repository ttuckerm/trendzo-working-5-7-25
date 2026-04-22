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

export async function GET(req: NextRequest, { params }: { params: { briefId: string } }) {
  const briefId = params.briefId

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return htmlResponse({
      title: 'Configuration error — Trendzo',
      heading: "We couldn't record your acknowledgment.",
      body: 'Server configuration is missing. Please contact your agency.',
      status: 500,
    })
  }

  const token = new URL(req.url).searchParams.get('token')
  if (!token) {
    return htmlResponse({
      title: 'Link invalid — Trendzo',
      heading: 'This link is missing its signature.',
      body: 'The acknowledgment link in your email is incomplete. Please use the original email, or contact your agency to resend.',
      status: 401,
    })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  // Load brief first — need user_id for signature verification (option A:
  // creator_user_id NOT in URL). See Fix 2 spec §G.1.
  const { data: brief, error: fetchErr } = await db
    .from('content_briefs')
    .select('id, user_id, agency_id, completion_status')
    .eq('id', briefId)
    .single()

  if (fetchErr || !brief) {
    return htmlResponse({
      title: 'Brief not found — Trendzo',
      heading: 'We could not find that brief.',
      body: 'The link may be expired or invalid. Please check your email or contact your agency.',
      status: 404,
    })
  }

  // Verify signature against brief.user_id. timingSafeEqual inside.
  let valid: boolean
  try {
    valid = verifyBriefAckToken(briefId, brief.user_id, token)
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
      heading: 'This acknowledgment link could not be verified.',
      body: 'The link signature does not match. Please use the original email link, or contact your agency to resend.',
      status: 401,
    })
  }

  const alreadyAcknowledged = brief.completion_status && brief.completion_status !== 'delivered'

  if (!alreadyAcknowledged) {
    await db
      .from('content_briefs')
      .update({ completion_status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', briefId)

    // Audit log — fire-and-forget (emitEvent is non-throwing).
    emitEvent({
      eventType: 'brief.acknowledged_via_email_link',
      payload: { briefId },
      actorId: brief.user_id,
      actorType: 'user',
      agencyId: brief.agency_id ?? undefined,
      entityType: 'content_brief',
      entityId: briefId,
    })
  }

  return htmlResponse({
    title: 'Got it — Trendzo',
    heading: 'Got it. Your brief has been marked as received.',
    body: alreadyAcknowledged
      ? 'This brief was already acknowledged. You can close this tab.'
      : 'Thanks for confirming. You can close this tab.',
  })
}
