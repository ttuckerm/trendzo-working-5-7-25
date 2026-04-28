'use client'

import { useEffect, useRef } from 'react'
import type { FreedomAgentMessage } from '@/types/freedom-agent'

interface Props {
  messages: FreedomAgentMessage[]
  isStreaming: boolean
  streamingContent: string
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(d)
  } catch {
    return ''
  }
}

export function AgentMessages({
  messages,
  isStreaming,
  streamingContent,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length, streamingContent, isStreaming])

  if (messages.length === 0 && !isStreaming) return null

  return (
    <div
      ref={scrollerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 16px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {messages.map((m, i) => (
        <Bubble key={i} message={m} />
      ))}
      {isStreaming && (
        <Bubble
          message={{
            role: 'assistant',
            content: streamingContent,
            timestamp: new Date().toISOString(),
          }}
          showCursor
          streaming
        />
      )}
    </div>
  )
}

function Bubble({
  message,
  showCursor,
  streaming,
}: {
  message: FreedomAgentMessage
  showCursor?: boolean
  streaming?: boolean
}) {
  const isUser = message.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '84%',
          padding: isUser ? '10px 14px' : '4px 0 4px 10px',
          background: isUser ? 'rgba(34, 34, 44, 0.55)' : 'transparent',
          backdropFilter: isUser ? 'blur(6px)' : 'none',
          WebkitBackdropFilter: isUser ? 'blur(6px)' : 'none',
          border: isUser ? '1px solid rgba(240, 74, 77, 0.22)' : 'none',
          borderLeft: streaming
            ? '2px solid #f04a4d'
            : isUser
            ? '1px solid rgba(240, 74, 77, 0.22)'
            : 'none',
          borderRadius: isUser ? 12 : 0,
          color: '#f4f4f6',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          textShadow: isUser ? 'none' : '0 0 1px rgba(240, 74, 77, 0.15)',
          boxShadow: isUser ? '0 0 8px rgba(240, 74, 77, 0.08)' : 'none',
          animation: streaming ? 'hudActiveLeftBorder 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
        }}
      >
        {message.content}
        {showCursor && <BlinkingCursor />}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 10,
          color: '#5b5b63',
          alignSelf: 'center',
        }}
      >
        {formatTime(message.timestamp)}
      </div>
    </div>
  )
}

function BlinkingCursor() {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          color: '#f04a4d',
          marginLeft: 2,
          animation: 'agentCursor 0.9s steps(2, start) infinite',
        }}
      >
        ▎
      </span>
      <style>{`
        @keyframes agentCursor {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </>
  )
}
