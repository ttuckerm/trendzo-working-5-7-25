// Appends one or more messages to a Freedom Agent conversation row, capping
// the stored history at the 20 most recent messages. Read-modify-write with
// no compression in v1.

import { createClient } from '@supabase/supabase-js'
import type { FreedomAgentMessage } from '@/types/freedom-agent'

const STORAGE_CAP = 20

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

function normalize(raw: unknown): FreedomAgentMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((m): m is FreedomAgentMessage => {
    if (!m || typeof m !== 'object') return false
    const o = m as Record<string, unknown>
    return (
      (o.role === 'user' || o.role === 'assistant') &&
      typeof o.content === 'string' &&
      typeof o.timestamp === 'string'
    )
  })
}

export async function appendMessages(
  assessmentId: string,
  newMessages: FreedomAgentMessage[],
): Promise<FreedomAgentMessage[]> {
  const supabase = getServerSupabase()
  if (!supabase) throw new Error('Supabase not configured')

  const { data: row, error: readErr } = await supabase
    .from('freedom_agent_conversations')
    .select('messages')
    .eq('assessment_id', assessmentId)
    .maybeSingle()

  if (readErr) throw new Error(`appendMessages read failed: ${readErr.message}`)

  const existing = normalize(row?.messages)
  const combined = [...existing, ...newMessages]
  const capped = combined.length > STORAGE_CAP
    ? combined.slice(combined.length - STORAGE_CAP)
    : combined

  const { error: writeErr } = await supabase
    .from('freedom_agent_conversations')
    .update({ messages: capped, message_count: capped.length })
    .eq('assessment_id', assessmentId)

  if (writeErr) throw new Error(`appendMessages write failed: ${writeErr.message}`)
  return capped
}
