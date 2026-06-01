'use client'

// Inline-SVG sprite components for the StepOffGame mini-game.
//
// Each obstacle is a multi-shape illustration in the crimson palette
// (#f04a4d / #c93b3e / #8a2a2c) with white/cream highlights, sized to match
// the logical hitbox in obstacles.ts. Idle animations are wired via class
// hooks defined in StepOffGame.global.css so they run on the compositor
// (transform / opacity only) and never trigger layout.
//
// All components are React.memo'd because they only re-render on
// mount/unmount — the rAF loop moves their parent <div> imperatively.

import { memo } from 'react'
import type {
  CollectibleType,
  DecorationType,
  ObstacleType,
} from './obstacles'

const C_PRIMARY = '#f04a4d'
const C_MID = '#c93b3e'
const C_DARK = '#8a2a2c'
const HIGHLIGHT = 'rgba(255, 240, 235, 0.85)'
const SHEEN = 'rgba(255, 255, 255, 0.35)'

interface SpriteProps {
  type: string
  kind: 'obstacle' | 'collectible' | 'decoration'
}

export const Sprite = memo(function Sprite({ type, kind }: SpriteProps) {
  if (kind === 'obstacle') return <ObstacleSprite type={type as ObstacleType} />
  if (kind === 'collectible') return <CollectibleSprite type={type as CollectibleType} />
  return <DecorationSprite type={type as DecorationType} />
})

function ObstacleSprite({ type }: { type: ObstacleType }) {
  switch (type) {
    case 'invoice':  return <Invoice />
    case 'laptop':   return <Laptop />
    case 'books':    return <Books />
    case 'inbox':    return <Inbox />
    case 'calendar': return <Calendar />
    case 'coffee':   return <Coffee />
  }
}

function CollectibleSprite({ type }: { type: CollectibleType }) {
  return type === 'coin' ? <Coin /> : <Bulb />
}

function DecorationSprite({ type }: { type: DecorationType }) {
  switch (type) {
    case 'paperclip': return <Paperclip />
    case 'paperball': return <PaperBall />
    case 'pen':       return <Pen />
    case 'sticky':    return <Sticky />
  }
}

// ─── Obstacles ─────────────────────────────────────────────────────────────

function Invoice() {
  return (
    <svg viewBox="0 0 30 36" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <linearGradient id="inv-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6064" />
          <stop offset="1" stopColor={C_PRIMARY} />
        </linearGradient>
      </defs>
      {/* Bottom paper */}
      <g transform="translate(15 22) rotate(4)">
        <rect x="-12" y="-12" width="24" height="22" rx="1" fill={C_DARK} />
      </g>
      {/* Middle paper */}
      <g transform="translate(15 18) rotate(-8)">
        <rect x="-11" y="-10" width="22" height="20" rx="1" fill={C_MID} />
        <rect x="-7" y="-5" width="14" height="1" fill={SHEEN} />
        <rect x="-7" y="-2" width="11" height="1" fill={SHEEN} />
        <rect x="-7" y="1" width="13" height="1" fill={SHEEN} />
      </g>
      {/* Top paper — flutters */}
      <g className="fos-spr-flutter" style={{ transformOrigin: '15px 28px' }}>
        <g transform="translate(15 12) rotate(6)">
          <rect x="-10" y="-8" width="20" height="20" rx="1.5" fill="url(#inv-top)" />
          <text x="-7" y="3" fontFamily="'JetBrains Mono', monospace" fontSize="8" fontWeight="800" fill={HIGHLIGHT}>$</text>
          <rect x="-2" y="-3" width="10" height="1" fill={SHEEN} />
          <rect x="-2" y="-1" width="7" height="1" fill={SHEEN} />
          <rect x="-2" y="1" width="9" height="1" fill={SHEEN} />
        </g>
      </g>
    </svg>
  )
}

function Laptop() {
  return (
    <svg viewBox="0 0 40 28" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <linearGradient id="lap-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9b3033" />
          <stop offset="1" stopColor={C_DARK} />
        </linearGradient>
        <linearGradient id="lap-base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5d61" />
          <stop offset="1" stopColor={C_MID} />
        </linearGradient>
      </defs>
      {/* Screen back */}
      <path d="M5 2 L35 2 L36 21 L4 21 Z" fill={C_DARK} />
      {/* Screen face */}
      <path d="M7 4 L33 4 L33.5 19 L6.5 19 Z" fill="url(#lap-screen)" />
      {/* Code lines */}
      <rect x="9" y="7" width="14" height="1" fill="rgba(255,255,255,0.18)" />
      <rect x="9" y="10" width="20" height="1" fill="rgba(255,255,255,0.13)" />
      <rect x="9" y="13" width="11" height="1" fill="rgba(255,255,255,0.15)" />
      <rect x="9" y="16" width="17" height="1" fill="rgba(255,255,255,0.10)" />
      {/* Base / hinge */}
      <path d="M2 21 L38 21 L40 26 L0 26 Z" fill="url(#lap-base)" />
      <rect x="0" y="26" width="40" height="1.5" fill={C_DARK} />
      <rect x="17" y="21" width="6" height="1" fill={C_DARK} />
      {/* Pulsing notification dot */}
      <g className="fos-spr-pulse" style={{ transformOrigin: '30px 8px' }}>
        <circle cx="30" cy="8" r="2.4" fill="#ff8a8e" />
        <circle cx="30" cy="8" r="1.2" fill={HIGHLIGHT} />
      </g>
    </svg>
  )
}

function Books() {
  return (
    <svg viewBox="0 0 32 38" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <linearGradient id="bks-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5d61" />
          <stop offset="1" stopColor={C_PRIMARY} />
        </linearGradient>
      </defs>
      {/* Bottom book (widest) */}
      <rect x="0" y="26" width="32" height="12" rx="1" fill={C_DARK} />
      <rect x="0" y="29" width="32" height="1.5" fill="rgba(255,255,255,0.18)" />
      <rect x="3" y="32" width="18" height="1" fill="rgba(255,255,255,0.10)" />
      <rect x="3" y="34.5" width="13" height="1" fill="rgba(255,255,255,0.10)" />
      {/* Middle book */}
      <rect x="2" y="14" width="28" height="12" rx="1" fill={C_MID} />
      <rect x="2" y="17" width="28" height="1.5" fill="rgba(255,255,255,0.20)" />
      <rect x="5" y="20" width="14" height="1" fill="rgba(255,255,255,0.12)" />
      <rect x="5" y="22.5" width="10" height="1" fill="rgba(255,255,255,0.12)" />
      {/* Top book — wobbles */}
      <g className="fos-spr-wobble" style={{ transformOrigin: '16px 14px' }}>
        <rect x="4" y="2" width="24" height="12" rx="1" fill="url(#bks-top)" />
        <rect x="4" y="5" width="24" height="1.5" fill={SHEEN} />
        <rect x="7" y="8" width="14" height="1" fill={HIGHLIGHT} opacity="0.7" />
        <rect x="7" y="10.5" width="9" height="1" fill={HIGHLIGHT} opacity="0.5" />
      </g>
    </svg>
  )
}

function Inbox() {
  return (
    <svg viewBox="0 0 42 32" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <linearGradient id="ibx-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5d61" />
          <stop offset="1" stopColor={C_MID} />
        </linearGradient>
      </defs>
      {/* Back envelope (peeking out, leans left) */}
      <g transform="translate(13 1) rotate(-8)">
        <rect x="0" y="0" width="16" height="11" rx="0.5" fill={C_DARK} />
        <path d="M0 0 L8 5.5 L16 0 Z" fill="rgba(0,0,0,0.25)" />
        <rect x="2" y="6" width="9" height="0.8" fill="rgba(255,255,255,0.18)" />
      </g>
      {/* Top envelope — jitters */}
      <g className="fos-spr-jitter">
        <g transform="translate(17 3) rotate(4)">
          <rect x="0" y="0" width="18" height="12" rx="0.5" fill="url(#ibx-front)" />
          <path d="M0 0 L9 6 L18 0 Z" fill="rgba(0,0,0,0.20)" />
          <rect x="2" y="6.5" width="11" height="0.8" fill={SHEEN} />
          <rect x="2" y="8.5" width="8" height="0.8" fill={SHEEN} />
          <circle cx="16" cy="2" r="1.4" fill={HIGHLIGHT} opacity="0.9" />
        </g>
      </g>
      {/* Tray */}
      <path d="M0 19 L42 19 L40 30 L2 30 Z" fill={C_MID} />
      <path d="M0 19 L42 19 L42 21 L0 21 Z" fill={C_DARK} />
      <rect x="2" y="28" width="38" height="2" fill={C_DARK} />
    </svg>
  )
}

function Calendar() {
  return (
    <svg viewBox="0 0 32 34" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <linearGradient id="cal-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ad3133" />
          <stop offset="1" stopColor={C_MID} />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="1" y="6" width="30" height="27" rx="2" fill="url(#cal-body)" />
      {/* Header strip */}
      <path d="M1 8 Q1 6 3 6 L29 6 Q31 6 31 8 L31 12 L1 12 Z" fill={C_DARK} />
      <rect x="3" y="13" width="26" height="1" fill="rgba(0,0,0,0.25)" />
      {/* Binding posts */}
      <rect x="7" y="2" width="2.5" height="8" rx="1" fill="rgba(255,255,255,0.45)" />
      <rect x="22.5" y="2" width="2.5" height="8" rx="1" fill="rgba(255,255,255,0.45)" />
      {/* "MTG" hint text */}
      <text x="16" y="20" textAnchor="middle" fontFamily="'DM Sans', sans-serif" fontSize="6" fontWeight="700" fill="rgba(255,255,255,0.55)">MTG</text>
      {/* Red X — flickers */}
      <g className="fos-spr-blink">
        <path d="M6 17 L26 32" stroke={HIGHLIGHT} strokeWidth="3" strokeLinecap="round" />
        <path d="M26 17 L6 32" stroke={HIGHLIGHT} strokeWidth="3" strokeLinecap="round" />
        <path d="M6 17 L26 32" stroke="#ff3d40" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 17 L6 32" stroke="#ff3d40" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}

function Coffee() {
  return (
    <svg viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <linearGradient id="cof-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b03135" />
          <stop offset="1" stopColor={C_DARK} />
        </linearGradient>
      </defs>
      {/* Steam plume 1 — animated */}
      <g className="fos-spr-steam-a" style={{ transformOrigin: '10px 12px' }}>
        <path
          d="M8 0 Q11 3 8 6 Q5 9 8 12"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      {/* Steam plume 2 — animated, offset */}
      <g className="fos-spr-steam-b" style={{ transformOrigin: '17px 12px' }}>
        <path
          d="M16 1 Q19 4 16 7 Q13 10 16 13"
          stroke="rgba(255,255,255,0.40)"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      {/* Cup body */}
      <path d="M3 14 L23 14 L21 34 L5 34 Z" fill="url(#cof-body)" />
      <rect x="3" y="14" width="20" height="2" fill={C_PRIMARY} />
      {/* Coffee surface */}
      <ellipse cx="13" cy="15" rx="9" ry="1.3" fill={C_DARK} />
      <ellipse cx="13" cy="15" rx="6" ry="0.8" fill="rgba(0,0,0,0.4)" />
      {/* Handle */}
      <path
        d="M23 18 Q26 18 26 22 Q26 26 23 26"
        stroke={C_DARK}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Collectibles ──────────────────────────────────────────────────────────

function Coin() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <radialGradient id="coin-face" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff5b0" />
          <stop offset="0.55" stopColor="#ffd700" />
          <stop offset="1" stopColor="#c79500" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="#9c7400" />
      <circle cx="12" cy="12" r="9.5" fill="url(#coin-face)" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="#a37c00" strokeWidth="0.8" />
      <text x="12" y="16" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="800" fill="#8a6100">$</text>
      {/* Tiny sparkle accent */}
      <circle cx="7" cy="7" r="1.2" fill="rgba(255,255,255,0.9)" />
    </svg>
  )
}

function Bulb() {
  return (
    <svg viewBox="0 0 22 28" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <defs>
        <radialGradient id="bulb-glass" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff5b0" />
          <stop offset="0.55" stopColor="#ffd700" />
          <stop offset="1" stopColor="#c79500" />
        </radialGradient>
      </defs>
      {/* Soft glow halo */}
      <circle cx="11" cy="11" r="11" fill="#ffd700" opacity="0.12" />
      {/* Bulb glass */}
      <path d="M11 1 Q19 1 19 11 Q19 16 15 19 L15 21 L7 21 L7 19 Q3 16 3 11 Q3 1 11 1 Z" fill="url(#bulb-glass)" />
      {/* Filament */}
      <path d="M8 13 Q11 9 14 13" stroke="#a37c00" strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <path d="M11 13 L11 17" stroke="#a37c00" strokeWidth="0.9" />
      {/* Highlight */}
      <ellipse cx="8" cy="7" rx="1.6" ry="2.6" fill="rgba(255,255,255,0.7)" transform="rotate(-20 8 7)" />
      {/* Base */}
      <rect x="7" y="21" width="8" height="2.5" rx="0.5" fill="#7a5300" />
      <rect x="7.5" y="23.5" width="7" height="1.5" fill="#5e3f00" />
      <path d="M8.5 25 L13.5 25 L12.5 27 L9.5 27 Z" fill="#3a2700" />
    </svg>
  )
}

// ─── Ground decorations ────────────────────────────────────────────────────

function Paperclip() {
  return (
    <svg viewBox="0 0 14 8" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <path
        d="M2 6 L2 3 Q2 1 4 1 L10 1 Q12 1 12 3 L12 5 Q12 6.5 10.5 6.5 L4.5 6.5"
        stroke="rgba(180,180,200,0.65)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PaperBall() {
  return (
    <svg viewBox="0 0 12 10" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <path
        d="M2 4 L4 1 L7 2 L10 3 L11 6 L9 9 L4 9 L1 7 Z"
        fill="rgba(220,220,230,0.55)"
        stroke="rgba(140,140,155,0.5)"
        strokeWidth="0.4"
      />
      <path d="M5 3 L7 5 L5 7" stroke="rgba(140,140,155,0.5)" strokeWidth="0.4" fill="none" />
    </svg>
  )
}

function Pen() {
  return (
    <svg viewBox="0 0 18 4" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <rect x="2" y="1" width="13" height="2.4" rx="1.2" fill={C_DARK} />
      <rect x="2" y="1" width="13" height="0.6" fill="rgba(255,255,255,0.18)" />
      <path d="M15 1 L17 2 L15 3 Z" fill="#2a2a32" />
      <rect x="3" y="1.4" width="2" height="1.6" fill={C_PRIMARY} opacity="0.7" />
    </svg>
  )
}

function Sticky() {
  return (
    <svg viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
      <path d="M1 1 L13 1 L13 11 L11 13 L1 13 Z" fill="#ffd700" opacity="0.7" />
      <path d="M13 11 L11 13 L11 11 Z" fill="rgba(0,0,0,0.25)" />
      <rect x="3" y="4" width="7" height="0.7" fill="rgba(0,0,0,0.30)" />
      <rect x="3" y="6.5" width="5" height="0.7" fill="rgba(0,0,0,0.30)" />
      <rect x="3" y="9" width="6" height="0.7" fill="rgba(0,0,0,0.30)" />
    </svg>
  )
}
