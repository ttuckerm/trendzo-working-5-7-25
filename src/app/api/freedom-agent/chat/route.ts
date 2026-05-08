// Streams the Freedom Agent's response. POST only.
// Uses the existing Vercel AI SDK pattern (streamText + @ai-sdk/anthropic).

import { NextResponse } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createClient } from '@supabase/supabase-js'
import type { FreedomAgentChatRequest, FreedomAgentMessage } from '@/types/freedom-agent'
import { fetchAssessmentByShareId, SHARE_TOKEN_REGEX } from '@/lib/assessment/fetch-assessment'
import { fetchOrCreateConversation } from '@/lib/freedom-agent/fetch-conversation'
import { appendMessages } from '@/lib/freedom-agent/append-message'
import { buildFreedomAgentSystemPrompt } from '@/lib/freedom-agent/build-system-prompt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DISPLAY_ID_REGEX = /^EA-[1-9]-\d{3}$/
const MAX_MESSAGE_CHARS = 2000
const SEND_TO_LLM_CAP = 10

function err(code: string, error: string, status: number) {
  return NextResponse.json({ ok: false, error, code }, { status })
}

interface ValidatedBody {
  assessmentId: string
  shareToken: string
  message: string
}

function validate(raw: unknown): ValidatedBody | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.assessmentId !== 'string' || !DISPLAY_ID_REGEX.test(o.assessmentId)) return null
  if (typeof o.shareToken !== 'string' || !SHARE_TOKEN_REGEX.test(o.shareToken)) return null
  if (typeof o.message !== 'string') return null
  const trimmed = o.message.trim()
  if (!trimmed) return null
  if (trimmed.length > MAX_MESSAGE_CHARS) return null
  return { assessmentId: o.assessmentId, shareToken: o.shareToken, message: trimmed }
}

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return err('INVALID_INPUT', 'Invalid JSON body', 400)
  }

  const body = validate(raw)
  if (!body) {
    return err(
      'INVALID_INPUT',
      'assessmentId, shareToken, and non-empty message ≤ 2000 chars required',
      400,
    )
  }
  const { assessmentId, shareToken, message } = body

  // Token-gated: the assessment id alone is insufficient. Both must match a
  // stored row or we 403 — without revealing which half was wrong.
  const assessment = await fetchAssessmentByShareId(assessmentId, shareToken)
  if (!assessment) {
    return err('FORBIDDEN', 'Forbidden', 403)
  }

  // Server-side email gate. UI also blocks behind a non-dismissable overlay,
  // but never trust the UI: an attacker who knew the assessmentId could call
  // this endpoint directly. Refuse unless an assessment_emails row exists.
  const gateOk = await hasEmailCaptured(assessmentId)
  if (!gateOk) {
    return err(
      'EMAIL_GATE',
      'The Freedom Agent is locked until you provide an email on the assessment page.',
      403,
    )
  }

  let conversation
  try {
    conversation = await fetchOrCreateConversation(assessmentId)
  } catch (e) {
    console.error('[freedom-agent/chat] conversation fetch failed', e)
    return err(
      'AI_FAILURE',
      'The Freedom Agent is temporarily unavailable. Please try again in a moment.',
      503,
    )
  }

  const systemPrompt = buildFreedomAgentSystemPrompt(
    assessment.payload,
    assessment.sprint_progress,
  )

  // Cap LLM input at the last 10 stored messages plus the new user turn.
  const sentHistory = conversation.messages.slice(-SEND_TO_LLM_CAP)
  const llmMessages = [
    ...sentHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ]
  // Count user messages including this turn — exposed via response header so
  // the rail can decide when to trigger the conversational email ask.
  const userMessageCount =
    conversation.messages.filter((m) => m.role === 'user').length + 1
  console.log(
    `[freedom-agent/chat] assessmentId=${assessmentId} stored=${conversation.messages.length} sentToLlm=${llmMessages.length} userMessageCount=${userMessageCount}`,
  )

  const userMessage: FreedomAgentMessage = {
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  }

  let result: ReturnType<typeof streamText>
  try {
    result = streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      system: systemPrompt,
      messages: llmMessages,
      maxOutputTokens: 1024,
      onFinish: async ({ text }) => {
        try {
          const assistantMessage: FreedomAgentMessage = {
            role: 'assistant',
            content: text,
            timestamp: new Date().toISOString(),
          }
          await appendMessages(assessmentId, [userMessage, assistantMessage])
        } catch (persistErr) {
          console.error('[freedom-agent/chat] persist failed', persistErr)
        }
      },
      onError: ({ error }) => {
        console.error('[freedom-agent/chat] stream error', error)
      },
    })
  } catch (e) {
    console.error('[freedom-agent/chat] streamText init failed', e)
    return err(
      'AI_FAILURE',
      'The Freedom Agent is temporarily unavailable. Please try again in a moment.',
      503,
    )
  }

  // Peek the first chunk so an upstream auth/credit failure surfaces as a
  // friendly 503 JSON before we commit to a streamed Response. Once the first
  // token is in hand, we splice it back in and pipe the rest as a plain text
  // stream.
  const reader = result.textStream.getReader()
  let firstChunk: string
  try {
    const first = await reader.read()
    if (first.done) {
      // Empty stream usually means the model rejected the call (e.g. credits out).
      return err(
        'AI_FAILURE',
        'The Freedom Agent is temporarily unavailable. Please try again in a moment.',
        503,
      )
    }
    firstChunk = first.value
  } catch (e) {
    console.error('[freedom-agent/chat] first-chunk read failed', e)
    return err(
      'AI_FAILURE',
      'The Freedom Agent is temporarily unavailable. Please try again in a moment.',
      503,
    )
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(firstChunk))
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) controller.enqueue(encoder.encode(value))
        }
        controller.close()
      } catch (e) {
        console.error('[freedom-agent/chat] mid-stream read failed', e)
        try { controller.close() } catch { /* already closed */ }
      }
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-User-Message-Count': String(userMessageCount),
    },
  })
}

// True when an assessment_emails row exists for this assessment. Treats DB
// outages as failed gate (deny rather than allow) — the UI gate is the
// happy path and a brief Supabase blip still keeps the agent locked.
async function hasEmailCaptured(assessmentId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[freedom-agent/chat] supabase not configured for gate check')
    return false
  }
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } })
    const { data, error } = await supabase
      .from('assessment_emails')
      .select('assessment_id')
      .eq('assessment_id', assessmentId)
      .maybeSingle()
    if (error) {
      console.error('[freedom-agent/chat] gate query failed', error)
      return false
    }
    return Boolean(data)
  } catch (e) {
    console.error('[freedom-agent/chat] gate check threw', e)
    return false
  }
}
