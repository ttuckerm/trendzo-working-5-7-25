// Toggles a single sprint day's completed flag on an escape_assessments row.
// Body: { assessmentId: string (EA-X-XXX display ID), dayNumber: number (1-14), completed: boolean }
// Response: { ok: true, sprint_progress: SprintProgressMap } | { ok: false, error: string }
//
// Lookup is by payload->>'assessmentId' (EA-X-XXX display ID); a unique partial
// index enforces uniqueness on that key.
//
// RLS: anon role has UPDATE on escape_assessments per the Cursor Prompt 2 migration.
// Anyone with the displayId can update sprint progress in v1; auth deferred to Prompt 4+.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchAssessmentByShareId, SHARE_TOKEN_REGEX } from '@/lib/assessment/fetch-assessment'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DISPLAY_ID_REGEX = /^EA-[1-9]-\d{3}$/

interface SprintProgressEntry {
  completed: boolean
  completedAt: string | null
}
type SprintProgressMap = Record<string, SprintProgressEntry>

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

function isSprintProgressMap(v: unknown): v is SprintProgressMap {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false
  for (const entry of Object.values(v as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') return false
    const e = entry as Record<string, unknown>
    if (typeof e.completed !== 'boolean') return false
    if (e.completedAt !== null && typeof e.completedAt !== 'string') return false
  }
  return true
}

interface Body {
  assessmentId: string // EA-X-XXX display ID
  shareToken: string
  dayNumber: number
  completed: boolean
}

function validateBody(raw: unknown): { ok: true; body: Body } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'body not object' }
  const o = raw as Record<string, unknown>
  if (typeof o.assessmentId !== 'string' || !DISPLAY_ID_REGEX.test(o.assessmentId)) {
    return { ok: false, error: 'assessmentId must match EA-X-XXX format' }
  }
  if (typeof o.shareToken !== 'string' || !SHARE_TOKEN_REGEX.test(o.shareToken)) {
    return { ok: false, error: 'shareToken required' }
  }
  if (
    typeof o.dayNumber !== 'number' ||
    !Number.isInteger(o.dayNumber) ||
    o.dayNumber < 1 ||
    o.dayNumber > 14
  ) {
    return { ok: false, error: 'dayNumber must be an integer between 1 and 14' }
  }
  if (typeof o.completed !== 'boolean') {
    return { ok: false, error: 'completed must be boolean' }
  }
  return {
    ok: true,
    body: {
      assessmentId: o.assessmentId,
      shareToken: o.shareToken,
      dayNumber: o.dayNumber,
      completed: o.completed,
    },
  }
}

export async function POST(request: Request) {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const validated = validateBody(raw)
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 })
  }
  const { assessmentId: displayId, shareToken, dayNumber, completed } = validated.body

  // Token-gated: 403 unless assessmentId + shareToken match a stored row.
  const verified = await fetchAssessmentByShareId(displayId, shareToken)
  if (!verified) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const supabase = getServerSupabase()
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: 'Supabase not configured' },
      { status: 500 },
    )
  }

  // Read existing sprint_progress + the internal UUID, merge, write back by UUID.
  const { data: row, error: readErr } = await supabase
    .from('escape_assessments')
    .select('assessment_id, sprint_progress')
    .eq('payload->>assessmentId', displayId)
    .maybeSingle()

  if (readErr) {
    console.error('[sprint-progress] read failed', readErr)
    return NextResponse.json({ ok: false, error: 'Read failed' }, { status: 500 })
  }
  if (!row) {
    return NextResponse.json({ ok: false, error: 'Assessment not found' }, { status: 404 })
  }

  const existing: SprintProgressMap = isSprintProgressMap(row.sprint_progress)
    ? (row.sprint_progress as SprintProgressMap)
    : {}

  const next: SprintProgressMap = {
    ...existing,
    [String(dayNumber)]: {
      completed,
      completedAt: completed ? new Date().toISOString() : null,
    },
  }

  const { data: updated, error: writeErr } = await supabase
    .from('escape_assessments')
    .update({ sprint_progress: next })
    .eq('assessment_id', row.assessment_id)
    .select('sprint_progress')
    .maybeSingle()

  if (writeErr) {
    console.error('[sprint-progress] write failed', writeErr)
    return NextResponse.json({ ok: false, error: 'Write failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    sprint_progress: (updated?.sprint_progress as SprintProgressMap | null) ?? next,
  })
}
