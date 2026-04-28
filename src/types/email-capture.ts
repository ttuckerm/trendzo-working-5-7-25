export type EmailCaptureSource = 'hud_panel' | 'agent_conversation'

export interface EmailCaptureRequest {
  assessmentId: string
  email: string
  source: EmailCaptureSource
  notifyOnCodes?: boolean
}

export interface EmailCaptureResponse {
  ok: true
  captured: true
  source: EmailCaptureSource
}

export interface EmailCaptureErrorResponse {
  ok: false
  error: string
  code: 'INVALID_EMAIL' | 'INVALID_ASSESSMENT' | 'ALREADY_CAPTURED' | 'SERVER_ERROR'
}

export interface EmailStatusResponse {
  hasCapture: boolean
  source: EmailCaptureSource | null
}
