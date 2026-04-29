'use client';

import { useEffect, useState, FormEvent } from 'react';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function EmailNotifyForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => {
      setStatus('idle');
      setEmail('');
    }, 5000);
    return () => clearTimeout(t);
  }, [status]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === 'submitting' || status === 'success') return;
    setError(null);
    setStatus('submitting');
    try {
      const res = await fetch('/api/landing/email-notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source: 'landing_notify' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStatus('success');
        return;
      }
      setError(typeof data?.message === 'string' ? data.message : 'Could not save that. Try again.');
      setStatus('error');
    } catch {
      setError("Couldn't reach the system. Try again.");
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        className="max-w-xl mx-auto rounded-md border border-instrument-divider bg-instrument-surface px-5 py-4 text-center font-body text-instrument-primary"
      >
        You&apos;re on the list. We&apos;ll send one email when codes drop. That&apos;s it.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={320}
          disabled={status === 'submitting'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email for code-drop notifications"
          className="flex-1 min-w-0 bg-instrument-surface-inset border border-instrument-divider text-instrument-primary placeholder:text-instrument-tertiary font-body text-base px-4 py-3 rounded-md focus:outline-none focus:border-instrument-crimson glow-crimson-soft focus:glow-crimson-medium transition-shadow disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="font-mono text-base tracking-[0.12em] uppercase bg-instrument-crimson text-white px-5 py-3 rounded-md transition-all duration-200 hover:bg-[#ff5b5e] active:scale-[0.99] glow-crimson-soft hover:glow-crimson-medium disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'SENDING…' : 'NOTIFY ME'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 font-mono text-sm text-instrument-crimson">
          {error}
        </p>
      )}
    </form>
  );
}
