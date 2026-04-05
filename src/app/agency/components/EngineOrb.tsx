'use client';

import { useEffect, useRef } from 'react';

interface EngineOrbProps {
  state: 'idle' | 'thinking' | 'streaming' | 'error';
  size?: number;
}

export default function EngineOrb({ state, size = 32 }: EngineOrbProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.setAttribute('data-state', state);
    }
  }, [state]);

  const half = size / 2;
  const coreR = (12 / 32) * size;
  const glowR = (16 / 32) * size;
  const outerR = (20 / 32) * size;

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      data-state={state}
      className="engine-orb"
    >
      <style>{`
        /* ---- Gradients are in defs, animations here ---- */

        /* === IDLE === */
        .engine-orb[data-state="idle"] .orb-core {
          animation: idleCore 3s ease-in-out infinite;
        }
        .engine-orb[data-state="idle"] .orb-glow {
          animation: idleGlow 3s ease-in-out infinite;
        }
        .engine-orb[data-state="idle"] .orb-outer {
          animation: idleOuter 4s ease-in-out infinite;
        }
        .engine-orb[data-state="idle"] .orb-ripple1,
        .engine-orb[data-state="idle"] .orb-ripple2,
        .engine-orb[data-state="idle"] .orb-rotate-ring {
          display: none;
        }

        @keyframes idleCore {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes idleGlow {
          0%, 100% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
        }
        @keyframes idleOuter {
          0%, 100% { transform: scale(0.9); }
          50% { transform: scale(1.1); }
        }

        /* === THINKING === */
        .engine-orb[data-state="thinking"] .orb-core {
          animation: thinkCore 1.5s ease-in-out infinite;
        }
        .engine-orb[data-state="thinking"] .orb-glow {
          animation: thinkGlow 1.5s ease-in-out infinite;
        }
        .engine-orb[data-state="thinking"] .orb-outer {
          animation: thinkOuter 2s ease-in-out infinite;
        }
        .engine-orb[data-state="thinking"] .orb-rotate-ring {
          display: block;
          animation: rotateRing 4s linear infinite;
        }
        .engine-orb[data-state="thinking"] .orb-ripple1,
        .engine-orb[data-state="thinking"] .orb-ripple2 {
          display: none;
        }

        @keyframes thinkCore {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes thinkGlow {
          0%, 100% { transform: scale(0.9); }
          50% { transform: scale(1.15); }
        }
        @keyframes thinkOuter {
          0%, 100% { transform: scale(0.85); }
          50% { transform: scale(1.2); }
        }
        @keyframes rotateRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* === STREAMING === */
        .engine-orb[data-state="streaming"] .orb-core {
          animation: streamCore 0.8s ease-in-out infinite;
        }
        .engine-orb[data-state="streaming"] .orb-glow {
          animation: streamGlow 0.8s ease-in-out infinite;
        }
        .engine-orb[data-state="streaming"] .orb-outer {
          display: none;
        }
        .engine-orb[data-state="streaming"] .orb-ripple1 {
          display: block;
          animation: ripple 1.5s ease-out infinite;
        }
        .engine-orb[data-state="streaming"] .orb-ripple2 {
          display: block;
          animation: ripple 1.5s ease-out infinite 0.75s;
        }
        .engine-orb[data-state="streaming"] .orb-rotate-ring {
          display: block;
          animation: rotateRing 2s linear infinite;
        }

        @keyframes streamCore {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        @keyframes streamGlow {
          0%, 100% { transform: scale(0.85); }
          50% { transform: scale(1.25); }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.15; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        /* === ERROR === */
        .engine-orb[data-state="error"] .orb-core {
          animation: errorCore 0.5s steps(4) infinite;
        }
        .engine-orb[data-state="error"] .orb-glow {
          animation: errorGlow 0.5s steps(4) infinite;
        }
        .engine-orb[data-state="error"] .orb-outer,
        .engine-orb[data-state="error"] .orb-ripple1,
        .engine-orb[data-state="error"] .orb-ripple2,
        .engine-orb[data-state="error"] .orb-rotate-ring {
          display: none;
        }

        @keyframes errorCore {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes errorGlow {
          0%, 100% { transform: scale(0.95); }
          50% { transform: scale(1.08); }
        }

        /* transform-origin for scale animations */
        .orb-glow, .orb-outer, .orb-ripple1, .orb-ripple2, .orb-rotate-ring {
          transform-origin: center;
        }
      `}</style>

      <defs>
        {/* Default green-cyan gradient */}
        <radialGradient id={`orb-grad-default-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2dd4a8" />
          <stop offset="100%" stopColor="#00d4ff" />
        </radialGradient>
        {/* Cyan-dominant gradient (thinking/streaming) */}
        <radialGradient id={`orb-grad-cyan-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#2dd4a8" />
        </radialGradient>
        {/* Error gradient */}
        <radialGradient id={`orb-grad-error-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e63946" />
          <stop offset="100%" stopColor="#ff6b6b" />
        </radialGradient>
      </defs>

      {/* Outer ring */}
      <circle
        className="orb-outer"
        cx={half}
        cy={half}
        r={outerR}
        fill={state === 'error' ? `url(#orb-grad-error-${size})` : `url(#orb-grad-default-${size})`}
        opacity={0.08}
      />

      {/* Ripple rings (streaming only) */}
      <circle
        className="orb-ripple1"
        cx={half}
        cy={half}
        r={outerR}
        fill={`url(#orb-grad-cyan-${size})`}
        opacity={0.15}
        style={{ display: 'none' }}
      />
      <circle
        className="orb-ripple2"
        cx={half}
        cy={half}
        r={outerR}
        fill={`url(#orb-grad-cyan-${size})`}
        opacity={0.15}
        style={{ display: 'none' }}
      />

      {/* Rotating ring (thinking/streaming) */}
      <circle
        className="orb-rotate-ring"
        cx={half}
        cy={half}
        r={glowR + (outerR - glowR) / 2}
        fill="none"
        stroke="#00d4ff"
        strokeWidth={1}
        opacity={0.3}
        strokeDasharray={`${Math.PI * (glowR + (outerR - glowR) / 2) * 0.3} ${Math.PI * (glowR + (outerR - glowR) / 2) * 0.7}`}
        style={{ display: 'none' }}
      />

      {/* Glow ring */}
      <circle
        className="orb-glow"
        cx={half}
        cy={half}
        r={glowR}
        fill={
          state === 'error'
            ? `url(#orb-grad-error-${size})`
            : state === 'thinking' || state === 'streaming'
              ? `url(#orb-grad-cyan-${size})`
              : `url(#orb-grad-default-${size})`
        }
        opacity={0.2}
      />

      {/* Core circle */}
      <circle
        className="orb-core"
        cx={half}
        cy={half}
        r={coreR}
        fill={
          state === 'error'
            ? `url(#orb-grad-error-${size})`
            : state === 'streaming'
              ? `url(#orb-grad-cyan-${size})`
              : state === 'thinking'
                ? `url(#orb-grad-cyan-${size})`
                : `url(#orb-grad-default-${size})`
        }
      />
    </svg>
  );
}
