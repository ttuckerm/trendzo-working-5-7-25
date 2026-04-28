// GET endpoint for the Freedom Agent rail to load existing conversation history
// on first expand. Returns { messages: [] } if no row exists yet.

import { NextResponse } from 'next/server'
import { fetchConversation } from '@/lib/freedom-agent/fetch-conversation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DISPLAY_ID_REGEX = /^EA-[1-9]-\d{3}$/

export async function GET(request: Request) {
  const url = new URL(request.url)
  const assessmentId = url.searchParams.get('assessmentId') ?? ''
  if (!DISPLAY_ID_REGEX.test(assessmentId)) {
    return NextResponse.json(
      { ok: false, error: 'assessmentId must match EA-X-XXX', code: 'INVALID_INPUT' },
      { status: 400 },
    )
  }

  const conversation = await fetchConversation(assessmentId)
  return NextResponse.json({
    ok: true,
    messages: conversation?.messages ?? [],
  })
}
