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
  share_token: string   // unguessable URL token; required for access
  payload: AssessmentPayload
  sprint_progress: SprintProgressMap
  generated_at: string
}

// EA-X-XXX format (one digit 1-9, dash, three digits).
export const DISPLAY_ID_REGEX = /^EA-[1-9]-\d{3}$/

// 20 lowercase alphanumeric characters (matches the share_token generator).
export const SHARE_TOKEN_REGEX = /^[a-z0-9]{20}$/

// Combined share id for the URL: {EA-X-XXX}-{share_token}.
// e.g. EA-7-378-k7x9m2nq8pwer4t5y6u8.
export const SHARE_ID_REGEX = /^EA-[1-9]-\d{3}-[a-z0-9]{20}$/

// Build the user-facing /assessment/ url segment from a row.
export function buildAssessmentShareId(displayId: string, shareToken: string): string {
  return `${displayId}-${shareToken}`
}

// Parse the /assessment/[shareId] param into its two components. Returns null
// when the param doesn't conform to {EA-X-XXX}-{20 alnum} — caller should 404.
export function parseShareIdParam(
  raw: string | undefined | null,
): { displayId: string; shareToken: string } | null {
  if (!raw || typeof raw !== 'string') return null
  if (!SHARE_ID_REGEX.test(raw)) return null
  // Split on the LAST hyphen — the EA-X-XXX prefix already contains hyphens.
  const lastHyphen = raw.lastIndexOf('-')
  if (lastHyphen <= 0) return null
  const displayId = raw.slice(0, lastHyphen)
  const shareToken = raw.slice(lastHyphen + 1)
  if (!DISPLAY_ID_REGEX.test(displayId) || !SHARE_TOKEN_REGEX.test(shareToken)) {
    return null
  }
  return { displayId, shareToken }
}

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

// Lookup an assessment by its EA-X-XXX display id. Caller MUST also verify
// share_token before using this for any user-facing access; for paths that
// require token possession, prefer fetchAssessmentByShareId.
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
    .select('assessment_id, payload, sprint_progress, created_at, share_token')
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
  const shareToken = typeof data.share_token === 'string' ? data.share_token : ''

  return {
    assessment_id: data.assessment_id as string,
    display_id: payload.assessmentId,
    share_token: shareToken,
    payload,
    sprint_progress: sprintProgress,
    generated_at: data.created_at as string,
  }
}

// Lookup an assessment by display id AND verify share_token matches. Returns
// null on either mismatch — callers should treat null as 404 (don't leak which
// of the two halves was wrong).
export async function fetchAssessmentByShareId(
  displayId: string,
  shareToken: string,
): Promise<AssessmentRow | null> {
  if (!DISPLAY_ID_REGEX.test(displayId)) return null
  if (!SHARE_TOKEN_REGEX.test(shareToken)) return null
  const row = await fetchAssessment(displayId)
  if (!row) return null
  // Constant-time comparison to avoid timing oracles. Tokens are 20 chars so
  // the timing difference of a == is tiny in practice, but be safe.
  if (!constantTimeEquals(row.share_token, shareToken)) return null
  return row
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}
