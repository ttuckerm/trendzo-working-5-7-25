'use client'

import { useEffect, useState } from 'react'
import '../../app/(public)/free/freedom-os/hamster-loader.css'

interface Props {
  visible: boolean
}

const PHRASES = [
  'Calibrating your Freedom Number…',
  'Mapping your 14-day sprint…',
  'Drafting your 90-day roadmap…',
  'Finding your first 50 leads…',
]

export function HamsterLoader({ visible }: Props) {
  const [phraseIndex, setPhraseIndex] = useState(0)

  useEffect(() => {
    if (!visible) {
      setPhraseIndex(0)
      return
    }
    const id = window.setInterval(
      () => setPhraseIndex(i => (i + 1) % PHRASES.length),
      3000,
    )
    return () => window.clearInterval(id)
  }, [visible])

  if (!visible) return null

  return (
    <div
      className="fos-loader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 50% 50%, rgba(20, 8, 12, 0.92) 0%, rgba(8, 8, 13, 0.95) 60%, rgba(8, 8, 13, 0.97) 100%)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Volumetric crimson glow pulse behind the hamster */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at center, rgba(240, 74, 77, 0.22) 0%, rgba(240, 74, 77, 0.08) 38%, transparent 70%)',
          filter: 'blur(12px)',
          animation: 'fosVolumetricGlow 3.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          pointerEvents: 'none',
        }}
      />

      <div
        aria-label="Hamster running in a wheel"
        role="img"
        className="wheel-and-hamster"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div className="wheel"></div>
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear"></div>
              <div className="hamster__eye"></div>
              <div className="hamster__nose"></div>
            </div>
            <div className="hamster__limb hamster__limb--fr"></div>
            <div className="hamster__limb hamster__limb--fl"></div>
            <div className="hamster__limb hamster__limb--br"></div>
            <div className="hamster__limb hamster__limb--bl"></div>
            <div className="hamster__tail"></div>
          </div>
        </div>
        <div className="spoke"></div>
      </div>

      <p
        key={phraseIndex}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          color: 'rgba(255, 255, 255, 0.65)',
          marginTop: '2.5rem',
          fontSize: '0.9375rem',
          letterSpacing: 0.2,
          position: 'relative',
          zIndex: 1,
          animation: 'fosPhraseFade 0.4s ease-out',
        }}
      >
        {PHRASES[phraseIndex]}
      </p>
      <p
        style={{
          fontFamily:
            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
          color: 'rgba(255, 255, 255, 0.32)',
          marginTop: '0.75rem',
          fontSize: '0.6875rem',
          letterSpacing: 1.2,
          position: 'relative',
          zIndex: 1,
        }}
      >
        This usually takes about 90 seconds.
      </p>

      <style>{`
        @keyframes fosVolumetricGlow {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50%      { transform: scale(1.08); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .fos-loader [aria-hidden] { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
