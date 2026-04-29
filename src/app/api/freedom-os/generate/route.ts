// DEPRECATED — superseded by /api/assessment/generate (Escape Assessment v1).
// Left in place as a rollback path until Prompt 4 rewires the form.
// Do not modify. Scheduled for removal once the new flow is verified end-to-end.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FREEDOM_AGENT_SYSTEM_PROMPT } from '@/lib/prompts/freedom-agent'
import { extractJsonObject } from '@/lib/freedom-os/parse-claude-plan-json'
import { checkIpRateLimit, getClientIp } from '@/lib/freedom-os/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BEEHIIV_BASE = 'https://api.beehiiv.com/v2'
const MAX_PER_HOUR = 3

type GenerateBody = {
  hours_per_week: number
  monthly_income: number | null
  monthly_expenses: number
  savings_runway_months: number
  skill_leverage: string
  experience_level: string
  risk_tolerance: string
  preferred_business_type: string
  niche_interest: string | null
  target_monthly_income: number | null
  freedom_multiplier: number
  freedom_number: number
  email: string | null
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function getPublicationId(): string | null {
  return process.env.BEEHIIV_PUB_ID ?? process.env.BEEHIIV_PUBLICATION_ID ?? null
}

function validateBody(raw: unknown): { ok: true; body: GenerateBody } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Invalid JSON body' }
  const o = raw as Record<string, unknown>
  const hw = o.hours_per_week
  const me = o.monthly_expenses
  const sr = o.savings_runway_months
  if (typeof hw !== 'number' || !Number.isFinite(hw) || hw < 0) {
    return { ok: false, error: 'hours_per_week is required and must be a non-negative number' }
  }
  if (typeof me !== 'number' || !Number.isFinite(me) || me < 0) {
    return { ok: false, error: 'monthly_expenses is required and must be a non-negative number' }
  }
  if (typeof sr !== 'number' || !Number.isFinite(sr) || sr < 0) {
    return { ok: false, error: 'savings_runway_months is required and must be a non-negative number' }
  }
  const emailRaw = o.email
  let email: string | null = null
  if (emailRaw != null && String(emailRaw).trim() !== '') {
    const e = String(emailRaw).trim().toLowerCase()
    if (!EMAIL_RE.test(e)) return { ok: false, error: 'Invalid email address' }
    email = e
  }
  return {
    ok: true,
    body: {
    hours_per_week: hw,
    monthly_income: typeof o.monthly_income === 'number' && Number.isFinite(o.monthly_income) ? o.monthly_income : null,
    monthly_expenses: me,
    savings_runway_months: sr,
    skill_leverage: String(o.skill_leverage ?? ''),
    experience_level: String(o.experience_level ?? ''),
    risk_tolerance: String(o.risk_tolerance ?? ''),
    preferred_business_type: String(o.preferred_business_type ?? ''),
    niche_interest: o.niche_interest == null || o.niche_interest === '' ? null : String(o.niche_interest),
    target_monthly_income:
      typeof o.target_monthly_income === 'number' && Number.isFinite(o.target_monthly_income)
        ? o.target_monthly_income
        : null,
    freedom_multiplier:
      typeof o.freedom_multiplier === 'number' && Number.isFinite(o.freedom_multiplier) ? o.freedom_multiplier : 1.5,
    freedom_number:
      typeof o.freedom_number === 'number' && Number.isFinite(o.freedom_number) ? o.freedom_number : 0,
    email,
    },
  }
}

async function invokeClaude(
  system: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude HTTP ${res.status}: ${err.slice(0, 800)}`)
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const text = (data.content ?? [])
    .filter(b => b.type === 'text')
    .map(b => b.text ?? '')
    .join('\n')
  if (!text.trim()) throw new Error('Empty response from Claude')
  return text
}

function normalizeParsedPlan(raw: Record<string, unknown>): {
  outputs: Record<string, unknown>
  beehiiv_segment: string
  beehiiv_tag: string
  full: Record<string, unknown>
} {
  const outputs = raw.outputs
  if (!outputs || typeof outputs !== 'object' || Array.isArray(outputs)) {
    throw new Error('Parsed JSON must include an "outputs" object')
  }
  const beehiiv_segment =
    typeof raw.beehiiv_segment === 'string' && raw.beehiiv_segment.trim()
      ? raw.beehiiv_segment.trim()
      : 'freedom-os-general'
  const beehiiv_tag =
    typeof raw.beehiiv_tag === 'string' && raw.beehiiv_tag.trim() ? raw.beehiiv_tag.trim() : 'freedom-os-plan'
  return { outputs: outputs as Record<string, unknown>, beehiiv_segment, beehiiv_tag, full: raw }
}

async function beehiivLookupSubscriptionId(
  publicationId: string,
  email: string,
  headers: Record<string, string>,
): Promise<string | null> {
  const byEmailUrl = `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions/by_email/${encodeURIComponent(email)}`
  try {
    let res = await fetch(byEmailUrl, { headers })
    if (res.ok) {
      const j = (await res.json()) as { data?: { id?: string } }
      if (j?.data?.id) return j.data.id
    }
  } catch {
    /* fall through */
  }
  const q = `${BEEHIIV_BASE}/publications/${publicationId}/subscriptions?email=${encodeURIComponent(email)}`
  try {
    const res = await fetch(q, { headers })
    if (!res.ok) return null
    const j = (await res.json()) as { data?: Array<{ id?: string }> }
    return j?.data?.[0]?.id ?? null
  } catch {
    return null
  }
}

async function runBeehiivFlow(opts: {
  email: string
  publicationId: string
  apiKey: string
  planUrl: string
  beehiiv_segment: string
  beehiiv_tag: string
}): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.apiKey}`,
    'Content-Type': 'application/json',
  }

  const call1Body = {
    email: opts.email,
    reactivate_existing: true,
    send_welcome_email: false,
    utm_source: 'freedom-os',
    utm_medium: 'tool',
    utm_campaign: 'freedom-os-generate',
    custom_fields: [
      { name: 'waitlist_source', value: 'freedom-os' },
      { name: 'funnel_segment', value: opts.beehiiv_segment },
      { name: 'freedom_os_plan_url', value: opts.planUrl },
    ],
  }

  let subscriptionId: string | null = null

  try {
    const postRes = await fetch(`${BEEHIIV_BASE}/publications/${opts.publicationId}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(call1Body),
    })

    if (postRes.ok) {
      const j = (await postRes.json()) as { data?: { id?: string } }
      subscriptionId = j?.data?.id ?? null
    } else if (postRes.status === 409) {
      subscriptionId = await beehiivLookupSubscriptionId(opts.publicationId, opts.email, headers)
      if (!subscriptionId) {
        console.warn('[freedom-os/generate] Beehiiv 409 but lookup returned no id', { email: opts.email })
      }
    } else {
      const t = await postRes.text()
      console.error('[freedom-os/generate] Beehiiv POST failed', postRes.status, t.slice(0, 400))
      subscriptionId = await beehiivLookupSubscriptionId(opts.publicationId, opts.email, headers)
    }

    if (!subscriptionId) {
      subscriptionId = await beehiivLookupSubscriptionId(opts.publicationId, opts.email, headers)
    }

    if (subscriptionId) {
      const tagRes = await fetch(
        `${BEEHIIV_BASE}/publications/${opts.publicationId}/subscriptions/${subscriptionId}/tags`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ tags: ['freedom-os', opts.beehiiv_tag] }),
        },
      )
      if (!tagRes.ok) {
        const te = await tagRes.text()
        console.error('[freedom-os/generate] Beehiiv tags failed', tagRes.status, te.slice(0, 400))
      }
    }
  } catch (e) {
    console.error('[freedom-os/generate] Beehiiv flow error', e)
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request)

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const validated = validateBody(raw)
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 })
  }
  const body = validated.body

  const limited = checkIpRateLimit(ip, MAX_PER_HOUR)
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many plan generations. Try again later.', retryAfterSec: limited.retryAfterSec },
      { status: 429 },
    )
  }

  const userPayload = JSON.stringify(body)

  let assistantText: string
  try {
    assistantText = await invokeClaude(FREEDOM_AGENT_SYSTEM_PROMPT, [{ role: 'user', content: userPayload }])
  } catch (e) {
    console.error('[freedom-os/generate] Claude error', e)
    return NextResponse.json(
      {
        ok: false,
        error: 'We could not generate your plan right now. Please try again in a few minutes.',
      },
      { status: 500 },
    )
  }

  let parsed: Record<string, unknown>
  try {
    parsed = extractJsonObject(assistantText)
  } catch (firstErr) {
    console.warn('[freedom-os/generate] JSON parse failed, retrying once', firstErr)
    try {
      assistantText = await invokeClaude(FREEDOM_AGENT_SYSTEM_PROMPT, [
        { role: 'user', content: userPayload },
        {
          role: 'user',
          content:
            'IMPORTANT: Your previous reply was not valid JSON. Respond with ONLY one JSON object. No markdown fences, no commentary. Valid JSON only.',
        },
      ])
      parsed = extractJsonObject(assistantText)
    } catch (e) {
      console.error('[freedom-os/generate] JSON parse failed after retry', e)
      return NextResponse.json(
        {
          ok: false,
          error: 'The AI returned an unexpected format. Please try again.',
        },
        { status: 500 },
      )
    }
  }

  let normalized: ReturnType<typeof normalizeParsedPlan>
  try {
    normalized = normalizeParsedPlan(parsed)
  } catch (e) {
    console.error('[freedom-os/generate] Invalid plan shape', e)
    return NextResponse.json(
      { ok: false, error: 'Generated plan was incomplete. Please try again.' },
      { status: 500 },
    )
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    console.error('[freedom-os/generate] Supabase not configured')
    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
  }

  const { data: row, error: insertErr } = await supabase
    .from('freedom_os_plans')
    .insert({
      email: body.email,
      inputs: body as unknown as Record<string, unknown>,
      plan: normalized.full,
      beehiiv_tag: normalized.beehiiv_tag,
      beehiiv_segment: normalized.beehiiv_segment,
    })
    .select('id')
    .single()

  if (insertErr || !row?.id) {
    console.error('[freedom-os/generate] Supabase insert', insertErr)
    return NextResponse.json({ ok: false, error: 'Could not save your plan. Please try again.' }, { status: 500 })
  }

  const shareId = row.id as string
  const siteUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const planUrl = `${siteUrl.replace(/\/$/, '')}/free/freedom-os/plan/${shareId}`

  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = getPublicationId()
  if (body.email && apiKey && publicationId) {
    await runBeehiivFlow({
      email: body.email,
      publicationId,
      apiKey,
      planUrl,
      beehiiv_segment: normalized.beehiiv_segment,
      beehiiv_tag: normalized.beehiiv_tag,
    })
  } else if (body.email) {
    console.warn('[freedom-os/generate] Beehiiv skipped (missing BEEHIIV_API_KEY or BEEHIIV_PUB_ID / BEEHIIV_PUBLICATION_ID)')
  }

  return NextResponse.json({
    ok: true,
    share_id: shareId,
    plan_url: planUrl,
    outputs: normalized.outputs,
    plan: normalized.full,
    beehiiv_segment: normalized.beehiiv_segment,
    beehiiv_tag: normalized.beehiiv_tag,
  })
}
