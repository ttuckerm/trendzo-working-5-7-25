'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Chassis } from '@/components/assessment/Chassis';

type Variant = 'chassis' | 'minimal';

interface CodeEntryProps {
  variant?: Variant;
  idPrefix?: string;
}

type ButtonState = 'idle' | 'validating' | 'success' | 'error';

const BUTTON_LABEL: Record<ButtonState, string> = {
  idle: 'INITIATE →',
  validating: 'VALIDATING…',
  success: 'ACCESS GRANTED →',
  error: 'INITIATE →',
};

export function CodeEntry({ variant = 'chassis', idPrefix = 'code' }: CodeEntryProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [state, setState] = useState<ButtonState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [statusOverride, setStatusOverride] = useState<'active' | 'complete' | 'idle'>('active');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === 'validating' || state === 'success') return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError('Enter a code first.');
      setState('error');
      setStatusOverride('idle');
      setFlash(true);
      setTimeout(() => setFlash(false), 800);
      inputRef.current?.focus();
      return;
    }

    setState('validating');
    setError(null);
    setStatusOverride('active');

    try {
      const res = await fetch('/api/landing/code-validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        setState('success');
        setStatusOverride('complete');
        setFlash(true);
        const target = typeof data.redirectTo === 'string' ? data.redirectTo : '/free/freedom-os';
        setTimeout(() => {
          router.push(target);
        }, 800);
        return;
      }

      const message =
        typeof data?.message === 'string'
          ? data.message
          : res.status === 429
          ? 'Too many attempts. Try again in a few minutes.'
          : 'That code looks off. Check for typos.';
      setError(message);
      setState('error');
      setStatusOverride('idle');
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setState('idle');
      }, 800);
      inputRef.current?.focus();
    } catch {
      setError("Couldn't reach the system. Try again.");
      setState('error');
      setStatusOverride('idle');
      setFlash(true);
      setTimeout(() => {
        setFlash(false);
        setState('idle');
      }, 800);
    }
  }

  const inputId = `${idPrefix}-input`;
  const errorId = `${idPrefix}-error`;
  const isLocked = state === 'validating' || state === 'success';

  const inputBlock = (
    <form onSubmit={onSubmit}>
      <label
        htmlFor={inputId}
        className="block font-mono text-[10px] tracking-[0.18em] uppercase text-instrument-tertiary mb-3"
      >
        ENTER YOUR CODE
      </label>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 items-stretch">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          maxLength={5}
          disabled={isLocked}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))
          }
          placeholder="XXXXX"
          aria-invalid={state === 'error'}
          aria-describedby={error ? errorId : undefined}
          className="flex-1 min-w-0 bg-instrument-surface-inset border text-instrument-primary placeholder:text-instrument-tertiary font-display text-2xl tracking-[0.18em] uppercase text-center px-5 py-4 rounded-md focus:outline-none transition-shadow duration-200 disabled:opacity-60"
          style={{
            borderColor: state === 'error' ? '#f04a4d' : 'rgba(240, 74, 77, 0.45)',
            boxShadow:
              state === 'error'
                ? '0 0 24px rgba(240, 74, 77, 0.40)'
                : '0 0 12px rgba(240, 74, 77, 0.25)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 24px rgba(240, 74, 77, 0.40)';
            e.currentTarget.style.borderColor = '#f04a4d';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '0 0 12px rgba(240, 74, 77, 0.25)';
            e.currentTarget.style.borderColor =
              state === 'error' ? '#f04a4d' : 'rgba(240, 74, 77, 0.45)';
          }}
        />
        <button
          type="submit"
          disabled={isLocked}
          className="font-mono text-base tracking-[0.12em] uppercase bg-instrument-crimson text-white px-6 py-4 rounded-md transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-[#ff5b5e] active:scale-[0.99] glow-crimson-soft hover:glow-crimson-medium"
        >
          {state === 'validating' && (
            <span
              aria-hidden
              className="inline-block w-3 h-3 mr-2 align-middle border-2 border-white/40 border-t-white rounded-full animate-spin"
            />
          )}
          {BUTTON_LABEL[state]}
        </button>
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-3 font-mono text-sm text-instrument-crimson"
        >
          {error}
        </p>
      )}
    </form>
  );

  if (variant === 'minimal') {
    return <div className="w-full max-w-xl mx-auto">{inputBlock}</div>;
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <Chassis
        intensity="prominent"
        statusLabel="SYS://ACCESS_CHANNEL — STANDBY"
        status={statusOverride}
        brackets
        innerGlow
        flash={flash}
      >
        <div className="bg-instrument-surface/70 backdrop-blur-sm rounded-xl p-6 sm:p-8">
          {inputBlock}
        </div>
      </Chassis>
    </div>
  );
}
