'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Chassis } from './Chassis'

type CopyState = 'idle' | 'copied'

const COPIED_LABEL_MS = 2000

export function SaveYourLinkNotice() {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const onCopy = useCallback(async () => {
    if (typeof window === 'undefined') return
    const href = window.location.href
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(href)
      } else {
        const ta = document.createElement('textarea')
        ta.value = href
        ta.setAttribute('readonly', '')
        ta.style.position = 'absolute'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopyState('copied')
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        setCopyState('idle')
      }, COPIED_LABEL_MS)
    } catch (err) {
      console.error('[SaveYourLinkNotice] clipboard write failed', err)
    }
  }, [])

  return (
    <Chassis
      intensity="subtle"
      statusLabel="SYS://SAVE_YOUR_LINK"
      status="active"
      innerGlow
    >
      <div
        className="save-link-notice"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 20px',
          background: '#1c1c24',
          border: '1px solid rgba(240, 74, 77, 0.32)',
          borderLeft: '3px solid #f04a4d',
          borderRadius: 12,
          boxShadow:
            'inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 0 18px rgba(240, 74, 77, 0.12)',
        }}
      >
        <span
          aria-hidden
          style={{
            color: '#f04a4d',
            fontSize: 18,
            lineHeight: 1,
            flexShrink: 0,
            textShadow: '0 0 10px rgba(240, 74, 77, 0.55)',
          }}
        >
          ⚡
        </span>

        <p
          style={{
            flex: 1,
            margin: 0,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 13.5,
            lineHeight: 1.45,
            color: '#f4f4f6',
          }}
        >
          <span style={{ fontWeight: 600 }}>
            This is your personal assessment link.
          </span>{' '}
          <span style={{ color: '#c8c8d0' }}>
            Save it — it&apos;s the only way back. Free, unlimited Agent access
            lives here.
          </span>
        </p>

        <button
          type="button"
          onClick={onCopy}
          aria-live="polite"
          className="save-link-copy-btn"
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background:
              copyState === 'copied'
                ? 'rgba(58, 166, 122, 0.18)'
                : 'rgba(240, 74, 77, 0.14)',
            border:
              copyState === 'copied'
                ? '1px solid rgba(58, 166, 122, 0.55)'
                : '1px solid rgba(240, 74, 77, 0.55)',
            color: copyState === 'copied' ? '#7ddcb0' : '#f4f4f6',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: 11,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            padding: '8px 14px',
            borderRadius: 999,
            cursor: 'pointer',
            transition:
              'background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, color 160ms ease',
            boxShadow:
              copyState === 'copied'
                ? '0 0 12px rgba(58, 166, 122, 0.35)'
                : '0 0 10px rgba(240, 74, 77, 0.25)',
          }}
        >
          {copyState === 'copied' ? 'Copied ✓' : 'Copy link'}
        </button>

        <style>{`
          .save-link-copy-btn:hover {
            background: rgba(240, 74, 77, 0.24) !important;
            box-shadow: 0 0 16px rgba(240, 74, 77, 0.45) !important;
          }
          .save-link-copy-btn:focus-visible {
            outline: 2px solid #f04a4d;
            outline-offset: 2px;
          }
          @media (max-width: 640px) {
            .save-link-notice {
              flex-wrap: wrap;
            }
            .save-link-notice > p {
              flex-basis: 100%;
              order: 2;
            }
            .save-link-notice > .save-link-copy-btn {
              margin-left: auto;
              order: 3;
            }
          }
        `}</style>
      </div>
    </Chassis>
  )
}
