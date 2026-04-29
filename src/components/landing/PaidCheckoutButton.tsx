'use client';

import { useState } from 'react';

interface PaidCheckoutButtonProps {
  /** Visible label. Defaults to the canonical CTA. */
  label?: string;
  /** Button id prefix used for accessibility. */
  idPrefix?: string;
}

type State = 'idle' | 'loading' | 'error';

export function PaidCheckoutButton({
  label = 'Buy for $97 — instant access',
  idPrefix = 'paid-checkout',
}: PaidCheckoutButtonProps) {
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (state === 'loading') return;
    setState('loading');
    setError(null);
    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !data.ok || typeof data.url !== 'string') {
        const msg =
          typeof data.error === 'string' && data.error
            ? data.error
            : 'Checkout unavailable, try again in a moment.';
        setError(msg);
        setState('error');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Checkout unavailable, try again in a moment.');
      setState('error');
    }
  }

  const errorId = `${idPrefix}-error`;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center gap-4 my-5" role="separator" aria-label="or">
        <div className="h-px flex-1 bg-instrument-divider opacity-50" />
        <span className="font-mono text-[10px] tracking-[0.24em] uppercase text-instrument-tertiary">
          or
        </span>
        <div className="h-px flex-1 bg-instrument-divider opacity-50" />
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={state === 'loading'}
        aria-describedby={error ? errorId : undefined}
        className="glow-emerald-pulse w-full font-mono text-sm sm:text-base tracking-[0.12em] uppercase bg-transparent text-instrument-primary px-6 py-4 rounded-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-instrument-surface/40 active:scale-[0.99]"
      >
        {state === 'loading' && (
          <span
            aria-hidden
            className="inline-block w-3 h-3 mr-2 align-middle border-2 border-white/30 border-t-white rounded-full animate-spin"
          />
        )}
        {state === 'loading' ? 'Opening checkout…' : label}
      </button>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-3 font-mono text-sm text-instrument-crimson text-center"
        >
          {error}
        </p>
      )}
    </div>
  );
}
