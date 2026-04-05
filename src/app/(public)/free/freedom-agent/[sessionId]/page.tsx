'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface ProgressState {
  hasChosenNiche?: boolean
  hasStartedCreating?: boolean
  hasPostedContent?: boolean
  hasGottenFirstFollowers?: boolean
  hasEarnedFirstRevenue?: boolean
  totalMessages?: number
  currentMorale?: 'high' | 'medium' | 'low'
}

const MILESTONES = [
  { key: 'hasChosenNiche', label: 'Niche' },
  { key: 'hasStartedCreating', label: 'Creating' },
  { key: 'hasPostedContent', label: 'Posted' },
  { key: 'hasGottenFirstFollowers', label: 'Followers' },
  { key: 'hasEarnedFirstRevenue', label: 'Revenue' },
] as const

// ═══════════════════════════════════════════════════════════════
// SIMPLE MARKDOWN RENDERER
// ═══════════════════════════════════════════════════════════════

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  function flushList() {
    if (listItems.length > 0 && listType) {
      const Tag = listType
      elements.push(<Tag key={key++} className={listType === 'ul' ? 'list-disc pl-5 my-2 space-y-1' : 'list-decimal pl-5 my-2 space-y-1'}>{listItems}</Tag>)
      listItems = []
      listType = null
    }
  }

  function formatInline(line: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []
    // Match **bold**, *italic*, `code`
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index))
      }
      if (match[2]) {
        parts.push(<strong key={`b${match.index}`} className="font-bold text-white">{match[2]}</strong>)
      } else if (match[3]) {
        parts.push(<em key={`i${match.index}`} className="italic">{match[3]}</em>)
      } else if (match[4]) {
        parts.push(
          <code
            key={`c${match.index}`}
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.08)', fontFamily: "'JetBrains Mono', monospace" }}
          >
            {match[4]}
          </code>
        )
      }
      lastIndex = regex.lastIndex
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex))
    }
    return parts.length > 0 ? parts : [line]
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Unordered list
    if (/^[-*]\s+/.test(trimmed)) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(<li key={key++}>{formatInline(trimmed.replace(/^[-*]\s+/, ''))}</li>)
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(<li key={key++}>{formatInline(trimmed.replace(/^\d+\.\s+/, ''))}</li>)
      continue
    }

    flushList()

    // Empty line
    if (trimmed === '') {
      elements.push(<div key={key++} className="h-2" />)
      continue
    }

    // Regular paragraph
    elements.push(<p key={key++} className="my-1">{formatInline(trimmed)}</p>)
  }

  flushList()
  return elements
}

// ═══════════════════════════════════════════════════════════════
// CHAT PAGE
// ═══════════════════════════════════════════════════════════════

export default function FreedomAgentChat() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [messagesRemaining, setMessagesRemaining] = useState(5)
  const [progressState, setProgressState] = useState<ProgressState>({})
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  // Load session history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/freedom-agent/history?sessionId=${sessionId}`)
        if (!res.ok) {
          setLoadState('error')
          return
        }
        const data = await res.json()
        const history: Message[] = (data.conversationHistory || []).map((msg: { role: string; content: string }, i: number) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: undefined,
        }))
        setMessages(history)
        setCurrentWeek(data.currentWeek)
        setMessagesRemaining(data.messagesRemaining)
        setProgressState(data.progressState || {})
        setLoadState('ready')
      } catch {
        setLoadState('error')
      }
    }
    loadHistory()
  }, [sessionId])

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || messagesRemaining <= 0) return

    setInput('')
    setSending(true)

    // Optimistic user message
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/freedom-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      })

      if (res.status === 429) {
        const data = await res.json()
        setMessagesRemaining(0)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.error || "You've used your 5 messages for today. Come back tomorrow for more guidance.",
          timestamp: new Date().toISOString(),
        }])
        setSending(false)
        return
      }

      if (!res.ok) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        }])
        setSending(false)
        return
      }

      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      }])
      setMessagesRemaining(data.messagesRemaining)
      if (data.currentWeek) setCurrentWeek(data.currentWeek)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Network error. Please check your connection and try again.",
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function formatTime(ts?: string) {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // ── Loading state ──
  if (loadState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080d' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7c3aed', animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7c3aed', animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7c3aed', animationDelay: '300ms' }} />
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Loading session...</span>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080d' }}>
        <div className="text-center">
          <p className="text-sm text-white mb-3">Session not found</p>
          <Link
            href="/free/freedom-agent"
            className="text-xs font-medium no-underline px-4 py-2 rounded-lg"
            style={{ color: '#e63946', border: '1px solid rgba(230,57,70,0.3)' }}
          >
            Start a new session
          </Link>
        </div>
      </div>
    )
  }

  const limitReached = messagesRemaining <= 0

  return (
    <div className="flex flex-col" style={{ background: '#08080d', height: '100dvh' }}>
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid #1e1e2e' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/free/freedom-agent"
            className="no-underline"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </Link>
          <h1
            className="text-base font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Freedom Agent
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}
          >
            Week {currentWeek} of 8
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {messagesRemaining} left today
          </span>
        </div>
      </div>

      {/* ── Milestone dots ── */}
      {(progressState.totalMessages || 0) > 0 && (
        <div
          className="flex items-center justify-center gap-3 px-4 py-2 shrink-0"
          style={{ borderBottom: '1px solid rgba(30,30,46,0.5)' }}
        >
          {MILESTONES.map((m, i) => {
            const reached = !!progressState[m.key]
            // Show reached milestones + the next unreached one
            const isNext = !reached && (i === 0 || !!progressState[MILESTONES[i - 1].key])
            if (!reached && !isNext) return null
            return (
              <div key={m.key} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: reached ? '#2dd4a8' : 'transparent',
                    border: reached ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: reached ? '#2dd4a8' : 'rgba(255,255,255,0.25)',
                    fontSize: '10px',
                  }}
                >
                  {m.label}
                </span>
                {i < MILESTONES.length - 1 && (reached || isNext) && (
                  <div className="w-3 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollBehavior: 'smooth' }}>
        {/* Welcome message if no history */}
        {messages.length === 0 && (
          <div className="flex justify-center mb-6">
            <div
              className="rounded-2xl px-5 py-4 max-w-sm text-center"
              style={{ background: '#0f0f16', border: '1px solid #1e1e2e' }}
            >
              <p className="text-sm text-white font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                Hey, I&apos;m your Freedom Agent
              </p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Your personal AI business advisor. Tell me what you&apos;re working on and I&apos;ll help you take the next step.
              </p>
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm"
              style={{
                background: msg.role === 'user' ? '#e63946' : '#0f0f16',
                color: msg.role === 'user' ? '#ffffff' : 'rgba(255,255,255,0.85)',
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                border: msg.role === 'assistant' ? '1px solid #1e1e2e' : 'none',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: '1.5',
              }}
            >
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
              {msg.timestamp && (
                <div
                  className="text-right mt-1.5"
                  style={{
                    fontSize: '11px',
                    color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {formatTime(msg.timestamp)}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex justify-start mb-3">
            <div
              className="px-4 py-3 rounded-2xl text-xs"
              style={{
                background: '#0f0f16',
                border: '1px solid #1e1e2e',
                color: 'rgba(255,255,255,0.4)',
                borderRadius: '16px 16px 16px 4px',
              }}
            >
              <span className="flex items-center gap-1.5">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7c3aed', animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7c3aed', animationDelay: '200ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7c3aed', animationDelay: '400ms' }} />
                </span>
                Freedom Agent is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Rate limit banner ── */}
      {limitReached && (
        <div
          className="px-4 py-3 text-center text-xs shrink-0"
          style={{
            background: 'rgba(124,58,237,0.06)',
            borderTop: '1px solid rgba(124,58,237,0.15)',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          You&apos;ve used your 5 messages for today. Come back tomorrow for more guidance.
        </div>
      )}

      {/* ── Input bar ── */}
      <form
        onSubmit={handleSend}
        className="shrink-0 px-4 py-3 flex gap-2"
        style={{
          borderTop: '1px solid #1e1e2e',
          opacity: limitReached ? 0.4 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={limitReached ? 'Daily limit reached' : 'Ask your advisor anything...'}
          disabled={limitReached || sending}
          maxLength={2000}
          className="flex-1 min-w-0 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 disabled:cursor-not-allowed"
          style={{
            background: '#0f0f16',
            border: '1px solid #1e1e2e',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          type="submit"
          disabled={limitReached || sending || !input.trim()}
          className="rounded-xl px-5 py-3 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ background: '#e63946' }}
        >
          {sending ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          )}
        </button>
      </form>
    </div>
  )
}
