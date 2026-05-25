import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  fetchAssessmentByShareId,
  DISPLAY_ID_REGEX,
  SHARE_TOKEN_REGEX,
} from '@/lib/assessment/fetch-assessment'
import type {
  EmailCaptureRequest,
  EmailCaptureSource,
} from '@/types/email-capture'
import { notifyBeehiiv } from '@/lib/beehiiv/notify'
import {
  classifyEscapeAssessment,
  type EscapeAssessmentInputsLite,
} from '@/lib/funnel/segment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_SOURCES: readonly EmailCaptureSource[] = ['hud_panel', 'agent_conversation', 'rail_gate']

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function err(
  code: 'INVALID_EMAIL' | 'INVALID_ASSESSMENT' | 'FORBIDDEN' | 'SERVER_ERROR',
  error: string,
  status: number,
) {
  return NextResponse.json({ ok: false, error, code }, { status })
}

interface ValidatedBody extends EmailCaptureRequest {
  shareToken: string
}

function validate(raw: unknown): ValidatedBody | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.assessmentId !== 'string' || !DISPLAY_ID_REGEX.test(o.assessmentId)) return null
  if (typeof o.shareToken !== 'string' || !SHARE_TOKEN_REGEX.test(o.shareToken)) return null
  if (typeof o.email !== 'string' || !EMAIL_REGEX.test(o.email.trim())) return null
  if (typeof o.source !== 'string' || !VALID_SOURCES.includes(o.source as EmailCaptureSource)) {
    return null
  }
  const notifyOnCodes =
    typeof o.notifyOnCodes === 'boolean' ? o.notifyOnCodes : true
  return {
    assessmentId: o.assessmentId,
    shareToken: o.shareToken,
    email: o.email.trim(),
    source: o.source as EmailCaptureSource,
    notifyOnCodes,
  }
}

// Look up the YouTube source attribution for a given assessment via the
// code_redemptions → redemption_codes join. Null when the user came in
// through the paid path (no redemption row).
async function lookupYoutubeSource(
  supabase: SupabaseClient,
  internalAssessmentUuid: string,
): Promise<string | null> {
  try {
    const { data: redemption, error: redemptionErr } = await supabase
      .from('code_redemptions')
      .select('code_id')
      .eq('assessment_id', internalAssessmentUuid)
      .maybeSingle()
    if (redemptionErr || !redemption?.code_id) return null
    const { data: code, error: codeErr } = await supabase
      .from('redemption_codes')
      .select('source')
      .eq('id', redemption.code_id as string)
      .maybeSingle()
    if (codeErr || !code) return null
    return typeof code.source === 'string' && code.source.length > 0 ? code.source : null
  } catch (e) {
    console.error('[email-capture] youtube_source lookup threw', e)
    return null
  }
}

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return err('INVALID_EMAIL', 'Invalid JSON body', 400)
  }

  const body = validate(raw)
  if (!body) {
    return err(
      'INVALID_EMAIL',
      'assessmentId (EA-X-XXX), shareToken, valid email, and source required',
      400,
    )
  }

  // Token-gated: assessmentId + shareToken must both match a stored row.
  // 403 (don't leak which half was wrong, don't differentiate from missing).
  const assessment = await fetchAssessmentByShareId(body.assessmentId, body.shareToken)
  if (!assessment) {
    return err('FORBIDDEN', 'Forbidden', 403)
  }

  const supabase = getServerSupabase()
  if (!supabase) {
    console.error('[email-capture] supabase not configured')
    return err('SERVER_ERROR', 'Server is temporarily unavailable.', 500)
  }

  const { error: insertError } = await supabase
    .from('assessment_emails')
    .insert({
      assessment_id: body.assessmentId,
      email: body.email,
      capture_source: body.source,
      notify_on_codes: body.notifyOnCodes ?? true,
    })

  let alreadyCaptured = false
  let existingSource: EmailCaptureSource = body.source
  if (insertError) {
    if (insertError.code === '23505') {
      alreadyCaptured = true
      const { data: existing } = await supabase
        .from('assessment_emails')
        .select('capture_source')
        .eq('assessment_id', body.assessmentId)
        .maybeSingle()
      if (existing && typeof existing.capture_source === 'string') {
        existingSource = existing.capture_source as EmailCaptureSource
      }
    } else {
      console.error('[email-capture] insert failed', insertError)
      return err('SERVER_ERROR', 'Could not save your email just now.', 500)
    }
  }

  // ── Beehiiv (best-effort, never blocks the user response) ──────────────
  // Push assessment_url, freedom_number, youtube_source, funnel_segment.
  try {
    const operatorInputs = assessment.payload.operator.inputs
    const lite: EscapeAssessmentInputsLite = {
      hoursPerWeek: operatorInputs.hoursPerWeek,
      monthlyIncome: operatorInputs.monthlyIncome,
      monthlyExpenses: operatorInputs.monthlyExpenses,
      runwayMonths: operatorInputs.runwayMonths,
      skillProfile: operatorInputs.skillProfile,
      riskTolerance: operatorInputs.riskTolerance,
      audienceAccess: operatorInputs.audienceAccess,
      nicheSignal: operatorInputs.nicheSignal,
    }
    const segment = classifyEscapeAssessment(lite)

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000'
    // Use the unguessable {EA-X-XXX}-{share_token} url segment so the link
    // pushed to Beehiiv (and into the welcome email) is the same long format
    // the user got after generating the assessment.
    const shareUrlId = `${assessment.display_id}-${assessment.share_token}`
    const assessmentUrl = `${siteUrl.replace(/\/+$/, '')}/assessment/${shareUrlId}`
    const freedomNumber = Math.round(assessment.payload.freedomNumber.monthlyTarget)
    const youtubeSource = await lookupYoutubeSource(supabase, assessment.assessment_id)

    console.log('[assessment/email-capture] beehiiv push', {
      email: body.email,
      assessmentId: assessment.display_id,
      segment,
      freedomNumber,
      youtubeSource,
    })

    const customFields = [
      { name: 'assessment_url', value: assessmentUrl },
      { name: 'funnel_segment', value: segment },
      { name: 'freedom_number', value: String(freedomNumber) },
      { name: 'youtube_source', value: youtubeSource ?? '' },
    ]

    await notifyBeehiiv({
      email: body.email,
      customFields,
      tags: [segment],
      reactivateExisting: true,
      sendWelcomeEmail: true,
      utmSource: 'dailylotion',
      utmMedium: 'assessment',
      utmCampaign: 'escape-assessment',
      referringSite: assessmentUrl,
      logScope: 'assessment/email-capture',
    })
  } catch (beehiivErr) {
    console.error('[assessment/email-capture] beehiiv side-effect threw', beehiivErr)
  }

  return NextResponse.json({
    ok: true,
    captured: true,
    source: alreadyCaptured ? existingSource : body.source,
  })
}
