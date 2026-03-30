import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PlanResultsView from '../../PlanResultsView'

export const metadata = {
  title: 'Your Plan | Freedom OS',
  description: 'View your saved Financial Freedom OS plan.',
}

async function getPlan(planId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from('freedom_os_saved_plans')
    .select('id, plan, created_at, expires_at')
    .eq('id', planId)
    .single()

  if (error || !data) return null

  // Check TTL — treat expired plans as not found
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  return data
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

  const plan = row.plan as { inputs?: Record<string, unknown>; outputs?: Record<string, unknown>; createdAt?: string }
  const outputs = plan?.outputs

  if (!outputs) notFound()

  console.log('[freedom-os/track] plan_viewed', { planId })

  const createdDate = plan.createdAt
    ? new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date(row.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

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
