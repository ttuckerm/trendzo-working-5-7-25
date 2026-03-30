import Link from 'next/link'

export default function PlanNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#050507' }}>
      <div className="text-center max-w-md px-6">
        <div className="text-5xl mb-4" style={{ color: 'rgba(255,255,255,0.15)' }}>404</div>
        <h1 className="text-xl font-extrabold text-white mb-2">Plan not found</h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
          This plan may have expired or the link is invalid. You can generate a new plan for free.
        </p>
        <Link
          href="/free/freedom-os"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white no-underline transition-all"
          style={{
            background: 'linear-gradient(135deg, #e50914, #ff1744)',
            boxShadow: '0 4px 20px rgba(229,9,20,0.35)',
          }}
        >
          Build a New Plan
        </Link>
      </div>
    </div>
  )
}
