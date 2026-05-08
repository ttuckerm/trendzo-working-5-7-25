// GET endpoint for the Freedom Agent rail to load existing conversation history
// on first expand. Returns { messages: [] } if no row exists yet.
//
// Token-gated: assessmentId + shareToken must both match a stored row, else
// 403 (don't leak which half was wrong).

import { NextResponse } from 'next/server'
import { fetchConversation } from '@/lib/freedom-agent/fetch-conversation'
import {
  fetchAssessmentByShareId,
  DISPLAY_ID_REGEX,
  SHARE_TOKEN_REGEX,
} from '@/lib/assessment/fetch-assessment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const assessmentId = url.searchParams.get('assessmentId') ?? ''
  const shareToken = url.searchParams.get('shareToken') ?? ''
  if (!DISPLAY_ID_REGEX.test(assessmentId)) {
    return NextResponse.json(
      { ok: false, error: 'assessmentId must match EA-X-XXX', code: 'INVALID_INPUT' },
      { status: 400 },
    )
  }
  if (!SHARE_TOKEN_REGEX.test(shareToken)) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  const verified = await fetchAssessmentByShareId(assessmentId, shareToken)
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: 'Forbidden', code: 'FORBIDDEN' },
      { status: 403 },
    )
  }

  const conversation = await fetchConversation(assessmentId)
  return NextResponse.json({
    ok: true,
    messages: conversation?.messages ?? [],
  })
}
