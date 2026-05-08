// The Escape Assessment generator route.
// Future user-facing route: /assessment/[assessmentId] (built in Cursor Prompt 2).
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  type AssessmentInput,
  type RiskTolerance,
} from '@/types/assessment'
import { generateAssessment, generateAssessmentId } from '@/lib/assessment/generate'
import { CODE_PATH_COOKIE_NAME, readCodePathCookieRedemptionId } from '@/lib/stripe/cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RISK_VALUES: ReadonlySet<RiskTolerance> = new Set(['Low', 'Medium', 'High'])

interface ValidatedInput { ok: true; input: AssessmentInput }
interface InvalidInput   { ok: false; error: string }

function extractSessionId(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const v = (raw as Record<string, unknown>).sessionId
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  // Stripe checkout session ids start with cs_ and are reasonable length.
  if (!/^cs_[A-Za-z0-9_]+$/.test(trimmed) || trimmed.length > 200) return null
  return trimmed
}

function validateInput(raw: unknown): ValidatedInput | InvalidInput {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'body not object' }
  const o = raw as Record<string, unknown>

  const firstName = typeof o.firstName === 'string' ? o.firstName.trim() : ''
  if (!firstName) return { ok: false, error: 'firstName required' }

  const numField = (k: keyof AssessmentInput) => typeof o[k] === 'number' && Number.isFinite(o[k] as number) ? (o[k] as number) : null
  const hoursPerWeek = numField('hoursPerWeek')
  const monthlyIncome = numField('monthlyIncome')
  const monthlyExpenses = numField('monthlyExpenses')
  const runwayMonths = numField('runwayMonths')
  const freedomMultiplier = numField('freedomMultiplier')

  if (hoursPerWeek == null || hoursPerWeek < 0) return { ok: false, error: 'hoursPerWeek invalid' }
  if (monthlyIncome == null || monthlyIncome < 0) return { ok: false, error: 'monthlyIncome invalid' }
  if (monthlyExpenses == null || monthlyExpenses <= 0) return { ok: false, error: 'monthlyExpenses must be > 0' }
  if (runwayMonths == null || runwayMonths < 0) return { ok: false, error: 'runwayMonths invalid' }
  if (freedomMultiplier == null || freedomMultiplier < 1 || freedomMultiplier > 3) {
    return { ok: false, error: 'freedomMultiplier must be between 1 and 3' }
  }

  const skillProfile = typeof o.skillProfile === 'string' ? o.skillProfile.trim() : ''
  if (!skillProfile) return { ok: false, error: 'skillProfile required' }

  const riskTolerance = o.riskTolerance
  if (typeof riskTolerance !== 'string' || !RISK_VALUES.has(riskTolerance as RiskTolerance)) {
    return { ok: false, error: 'riskTolerance must be Low|Medium|High' }
  }

  const audienceAccess = typeof o.audienceAccess === 'string' ? o.audienceAccess.trim() : ''
  if (audienceAccess.length < 3 || audienceAccess.length > 300) {
    return { ok: false, error: 'audienceAccess must be 3-300 chars' }
  }

  const nicheSignal = typeof o.nicheSignal === 'string' ? o.nicheSignal : ''

  return {
    ok: true,
    input: {
      firstName,
      hoursPerWeek,
      monthlyIncome,
      monthlyExpenses,
      runwayMonths,
      skillProfile,
      riskTolerance: riskTolerance as RiskTolerance,
      audienceAccess,
      nicheSignal,
      freedomMultiplier,
    },
  }
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const validated = validateInput(raw)
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 })
  }

  const sessionId = extractSessionId(raw)
  // Code-path linkage: the dl_code_path cookie (issued by /api/landing/code-validate)
  // carries the code_redemptions.id. We use it after the assessment is persisted
  // to link the redemption row back to the assessment — same atomic conditional
  // pattern as stripe_purchases.consumed_at.
  const codePathRedemptionId = readCodePathCookieRedemptionId(
    request.cookies.get(CODE_PATH_COOKIE_NAME)?.value,
  )

  const result = await generateAssessment(validated.input)
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error, reasons: result.reasons }, { status: result.status })
  }

  // Persist. Production schema (canonical migration 20260426120000):
  //   assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid()  -- internal PK, auto-assigned
  //   payload JSONB NOT NULL                                    -- contains payload.assessmentId (EA-X-XXX)
  //   inputs  JSONB NOT NULL
  // Cursor 1.9 Option 3: do NOT insert assessment_id manually. The DB auto-assigns
  // the UUID PK via gen_random_uuid(). The user-facing EA-X-XXX display ID lives
  // inside payload.assessmentId. The returned UUID is the internal handle for joins/reads.
  // Persist with retry on EA-X-XXX collision. The unique partial index on
  // payload->>'assessmentId' (migration 20260427010000) prevents duplicate
  // display IDs. On a 23505 unique-violation we regenerate the EA-X-XXX and
  // retry. The address space (8100 values) is small but adequate for v1.
  const supabase = getServiceSupabase()
  let internalAssessmentUuid: string | null = null
  let displayId: string = result.payload.assessmentId
  let shareToken: string | null = null
  if (supabase) {
    const MAX_ATTEMPTS = 8
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const { data, error: insertErr } = await supabase
        .from('escape_assessments')
        .insert({
          payload: result.payload,
          inputs: validated.input,
        })
        .select('assessment_id, share_token')
        .single()
      if (!insertErr) {
        if (data?.assessment_id) internalAssessmentUuid = data.assessment_id as string
        if (typeof data?.share_token === 'string') shareToken = data.share_token
        break
      }
      const isUnique = (insertErr as { code?: string }).code === '23505'
      if (!isUnique) {
        console.error('[assessment/generate] supabase insert failed', insertErr)
        break
      }
      // Collision on payload.assessmentId — regenerate and retry.
      const regenerated = generateAssessmentId()
      console.warn('[assessment/generate] EA-X-XXX collision, regenerating', {
        previous: result.payload.assessmentId,
        next: regenerated,
        attempt,
      })
      result.payload.assessmentId = regenerated
      displayId = regenerated
    }
  } else {
    console.warn('[assessment/generate] supabase not configured, skipping persistence')
  }

  // If the user came through the paid Stripe path, link the purchase to the
  // new assessment and mark it consumed. The page guard already verified the
  // session is paid; here we only enforce that the row is in the 'paid' state
  // and not already consumed by some other flow. Server-side and atomic.
  if (sessionId && supabase && internalAssessmentUuid) {
    const { error: linkErr, data: linked } = await supabase
      .from('stripe_purchases')
      .update({
        status: 'consumed',
        consumed_at: new Date().toISOString(),
        assessment_id: internalAssessmentUuid,
      })
      .eq('stripe_session_id', sessionId)
      .eq('status', 'paid')
      .select('id')
      .maybeSingle()
    if (linkErr) {
      console.error('[assessment/generate] purchase link failed', linkErr)
    } else if (!linked) {
      console.warn('[assessment/generate] purchase row not in paid state, skipped link', { sessionId })
    }
  }

  // Code-path linkage. The redemption row was inserted at code-validate time;
  // here we fill in assessment_id on the still-unfilled row. Conditional on
  // assessment_id IS NULL so a stale/replayed cookie can't relink someone else's
  // redemption to a new assessment.
  if (codePathRedemptionId && supabase && internalAssessmentUuid) {
    const { error: linkErr, data: linked } = await supabase
      .from('code_redemptions')
      .update({ assessment_id: internalAssessmentUuid })
      .eq('id', codePathRedemptionId)
      .is('assessment_id', null)
      .select('id')
      .maybeSingle()
    if (linkErr) {
      console.error('[assessment/generate] code redemption link failed', linkErr)
    } else if (!linked) {
      console.warn('[assessment/generate] redemption already linked or missing', { codePathRedemptionId })
    }
  }

  // shareUrlId is what the form should put in the URL: {EA-X-XXX}-{token}.
  // When supabase is unconfigured (dev only) we fall back to the bare display
  // id so the redirect still navigates somewhere — but production always has
  // supabase wired so shareToken will be set.
  const shareUrlId = shareToken ? `${displayId}-${shareToken}` : displayId

  return NextResponse.json({
    ok: true,
    assessment: result.payload,
    internalAssessmentUuid,
    // The form redirects to /assessment/{shareUrlId}. The URL is
    // {EA-X-XXX}-{share_token} so it can't be enumerated.
    assessmentId: displayId,
    shareToken,
    shareUrlId,
  })
}
