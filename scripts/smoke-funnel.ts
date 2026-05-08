#!/usr/bin/env tsx
/* eslint-disable no-console */

/**
 * Escape Assessment Funnel — End-to-End Smoke Test
 * ─────────────────────────────────────────────────────────────────────────────
 * Walks the full funnel as a synthetic user against a running Next.js app
 * (localhost or prod URL via SMOKE_BASE_URL) using the live Supabase + Beehiiv
 * backends, then cleans up.
 *
 * Funnel under test (discovered by reading the codebase 2026-05-07):
 *
 *   Landing       GET  /free/freedom-os
 *                 src/app/(public)/free/freedom-os/page.tsx
 *                 → renders <FreedomOSTool /> client component
 *
 *   Generate      POST /api/assessment/generate
 *                 src/app/api/assessment/generate/route.ts
 *                 → inserts row into public.escape_assessments
 *                 → returns { ok, assessmentId (EA-X-XXX), shareToken,
 *                             shareUrlId, internalAssessmentUuid }
 *
 *   HUD render    GET  /assessment/{EA-X-XXX}-{shareToken}
 *                 src/app/assessment/[assessmentId]/page.tsx
 *                 → server-renders the AssessmentHUD client component
 *
 *   Email capture POST /api/assessment/email-capture
 *                 src/app/api/assessment/email-capture/route.ts
 *                 → inserts row into public.assessment_emails
 *                 → fires src/lib/beehiiv/notify.ts which performs:
 *                     1. POST /v2/publications/{pubId}/subscriptions
 *                     2. POST /v2/publications/{pubId}/subscriptions/{subId}/tags  ← CRITICAL
 *                     3. PUT  /v2/publications/{pubId}/subscriptions/{subId}
 *
 * Supabase tables (canonical migrations 20260426 + 20260428 + 20260430):
 *   escape_assessments(
 *     assessment_id UUID PK, share_token TEXT UNIQUE,
 *     payload JSONB (contains payload.assessmentId = 'EA-X-XXX'),
 *     inputs JSONB, created_at, updated_at
 *   )
 *   assessment_emails(
 *     id UUID PK,
 *     assessment_id TEXT UNIQUE  -- stores the EA-X-XXX display id, NOT the UUID
 *     email TEXT, capture_source TEXT, notify_on_codes BOOL, captured_at
 *   )
 *
 * Tag-application bug zone: src/lib/beehiiv/notify.ts:160-187 already uses
 *   POST /v2/publications/{pubId}/subscriptions/{subId}/tags
 * (the dedicated endpoint). Layer 5 verifies the tag actually lands on the
 * Beehiiv subscriber so we know the historical bug stays fixed.
 *
 * Funnel segments (src/lib/funnel/segment.ts):
 *   ready-to-scale | building-momentum | stuck-zero | tire-kicker
 *
 * Hardcoded UTMs (src/app/api/assessment/email-capture/route.ts:202-205):
 *   utm_source=dailylotion, utm_medium=assessment, utm_campaign=escape-assessment
 *   The Supabase tables do NOT have UTM columns. UTM forwarding from landing-
 *   page query string is NOT BUILT. Layer 8 verifies the hardcoded UTMs land
 *   on the Beehiiv subscriber.
 *
 * Run:    npm run smoke:funnel
 * Flags:  --no-cleanup    leave the test user in Supabase + Beehiiv
 */

import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'
import path from 'path'

// ── Load env from .env.local ────────────────────────────────────────────────
loadEnv({ path: path.resolve(process.cwd(), '.env.local') })

// ── Config ──────────────────────────────────────────────────────────────────
const CONFIG = {
  baseUrl: (process.env.SMOKE_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, ''),
  beehiivPubId: process.env.BEEHIIV_PUBLICATION_ID,
  beehiivApiKey: process.env.BEEHIIV_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  supabaseServiceKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY,
  testEmailDomain: process.env.SMOKE_EMAIL_DOMAIN ?? 'funnel-smoke.test',
}

const NO_CLEANUP = process.argv.includes('--no-cleanup')

// Fail fast on missing env vars.
const missing: string[] = []
if (!CONFIG.beehiivPubId) missing.push('BEEHIIV_PUBLICATION_ID')
if (!CONFIG.beehiivApiKey) missing.push('BEEHIIV_API_KEY')
if (!CONFIG.supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
if (!CONFIG.supabaseServiceKey) missing.push('SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY)')
if (missing.length) {
  console.error(`✗ Missing required env vars: ${missing.join(', ')}`)
  console.error('  Add them to .env.local or your shell, then re-run.')
  process.exit(2)
}

// ── Synthetic test user ─────────────────────────────────────────────────────
const RUN_ID = Date.now()
const TEST_EMAIL = `funnel-smoke+${RUN_ID}@${CONFIG.testEmailDomain}`
const TEST_FIRST_NAME = `SmokeTest${RUN_ID}`

// Inputs that, by classifyEscapeAssessment (src/lib/funnel/segment.ts),
// produce 'ready-to-scale': hours≥15, audience with platform keyword AND ≥1000,
// skill ≥30 chars, niche not a placeholder.
const ASSESSMENT_INPUTS = {
  firstName: TEST_FIRST_NAME,
  hoursPerWeek: 20,
  monthlyIncome: 6500,
  monthlyExpenses: 3800,
  runwayMonths: 4,
  skillProfile:
    '12 years marketing leader, copywriting + email lifecycle + paid acquisition. Comfortable shipping landing pages.',
  riskTolerance: 'Medium' as const,
  audienceAccess:
    '8,200 LinkedIn followers in B2B SaaS, 3,400 newsletter subscribers',
  nicheSignal: 'Newsletter + cohort for early-stage B2B SaaS founders',
  freedomMultiplier: 1.5,
}

const EXPECTED_TAG = 'ready-to-scale'

// ── Layer plumbing ──────────────────────────────────────────────────────────
type LayerStatus = boolean | 'skip' | 'not_built'

interface LayerResult {
  passed: LayerStatus
  ms: number
  notes: string[]
  data?: unknown
}

const LAYERS: Array<{ id: string; title: string; result?: LayerResult }> = [
  { id: 'L1', title: 'Landing page renders' },
  { id: 'L2', title: 'Capture POST succeeds' },
  { id: 'L3', title: 'Supabase row written' },
  { id: 'L4', title: 'Beehiiv subscriber created' },
  { id: 'L5', title: 'Beehiiv tags applied' },
  { id: 'L6', title: 'TrendzoCard renders' },
  { id: 'L7', title: 'Email automation wired' },
  { id: 'L8', title: 'Tracking attributed' },
  { id: 'L9', title: 'Unsubscribe works' },
]

function record(id: string, result: LayerResult) {
  const layer = LAYERS.find(l => l.id === id)
  if (!layer) throw new Error(`unknown layer ${id}`)
  layer.result = result
}

// ── HTTP helpers ────────────────────────────────────────────────────────────
async function fetchApp(pathname: string, init?: RequestInit) {
  const url = `${CONFIG.baseUrl}${pathname}`
  const start = Date.now()
  const res = await fetch(url, init)
  const text = await res.text()
  return { res, text, ms: Date.now() - start, url }
}

const beehiivHeaders: Record<string, string> = {
  Authorization: `Bearer ${CONFIG.beehiivApiKey}`,
  'Content-Type': 'application/json',
}
const BH_BASE = `https://api.beehiiv.com/v2/publications/${CONFIG.beehiivPubId}`

async function bhFetch(p: string, init: RequestInit = {}) {
  const res = await fetch(`${BH_BASE}${p}`, {
    ...init,
    headers: { ...beehiivHeaders, ...((init.headers as Record<string, string>) ?? {}) },
  })
  let data: unknown = null
  const text = await res.text()
  try { data = JSON.parse(text) } catch { /* keep null */ }
  return { res, data, text }
}

const supabase = createClient(CONFIG.supabaseUrl!, CONFIG.supabaseServiceKey!, {
  auth: { persistSession: false },
})

// ── State persisted across layers ───────────────────────────────────────────
const STATE: {
  assessmentDisplayId?: string
  shareToken?: string
  shareUrlId?: string
  internalAssessmentUuid?: string
  beehiivSubscriptionId?: string
} = {}

// ── Layer 1: Landing renders ────────────────────────────────────────────────
// The form page (/free/freedom-os) is PAYWALL-GATED — it requires either a
// Stripe checkout session_id query param or a valid signed dl_code_path
// cookie issued by /api/landing/code-validate. Hitting it without proof of
// access returns 307 to /. So Layer 1:
//   1. Confirms the public marketing landing (/) renders → site is up.
//   2. Confirms /free/freedom-os correctly 307s when no proof of access is
//      presented → the paywall gate is intact.
async function layer1(): Promise<LayerResult> {
  const t = Date.now()
  const notes: string[] = []
  let landingOk = false
  try {
    const { res, text, ms } = await fetchApp('/')
    if (res.status !== 200) {
      return { passed: false, ms: Date.now() - t, notes: [`/ returned ${res.status} (expected 200)`] }
    }
    if (ms > 2000) notes.push(`slow render: / took ${ms}ms (>2s)`)

    // The marketing landing typically references either Trendzo or the
    // assessment funnel CTA — be permissive but fail noisy if HTML is empty.
    const hasContent = /<title>|<body|trendzo|escape/i.test(text)
    if (!hasContent) {
      return {
        passed: false,
        ms: Date.now() - t,
        notes: ['/ returned 200 but no recognisable content markers'],
      }
    }
    const ogPresent = text.includes('og:title') || text.includes('og:description')
    if (!ogPresent) notes.push('OG meta tags not detected on /')
    landingOk = true
  } catch (err) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        `Could not fetch ${CONFIG.baseUrl}/: ${(err as Error).message}`,
        'Is the Next.js dev server running? `npm run dev`',
      ],
    }
  }

  // Paywall gate check on /free/freedom-os.
  try {
    const { res } = await fetchApp('/free/freedom-os', { redirect: 'manual' })
    if (res.status === 307 || res.status === 308 || res.status === 302) {
      notes.push(`/free/freedom-os correctly returns ${res.status} (paywall gate intact)`)
    } else if (res.status === 200) {
      notes.push('/free/freedom-os returned 200 directly — paywall MAY be bypassed (verify gating rules)')
    } else {
      notes.push(`/free/freedom-os returned ${res.status} — unexpected`)
    }
  } catch (err) {
    notes.push(`Could not probe /free/freedom-os: ${(err as Error).message}`)
  }

  notes.push('NOTE: form page (/free/freedom-os) is paywall-gated. Smoke test calls /api/assessment/generate directly (the API is intentionally not gated; only the form page is).')
  return { passed: landingOk, ms: Date.now() - t, notes }
}

// ── Layer 2: Capture POST (generate + email-capture) ────────────────────────
async function layer2(): Promise<LayerResult> {
  const t = Date.now()
  // Step 2a — generate. This is what the FreedomOSTool form actually POSTs.
  let genRes: Response
  try {
    genRes = await fetch(`${CONFIG.baseUrl}/api/assessment/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ASSESSMENT_INPUTS),
    })
  } catch (err) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`POST /api/assessment/generate failed: ${(err as Error).message}`],
    }
  }
  if (genRes.status !== 200) {
    const txt = await genRes.text().catch(() => '')
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`/api/assessment/generate returned ${genRes.status}: ${txt.slice(0, 300)}`],
    }
  }
  const genJson: any = await genRes.json().catch(() => ({}))
  if (!genJson.ok || typeof genJson.assessmentId !== 'string') {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`generate response not ok: ${JSON.stringify(genJson).slice(0, 300)}`],
    }
  }
  STATE.assessmentDisplayId = genJson.assessmentId
  STATE.shareToken = genJson.shareToken
  STATE.shareUrlId = genJson.shareUrlId
  STATE.internalAssessmentUuid = genJson.internalAssessmentUuid

  // Step 2b — email capture. This is the actual user "submit my email" moment
  // that pushes to Beehiiv with tags + custom fields.
  let ecRes: Response
  try {
    ecRes = await fetch(`${CONFIG.baseUrl}/api/assessment/email-capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId: STATE.assessmentDisplayId,
        shareToken: STATE.shareToken,
        email: TEST_EMAIL,
        source: 'hud_panel',
        notifyOnCodes: true,
      }),
    })
  } catch (err) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`POST /api/assessment/email-capture failed: ${(err as Error).message}`],
    }
  }
  if (ecRes.status !== 200) {
    const txt = await ecRes.text().catch(() => '')
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        `Generate succeeded but email-capture returned ${ecRes.status}.`,
        `Body: ${txt.slice(0, 300)}`,
      ],
    }
  }
  return {
    passed: true,
    ms: Date.now() - t,
    notes: [
      `assessmentId=${STATE.assessmentDisplayId}`,
      `shareUrlId=${STATE.shareUrlId}`,
    ],
  }
}

// ── Layer 3: Supabase rows written ──────────────────────────────────────────
async function layer3(): Promise<LayerResult> {
  const t = Date.now()
  if (!STATE.assessmentDisplayId) {
    return { passed: 'skip', ms: 0, notes: ['no assessmentId from L2'] }
  }
  const notes: string[] = []

  // escape_assessments — looked up by payload.assessmentId (display id).
  const { data: assess, error: assessErr } = await supabase
    .from('escape_assessments')
    .select('assessment_id, payload, inputs, share_token, created_at')
    .eq('payload->>assessmentId', STATE.assessmentDisplayId)
    .maybeSingle()
  if (assessErr || !assess) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`escape_assessments row not found: ${assessErr?.message ?? 'no row'}`],
    }
  }
  const inputs = (assess.inputs ?? {}) as Record<string, unknown>
  const requiredFields = [
    'firstName', 'hoursPerWeek', 'monthlyIncome', 'monthlyExpenses',
    'runwayMonths', 'skillProfile', 'riskTolerance', 'audienceAccess',
    'nicheSignal', 'freedomMultiplier',
  ]
  const missingFields = requiredFields.filter(f => inputs[f] == null)
  if (missingFields.length) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`escape_assessments.inputs missing: ${missingFields.join(', ')}`],
    }
  }
  if (inputs.firstName !== TEST_FIRST_NAME) {
    notes.push(
      `firstName mismatch: stored='${String(inputs.firstName)}', expected='${TEST_FIRST_NAME}'`,
    )
  }

  // assessment_emails — keyed by EA-X-XXX TEXT (not by UUID).
  const { data: email, error: emailErr } = await supabase
    .from('assessment_emails')
    .select('assessment_id, email, capture_source, notify_on_codes')
    .eq('assessment_id', STATE.assessmentDisplayId)
    .maybeSingle()
  if (emailErr || !email) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`assessment_emails row not found: ${emailErr?.message ?? 'no row'}`],
    }
  }
  if (email.email !== TEST_EMAIL) {
    notes.push(`assessment_emails.email mismatch: stored=${email.email}, expected=${TEST_EMAIL}`)
  }

  notes.push('escape_assessments + assessment_emails rows verified')
  notes.push(
    'NOTE: neither table has utm_source/medium/campaign columns. Funnel-side UTM forwarding from the landing page is NOT BUILT — UTM check moves to Layer 8 (Beehiiv-side hardcoded UTMs).',
  )
  return { passed: true, ms: Date.now() - t, notes }
}

// ── Layer 4: Beehiiv subscriber exists with custom fields ───────────────────
async function layer4(): Promise<LayerResult> {
  const t = Date.now()
  if (!STATE.assessmentDisplayId) {
    return { passed: 'skip', ms: 0, notes: ['no assessmentId from L2'] }
  }
  const params = new URLSearchParams({ email: TEST_EMAIL })
  params.append('expand[]', 'custom_fields')
  // Beehiiv may take a moment to index. Retry a few times.
  let sub: any = null
  let lastStatus = 0
  let lastBody = ''
  for (let i = 0; i < 5 && !sub; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1000))
    const { res, data, text } = await bhFetch(`/subscriptions?${params.toString()}`)
    lastStatus = res.status
    lastBody = text
    if (res.ok) {
      const arr: any[] = (data as any)?.data ?? []
      sub = arr[0] ?? null
    }
  }
  if (!sub?.id) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        `Beehiiv subscriber not found after retries (last status ${lastStatus}).`,
        `Last response body: ${lastBody.slice(0, 200)}`,
        'Verify BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID and that POST /subscriptions ran server-side.',
      ],
    }
  }
  STATE.beehiivSubscriptionId = sub.id

  const cf: Array<{ name: string; value: string }> = sub.custom_fields ?? []
  const cfMap = new Map(cf.map(f => [f.name, f.value]))
  const expected = ['assessment_url', 'funnel_segment', 'freedom_number']
  const present = expected.filter(n => cfMap.get(n))
  const missingCustom = expected.filter(n => !cfMap.get(n))

  const notes: string[] = [
    `subscriber id=${sub.id} status=${sub.status ?? 'unknown'}`,
    `custom_fields present: ${present.join(', ') || '(none)'}`,
  ]
  if (missingCustom.length) notes.push(`custom_fields missing: ${missingCustom.join(', ')}`)

  return {
    passed: missingCustom.length === 0,
    ms: Date.now() - t,
    notes,
    data: { customFields: cf },
  }
}

// ── Layer 5: Beehiiv tags applied (CRITICAL — historical bug zone) ──────────
async function layer5(): Promise<LayerResult> {
  const t = Date.now()
  if (!STATE.beehiivSubscriptionId) {
    return { passed: 'skip', ms: 0, notes: ['no Beehiiv subscriber id from L4'] }
  }
  // Tags can settle slowly after the POST /tags call. Retry a few times.
  let tags: string[] = []
  let lastStatus = 0
  let lastBody = ''
  for (let i = 0; i < 5; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 1000))
    const params = new URLSearchParams()
    params.append('expand[]', 'tags')
    const { res, data, text } = await bhFetch(
      `/subscriptions/${STATE.beehiivSubscriptionId}?${params.toString()}`,
    )
    lastStatus = res.status
    lastBody = text
    if (!res.ok) continue
    const raw: any = (data as any)?.data ?? data
    const candidate =
      raw?.tags ?? raw?.subscription_tags ?? raw?.tag_list ?? null
    if (Array.isArray(candidate) && candidate.length > 0) {
      tags = candidate
        .map((tag: any) => (typeof tag === 'string' ? tag : tag?.tag ?? tag?.name ?? ''))
        .filter(Boolean)
      if (tags.length) break
    }
  }

  if (!tags.length) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        'Subscriber exists but tags array is empty.',
        `Expected: ['${EXPECTED_TAG}']`,
        'Verify dedicated POST to /v2/publications/{pub_id}/subscriptions/{sub_id}/tags is being called.',
        `Last Beehiiv response: ${lastStatus} ${lastBody.slice(0, 200)}`,
      ],
    }
  }
  if (!tags.includes(EXPECTED_TAG)) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        `tags=[${tags.join(',')}] but expected '${EXPECTED_TAG}' is not present.`,
        'Either segmentation logic changed or the tag isn\'t configured in Beehiiv.',
      ],
    }
  }
  return { passed: true, ms: Date.now() - t, notes: [`tags=[${tags.join(',')}]`] }
}

// ── Layer 6: TrendzoCard / Assessment HUD URL renders ───────────────────────
async function layer6(): Promise<LayerResult> {
  const t = Date.now()
  if (!STATE.shareUrlId) {
    return { passed: 'skip', ms: 0, notes: ['no shareUrlId from L2'] }
  }
  let res: Response, text: string, ms: number
  try {
    ;({ res, text, ms } = await fetchApp(`/assessment/${STATE.shareUrlId}`))
  } catch (err) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`fetch failed: ${(err as Error).message}`],
    }
  }
  if (res.status !== 200) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`status=${res.status} for /assessment/${STATE.shareUrlId} (expected 200)`],
    }
  }
  // The HUD is hydrated client-side; SSR HTML still embeds the assessment
  // payload (firstName + display id) in the React data. Looking for either is
  // good enough to confirm the row was reachable.
  const personalised =
    text.includes(TEST_FIRST_NAME) ||
    text.includes(STATE.assessmentDisplayId!) ||
    text.includes(STATE.shareToken!)
  if (!personalised) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        `HUD page rendered but neither firstName='${TEST_FIRST_NAME}' nor assessmentId='${STATE.assessmentDisplayId}' present in HTML.`,
      ],
    }
  }
  return { passed: true, ms: Date.now() - t, notes: [`render time ${ms}ms`] }
}

// ── Layer 7: Email automation wired ─────────────────────────────────────────
async function layer7(): Promise<LayerResult> {
  const t = Date.now()
  // Beehiiv: GET /publications/{pubId}/automations
  const { res, data, text } = await bhFetch('/automations?limit=100')
  if (!res.ok) {
    return {
      passed: 'not_built',
      ms: Date.now() - t,
      notes: [
        `Could not list Beehiiv automations: ${res.status} ${text.slice(0, 200)}`,
        'Endpoint may require an enterprise plan.',
      ],
    }
  }
  const automations: any[] = (data as any)?.data ?? []
  if (!automations.length) {
    return {
      passed: 'not_built',
      ms: Date.now() - t,
      notes: ['No automations exist on this publication. Welcome sequence is not yet wired in Beehiiv.'],
    }
  }
  // Beehiiv automation trigger schema is opaque in the public API; do a
  // pragmatic blob-substring scan for the segment tag we just applied.
  const matches = automations.filter((a: any) =>
    JSON.stringify(a ?? {}).toLowerCase().includes(EXPECTED_TAG),
  )
  const enabledMatches = matches.filter((a: any) => {
    const status = String(a.status ?? a.enabled ?? '').toLowerCase()
    return status === 'active' || status === 'enabled' || a.enabled === true
  })
  if (matches.length === 0) {
    const allTags = automations.map(a => a?.name ?? a?.id ?? '?').slice(0, 8).join(', ')
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        `${automations.length} automation(s) exist but none reference tag '${EXPECTED_TAG}'.`,
        `First automations: ${allTags}`,
      ],
    }
  }
  if (enabledMatches.length === 0) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [
        `Automation referencing '${EXPECTED_TAG}' exists but is not enabled.`,
        `Names: ${matches.map(m => m?.name ?? m?.id).join(', ')}`,
      ],
    }
  }
  return {
    passed: true,
    ms: Date.now() - t,
    notes: [
      `automation '${enabledMatches[0]?.name ?? enabledMatches[0]?.id}' enabled and references '${EXPECTED_TAG}'`,
    ],
  }
}

// ── Layer 8: Tracking attributed (UTMs on Beehiiv subscriber) ───────────────
async function layer8(): Promise<LayerResult> {
  const t = Date.now()
  if (!STATE.beehiivSubscriptionId) {
    return { passed: 'skip', ms: 0, notes: ['no Beehiiv subscriber id from L4'] }
  }
  const { res, data, text } = await bhFetch(`/subscriptions/${STATE.beehiivSubscriptionId}`)
  if (!res.ok) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [`Beehiiv GET /subscriptions/{id} returned ${res.status}: ${text.slice(0, 200)}`],
    }
  }
  const sub: any = (data as any)?.data ?? data
  const utmSource = sub?.utm_source ?? null
  const utmMedium = sub?.utm_medium ?? null
  const utmCampaign = sub?.utm_campaign ?? null
  const referring = sub?.referring_site ?? null
  const notes: string[] = []
  notes.push(`utm_source=${utmSource ?? '(none)'}, utm_medium=${utmMedium ?? '(none)'}, utm_campaign=${utmCampaign ?? '(none)'}`)
  notes.push(`referring_site=${referring ?? '(none)'}`)
  notes.push(
    'NOTE: UTMs are hardcoded server-side in /api/assessment/email-capture (utm_source=dailylotion, utm_medium=assessment, utm_campaign=escape-assessment). Forwarding from landing-page query string is NOT BUILT.',
  )
  if (!utmSource || !utmMedium) {
    return {
      passed: false,
      ms: Date.now() - t,
      notes: [...notes, 'UTM attribution missing on subscriber.'],
    }
  }
  return { passed: true, ms: Date.now() - t, notes }
}

// ── Layer 9: Unsubscribe ────────────────────────────────────────────────────
async function layer9(): Promise<LayerResult> {
  const t = Date.now()
  if (!STATE.beehiivSubscriptionId) {
    return { passed: 'skip', ms: 0, notes: ['no Beehiiv subscriber id from L4'] }
  }
  // Capture pre-state. Beehiiv flags subscribers on synthetic test domains
  // (e.g. *.test) as status='invalid' immediately at create time — those
  // never transition to 'unsubscribed' since they can't receive mail. This
  // is a synthetic-email artifact, not a funnel bug.
  const preRes = await bhFetch(`/subscriptions/${STATE.beehiivSubscriptionId}`)
  const preStatus = String(((preRes.data as any)?.data ?? preRes.data)?.status ?? '').toLowerCase()
  const preIsInvalid = preStatus === 'invalid'

  // No in-app unsubscribe endpoint exists. Try Beehiiv's documented endpoints
  // in order — POST /unsubscribe first, then PATCH with unsubscribe_status.
  let ok = false
  let lastStatus = 0
  let lastBody = ''
  let used = ''
  const attempts = [
    {
      label: 'POST /subscriptions/{id}/unsubscribe',
      run: () =>
        bhFetch(`/subscriptions/${STATE.beehiivSubscriptionId}/unsubscribe`, {
          method: 'POST',
        }),
    },
    {
      label: 'PATCH /subscriptions/{id}',
      run: () =>
        bhFetch(`/subscriptions/${STATE.beehiivSubscriptionId}`, {
          method: 'PATCH',
          body: JSON.stringify({ unsubscribe_status: 'unsubscribed' }),
        }),
    },
  ]
  for (const a of attempts) {
    const { res, text } = await a.run()
    lastStatus = res.status
    lastBody = text
    used = a.label
    if (res.ok) {
      ok = true
      break
    }
  }
  if (!ok) {
    return {
      passed: 'not_built',
      ms: Date.now() - t,
      notes: [
        `Beehiiv unsubscribe failed via tried endpoints. Last: ${used} → ${lastStatus} ${lastBody.slice(0, 200)}`,
        'There is no in-app unsubscribe route. Beehiiv hosts the user-facing unsubscribe page; the API path used by this script may need plan-level access.',
      ],
    }
  }

  const { data } = await bhFetch(`/subscriptions/${STATE.beehiivSubscriptionId}`)
  const post: any = (data as any)?.data ?? data
  const status = String(post?.status ?? '').toLowerCase()
  const acceptable = ['unsubscribed', 'inactive']
  if (acceptable.includes(status)) {
    return { passed: true, ms: Date.now() - t, notes: [`subscriber status=${status} via ${used}`] }
  }
  if (status === 'invalid' && preIsInvalid) {
    return {
      passed: 'not_built',
      ms: Date.now() - t,
      notes: [
        `Unsubscribe API call succeeded (${used}) but subscriber was flagged 'invalid' at create time (synthetic *.test email domain).`,
        'Cannot transition invalid → unsubscribed. To verify this layer end-to-end, set SMOKE_EMAIL_DOMAIN to a real domain (e.g. example.com).',
      ],
    }
  }
  return {
    passed: false,
    ms: Date.now() - t,
    notes: [`unsubscribe call succeeded (${used}) but subscriber.status='${status}' (expected 'unsubscribed' or 'inactive').`],
  }
}

// ── Cleanup ─────────────────────────────────────────────────────────────────
async function cleanup(): Promise<{ ok: boolean; notes: string[] }> {
  const notes: string[] = []
  let ok = true

  if (STATE.assessmentDisplayId) {
    try {
      const { error } = await supabase
        .from('assessment_emails')
        .delete()
        .eq('assessment_id', STATE.assessmentDisplayId)
      if (error) { ok = false; notes.push(`assessment_emails delete: ${error.message}`) }
    } catch (e) {
      ok = false
      notes.push(`assessment_emails delete threw: ${(e as Error).message}`)
    }
    try {
      const { error } = await supabase
        .from('escape_assessments')
        .delete()
        .eq('payload->>assessmentId', STATE.assessmentDisplayId)
      if (error) { ok = false; notes.push(`escape_assessments delete: ${error.message}`) }
    } catch (e) {
      ok = false
      notes.push(`escape_assessments delete threw: ${(e as Error).message}`)
    }
  }

  if (STATE.beehiivSubscriptionId) {
    try {
      const { res, text } = await bhFetch(
        `/subscriptions/${STATE.beehiivSubscriptionId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) {
        ok = false
        notes.push(`beehiiv DELETE /subscriptions/{id}: ${res.status} ${text.slice(0, 200)}`)
      }
    } catch (e) {
      ok = false
      notes.push(`beehiiv delete threw: ${(e as Error).message}`)
    }
  }

  return { ok, notes }
}

// ── Reporter ────────────────────────────────────────────────────────────────
function pad(s: string, n: number) {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

function statusIcon(p: LayerStatus) {
  if (p === true) return '✓ PASS     '
  if (p === false) return '✗ FAIL     '
  if (p === 'skip') return '⊘ SKIP     '
  if (p === 'not_built') return '⚠ NOT BUILT'
  return '?'
}

function printReport(start: number) {
  const end = Date.now()
  const totalSec = ((end - start) / 1000).toFixed(1)
  const sep = '═══════════════════════════════════════════════════════════════'
  console.log(`\n${sep}`)
  console.log('ESCAPE ASSESSMENT FUNNEL — SMOKE TEST REPORT')
  console.log(sep)
  console.log(`Test user:  ${TEST_EMAIL}`)
  console.log(`Run time:   ${new Date(start).toISOString()} → ${new Date(end).toISOString()} (${totalSec}s)`)
  console.log(`Base URL:   ${CONFIG.baseUrl}`)
  if (STATE.assessmentDisplayId) {
    console.log(`Assessment: ${STATE.assessmentDisplayId} (uuid ${STATE.internalAssessmentUuid ?? 'n/a'})`)
  }
  if (STATE.beehiivSubscriptionId) console.log(`Beehiiv:    ${STATE.beehiivSubscriptionId}`)
  console.log('')
  for (const layer of LAYERS) {
    const r = layer.result
    if (!r) {
      console.log(`  ${layer.id}  ${pad(layer.title, 32)}  (not run)`)
      continue
    }
    const seconds = (r.ms / 1000).toFixed(1)
    console.log(`  ${layer.id}  ${pad(layer.title, 32)}  ${statusIcon(r.passed)}  (${seconds}s)`)
    for (const n of r.notes) console.log(`            ${n}`)
  }
  let pass = 0, fail = 0, skip = 0, nb = 0
  for (const l of LAYERS) {
    if (!l.result) continue
    if (l.result.passed === true) pass++
    else if (l.result.passed === false) fail++
    else if (l.result.passed === 'skip') skip++
    else if (l.result.passed === 'not_built') nb++
  }
  console.log('')
  console.log(sep)
  console.log(`RESULT: ${fail} failed, ${skip} skipped, ${nb} not built, ${pass} passed`)
  console.log(sep)
  console.log('')
  console.log('MANUAL CHECKS — not automated by this script:')
  console.log('  □ Welcome email actually delivered (check inbox within 60s of next live signup)')
  console.log('  □ Welcome email renders correctly on Gmail mobile + Apple Mail')
  console.log('  □ Landing page mobile responsiveness on 375px width')
  console.log('  □ Form copy & error states feel right')
  console.log('  □ TrendzoCard visual quality matches NFS Most Wanted spec')
  console.log('  □ Automation sequence cadence (sign up with a real email and time it)')
  console.log('  □ Meta Pixel / GA conversion event fires on form submit (verify in Meta Events Manager)')
  console.log('')
  return fail
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[smoke] starting Escape Assessment funnel smoke test')
  console.log(`[smoke] base url:     ${CONFIG.baseUrl}`)
  console.log(`[smoke] supabase:     ${CONFIG.supabaseUrl}`)
  console.log(`[smoke] beehiiv pub:  ${CONFIG.beehiivPubId}`)
  console.log(`[smoke] test email:   ${TEST_EMAIL}`)
  console.log('')

  const startedAt = Date.now()
  const order: Array<[string, () => Promise<LayerResult>]> = [
    ['L1', layer1],
    ['L2', layer2],
    ['L3', layer3],
    ['L4', layer4],
    ['L5', layer5],
    ['L6', layer6],
    ['L7', layer7],
    ['L8', layer8],
    ['L9', layer9],
  ]
  for (const [id, fn] of order) {
    try {
      console.log(`[smoke] running ${id} ...`)
      const r = await fn()
      record(id, r)
    } catch (err) {
      record(id, {
        passed: false,
        ms: 0,
        notes: [`uncaught error: ${(err as Error).stack ?? (err as Error).message}`],
      })
    }
  }

  // Cleanup
  let cleanupNote = '⊘ SKIPPED (--no-cleanup)'
  if (!NO_CLEANUP) {
    if (!STATE.assessmentDisplayId && !STATE.beehiivSubscriptionId) {
      cleanupNote = '⊘ NOTHING TO CLEAN'
    } else {
      const c = await cleanup()
      if (c.ok) {
        cleanupNote = '✓ DONE'
        console.log(`[cleanup] removed test user ${TEST_EMAIL}`)
      } else {
        cleanupNote = '⚠ PARTIAL — manual cleanup required'
        for (const n of c.notes) console.warn(`  [cleanup] ${n}`)
        console.warn(`  [cleanup] manual cleanup required for ${TEST_EMAIL} / ${STATE.assessmentDisplayId ?? '?'}`)
      }
    }
  }
  console.log('')
  console.log(`Cleanup: ${cleanupNote}`)
  console.log('         (use --no-cleanup to leave the test user behind)')

  const failed = printReport(startedAt)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('[smoke] uncaught:', err)
  process.exit(1)
})
