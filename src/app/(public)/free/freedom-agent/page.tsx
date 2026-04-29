'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function FreedomAgentEntry() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get('planId')
  const prefilledEmail = searchParams.get('email') ?? ''

  const [email, setEmail] = useState(prefilledEmail)
  const [status, setStatus] = useState<'idle' | 'loading' | 'returning' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const autoSubmittedRef = useRef(false)

  const startSession = useCallback(async (rawEmail: string) => {
    const cleaned = rawEmail.trim()
    if (!cleaned) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/freedom-agent/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleaned, planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong')
        setStatus('error')
        return
      }

      if (data.isReturning) {
        setStatus('returning')
        setTimeout(() => {
          router.push(`/free/freedom-agent/${data.sessionId}`)
        }, 1200)
      } else {
        router.push(`/free/freedom-agent/${data.sessionId}`)
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }, [planId, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await startSession(email)
  }

  // Auto-start when landing with ?email= — skip straight to chat
  useEffect(() => {
    if (autoSubmittedRef.current) return
    const clean = prefilledEmail.trim()
    if (!clean) return
    // Basic email sanity check — fall through to manual entry if malformed
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return
    autoSubmittedRef.current = true
    startSession(clean)
  }, [prefilledEmail, startSession])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ background: '#08080d' }}>
      <div className="w-full" style={{ maxWidth: 480 }}>
        {/* Back link */}
        <Link
          href="/free"
          className="inline-flex items-center gap-1.5 text-xs font-medium no-underline mb-8"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back to Hub
        </Link>

        {/* Hero */}
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Your AI Business Advisor
        </h1>
        <p
          className="text-base mb-6"
          style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.6' }}
        >
          Solo founders fail because they&apos;re alone with their decisions. You don&apos;t have to be.
        </p>

        {/* Plan loaded badge */}
        {planId && (
          <div
            className="rounded-xl px-4 py-3 mb-5 flex items-center gap-2"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span className="text-xs font-medium" style={{ color: '#7c3aed' }}>
              Your Freedom OS plan is loaded — your advisor already knows your situation.
            </span>
          </div>
        )}

        {/* Returning user message */}
        {status === 'returning' && (
          <div
            className="rounded-xl p-4 mb-5 text-center"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <span className="text-sm font-bold" style={{ color: '#10b981' }}>
              Welcome back! Resuming your session...
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
            placeholder="you@example.com"
            required
            className="w-full rounded-xl px-4 py-4 text-base text-white outline-none focus:ring-1"
            style={{
              background: '#0f0f16',
              border: '1px solid #1e1e2e',
              fontFamily: "'DM Sans', sans-serif",
              minHeight: 48,
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading' || status === 'returning'}
            className="w-full rounded-xl px-4 py-4 text-base font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: status === 'loading' ? '#a82834' : '#e63946',
              fontFamily: "'DM Sans', sans-serif",
              minHeight: 48,
            }}
          >
            {status === 'loading' ? 'Starting...' : status === 'returning' ? 'Resuming...' : 'Start Session'}
          </button>
        </form>

        {/* Error */}
        {status === 'error' && (
          <p className="text-xs mt-3" style={{ color: '#ef4444' }}>{errorMsg}</p>
        )}

        {/* Sub-CTA info */}
        <p
          className="text-sm mt-6 text-center"
          style={{ color: 'rgba(255,255,255,0.35)', fontFamily: "'DM Sans', sans-serif" }}
        >
          Free. No credit card. Your advisor remembers everything and gets smarter every week.
        </p>

        {/* Loss frame */}
        <div className="mt-8 px-4 py-3" style={{ borderLeft: '3px solid #e63946' }}>
          <p className="text-sm" style={{ color: '#a0a0a0', fontStyle: 'italic', lineHeight: '1.6' }}>
            The best time to start was last month. The second best time is right now — with an advisor who won&apos;t let you drift.
          </p>
        </div>
      </div>
    </div>
  )
}
