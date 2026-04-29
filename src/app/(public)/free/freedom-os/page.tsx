import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import FreedomOSTool from './FreedomOSTool'
import { CODE_PATH_COOKIE_NAME, verifyCodePathCookieValue } from '@/lib/stripe/cookie'
import { verifySession } from '@/lib/stripe/verify'

export const metadata = {
  title: 'Generate Your Escape Assessment | Trendzo',
  description: 'Answer 9 questions. Get a personalized 14-day sprint, a 90-day roadmap, your Freedom Number, and a personal AI advisor. Three minutes.',
}

export const dynamic = 'force-dynamic'

// Webhook lag tolerance: poll verify up to 10s with 1s backoff before failing.
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
    // 'pending' — keep waiting.
    lastReason = r.reason
    await new Promise(res => setTimeout(res, 1000))
  }
  return { ok: false, reason: lastReason }
}

export default async function FreedomOSPage({
  searchParams,
}: {
  searchParams?: { session_id?: string; code?: string }
}) {
  const sessionId = typeof searchParams?.session_id === 'string' ? searchParams.session_id : null

  // Path A: paid checkout — validate Stripe session server-side.
  if (sessionId) {
    const v = await waitForPaid(sessionId)
    if (!v.ok) {
      if (v.reason === 'already_used') redirect('/?checkout=already_used')
      redirect('/?checkout=invalid')
    }
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#050507' }}>
        <main className="flex-1">
          <FreedomOSTool sessionId={sessionId} />
        </main>
      </div>
    )
  }

  // Path B: code redemption — validate signed HttpOnly cookie issued by /api/landing/code-validate.
  const cookieStore = cookies()
  const codeCookie = cookieStore.get(CODE_PATH_COOKIE_NAME)?.value
  if (verifyCodePathCookieValue(codeCookie)) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#050507' }}>
        <main className="flex-1">
          <FreedomOSTool sessionId={null} />
        </main>
      </div>
    )
  }

  // No proof of access at all → back to the landing page.
  redirect('/')
}
