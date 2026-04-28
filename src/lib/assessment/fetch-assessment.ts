// Server-side fetcher for a single escape_assessments row.
// Called from the /assessment/[assessmentId] server component.
//
// Lookup is by the EA-X-XXX display ID stored in payload.assessmentId.
// A unique partial index on payload->>'assessmentId' enforces uniqueness
// (see supabase/migrations/20260427010000_unique_payload_assessment_id.sql).

import { createClient } from '@supabase/supabase-js'
import {
  type AssessmentPayload,
} from '@/types/assessment'
import { describeAssessmentPayload } from '@/lib/assessment/validate-payload'

export interface SprintProgressEntry {
  completed: boolean
  completedAt: string | null
}

export type SprintProgressMap = Record<string, SprintProgressEntry>

export interface AssessmentRow {
  assessment_id: string // internal UUID PK (not exposed to URL)
  display_id: string    // EA-X-XXX format from payload.assessmentId
  payload: AssessmentPayload
  sprint_progress: SprintProgressMap
  generated_at: string
}

// EA-X-XXX format (one digit 1-9, dash, three digits).
export const DISPLAY_ID_REGEX = /^EA-[1-9]-\d{3}$/

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

export async function fetchAssessment(
  displayId: string,
): Promise<AssessmentRow | null> {
  if (!displayId || typeof displayId !== 'string') return null
  if (!DISPLAY_ID_REGEX.test(displayId)) return null

  const supabase = getServerSupabase()
  if (!supabase) {
    console.error('[fetchAssessment] supabase not configured')
    return null
  }

  // Lookup by payload->>'assessmentId' (the EA-X-XXX display ID).
  // The unique partial index makes this O(log n) and guarantees a single row.
  const { data, error } = await supabase
    .from('escape_assessments')
    .select('assessment_id, payload, sprint_progress, created_at')
    .eq('payload->>assessmentId', displayId)
    .maybeSingle()

  if (error) {
    console.error('[fetchAssessment] supabase error', error)
    return null
  }
  if (!data) return null

  const validation = describeAssessmentPayload(data.payload)
  if (!validation.ok) {
    console.error(
      '[fetchAssessment] payload failed validation, treating as not-found',
      { displayId, reasons: validation.reasons },
    )
    return null
  }

  const sprintProgress: SprintProgressMap = isSprintProgressMap(data.sprint_progress)
    ? (data.sprint_progress as SprintProgressMap)
    : {}

  const payload = data.payload as AssessmentPayload

  return {
    assessment_id: data.assessment_id as string,
    display_id: payload.assessmentId,
    payload,
    sprint_progress: sprintProgress,
    generated_at: data.created_at as string,
  }
}
