import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAssessment, DISPLAY_ID_REGEX } from '@/lib/assessment/fetch-assessment'
import type {
  EmailCaptureRequest,
  EmailCaptureSource,
} from '@/types/email-capture'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_SOURCES: readonly EmailCaptureSource[] = ['hud_panel', 'agent_conversation']

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
  code: 'INVALID_EMAIL' | 'INVALID_ASSESSMENT' | 'SERVER_ERROR',
  error: string,
  status: number,
) {
  return NextResponse.json({ ok: false, error, code }, { status })
}

function validate(raw: unknown): EmailCaptureRequest | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.assessmentId !== 'string' || !DISPLAY_ID_REGEX.test(o.assessmentId)) return null
  if (typeof o.email !== 'string' || !EMAIL_REGEX.test(o.email.trim())) return null
  if (typeof o.source !== 'string' || !VALID_SOURCES.includes(o.source as EmailCaptureSource)) {
    return null
  }
  const notifyOnCodes =
    typeof o.notifyOnCodes === 'boolean' ? o.notifyOnCodes : true
  return {
    assessmentId: o.assessmentId,
    email: o.email.trim(),
    source: o.source as EmailCaptureSource,
    notifyOnCodes,
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
      'assessmentId (EA-X-XXX), valid email, and source required',
      400,
    )
  }

  const assessment = await fetchAssessment(body.assessmentId)
  if (!assessment) {
    return err('INVALID_ASSESSMENT', 'Assessment not found', 404)
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

  if (insertError) {
    // Unique-constraint violation = email already captured for this assessment.
    // Both flows treat this as success; return the existing row's source.
    if (insertError.code === '23505') {
      const { data: existing } = await supabase
        .from('assessment_emails')
        .select('capture_source')
        .eq('assessment_id', body.assessmentId)
        .maybeSingle()
      const existingSource =
        existing && typeof existing.capture_source === 'string'
          ? (existing.capture_source as EmailCaptureSource)
          : body.source
      return NextResponse.json({
        ok: true,
        captured: true,
        source: existingSource,
      })
    }
    console.error('[email-capture] insert failed', insertError)
    return err('SERVER_ERROR', 'Could not save your email just now.', 500)
  }

  return NextResponse.json({
    ok: true,
    captured: true,
    source: body.source,
  })
}
