import Link from 'next/link'

export const metadata = {
  title: 'Free AI Tools for Creators & Founders | Trendzo',
  description: 'Build a business that runs without you. Free AI tools that plan your business, predict your content, and coach you weekly.',
}

export default function FreeHubPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#08080d' }}>
      <main className="flex-1 flex flex-col items-center px-5 py-12 sm:py-20">
        <div className="w-full" style={{ maxWidth: 480 }}>

          {/* ── Above the fold ── */}
          <div className="text-center mb-10">
            <h1
              className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Build a Business That Runs Without You
            </h1>
            <p
              className="text-base mb-8"
              style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", lineHeight: '1.6' }}
            >
              Free AI tools that plan your business, predict your content, and coach you weekly.
            </p>

            {/* Primary CTA */}
            <Link
              href="/free/freedom-os"
              className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-white font-bold text-base no-underline transition-all mb-3"
              style={{
                background: '#e63946',
                fontFamily: "'DM Sans', sans-serif",
                minHeight: 48,
              }}
            >
              Get My Free Business Plan
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/free/freedom-agent"
              className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl font-bold text-sm no-underline transition-all"
              style={{
                background: 'transparent',
                border: '1px solid rgba(124,58,237,0.4)',
                color: '#7c3aed',
                fontFamily: "'DM Sans', sans-serif",
                minHeight: 48,
              }}
            >
              Talk to My AI Advisor
            </Link>
          </div>

          {/* ── Value cards ── */}
          <div className="mb-10">
            <p
              className="text-xs font-semibold uppercase tracking-widest text-center mb-5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              What you get — no signup, no credit card
            </p>

            <div className="flex flex-col gap-3">
              {/* Card 1: Freedom OS */}
              <div
                className="rounded-xl px-5 py-5"
                style={{
                  background: '#0f0f16',
                  border: '1px solid #1e1e2e',
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(230,57,70,0.12)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  </div>
                  <span className="text-sm font-bold text-white">Freedom OS</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
                  Answer 10 questions. Get a full business plan with revenue targets, a launch sprint, and your first 50 leads strategy. Takes 3 minutes.
                </p>
              </div>

              {/* Card 2: AI Advisor */}
              <div
                className="rounded-xl px-5 py-5"
                style={{
                  background: '#0f0f16',
                  border: '1px solid #1e1e2e',
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.12)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <span className="text-sm font-bold text-white">AI Business Advisor</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
                  A personal advisor that knows your plan, tracks your progress, and gives you specific guidance every week for 8 weeks.
                </p>
              </div>

              {/* Card 3: Trendzo */}
              <div
                className="rounded-xl px-5 py-5"
                style={{
                  background: '#0f0f16',
                  border: '1px solid #1e1e2e',
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,212,255,0.1)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <span className="text-sm font-bold text-white">When you&apos;re ready</span>
                </div>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
                  Trendzo&apos;s full platform: know what to post before you make it, AI-generated content briefs, creator portfolio management. Founding access available.
                </p>
              </div>
            </div>
          </div>

          {/* ── Loss framing ── */}
          <div className="flex flex-col gap-4 mb-10">
            <div className="px-4 py-3" style={{ borderLeft: '3px solid #e63946' }}>
              <p className="text-sm" style={{ color: '#a0a0a0', fontStyle: 'italic', lineHeight: '1.6' }}>
                Every week without a plan is a week your competitors are building.
              </p>
            </div>
            <div className="px-4 py-3" style={{ borderLeft: '3px solid #e63946' }}>
              <p className="text-sm" style={{ color: '#a0a0a0', fontStyle: 'italic', lineHeight: '1.6' }}>
                The creators winning right now aren&apos;t guessing what to post. They know before they press record.
              </p>
            </div>
            <div className="px-4 py-3" style={{ borderLeft: '3px solid #e63946' }}>
              <p className="text-sm" style={{ color: '#a0a0a0', fontStyle: 'italic', lineHeight: '1.6' }}>
                Your free plan takes 3 minutes. Your excuses take longer.
              </p>
            </div>
          </div>

          {/* ── Bottom CTA ── */}
          <div className="text-center">
            <Link
              href="/free/freedom-os"
              className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-xl text-white font-bold text-base no-underline transition-all"
              style={{
                background: '#e63946',
                fontFamily: "'DM Sans', sans-serif",
                minHeight: 48,
              }}
            >
              Get My Free Business Plan
            </Link>
            <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              No login. No credit card. Takes 3 minutes.
            </p>
          </div>

        </div>
      </main>

      <footer className="px-6 py-6 text-center">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.12)', maxWidth: 480, margin: '0 auto' }}>
          Free tools by Trendzo. No personal data collected unless you submit it via a form.
        </p>
      </footer>
    </div>
  )
}
