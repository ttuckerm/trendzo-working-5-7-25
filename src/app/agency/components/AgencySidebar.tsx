'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageSquare,
  LayoutGrid,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Brain,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react'

// ── Design tokens ─────────────────────────────────────────────────────

const S = {
  bgSidebar: '#0f0f16',
  bgHover: 'rgba(255,255,255,0.04)',
  bgActive: 'rgba(0,212,255,0.08)',
  borderActive: 'rgba(0,212,255,0.2)',
  border: '#1e1e2e',
  cyan: '#00d4ff',
  textPrimary: '#e8e8f0',
  textMuted: '#55556a',
  crimson: '#e63946',
  widthCollapsed: 56,
  widthExpanded: 208,
} as const

// Emil's custom easing curves — built-in CSS easings are too weak
const EASE = {
  out: 'cubic-bezier(0.23, 1, 0.32, 1)',       // strong ease-out for entries
  inOut: 'cubic-bezier(0.77, 0, 0.175, 1)',     // strong ease-in-out for movement
} as const

const STORAGE_KEY = 'trendzo-sidebar-expanded'

// ── CSS for animations ────────────────────────────────────────────────

const SIDEBAR_CSS = `
  /* ── Page-load entrance: stagger each nav icon ───────────── */
  @keyframes sbIconDrop {
    from { opacity: 0; transform: translateY(-8px) scale(0.85); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .sb-nav-item {
    opacity: 0;
    animation: sbIconDrop 350ms ${EASE.out} both;
  }

  /* ── Button press feedback ───────────────────────────────── */
  .sb-pressable {
    transition: transform 140ms ${EASE.out}, background 140ms ${EASE.out};
    will-change: transform;
  }
  .sb-pressable:active {
    transform: scale(0.96);
  }

  /* ── Nav link hover — glow + lift ────────────────────────── */
  .sb-link {
    transition: background 180ms ${EASE.out},
                border-color 180ms ${EASE.out},
                transform 180ms ${EASE.out},
                box-shadow 180ms ${EASE.out};
  }
  .sb-link:hover {
    background: rgba(255,255,255,0.04) !important;
    transform: translateX(2px);
  }
  .sb-link:hover .sb-icon {
    transform: scale(1.15);
    filter: drop-shadow(0 0 4px currentColor);
  }
  .sb-link:active {
    transform: translateX(0) scale(0.97);
    transition: transform 80ms ${EASE.out};
  }

  /* ── Tooltip — enters from trigger origin ────────────────── */
  .sb-tooltip {
    opacity: 0;
    transform: translateX(4px) scale(0.96);
    transform-origin: left center;
    transition: opacity 150ms ${EASE.out}, transform 150ms ${EASE.out};
    pointer-events: none;
  }
  .group:hover .sb-tooltip {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  /* ── Mobile overlay backdrop ─────────────────────────────── */
  .sb-backdrop-enter {
    animation: sbBackdropIn 200ms ${EASE.out} both;
  }
  @keyframes sbBackdropIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ── Mobile menu — slide up with scale ───────────────────── */
  .sb-menu-enter {
    animation: sbMenuIn 250ms ${EASE.out} both;
  }
  @keyframes sbMenuIn {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Label fade on expand — staggered ────────────────────── */
  .sb-label-enter {
    animation: sbLabelIn 200ms ${EASE.out} both;
  }
  @keyframes sbLabelIn {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* ── Chevron rotation ────────────────────────────────────── */
  .sb-chevron {
    transition: transform 200ms ${EASE.inOut};
    will-change: transform;
  }

  /* ── Active indicator dot pulse ──────────────────────────── */
  .sb-active-dot {
    animation: sbDotPulse 2s ease-in-out infinite;
  }
  @keyframes sbDotPulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  /* ── Logo — entrance + hover ─────────────────────────────── */
  @keyframes sbLogoIn {
    from { opacity: 0; transform: scale(0.5) rotate(-10deg); filter: blur(4px); }
    to { opacity: 1; transform: scale(1) rotate(0); filter: blur(0); }
  }
  .sb-logo {
    animation: sbLogoIn 400ms ${EASE.out} both;
    transition: transform 200ms ${EASE.out}, box-shadow 200ms ${EASE.out};
    will-change: transform;
  }
  .sb-logo:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 16px rgba(230, 57, 70, 0.4);
  }
  .sb-logo:active {
    transform: translateY(0) scale(0.92);
    transition-duration: 80ms;
  }

  /* ── Icon color + glow transition ────────────────────────── */
  .sb-icon {
    transition: color 140ms ${EASE.out}, transform 180ms ${EASE.out}, filter 180ms ${EASE.out};
  }

  /* ── Active link glow ────────────────────────────────────── */
  .sb-link-active {
    box-shadow: inset 0 0 12px rgba(0,212,255,0.06);
  }

  /* ── Reduced motion ──────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .sb-nav-item { animation: none !important; opacity: 1 !important; }
    .sb-logo { animation: none !important; opacity: 1 !important; }
  }
`

// ── Navigation items ──────────────────────────────────────────────────

interface NavItem {
  icon: typeof MessageSquare
  label: string
  href: string
  matchExact?: boolean
}

const MAIN_ITEMS: NavItem[] = [
  { icon: MessageSquare, label: 'Clay', href: '/agency', matchExact: true },
  { icon: LayoutGrid, label: 'Workspace', href: '/agency/dashboard' },
  { icon: FileText, label: 'Briefs', href: '/agency/cards' },
  { icon: Users, label: 'Creators', href: '/agency/clients' },
  { icon: Calendar, label: 'Calendar', href: '/agency/content-lab' },
  { icon: BarChart3, label: 'Analytics', href: '/agency/trend-iq' },
]

const BOTTOM_ITEMS: NavItem[] = [
  { icon: Brain, label: 'Memory', href: '/agency/memory' },
  { icon: Settings, label: 'Settings', href: '/agency/settings' },
]

// ── Sidebar component ─────────────────────────────────────────────────

export default function AgencySidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') setExpanded(true)
    } catch {}
    setLoaded(true)
  }, [])

  const toggle = () => {
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
  }

  const isActive = (item: NavItem) => {
    if (item.matchExact) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  const width = expanded ? S.widthExpanded : S.widthCollapsed

  if (!loaded) return null

  return (
    <>
      <style>{SIDEBAR_CSS}</style>

      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 h-screen sticky top-0 z-40"
        style={{
          width,
          background: S.bgSidebar,
          borderRight: `1px solid ${S.border}`,
          transition: `width 220ms ${EASE.inOut}`,
          willChange: 'width',
        }}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center px-2 pt-4 pb-3" style={{ height: 56 }}>
          <Link
            href="/agency"
            className="sb-logo flex items-center justify-center flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: S.crimson,
              marginLeft: 6,
            }}
          >
            <span className="font-display text-sm font-bold text-white select-none">T</span>
          </Link>

          {expanded && (
            <span
              className="sb-label-enter ml-3 font-display text-sm font-semibold whitespace-nowrap"
              style={{ color: S.textPrimary }}
            >
              Trendzo
            </span>
          )}

          <button
            onClick={toggle}
            className="sb-pressable ml-auto flex items-center justify-center flex-shrink-0 rounded-lg hover:bg-white/5"
            style={{
              width: 28,
              height: 28,
              color: S.textMuted,
              opacity: expanded ? 1 : 0,
              pointerEvents: expanded ? 'auto' : 'none',
              transition: `opacity 150ms ${EASE.out}`,
            }}
          >
            <ChevronLeft className="sb-chevron w-4 h-4" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 flex flex-col px-2 gap-0.5 overflow-hidden">
          {MAIN_ITEMS.map((item, i) => (
            <SidebarLink key={item.href} item={item} active={isActive(item)} expanded={expanded} index={i} />
          ))}
        </nav>

        {/* Divider + bottom items */}
        <div className="px-2 pb-4">
          <div className="mb-2" style={{ height: 1, background: S.border, margin: '0 4px' }} />
          <div className="flex flex-col gap-0.5">
            {BOTTOM_ITEMS.map((item, i) => (
              <SidebarLink key={item.href} item={item} active={isActive(item)} expanded={expanded} index={MAIN_ITEMS.length + i} />
            ))}
          </div>

          {/* Expand button when collapsed */}
          {!expanded && (
            <button
              onClick={toggle}
              className="sb-pressable flex items-center justify-center mt-2 mx-auto rounded-lg hover:bg-white/5"
              style={{ width: 36, height: 28, color: S.textMuted }}
            >
              <ChevronLeft className="sb-chevron w-4 h-4" style={{ transform: 'rotate(180deg)' }} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom bar ────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
        style={{
          height: 56,
          background: S.bgSidebar,
          borderTop: `1px solid ${S.border}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {MAIN_ITEMS.slice(0, 4).map(item => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sb-pressable flex flex-col items-center justify-center gap-0.5 flex-1 relative"
              style={{ height: '100%' }}
            >
              {active && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full sb-active-dot"
                  style={{ width: 4, height: 4, background: S.cyan }}
                />
              )}
              <Icon
                className="sb-icon w-5 h-5"
                style={{ color: active ? S.cyan : S.textMuted }}
              />
              <span
                className="text-[9px] font-body font-medium"
                style={{ color: active ? S.cyan : S.textMuted, transition: `color 140ms ${EASE.out}` }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sb-pressable flex flex-col items-center justify-center gap-0.5 flex-1"
          style={{ height: '100%' }}
        >
          <div style={{ transition: `transform 200ms ${EASE.out}`, transform: mobileOpen ? 'rotate(90deg)' : 'rotate(0)' }}>
            {mobileOpen ? (
              <X className="w-5 h-5" style={{ color: S.cyan }} />
            ) : (
              <Menu className="w-5 h-5" style={{ color: S.textMuted }} />
            )}
          </div>
          <span className="text-[9px] font-medium" style={{ color: mobileOpen ? S.cyan : S.textMuted }}>
            More
          </span>
        </button>
      </nav>

      {/* ── Mobile overflow menu ─────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 sb-backdrop-enter"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute bottom-16 left-2 right-2 rounded-xl p-2 sb-menu-enter"
            style={{
              background: S.bgSidebar,
              border: `1px solid ${S.border}`,
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
              transformOrigin: 'bottom center',
            }}
            onClick={e => e.stopPropagation()}
          >
            {[...MAIN_ITEMS.slice(4), ...BOTTOM_ITEMS].map((item, i) => {
              const Icon = item.icon
              const active = isActive(item)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="sb-pressable flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{
                    background: active ? S.bgActive : 'transparent',
                    color: active ? S.cyan : S.textPrimary,
                    animation: `sbMenuItemIn 200ms ${EASE.out} ${60 + i * 40}ms both`,
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" style={{ color: active ? S.cyan : S.textMuted }} />
                  <span className="text-sm font-body">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Staggered mobile menu item animation */}
      <style>{`
        @keyframes sbMenuItemIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

// ── Sidebar link ──────────────────────────────────────────────────────

function SidebarLink({ item, active, expanded, index }: {
  item: NavItem
  active: boolean
  expanded: boolean
  index: number
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={!expanded ? item.label : undefined}
      className={`sb-link sb-nav-item flex items-center gap-3 rounded-lg group relative ${active ? 'sb-link-active' : ''}`}
      style={{
        height: 38,
        paddingLeft: expanded ? 12 : 0,
        justifyContent: expanded ? 'flex-start' : 'center',
        background: active ? S.bgActive : 'transparent',
        border: active ? `1px solid ${S.borderActive}` : '1px solid transparent',
        animationDelay: `${100 + index * 60}ms`,
      }}
    >
      {/* Active indicator — small cyan bar on the left edge */}
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
          style={{
            width: 3,
            height: 16,
            background: S.cyan,
            boxShadow: `0 0 8px ${S.cyan}40`,
            animation: `sbActiveBar 200ms ${EASE.out} both`,
          }}
        />
      )}

      <Icon
        className="sb-icon w-[18px] h-[18px] flex-shrink-0"
        style={{ color: active ? S.cyan : S.textMuted }}
      />

      {expanded && (
        <span
          className="sb-label-enter font-body text-[13px] whitespace-nowrap"
          style={{
            color: active ? S.textPrimary : S.textMuted,
            animationDelay: `${index * 30}ms`,
          }}
        >
          {item.label}
        </span>
      )}

      {/* Tooltip when collapsed — scales from trigger origin (left edge) */}
      {!expanded && (
        <div
          className="sb-tooltip absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap"
          style={{
            background: '#1c1c24',
            color: S.textPrimary,
            border: `1px solid ${S.border}`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          {item.label}
        </div>
      )}

      <style>{`
        @keyframes sbActiveBar {
          from { opacity: 0; transform: translateY(-50%) scaleY(0.5); }
          to { opacity: 1; transform: translateY(-50%) scaleY(1); }
        }
      `}</style>
    </Link>
  )
}
