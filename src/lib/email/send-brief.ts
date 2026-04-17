import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export interface SendBriefResult {
  success: boolean
  error?: string
}

interface BriefContent {
  title?: string
  campaign_name?: string
  hook?: string
  angle?: string
  format?: string
  talking_points?: string[]
  cta?: string
  cultural_moment?: string
  trend_context?: string
  narrative_arc?: string
  [key: string]: any
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
  brief: BriefContent
  ackUrl: string
}): string {
  const { creatorName, brief, ackUrl } = opts
  const title = brief.title || brief.campaign_name || 'Your content brief'
  const hook = brief.hook
  const angle = brief.angle
  const format = brief.format
  const talkingPoints = Array.isArray(brief.talking_points) ? brief.talking_points : []
  const cta = brief.cta
  const cultural = brief.cultural_moment || brief.trend_context || brief.narrative_arc

  const section = (label: string, body: string) => `
    <tr><td style="padding:16px 0 4px 0;">
      <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#6B6D6D;font-weight:500;">${esc(label)}</div>
    </td></tr>
    <tr><td style="padding-bottom:8px;">
      <div style="font-size:15px;line-height:1.6;color:#282929;">${body}</div>
    </td></tr>`

  const pointsHtml = talkingPoints.length
    ? '<ul style="margin:0;padding-left:20px;">' +
      talkingPoints.map((p) => `<li style="margin:4px 0;">${esc(p)}</li>`).join('') +
      '</ul>'
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'IBM Plex Sans',Arial,Helvetica,sans-serif;color:#282929;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="padding-bottom:24px;">
          <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#6C92A0;font-weight:500;">Trendzo</div>
        </td></tr>
        <tr><td style="padding-bottom:8px;">
          <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:500;color:#282929;">${esc(title)}</h1>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <div style="font-size:15px;line-height:1.6;color:#282929;">Hi ${esc(creatorName)}, your next content brief is ready.</div>
        </td></tr>

        <tr><td style="border-top:1px solid #E5E7E7;"></td></tr>

        ${hook ? section('Hook', esc(hook)) : ''}
        ${angle ? section('Angle', esc(angle)) : ''}
        ${format ? section('Format', esc(format)) : ''}
        ${pointsHtml ? section('Talking points', pointsHtml) : ''}
        ${cultural ? section('Cultural context', esc(cultural)) : ''}
        ${cta ? section('Call to action', esc(cta)) : ''}

        <tr><td style="padding:32px 0 8px 0;" align="left">
          <a href="${esc(ackUrl)}" style="display:inline-block;background:#6C92A0;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:8px;">Mark as Received</a>
        </td></tr>

        <tr><td style="padding-top:48px;border-top:1px solid #E5E7E7;">
          <div style="font-size:12px;line-height:1.6;color:#6B6D6D;padding-top:16px;">
            Sent by Trendzo — viral prediction and creator briefs.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function buildEmailText(opts: { creatorName: string; brief: BriefContent; ackUrl: string }): string {
  const { creatorName, brief, ackUrl } = opts
  const lines: string[] = []
  lines.push(`Hi ${creatorName}, your next content brief is ready.`)
  lines.push('')
  if (brief.title || brief.campaign_name) lines.push(String(brief.title || brief.campaign_name))
  if (brief.hook) lines.push(`\nHook: ${brief.hook}`)
  if (brief.angle) lines.push(`Angle: ${brief.angle}`)
  if (brief.format) lines.push(`Format: ${brief.format}`)
  if (Array.isArray(brief.talking_points) && brief.talking_points.length) {
    lines.push('\nTalking points:')
    brief.talking_points.forEach((p) => lines.push(`- ${p}`))
  }
  const cultural = brief.cultural_moment || brief.trend_context || brief.narrative_arc
  if (cultural) lines.push(`\nCultural context: ${cultural}`)
  if (brief.cta) lines.push(`\nCTA: ${brief.cta}`)
  lines.push(`\nMark as received: ${ackUrl}`)
  lines.push('\n— Trendzo')
  return lines.join('\n')
}

export async function sendBriefToCreator(briefId: string): Promise<SendBriefResult> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { success: false, error: 'Missing Supabase config' }
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  const { data: brief, error: briefErr } = await db
    .from('content_briefs')
    .select('id, user_id, brief_content, delivery_status')
    .eq('id', briefId)
    .single()

  if (briefErr || !brief) {
    return { success: false, error: `Brief not found: ${briefErr?.message || briefId}` }
  }

  const { data: profile, error: profErr } = await db
    .from('profiles')
    .select('email, full_name')
    .eq('id', brief.user_id)
    .single()

  if (profErr || !profile?.email) {
    const msg = profErr?.message || 'no email on profile'
    await db.from('content_briefs').update({ delivery_status: 'failed' }).eq('id', briefId)
    return { success: false, error: `Creator email not found: ${msg}` }
  }

  const creatorName = profile.full_name || profile.email.split('@')[0]
  const briefContent = (brief.brief_content || {}) as BriefContent
  const subjectTitle = briefContent.title || briefContent.campaign_name || 'Your content brief is ready'
  const subject = `${subjectTitle} — ${creatorName}`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
  const ackUrl = `${baseUrl.replace(/\/$/, '')}/api/brief-acknowledge/${briefId}`

  const html = buildEmailHtml({ creatorName, brief: briefContent, ackUrl })
  const text = buildEmailText({ creatorName, brief: briefContent, ackUrl })

  const from = process.env.BRIEF_EMAIL_FROM || process.env.ALERT_EMAIL_FROM || ''
  if (!from) {
    await db.from('content_briefs').update({ delivery_status: 'failed' }).eq('id', briefId)
    return { success: false, error: 'Missing BRIEF_EMAIL_FROM (or ALERT_EMAIL_FROM) env var' }
  }

  let transporter: any
  try {
    // @ts-ignore — nodemailer types not installed; matches pattern in src/lib/ops/notifier.ts
    const nodemailer = await import('nodemailer') as any
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  } catch (e: any) {
    await db.from('content_briefs').update({ delivery_status: 'failed' }).eq('id', briefId)
    return { success: false, error: `nodemailer init failed: ${e?.message || 'unknown'}` }
  }

  try {
    await transporter.sendMail({ from, to: profile.email, subject, html, text })
  } catch (e: any) {
    await db.from('content_briefs').update({ delivery_status: 'failed' }).eq('id', briefId)
    return { success: false, error: `SMTP send failed: ${e?.message || 'unknown'}` }
  }

  await db.from('content_briefs').update({ delivery_status: 'delivered' }).eq('id', briefId)
  return { success: true }
}
