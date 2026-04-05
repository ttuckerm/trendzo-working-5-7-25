import { getSupabaseClient } from '@/lib/supabase/client'

export interface StoredMessagePart {
  type: string
  text?: string
  data?: unknown
}

export interface StoredMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  parts: StoredMessagePart[]
  timestamp: string
}

export interface ConversationSession {
  id: string
  agency_id: string
  user_id: string
  messages: StoredMessage[]
  created_at: string
  updated_at: string
  title?: string
  is_active: boolean
}

/**
 * Save or update a conversation session.
 * Called after each message exchange.
 */
export async function saveConversation(
  sessionId: string,
  agencyId: string,
  userId: string,
  messages: StoredMessage[]
): Promise<void> {
  const supabase = getSupabaseClient()

  const firstUserMsg = messages.find(m =>
    m.role === 'user' &&
    m.content !== 'Good morning. Brief me on what needs my attention.'
  )
  const title = firstUserMsg
    ? firstUserMsg.content.slice(0, 80) + (firstUserMsg.content.length > 80 ? '...' : '')
    : 'New Session'

  const { error } = await supabase
    .from('agency_conversations')
    .upsert({
      id: sessionId,
      agency_id: agencyId,
      user_id: userId,
      messages: JSON.stringify(messages),
      title,
      updated_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'id' })

  if (error) {
    console.error('Failed to save conversation:', error)
  }
}

/**
 * Load the most recent active conversation for this user.
 * Returns null if no conversation exists or it's older than 24 hours.
 */
export async function loadActiveConversation(
  userId: string,
  agencyId: string
): Promise<ConversationSession | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('agency_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const updatedAt = new Date(data.updated_at)
  const hoursSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60)
  if (hoursSinceUpdate > 24) return null

  return {
    ...data,
    messages: typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages,
  }
}

/**
 * Load recent conversation summaries for context injection.
 */
export async function loadRecentSessionSummaries(
  userId: string,
  agencyId: string,
  excludeSessionId: string,
  limit: number = 5
): Promise<Array<{ title: string; updated_at: string; message_count: number }>> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('agency_conversations')
    .select('title, updated_at, messages')
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .neq('id', excludeSessionId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data.map(session => ({
    title: session.title || 'Untitled Session',
    updated_at: session.updated_at,
    message_count: typeof session.messages === 'string'
      ? JSON.parse(session.messages).length
      : (session.messages as unknown[]).length,
  }))
}

/**
 * Mark a session as inactive (user started a new conversation).
 */
export async function deactivateSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient()

  await supabase
    .from('agency_conversations')
    .update({ is_active: false })
    .eq('id', sessionId)
}

/**
 * Start a brand new session — deactivates current active session.
 */
export async function startNewSession(
  userId: string,
  agencyId: string
): Promise<string> {
  const supabase = getSupabaseClient()

  await supabase
    .from('agency_conversations')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('agency_id', agencyId)
    .eq('is_active', true)

  return crypto.randomUUID()
}
