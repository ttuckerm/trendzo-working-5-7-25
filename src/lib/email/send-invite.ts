import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { signBriefAckToken } from '@/lib/email/brief-ack-token'

export interface SendInviteResult {
  success: boolean
  error?: string
}

function esc(s: unknown): string {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildEmailHtml(opts: {
  creatorName: string
  agencyName: string
  acceptUrl: string
}): string {
  const { creatorName, agencyName, acceptUrl } = opts
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>You've been invited to Trendzo</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'IBM Plex Sans',Arial,Helvetica,sans-serif;color:#282929;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6C92A0;font-weight:500;">Trendzo</div>
        </td></tr>
        <tr><td style="padding-bottom:8px;">
          <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:500;color:#282929;">You're invited to join ${esc(agencyName)} on Trendzo</h1>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <div style="font-size:15px;line-height:1.6;color:#282929;">Hi ${esc(creatorName)}, ${esc(agencyName)} has invited you to join their roster on Trendzo — a viral content prediction platform that helps creators ship videos that hit.</div>
        </td></tr>

        <tr><td style="border-top:1px solid #E5E7E7;"></td></tr>

        <tr><td style="padding:24px 0 8px 0;">
          <div style="font-size:15px;line-height:1.6;color:#282929;">Click below to accept the invitation and start onboarding.</div>
        </td></tr>

        <tr><td style="padding:16px 0 8px 0;" align="left">
          <a href="${esc(acceptUrl)}" style="display:inline-block;background:#6C92A0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;">Accept invitation</a>
        </td></tr>

        <tr><td style="padding-top:48px;border-top:1px solid #E5E7E7;">
          <div style="font-size:12px;line-height:1.6;color:#6B6D6D;padding-top:16px;">
            Sent by Trendzo on behalf of ${esc(agencyName)} — viral prediction and creator briefs.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function buildEmailText(opts: { creatorName: string; agencyName: string; acceptUrl: string }): string {
  const { creatorName, agencyName, acceptUrl } = opts
  const lines: string[] = []
  lines.push(`Hi ${creatorName},`)
  lines.push('')
  lines.push(`${agencyName} has invited you to join their roster on Trendzo — a viral content prediction platform that helps creators ship videos that hit.`)
  lines.push('')
  lines.push(`Accept the invitation: ${acceptUrl}`)
  lines.push('')
  lines.push('— Trendzo')
  return lines.join('\n')
}

export async function sendCreatorInvite(inviteId: string): Promise<SendInviteResult> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { success: false, error: 'Missing Supabase config' }
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  const { data: invite, error: inviteErr } = await db
    .from('agency_invites')
    .select('id, agency_id, creator_email, creator_name')
    .eq('id', inviteId)
    .single()

  if (inviteErr || !invite) {
    return { success: false, error: `Invite not found: ${inviteErr?.message || inviteId}` }
  }

  if (!invite.creator_email) {
    await db
      .from('agency_invites')
      .update({ status: 'failed', error_message: 'Invite row missing creator_email' })
      .eq('id', inviteId)
    return { success: false, error: 'Invite row missing creator_email' }
  }

  let agencyName = 'your agency'
  const { data: agency } = await db
    .from('agencies')
    .select('name')
    .eq('id', invite.agency_id)
    .maybeSingle()
  if (agency?.name) agencyName = agency.name

  const creatorName = invite.creator_name || invite.creator_email.split('@')[0]

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'

  let token: string
  try {
    token = signBriefAckToken(invite.id, invite.creator_email)
  } catch (e: any) {
    const msg = `Cannot sign invite token: ${e?.message || 'BRIEF_ACK_SECRET not configured'}`
    await db
      .from('agency_invites')
      .update({ status: 'failed', error_message: msg })
      .eq('id', inviteId)
    return { success: false, error: msg }
  }

  const acceptUrl = `${baseUrl.replace(/\/$/, '')}/api/invite-acknowledge/${invite.id}?token=${token}`

  const subject = `You've been invited to Trendzo by ${agencyName}`
  const html = buildEmailHtml({ creatorName, agencyName, acceptUrl })
  const text = buildEmailText({ creatorName, agencyName, acceptUrl })

  const from = process.env.BRIEF_EMAIL_FROM || process.env.ALERT_EMAIL_FROM || ''
  if (!from) {
    const msg = 'Missing BRIEF_EMAIL_FROM (or ALERT_EMAIL_FROM) env var'
    await db
      .from('agency_invites')
      .update({ status: 'failed', error_message: msg })
      .eq('id', inviteId)
    return { success: false, error: msg }
  }

  if (!process.env.SMTP_HOST) {
    const msg = 'Missing SMTP_HOST env var'
    await db
      .from('agency_invites')
      .update({ status: 'failed', error_message: msg })
      .eq('id', inviteId)
    return { success: false, error: msg }
  }

  let transporter: any
  try {
    // @ts-ignore — nodemailer types not installed; matches pattern in src/lib/email/send-brief.ts
    const nodemailer = await import('nodemailer') as any
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  } catch (e: any) {
    const msg = `nodemailer init failed: ${e?.message || 'unknown'}`
    await db
      .from('agency_invites')
      .update({ status: 'failed', error_message: msg })
      .eq('id', inviteId)
    return { success: false, error: msg }
  }

  try {
    await transporter.sendMail({ from, to: invite.creator_email, subject, html, text })
  } catch (e: any) {
    const msg = `SMTP send failed: ${e?.message || 'unknown'}`
    await db
      .from('agency_invites')
      .update({ status: 'failed', error_message: msg })
      .eq('id', inviteId)
    return { success: false, error: msg }
  }

  await db
    .from('agency_invites')
    .update({ status: 'sent', sent_at: new Date().toISOString(), error_message: null })
    .eq('id', inviteId)

  return { success: true }
}

/**
 * Shared helper: upsert the agency_invites row, then send the email.
 * Used by BOTH the Clay action handler (action-handler.ts:sendInvite)
 * and the Dashboard POST route (/api/invites/send). Audit-event emission
 * stays at the caller layer so each surface can attach its own context
 * (source: 'operator-action' for Clay, 'dashboard-action' for Dashboard).
 */
export async function sendInviteFor(params: {
  agencyId: string
  userId: string
  creatorEmail: string
  creatorName: string
}): Promise<
  | { ok: true; inviteId: string }
  | { ok: false; error: string; inviteId?: string }
> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { ok: false, error: 'Missing Supabase config' }
  }

  const email = String(params.creatorEmail || '').trim().toLowerCase()
  const name = String(params.creatorName || '').trim()
  if (!email) return { ok: false, error: 'Email address required' }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  const { data: inviteRow, error: upsertErr } = await db
    .from('agency_invites')
    .upsert(
      {
        agency_id: params.agencyId,
        creator_email: email,
        creator_name: name || null,
        invited_by: params.userId,
        status: 'pending',
      },
      { onConflict: 'agency_id,creator_email' },
    )
    .select('id')
    .single()

  if (upsertErr || !inviteRow) {
    return { ok: false, error: `Failed to queue invite: ${upsertErr?.message ?? 'no row returned'}` }
  }

  const sendResult = await sendCreatorInvite(inviteRow.id)
  if (!sendResult.success) {
    return { ok: false, error: sendResult.error ?? 'unknown error', inviteId: inviteRow.id }
  }

  return { ok: true, inviteId: inviteRow.id }
}
