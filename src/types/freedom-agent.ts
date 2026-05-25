export type FreedomAgentMessageRole = 'user' | 'assistant'

export interface FreedomAgentMessage {
  role: FreedomAgentMessageRole
  content: string
  timestamp: string // ISO 8601
  // Local-only marker: true when the bubble was inserted client-side as a
  // chip-preview (pre-unlock teaser) and never sent to or stored on the
  // server. Real conversation history never has this flag.
  preview?: boolean
}

export interface FreedomAgentConversation {
  id: string
  assessmentId: string
  messages: FreedomAgentMessage[]
  messageCount: number
  createdAt: string
  updatedAt: string
}

export interface FreedomAgentChatRequest {
  assessmentId: string
  shareToken: string
  message: string
}

export type FreedomAgentChatErrorCode =
  | 'ASSESSMENT_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'AI_FAILURE'
  | 'RATE_LIMIT'
  | 'FORBIDDEN'

export interface FreedomAgentChatErrorResponse {
  error: string
  code: FreedomAgentChatErrorCode
}
