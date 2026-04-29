import type { Metadata } from 'next'
import { RecoverForm } from './RecoverForm'
import '@/styles/instrument.css'

export const metadata: Metadata = {
  title: 'Lost Your Assessment Link | Trendzo',
  description:
    "Drop your email and we'll resend the link to your Escape Assessment.",
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function RecoverPage() {
  return (
    <main className="min-h-screen bg-instrument-bg text-instrument-primary font-body antialiased">
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-28 pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 20%, rgba(240, 74, 77, 0.08) 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-xl mx-auto">
          <p className="text-center font-mono text-[11px] tracking-[0.32em] uppercase text-instrument-tertiary mb-12">
            TRENDZO :: ESCAPE ASSESSMENT
          </p>

          <h1 className="text-center font-display text-3xl sm:text-4xl text-instrument-primary leading-tight mb-4">
            Lost your assessment link?
          </h1>
          <p className="text-center font-body text-base sm:text-lg text-instrument-secondary leading-relaxed mb-10">
            Drop your email and we&apos;ll send it to you.
          </p>

          <RecoverForm />
        </div>
      </section>
    </main>
  )
}
