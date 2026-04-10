'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { getQuickActions } from '@/lib/cards/quick-actions'

/* ═══════════════════════════════════════════════════════════
   Props
   ═══════════════════════════════════════════════════════════ */

export interface TrendzoCardProps {
  card: {
    id: string
    shareId: string
    creatorName: string
    creatorHandle: string | null
    creatorAvatarUrl: string | null
    creatorNiche: string
    vpsScore: number | null
    dpsScore: number | null
    followerCount: number | null
    trendDirection: 'up' | 'down' | 'stable' | null
    nicheRank: number | null
    agencyName: string
    agencyLogoUrl: string | null
    agentEnabled: boolean
  }
}

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}K`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function scoreColor(score: number): string {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#a37434'
  return '#ef4444'
}

function nicheLabel(niche: string): string {
  return niche.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/* ═══════════════════════════════════════════════════════════
   CSS (injected via <style>)
   ═══════════════════════════════════════════════════════════ */

const CARD_STYLES = `
  .tc-card {
    --gold: #a37434;
    --gold-dim: rgba(163, 116, 52, 0.35);
    --card-bg: #18181b;
    --hatch-bg: repeating-linear-gradient(
      135deg,
      #222221,
      #222221 10px,
      transparent 10px,
      transparent 20px
    );
    --ease-out: cubic-bezier(0.23, 1, 0.32, 1);

    position: relative;
    width: 100%;
    max-width: 375px;
    aspect-ratio: 9 / 16;
    background: var(--card-bg);
    outline: 5px solid #4b4b47;
    border: 1px solid black;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    font-family: 'DM Sans', var(--font-body, sans-serif);
  }

  /* ── Corner brackets ── */
  .tc-card::before, .tc-card::after,
  .tc-bracket-bl, .tc-bracket-br {
    content: '';
    position: absolute;
    width: 28px;
    height: 28px;
    border-color: var(--gold-dim);
    border-style: solid;
    z-index: 20;
    transition: border-color 0.4s var(--ease-out), width 0.4s var(--ease-out), height 0.4s var(--ease-out);
    pointer-events: none;
  }
  .tc-card::before { top: 8px; left: 8px; border-width: 3px 0 0 3px; }
  .tc-card::after  { top: 8px; right: 8px; border-width: 3px 3px 0 0; }
  .tc-bracket-bl   { bottom: 8px; left: 8px; border-width: 0 0 3px 3px; }
  .tc-bracket-br   { bottom: 8px; right: 8px; border-width: 0 3px 3px 0; }

  .tc-card:hover::before, .tc-card:hover::after,
  .tc-card:hover .tc-bracket-bl, .tc-card:hover .tc-bracket-br {
    border-color: var(--gold);
    width: 36px;
    height: 36px;
  }

  /* ── Hatch header/footer ── */
  .tc-hatch {
    background: var(--hatch-bg);
    position: relative;
    z-index: 10;
  }
  .tc-hatch::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(24,24,27,0.55);
  }
  .tc-hatch-content { position: relative; z-index: 1; }

  /* ── Page flash animation ── */
  @keyframes tc-flash {
    0%   { opacity: 0; }
    30%  { opacity: 0.12; }
    100% { opacity: 0; }
  }
  .tc-flash {
    animation: tc-flash 0.45s var(--ease-out) forwards;
  }

  /* ── VPS ring ── */
  @keyframes tc-ring-fill {
    from { stroke-dashoffset: 339.292; }
  }
  .tc-ring-track {
    fill: none;
    stroke: rgba(255,255,255,0.06);
    stroke-width: 8;
  }
  .tc-ring-value {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 339.292;
    transform: rotate(-90deg);
    transform-origin: center;
    animation: tc-ring-fill 1.4s var(--ease-out) forwards;
  }

  /* ── Orb pulse ── */
  @keyframes tc-orb-pulse {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50%      { transform: scale(1.08); opacity: 1; }
  }
  .tc-orb {
    animation: tc-orb-pulse 3s ease-in-out infinite;
  }

  /* ── Nav button ── */
  .tc-nav-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 14px 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.25s, background 0.25s;
    position: relative;
    min-height: 48px;
  }
  .tc-nav-btn.active {
    color: #fff;
  }
  .tc-nav-btn.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 20%;
    right: 20%;
    height: 2px;
    background: var(--gold);
  }

  /* ── Chat ── */
  .tc-chat-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tc-chat-scroll::-webkit-scrollbar { width: 3px; }
  .tc-chat-scroll::-webkit-scrollbar-track { background: transparent; }
  .tc-chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  .tc-msg {
    max-width: 85%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
  }
  .tc-msg-user {
    align-self: flex-end;
    background: var(--gold);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  .tc-msg-ai {
    align-self: flex-start;
    background: #27272a;
    color: rgba(255,255,255,0.85);
    border-bottom-left-radius: 4px;
  }

  .tc-quick-btn {
    padding: 8px 14px;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    white-space: nowrap;
    min-height: 36px;
  }
  .tc-quick-btn:hover {
    border-color: var(--gold);
    color: #fff;
  }

  .tc-input-wrap {
    display: flex;
    gap: 8px;
    padding: 10px 14px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .tc-input {
    flex: 1;
    background: #27272a;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 10px 16px;
    color: #fff;
    font-size: 13px;
    outline: none;
    min-height: 40px;
  }
  .tc-input::placeholder { color: rgba(255,255,255,0.25); }
  .tc-input:focus { border-color: var(--gold); }
  .tc-send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gold);
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .tc-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Lead CTA ── */
  .tc-lead-input {
    background: transparent;
    border: 1px solid var(--gold);
    border-radius: 6px;
    padding: 6px 10px;
    color: #fff;
    font-size: 11px;
    outline: none;
    width: 140px;
  }
  .tc-lead-input::placeholder { color: rgba(255,255,255,0.3); }
  .tc-lead-submit {
    background: var(--gold);
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    min-height: 30px;
  }
`

/* ═══════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════ */

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function TrendzoCard({ card }: TrendzoCardProps) {
  const [page, setPage] = useState<'score' | 'agent'>('score')
  const [flashKey, setFlashKey] = useState(0)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [msgsRemaining, setMsgsRemaining] = useState(10)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Lead state
  const [leadMode, setLeadMode] = useState<'cta' | 'form' | 'done'>('cta')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadLoading, setLeadLoading] = useState(false)

  const quickActions = getQuickActions(card.creatorNiche)

  const switchPage = useCallback((to: 'score' | 'agent') => {
    if (to === page) return
    setFlashKey(k => k + 1)
    setPage(to)
  }, [page])

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return
    const userMsg = text.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setSending(true)

    try {
      const res = await fetch(`/api/cards/${card.shareId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: userMsg }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: data.error || 'Something went wrong.' },
        ])
        return
      }
      if (data.sessionId) setSessionId(data.sessionId)
      if (data.messagesRemaining != null) setMsgsRemaining(data.messagesRemaining)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please try again.' },
      ])
    } finally {
      setSending(false)
    }
  }

  async function submitLead() {
    if (!leadEmail.trim() || leadLoading) return
    setLeadLoading(true)
    try {
      await fetch(`/api/cards/${card.shareId}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: leadEmail.trim() }),
      })
      setLeadMode('done')
    } catch {
      // silently fail — don't block UX
    } finally {
      setLeadLoading(false)
    }
  }

  const vps = card.vpsScore != null ? Math.round(card.vpsScore) : null
  const ringOffset = vps != null ? 339.292 - (339.292 * Math.min(vps, 100)) / 100 : 339.292

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CARD_STYLES }} />

      <div className="tc-card">
        {/* Corner brackets (bottom pair need real elements) */}
        <div className="tc-bracket-bl" />
        <div className="tc-bracket-br" />

        {/* ── Flash overlay ── */}
        <div
          key={flashKey}
          className={flashKey > 0 ? 'tc-flash' : ''}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#888',
            pointerEvents: 'none',
            zIndex: 30,
            opacity: 0,
          }}
        />

        {/* ══════════════ HEADER ══════════════ */}
        <div className="tc-hatch" style={{ padding: '10px 16px' }}>
          <div className="tc-hatch-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              Trendzo
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
              {nicheLabel(card.creatorNiche)}
            </span>
          </div>
        </div>

        {/* ══════════════ CONTENT ══════════════ */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              width: '200%',
              height: '100%',
              transform: page === 'score' ? 'translateX(0)' : 'translateX(-50%)',
              transition: `transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)`,
            }}
          >
            {/* ── PAGE 1: SCORE ── */}
            <div style={{ width: '50%', height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', gap: 16 }}>
              {/* Avatar */}
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: card.creatorAvatarUrl
                  ? `url(${card.creatorAvatarUrl}) center/cover`
                  : 'linear-gradient(135deg, #a37434, #d4a853)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.08)',
              }}>
                {!card.creatorAvatarUrl && card.creatorName.charAt(0)}
              </div>

              {/* Name + handle */}
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                  {card.creatorName}
                </h2>
                {card.creatorHandle && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    {card.creatorHandle}
                  </p>
                )}
              </div>

              {/* Niche badge */}
              <span style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                background: 'rgba(163,116,52,0.12)',
                color: '#a37434',
              }}>
                {nicheLabel(card.creatorNiche)}
              </span>

              {/* VPS Ring */}
              {vps != null && (
                <div style={{ position: 'relative', width: 140, height: 140 }}>
                  <svg viewBox="0 0 120 120" width="140" height="140">
                    <circle className="tc-ring-track" cx="60" cy="60" r="54" />
                    <circle
                      className="tc-ring-value"
                      cx="60"
                      cy="60"
                      r="54"
                      stroke={scoreColor(vps)}
                      style={{ strokeDashoffset: ringOffset }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
                      {vps}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
                      VPS
                    </span>
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                {card.followerCount != null && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>
                      {formatFollowers(card.followerCount)}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Followers</p>
                  </div>
                )}
                {card.trendDirection && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{
                      fontSize: 16,
                      fontWeight: 800,
                      margin: 0,
                      color: card.trendDirection === 'up' ? '#10b981' : card.trendDirection === 'down' ? '#ef4444' : 'rgba(255,255,255,0.5)',
                    }}>
                      {card.trendDirection === 'up' ? '▲' : card.trendDirection === 'down' ? '▼' : '—'}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Trend</p>
                  </div>
                )}
                {card.nicheRank != null && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>#{card.nicheRank}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Rank</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── PAGE 2: AGENT ── */}
            <div style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Orb + title */}
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 8px' }}>
                  <div className="tc-orb" style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #d4a853, #a37434 60%, #6b4a1f)',
                    boxShadow: '0 0 24px rgba(163,116,52,0.3)',
                    marginBottom: 10,
                  }} />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                    {nicheLabel(card.creatorNiche)} Assistant
                  </h3>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4, textAlign: 'center' }}>
                    Ask anything about {nicheLabel(card.creatorNiche).toLowerCase()} content strategy
                  </p>
                </div>
              )}

              {/* Chat messages */}
              <div className="tc-chat-scroll" ref={chatScrollRef} style={messages.length === 0 ? { flex: 0 } : undefined}>
                {messages.map((msg, i) => (
                  <div key={i} className={`tc-msg ${msg.role === 'user' ? 'tc-msg-user' : 'tc-msg-ai'}`}>
                    {msg.content}
                  </div>
                ))}
                {sending && (
                  <div className="tc-msg tc-msg-ai" style={{ opacity: 0.5 }}>
                    Thinking...
                  </div>
                )}
              </div>

              {/* Quick actions (only when no messages) */}
              {messages.length === 0 && (
                <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {quickActions.map((q, i) => (
                    <button
                      key={i}
                      className="tc-quick-btn"
                      onClick={() => sendMessage(q)}
                      disabled={sending}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Remaining messages indicator */}
              {messages.length > 0 && msgsRemaining <= 3 && msgsRemaining > 0 && (
                <div style={{ textAlign: 'center', padding: '4px 0' }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                    {msgsRemaining} message{msgsRemaining !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              )}

              {/* Input bar */}
              <div style={{ marginTop: 'auto' }}>
                <div className="tc-input-wrap">
                  <input
                    className="tc-input"
                    placeholder={msgsRemaining <= 0 ? 'Limit reached' : 'Ask a question...'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                    disabled={sending || msgsRemaining <= 0}
                  />
                  <button
                    className="tc-send-btn"
                    onClick={() => sendMessage(input)}
                    disabled={sending || !input.trim() || msgsRemaining <= 0}
                    aria-label="Send message"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════ FOOTER ══════════════ */}
        <div className="tc-hatch" style={{ padding: '8px 16px' }}>
          <div className="tc-hatch-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 28 }}>
            {leadMode === 'cta' && (
              <>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  Managed by {card.agencyName}
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)' }}>·</span>
                <button
                  onClick={() => setLeadMode('form')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#a37434',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Get your free score
                </button>
              </>
            )}
            {leadMode === 'form' && (
              <form
                onSubmit={e => { e.preventDefault(); submitLead() }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <input
                  className="tc-lead-input"
                  type="email"
                  placeholder="you@email.com"
                  value={leadEmail}
                  onChange={e => setLeadEmail(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  className="tc-lead-submit"
                  type="submit"
                  disabled={leadLoading}
                >
                  {leadLoading ? '...' : 'Go'}
                </button>
              </form>
            )}
            {leadMode === 'done' && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981' }}>
                Check your inbox!
              </span>
            )}
          </div>
        </div>

        {/* ══════════════ NAV ══════════════ */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#111113' }}>
          <button
            className={`tc-nav-btn ${page === 'score' ? 'active' : ''}`}
            onClick={() => switchPage('score')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
            Score
          </button>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <button
            className={`tc-nav-btn ${page === 'agent' ? 'active' : ''}`}
            onClick={() => switchPage('agent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Agent
          </button>
        </div>
      </div>
    </>
  )
}
