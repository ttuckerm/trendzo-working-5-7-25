import crypto from 'crypto'
import { setTimeout as wait } from 'timers/promises'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

type SlackPayload = { title: string; text: string; severity: 'info'|'warn'|'crit'; rule?: string; cohort?: string|null }
type EmailPayload = { subject: string; html: string; text?: string; severity: 'info'|'warn'|'crit'; rule?: string; cohort?: string|null }

const cooldownMs = 10 * 60 * 1000

async function ensureTables(db: any) {
  try { await db.rpc?.('exec_sql', { query: "create table if not exists ops_delivery_log (id bigserial primary key, channel text, rule text, severity text, cohort text, hash text, status text, error text, ts timestamptz default now());" }) } catch {}
}

function hashContent(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

async function inCooldown(db: any, hash: string): Promise<boolean> {
  const since = new Date(Date.now() - cooldownMs).toISOString()
  try {
    const { data } = await db.from('ops_delivery_log').select('id').eq('hash', hash).gte('ts', since).limit(1)
    return Array.isArray(data) && data.length > 0
  } catch { return false }
}

export async function sendSlack(payload: SlackPayload): Promise<{ sent: boolean; count: number }>{
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureTables(db as any)
  const webhooks = (process.env.SLACK_WEBHOOK_URLS || '').split(',').map(s=>s.trim()).filter(Boolean)
  const hash = hashContent(`slack|${payload.rule||''}|${payload.cohort||''}|${payload.severity}|${payload.title}|${payload.text}`)
  if (await inCooldown(db as any, hash)) return { sent: true, count: 0 }
  let successCount = 0
  for (const url of webhooks) {
    let ok = false, errorMsg: string | null = null
    for (let attempt=0; attempt<3 && !ok; attempt++) {
      try {
        const body = { text: `*${payload.severity.toUpperCase()}* ${payload.title}\n${payload.text}` }
        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
        ok = res.ok
        if (!ok) errorMsg = `http_${res.status}`
      } catch (e: any) { errorMsg = e?.message || 'network_error' }
      if (!ok) await wait(500 * Math.pow(2, attempt))
    }
    try { await db.from('ops_delivery_log').insert({ channel: 'slack', rule: payload.rule||null, severity: payload.severity, cohort: payload.cohort||null, hash, status: ok ? 'sent' : 'failed', error: ok ? null : (errorMsg||'') } as any) } catch {}
    if (ok) successCount++
  }
  return { sent: successCount > 0, count: successCount }
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; count: number }>{
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureTables(db as any)
  const from = process.env.ALERT_EMAIL_FROM || ''
  const to = (process.env.ALERT_EMAIL_TO || '').split(',').map(s=>s.trim()).filter(Boolean)
  const hash = hashContent(`email|${payload.rule||''}|${payload.cohort||''}|${payload.severity}|${payload.subject}`)
  if (await inCooldown(db as any, hash)) return { sent: true, count: 0 }
  let transporter: any = null
  try {
    const nodemailer = await import('nodemailer') as any
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE||'false') === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  } catch (e) {
    // cannot init transporter
    try { await db.from('ops_delivery_log').insert({ channel: 'email', rule: payload.rule||null, severity: payload.severity, cohort: payload.cohort||null, hash, status: 'failed', error: 'no_nodemailer' } as any) } catch {}
    return { sent: false, count: 0 }
  }
  let ok = false, errorMsg: string | null = null
  for (let attempt=0; attempt<3 && !ok; attempt++) {
    try {
      await transporter.sendMail({ from, to, subject: payload.subject, html: payload.html, text: payload.text || '' })
      ok = true
    } catch (e: any) {
      errorMsg = e?.message || 'smtp_error'
      await wait(500 * Math.pow(2, attempt))
    }
  }
  try { await db.from('ops_delivery_log').insert({ channel: 'email', rule: payload.rule||null, severity: payload.severity, cohort: payload.cohort||null, hash, status: ok ? 'sent' : 'failed', error: ok ? null : (errorMsg||'') } as any) } catch {}
  return { sent: ok, count: ok ? to.length : 0 }
}

export async function dispatchAlarm(rule: string, severity: 'info'|'warn'|'crit', details: any = {}): Promise<{ slack?: any; email?: any }>{
  const title = `[${severity.toUpperCase()}] ${rule}`
  const text = `${details?.message || 'Alarm fired'} — ${JSON.stringify(details).slice(0, 400)}`
  const slack = await sendSlack({ title, text, severity, rule, cohort: details?.cohort || null })
  const email = await sendEmail({ subject: title, html: `<p>${text}</p>`, text, severity, rule, cohort: details?.cohort || null })
  return { slack, email }
}












