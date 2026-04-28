'use client'

import { useCallback, useState } from 'react'

interface Props {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function AgentChip({ label, onClick, disabled }: Props) {
  const [flashing, setFlashing] = useState(false)

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation()
      if (disabled) return
      setFlashing(true)
      window.setTimeout(() => setFlashing(false), 350)
      onClick()
    },
    [disabled, onClick],
  )

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="agent-chip"
      style={{
        position: 'relative',
        padding: '8px 12px 8px 14px',
        background: 'rgba(34, 34, 44, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(240, 74, 77, 0.18)',
        borderLeft: '4px solid rgba(240, 74, 77, 0.35)',
        borderRadius: 8,
        color: disabled ? '#5b5b63' : '#9b9ba4',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.4 : 1,
        transition:
          'color 160ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
        animation: flashing
          ? 'hudChipFlash 350ms cubic-bezier(0.4, 0, 0.6, 1) 1'
          : 'none',
        boxShadow: flashing ? '0 0 24px rgba(240, 74, 77, 0.55)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.color = '#f4f4f6'
        el.style.background = 'rgba(42, 42, 53, 0.7)'
        el.style.borderLeftColor = '#f04a4d'
        el.style.boxShadow = '0 0 12px rgba(240, 74, 77, 0.25)'
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        const el = e.currentTarget as HTMLButtonElement
        el.style.color = '#9b9ba4'
        el.style.background = 'rgba(34, 34, 44, 0.55)'
        el.style.borderLeftColor = 'rgba(240, 74, 77, 0.35)'
        el.style.boxShadow = flashing
          ? '0 0 24px rgba(240, 74, 77, 0.55)'
          : 'none'
      }}
    >
      {label}
    </button>
  )
}
