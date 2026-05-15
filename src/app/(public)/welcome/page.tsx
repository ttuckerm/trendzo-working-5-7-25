import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { CODE_PATH_COOKIE_NAME, verifyCodePathCookieValue } from '@/lib/stripe/cookie'
import { verifySession } from '@/lib/stripe/verify'
import '@/styles/instrument.css'

export const metadata: Metadata = {
  title: 'Your Escape Assessment is Ready | Trendzo',
  description:
    "Three minutes from now, you'll have a Freedom Number, a business that fits your life, a 14-day sprint, and an AI advisor trained on your situation.",
}

export const dynamic = 'force-dynamic'

// Mirrors the freedom-os page. Read-only — verifySession does NOT mark the
// session consumed; consumption happens later at the generator step.
async function waitForPaid(sessionId: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  const start = Date.now()
  const deadline = start + 10_000
  let lastReason = 'unknown'
  while (Date.now() < deadline) {
    const r = await verifySession(sessionId)
    if (r.valid) return { ok: true }
    if (r.reason === 'already_used' || r.reason === 'expired' || r.reason === 'unknown' || r.reason === 'config') {
      return { ok: false, reason: r.reason }
    }
    lastReason = r.reason
    await new Promise(res => setTimeout(res, 1000))
  }
  return { ok: false, reason: lastReason }
}

const RECEIVE_ITEMS: Array<[string, string]> = [
  ['Freedom Number', 'Calibrated to your income, expenses, and runway.'],
  ['Business Match', "Picked for who you actually are, not what's trending."],
  ['14-Day Sprint', 'Day-by-day, the tasks that move the needle.'],
  ['90-Day Roadmap', 'Where the sprint takes you over the next quarter.'],
  [
    'Lead Playbook + Freedom Agent',
    'Where to find your first customers, plus a personal advisor trained on your assessment.',
  ],
]

export default async function WelcomePage({
  searchParams,
}: {
  searchParams?: { session_id?: string; source?: string }
}) {
  const sessionId =
    typeof searchParams?.session_id === 'string' ? searchParams.session_id : null

  // Path A: paid path — validate Stripe session against stripe_purchases.
  let isPaid = false
  if (sessionId) {
    const v = await waitForPaid(sessionId)
    if (!v.ok) {
      if (v.reason === 'already_used') redirect('/?checkout=already_used')
      redirect('/?checkout=invalid')
    }
    isPaid = true
  }

  // Path B: code path — validate signed HttpOnly cookie issued by /api/landing/code-validate.
  let isCode = false
  if (!isPaid) {
    const cookieStore = cookies()
    const codeCookie = cookieStore.get(CODE_PATH_COOKIE_NAME)?.value
    if (verifyCodePathCookieValue(codeCookie)) {
      isCode = true
    }
  }

  if (!isPaid && !isCode) redirect('/')

  const formHref =
    isPaid && sessionId
      ? `/free/freedom-os?session_id=${encodeURIComponent(sessionId)}`
      : '/free/freedom-os'

  return (
    <main className="min-h-screen bg-instrument-bg text-instrument-primary font-body antialiased">
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 30%, rgba(240, 74, 77, 0.10) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-center font-mono text-[11px] tracking-[0.32em] uppercase text-instrument-tertiary mb-12 sm:mb-16">
            THE ESCAPE ASSESSMENT
          </p>

          <h1 className="text-center font-display text-3xl sm:text-5xl text-instrument-primary leading-tight mb-6">
            Your Escape Assessment is ready.
          </h1>
          <p className="text-center font-body text-lg sm:text-xl text-instrument-secondary leading-relaxed max-w-2xl mx-auto mb-12 sm:mb-14">
            Three minutes from now, you&apos;ll have a Freedom Number, a business that fits your life, a 14-day sprint, and an AI advisor trained on your situation.
          </p>

          <div className="mb-12 sm:mb-14 flex justify-center">
            <div className="w-full max-w-[720px] rounded-xl chassis-glow-soft">
              {/* Plain <img> so a missing asset degrades to a broken-image icon
                  instead of breaking the layout (per spec). */}
              <img
                src="/images/escape-assessment-product.png"
                alt="The Escape Assessment — book, dashboard, and Freedom Agent"
                className="block w-full h-auto rounded-xl"
              />
            </div>
          </div>

          <div className="max-w-2xl mx-auto mb-12 sm:mb-14">
            <p className="text-center font-mono text-[10px] tracking-[0.24em] uppercase text-instrument-tertiary mb-6">
              WHAT YOU&apos;RE ABOUT TO RECEIVE
            </p>
            <ul className="space-y-4">
              {RECEIVE_ITEMS.map(([label, body]) => (
                <li
                  key={label}
                  className="font-body text-base sm:text-[17px] text-instrument-secondary leading-relaxed"
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-instrument-primary">
                    {label}
                  </span>
                  <span aria-hidden className="mx-2 text-instrument-tertiary">—</span>
                  {body}
                </li>
              ))}
            </ul>
          </div>

          <div className="max-w-xl mx-auto text-center">
            <Link
              href={formHref}
              className="inline-block w-full font-mono text-base tracking-[0.12em] uppercase bg-instrument-crimson text-white px-6 py-4 rounded-md transition-all duration-200 hover:bg-[#ff5b5e] active:scale-[0.99] glow-crimson-soft hover:glow-crimson-medium"
            >
              BEGIN YOUR ASSESSMENT →
            </Link>
            <p className="mt-4 font-mono text-[10px] tracking-[0.24em] uppercase text-instrument-tertiary">
              TAKES ABOUT 3 MINUTES :: NO EMAIL REQUIRED
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
