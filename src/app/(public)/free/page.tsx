import Link from 'next/link'

const SECONDARY_TOOLS = [
  { title: 'Credit Booster', description: 'Step-by-step credit score improvement plan' },
  { title: 'Debt Escape Planner', description: 'Optimized debt payoff strategy calculator' },
  { title: 'Income Stack Builder', description: 'Multi-stream income diversification planner' },
]

export const metadata = {
  title: 'Free Tools | Trendzo',
  description: 'Free financial tools — no login required.',
}

export default function FreeHubPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#050507' }}
    >
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        {/* Brand mark */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white mb-8"
          style={{
            background: 'linear-gradient(135deg, #e50914, #ff1744)',
            boxShadow: '0 8px 32px rgba(229,9,20,0.3)',
          }}
        >
          TZ
        </div>

        {/* Hero */}
        <h1
          className="text-4xl sm:text-5xl font-extrabold text-white text-center tracking-tight leading-tight mb-4"
          style={{ maxWidth: 560 }}
        >
          Value Hub
        </h1>
        <p
          className="text-base sm:text-lg text-center mb-10"
          style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 440 }}
        >
          Get a personalized roadmap in minutes. No login required.
        </p>

        {/* Primary CTA */}
        <Link
          href="/free/freedom-os"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm no-underline transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #e50914, #ff1744)',
            boxShadow: '0 4px 24px rgba(229,9,20,0.35)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Launch Freedom OS
        </Link>

        {/* Secondary tools */}
        <div className="mt-16 w-full" style={{ maxWidth: 420 }}>
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-center mb-5"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            More free tools (coming soon)
          </h2>
          <div className="flex flex-col gap-3">
            {SECONDARY_TOOLS.map((tool) => (
              <div
                key={tool.title}
                className="rounded-xl px-5 py-4"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span
                  className="text-sm font-semibold block mb-0.5"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  {tool.title}
                </span>
                <span
                  className="text-xs"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  {tool.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer disclaimer */}
      <footer className="px-6 py-8 text-center">
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.15)', maxWidth: 480, margin: '0 auto' }}
        >
          This page does not collect or transmit personal data unless you
          submit it via an embedded email form in the future.
        </p>
      </footer>
    </div>
  )
}
