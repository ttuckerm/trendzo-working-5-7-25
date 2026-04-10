import AgencyAuthGate from './AuthGate'
import AgencySidebar from './components/AgencySidebar'

/* ── Global animation polish for all /agency/* pages ─────────────────
 *  1. prefers-reduced-motion: strip motion for accessibility
 *  2. :active scale on all buttons/links: instant press feedback
 *  3. hover guard: prevent sticky hover on touch devices
 *  Emil Kowalski design engineering principles applied globally.
 */
const AGENCY_ANIMATION_CSS = `
  /* ── Accessibility: reduced motion ─────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  /* ── Press feedback: every button and link ─────────────────── */
  /* Strong ease-out curve — not the weak built-in one */
  button, a, [role="button"] {
    transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1),
                background 140ms cubic-bezier(0.23, 1, 0.32, 1),
                color 140ms cubic-bezier(0.23, 1, 0.32, 1),
                opacity 140ms cubic-bezier(0.23, 1, 0.32, 1),
                border-color 140ms cubic-bezier(0.23, 1, 0.32, 1);
  }
  button:active, a:active, [role="button"]:active {
    transform: scale(0.97);
  }
  /* Smaller elements get slightly more press feedback */
  button:active svg, a:active svg {
    transform: scale(0.95);
  }
  /* Don't scale disabled elements */
  button:disabled:active, a[aria-disabled="true"]:active {
    transform: none;
  }

  /* ── Missing keyframes used across agency components ──────── */
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes materialize {
    from { opacity: 0; transform: scale(0.97) translateY(6px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* ── Hover guard: touch devices ────────────────────────────── */
  @media (hover: none) {
    button:hover, a:hover, [role="button"]:hover {
      background: initial !important;
      color: inherit !important;
      opacity: 1 !important;
      border-color: inherit !important;
    }
  }
`

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgencyAuthGate>
      <style dangerouslySetInnerHTML={{ __html: AGENCY_ANIMATION_CSS }} />
      <div className="flex min-h-screen" style={{ background: '#08080d' }}>
        <AgencySidebar />
        <main className="flex-1 min-w-0 pb-14 md:pb-0">
          {children}
        </main>
      </div>
    </AgencyAuthGate>
  )
}
