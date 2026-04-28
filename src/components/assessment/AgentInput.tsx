'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
  placeholder?: string
}

const MAX_CHARS = 2000

export function AgentInput({ onSend, disabled, placeholder }: Props) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (!disabled) ref.current?.focus()
  }, [disabled])

  function trySend() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      trySend()
    }
  }

  const showCounter = value.length >= 1900

  const canSend = !disabled && value.trim().length > 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '12px 16px',
        borderTop: '1px solid rgba(240, 74, 77, 0.18)',
        background: 'transparent',
        position: 'relative',
      }}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          const next = e.target.value
          if (next.length <= MAX_CHARS) setValue(next)
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? 'Ask the Freedom Agent…'}
        readOnly={disabled}
        rows={1}
        className="agent-input-area"
        style={{
          flex: 1,
          resize: 'none',
          minHeight: 38,
          maxHeight: 96,
          background: 'rgba(34, 34, 44, 0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(240, 74, 77, 0.18)',
          borderRadius: 8,
          padding: '10px 12px',
          color: disabled ? '#9b9ba4' : '#f4f4f6',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 14,
          lineHeight: 1.4,
          outline: 'none',
          transition: 'border-color 160ms ease, box-shadow 160ms ease',
        }}
      />
      <button
        type="button"
        onClick={trySend}
        disabled={!canSend}
        aria-label="Send message"
        className="agent-send-btn"
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          background: canSend ? '#f04a4d' : 'rgba(58, 26, 28, 0.6)',
          border: '1px solid rgba(240, 74, 77, 0.55)',
          borderRadius: 8,
          color: '#f4f4f6',
          cursor: canSend ? 'pointer' : 'not-allowed',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: canSend ? 1 : 0.5,
          boxShadow: canSend
            ? '0 0 12px rgba(240, 74, 77, 0.35)'
            : 'none',
          transition: 'box-shadow 160ms ease, transform 120ms ease',
        }}
      >
        <SendIcon />
      </button>
      <style>{`
        .agent-input-area:focus {
          border-color: #f04a4d !important;
          box-shadow: 0 0 12px rgba(240, 74, 77, 0.25);
        }
        .agent-send-btn:hover:not(:disabled) {
          box-shadow: 0 0 20px rgba(240, 74, 77, 0.55) !important;
        }
      `}</style>
      {showCounter && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute',
            top: -16,
            right: 16,
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 10,
            color: value.length >= MAX_CHARS - 10 ? '#f04a4d' : '#5b5b63',
          }}
        >
          {value.length} / {MAX_CHARS}
        </div>
      )}
    </div>
  )
}

function SendIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {/* Transmit triangle — solid leading edge, hollow trailing fin */}
      <path
        d="M2.4 9 16 3.2 12.6 9 16 14.8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
      <line
        x1="2.4"
        y1="9"
        x2="12.6"
        y2="9"
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="round"
        opacity={0.4}
      />
    </svg>
  )
}
