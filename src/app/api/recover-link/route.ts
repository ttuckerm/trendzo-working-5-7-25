import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAssessment } from '@/lib/assessment/fetch-assessment'
import { notifyBeehiiv } from '@/lib/beehiiv/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ─── Rate limiting ──────────────────────────────────────────────────────────
type Bucket = { count: number; resetAt: number }
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX = 10
const buckets = new Map<string, Bucket>()

function rateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const existing = buckets.get(ip)
  if (!existing || existing.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true }
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) }
  }
  existing.count += 1
  return { ok: true }
}

if (typeof globalThis !== 'undefined' && !(globalThis as any).__recoverLinkRateLimitCleanup) {
  (globalThis as any).__recoverLinkRateLimitCleanup = setInterval(() => {
    const now = Date.now()
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k)
    }
  }, 10 * 60 * 1000)
}

function getIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Generic success — returned whether or not we found a match. Don't leak which
// emails are on file.
const GENERIC_SUCCESS = {
  ok: true as const,
  message: "If we have an assessment for that email, we just sent you the link. Check your inbox.",
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const rl = rateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'RATE_LIMIT', message: 'Too many attempts. Try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'BAD_REQUEST', message: 'Invalid request.' },
      { status: 400 },
    )
  }

  const rawEmail = typeof (body as { email?: unknown })?.email === 'string'
    ? (body as { email: string }).email.trim().toLowerCase()
    : ''

  if (!EMAIL_REGEX.test(rawEmail) || rawEmail.length > 320) {
    // Bad email → generic message rather than form validation. The page-level
    // validation already catches obvious typos before submit.
    return NextResponse.json(GENERIC_SUCCESS)
  }

  const supabase = getServerSupabase()
  if (!supabase) {
    console.error('[recover-link] supabase not configured')
    // Still return generic success so we don't reveal infra state.
    return NextResponse.json(GENERIC_SUCCESS)
  }

  // Look up the most recent assessment_emails row for this email. If the user
  // captured against multiple assessments (rare), use the latest one.
  const { data: rows, error } = await supabase
    .from('assessment_emails')
    .select('assessment_id, captured_at')
    .eq('email', rawEmail)
    .order('captured_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('[recover-link] supabase lookup failed', error)
    return NextResponse.json(GENERIC_SUCCESS)
  }

  const match = rows?.[0]
  if (!match || typeof match.assessment_id !== 'string') {
    return NextResponse.json(GENERIC_SUCCESS)
  }

  const displayId = match.assessment_id as string
  const assessment = await fetchAssessment(displayId).catch(() => null)
  if (!assessment) {
    // Email row points at a missing assessment — log and bail silently.
    console.warn('[recover-link] assessment row missing for captured email', { displayId })
    return NextResponse.json(GENERIC_SUCCESS)
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  const assessmentUrl = `${siteUrl.replace(/\/+$/, '')}/assessment/${assessment.display_id}`

  // Trigger Beehiiv automation by applying the `recovery-requested` tag.
  // The assessment_url custom field is what the Beehiiv welcome / recovery
  // email template references via {{custom_field.assessment_url}} merge tag.
  // The actual email content lives in Beehiiv (not in code) — Tommy sets up
  // the automation once: Trigger = Subscriber receives tag → recovery-requested.
  try {
    await notifyBeehiiv({
      email: rawEmail,
      customFields: [{ name: 'assessment_url', value: assessmentUrl }],
      tags: ['recovery-requested'],
      reactivateExisting: true,
      sendWelcomeEmail: false,
      utmSource: 'dailylotion',
      utmMedium: 'recovery',
      utmCampaign: 'recover-link',
      referringSite: assessmentUrl,
      logScope: 'recover-link',
    })
  } catch (err) {
    console.error('[recover-link] beehiiv push threw', err)
    // Still return generic success — user shouldn't know it failed.
  }

  return NextResponse.json(GENERIC_SUCCESS)
}
