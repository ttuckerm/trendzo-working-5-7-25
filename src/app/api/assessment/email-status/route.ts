import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  DISPLAY_ID_REGEX,
  SHARE_TOKEN_REGEX,
  fetchAssessmentByShareId,
} from '@/lib/assessment/fetch-assessment'
import type { EmailCaptureSource } from '@/types/email-capture'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

export async function GET(request: Request) {
  const url = new URL(request.url)
  const assessmentId = url.searchParams.get('assessmentId')
  const shareToken = url.searchParams.get('shareToken')

  if (!assessmentId || !DISPLAY_ID_REGEX.test(assessmentId)) {
    return NextResponse.json(
      { error: 'Invalid assessmentId format' },
      { status: 400 },
    )
  }
  if (!shareToken || !SHARE_TOKEN_REGEX.test(shareToken)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Token-gated: confirm assessmentId+shareToken matches a stored row before
  // doing anything else. 403 on mismatch (don't leak which half was wrong).
  const assessment = await fetchAssessmentByShareId(assessmentId, shareToken)
  if (!assessment) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = getServerSupabase()
  if (!supabase) {
    console.error('[email-status] supabase not configured')
    return NextResponse.json({ hasCapture: false, source: null })
  }

  const { data, error } = await supabase
    .from('assessment_emails')
    .select('capture_source')
    .eq('assessment_id', assessmentId)
    .maybeSingle()

  if (error) {
    console.error('[email-status] supabase error', error)
    return NextResponse.json({ hasCapture: false, source: null })
  }

  if (!data) {
    return NextResponse.json({ hasCapture: false, source: null })
  }

  const source =
    typeof data.capture_source === 'string'
      ? (data.capture_source as EmailCaptureSource)
      : null

  return NextResponse.json({ hasCapture: true, source })
}
