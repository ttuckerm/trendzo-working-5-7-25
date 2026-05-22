import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PlanResultsView from '../../PlanResultsView'
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your Plan | Freedom OS',
  description: 'View your saved Financial Freedom OS plan.',
}

type PlanRow =
  | { source: 'saved'; id: string; email: string | null; plan: unknown; created_at: string; expires_at: string | null }
  | { source: 'generated'; id: string; email: string | null; plan: unknown; created_at: string; expires_at: null }

async function getPlan(planId: string): Promise<PlanRow | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  })

  const { data: gen, error: genErr } = await supabase
    .from('freedom_os_plans')
    .select('id, email, plan, created_at')
    .eq('id', planId)
    .maybeSingle()

  if (!genErr && gen?.plan) {
    return {
      source: 'generated',
      id: gen.id as string,
      email: (gen.email as string | null) ?? null,
      plan: gen.plan,
      created_at: gen.created_at as string,
      expires_at: null,
    }
  }

  const { data, error } = await supabase
    .from('freedom_os_saved_plans')
    .select('id, email, plan, created_at, expires_at')
    .eq('id', planId)
    .maybeSingle()

  if (error || !data?.plan) return null

  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  return {
    source: 'saved',
    id: data.id as string,
    email: (data.email as string | null) ?? null,
    plan: data.plan,
    created_at: data.created_at as string,
    expires_at: data.expires_at as string | null,
  }
}

export default async function SavedPlanPage({
  params,
}: {
  params: Promise<{ planId: string }>
}) {
  const { planId } = await params

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(planId)) notFound()

  const row = await getPlan(planId)
  if (!row) notFound()

  const plan = row.plan as {
    inputs?: Record<string, unknown>
    outputs?: Record<string, unknown>
    createdAt?: string
  }
  // Claude API plans store { outputs, beehiiv_*, ... }; legacy saves wrap { inputs, outputs }
  const outputs = plan?.outputs ?? (plan as Record<string, unknown>)

  if (!outputs || typeof outputs !== 'object') notFound()

  console.log('[freedom-os/track] plan_viewed', { planId })

  const createdDate = plan.createdAt
    ? new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date(row.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const advisorHref = row.email
    ? `/free/freedom-agent?email=${encodeURIComponent(row.email)}&planId=${planId}`
    : `/free/freedom-agent?planId=${planId}`

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#050507' }}>
      {/* Print stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: #fff !important; color: #111 !important; -webkit-print-color-adjust: exact; }
          .print-hide { display: none !important; }
          .print-only { display: block !important; }
          .print-section {
            background: #fff !important;
            border: 1px solid #e5e7eb !important;
            color: #111 !important;
            page-break-inside: avoid;
          }
          .print-section * { color: #111 !important; }
          .print-section h3 { color: #666 !important; }
          @page { margin: 1.5cm; }
        }
      `}} />

      {/* Advisor CTA banner — sticky at top, always present */}
      <div
        className="print-hide sticky top-0 z-40"
        style={{
          background: 'rgba(10,10,14,0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(124,58,237,0.25)',
        }}
      >
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
            <div
              className="shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                background: 'rgba(124,58,237,0.18)',
                border: '1px solid rgba(124,58,237,0.35)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <p
              className="text-xs sm:text-sm leading-snug"
              style={{ color: 'rgba(255,255,255,0.8)', fontFamily: "'Montserrat', sans-serif" }}
            >
              <span className="font-bold text-white">Your AI business advisor is ready</span>
              <span style={{ color: 'rgba(255,255,255,0.55)' }}> — it already knows your plan, your niche, and your numbers.</span>
            </p>
          </div>
          <a
            href={advisorHref}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline transition-all shrink-0"
            style={{
              background: '#7c3aed',
              boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
            }}
          >
            Talk To Your Advisor
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </a>
        </div>
      </div>

      <main className="flex-1">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/free/freedom-os"
              className="inline-flex items-center gap-1.5 text-xs font-medium no-underline mb-6 print-hide"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              Build a new plan
            </Link>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              Your Freedom Plan
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Created {createdDate}
            </p>
          </div>

          {/* Print header */}
          <div className="print-only" style={{ display: 'none' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Financial Freedom OS &mdash; Your Plan</h1>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 24 }}>Generated {createdDate}</p>
          </div>

          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <PlanResultsView outputs={outputs as any} planId={planId} />

          {/* CTA */}
          <div className="text-center mt-8 print-hide">
            <Link
              href="/free/freedom-os"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white no-underline transition-all"
              style={{
                background: 'linear-gradient(135deg, #e50914, #ff1744)',
                boxShadow: '0 4px 20px rgba(229,9,20,0.35)',
              }}
            >
              Build Your Own Plan
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
