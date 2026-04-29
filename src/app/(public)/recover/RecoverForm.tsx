'use client'

import { useState, type FormEvent } from 'react'

type State = 'idle' | 'submitting' | 'success' | 'error'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RecoverForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (state === 'submitting' || state === 'success') return
    const trimmed = email.trim()
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('That email looks off, try again.')
      setState('error')
      return
    }
    setError(null)
    setState('submitting')
    try {
      const res = await fetch('/api/recover-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (res.ok && data?.ok) {
        setState('success')
        return
      }
      if (res.status === 429) {
        setError('Too many attempts. Try again in a few minutes.')
      } else {
        setError(typeof data?.message === 'string' ? data.message : 'Something went wrong. Try again.')
      }
      setState('error')
    } catch {
      setError("Couldn't reach the system. Try again.")
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div
        role="status"
        className="rounded-md border border-instrument-divider bg-instrument-surface px-5 py-5 text-center font-body text-instrument-primary"
      >
        If we have an assessment for that email, we just sent you the link. Check your inbox.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit}>
      <label
        htmlFor="recover-email"
        className="block font-mono text-[10px] tracking-[0.18em] uppercase text-instrument-tertiary mb-3"
      >
        YOUR EMAIL
      </label>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch">
        <input
          id="recover-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCorrect="off"
          spellCheck={false}
          disabled={state === 'submitting'}
          value={email}
          onChange={e => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          placeholder="you@example.com"
          aria-invalid={state === 'error'}
          aria-describedby={error ? 'recover-error' : undefined}
          className="flex-1 min-w-0 bg-instrument-surface-inset text-instrument-primary placeholder:text-instrument-tertiary font-body text-base px-4 py-3 rounded-md focus:outline-none transition-shadow duration-200 disabled:opacity-60"
          style={{
            border: state === 'error' ? '1px solid #f04a4d' : '1px solid rgba(240, 74, 77, 0.45)',
            boxShadow:
              state === 'error'
                ? '0 0 24px rgba(240, 74, 77, 0.40)'
                : '0 0 12px rgba(240, 74, 77, 0.20)',
          }}
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="font-mono text-base tracking-[0.12em] uppercase bg-instrument-crimson text-white px-6 py-3 rounded-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-[#ff5b5e] active:scale-[0.99] glow-crimson-soft hover:glow-crimson-medium"
        >
          {state === 'submitting' ? 'SENDING…' : 'SEND MY LINK →'}
        </button>
      </div>
      {error && (
        <p id="recover-error" role="alert" className="mt-3 font-mono text-sm text-instrument-crimson">
          {error}
        </p>
      )}
    </form>
  )
}
