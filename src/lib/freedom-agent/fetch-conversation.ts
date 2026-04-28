// Server-side fetcher (or creator) for a Freedom Agent conversation row.
// One row per assessment_id (EA-X-XXX). If the row does not exist yet, this
// helper inserts an empty one and returns it.

import { createClient } from '@supabase/supabase-js'
import type {
  FreedomAgentConversation,
  FreedomAgentMessage,
} from '@/types/freedom-agent'

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

interface DbRow {
  id: string
  assessment_id: string
  messages: unknown
  message_count: number
  created_at: string
  updated_at: string
}

function normalizeMessages(raw: unknown): FreedomAgentMessage[] {
  if (!Array.isArray(raw)) return []
  const out: FreedomAgentMessage[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue
    const o = m as Record<string, unknown>
    if ((o.role !== 'user' && o.role !== 'assistant') ||
        typeof o.content !== 'string' ||
        typeof o.timestamp !== 'string') {
      continue
    }
    out.push({
      role: o.role,
      content: o.content,
      timestamp: o.timestamp,
    })
  }
  return out
}

function rowToConversation(row: DbRow): FreedomAgentConversation {
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    messages: normalizeMessages(row.messages),
    messageCount: row.message_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchOrCreateConversation(
  assessmentId: string,
): Promise<FreedomAgentConversation> {
  const supabase = getServerSupabase()
  if (!supabase) throw new Error('Supabase not configured')

  const { data: existing, error: readErr } = await supabase
    .from('freedom_agent_conversations')
    .select('*')
    .eq('assessment_id', assessmentId)
    .maybeSingle()

  if (readErr) throw new Error(`fetch conversation read failed: ${readErr.message}`)
  if (existing) return rowToConversation(existing as DbRow)

  // Insert a fresh row. Race: if two requests arrive simultaneously, the UNIQUE
  // constraint on assessment_id rejects the second; we fall back to a re-read.
  const { data: created, error: insertErr } = await supabase
    .from('freedom_agent_conversations')
    .insert({ assessment_id: assessmentId, messages: [], message_count: 0 })
    .select('*')
    .single()

  if (!insertErr && created) return rowToConversation(created as DbRow)

  // Race fallback: re-read.
  const { data: refetched, error: refetchErr } = await supabase
    .from('freedom_agent_conversations')
    .select('*')
    .eq('assessment_id', assessmentId)
    .maybeSingle()
  if (refetchErr || !refetched) {
    throw new Error(`create conversation failed: ${insertErr?.message ?? 'unknown'}`)
  }
  return rowToConversation(refetched as DbRow)
}

export async function fetchConversation(
  assessmentId: string,
): Promise<FreedomAgentConversation | null> {
  const supabase = getServerSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('freedom_agent_conversations')
    .select('*')
    .eq('assessment_id', assessmentId)
    .maybeSingle()
  if (error || !data) return null
  return rowToConversation(data as DbRow)
}
