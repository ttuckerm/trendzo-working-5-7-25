export type FreedomAgentMessageRole = 'user' | 'assistant'

export interface FreedomAgentMessage {
  role: FreedomAgentMessageRole
  content: string
  timestamp: string // ISO 8601
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
  message: string
}

export type FreedomAgentChatErrorCode =
  | 'ASSESSMENT_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'AI_FAILURE'
  | 'RATE_LIMIT'

export interface FreedomAgentChatErrorResponse {
  error: string
  code: FreedomAgentChatErrorCode
}
