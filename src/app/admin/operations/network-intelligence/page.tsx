/**
 * Prompt 44 — Network Intelligence admin page.
 *
 * This lives under /admin/* which is already protected by
 * AdminAuthGate (src/app/admin/AuthGate.tsx). Any user reaching this
 * page is a chairman / sub_admin — i.e. an internal operator.
 * Operators ARE the audience for network intelligence, so there is
 * no additional tier gate on the admin surface.
 *
 * (The tier gate in src/lib/network-intelligence/tier-gate.ts is for
 * future customer-facing surfaces where a tenant agency might view
 * insights; the API route at /api/network-intelligence/insights
 * enforces it. This page queries the DB directly with the service key.)
 */

import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface Insight {
  id: string
  insight_type: string
  insight_text: string
  statistical_payload: Record<string, unknown>
  confidence_score: number
  supporting_agency_count: number
  supporting_run_count: number
  niche_scope: string
  llm_model: string | null
  created_at: string
}

async function loadInsights(): Promise<Insight[]> {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  )
  const { data } = await db
    .from('network_insights')
    .select(
      'id, insight_type, insight_text, statistical_payload, confidence_score, supporting_agency_count, supporting_run_count, niche_scope, llm_model, created_at, expires_at',
    )
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(200)

  // Dedup by (insight_type, niche_scope) — keep latest only.
  const seen = new Set<string>()
  const deduped: Insight[] = []
  for (const row of (data || []) as any[]) {
    const key = `${row.insight_type}::${row.niche_scope}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(row as Insight)
  }
  return deduped
}

function typeLabel(t: string): string {
  switch (t) {
    case 'timing_optimization': return 'Timing optimization'
    case 'format_effectiveness': return 'Format effectiveness'
    case 'retention_correlation': return 'Retention correlation'
    case 'posting_frequency': return 'Posting frequency'
    default: return t
  }
}

export default async function NetworkIntelligencePage() {
  const insights = await loadInsights()

  const grouped = new Map<string, Insight[]>()
  for (const i of insights) {
    const arr = grouped.get(i.insight_type) || []
    arr.push(i)
    grouped.set(i.insight_type, arr)
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Network Intelligence</h1>
        <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-700">
          Operator view
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Anonymized aggregate insights across the Trendzo network. Every finding is backed by
        statistical significance testing (p&lt;0.05, k≥10 agencies).
      </p>

      {insights.length === 0 ? (
        <div className="mt-8 rounded-lg border border-slate-700 bg-slate-900/40 p-6 text-sm text-slate-400">
          No insights generated yet. The nightly pipeline runs at 04:45 UTC and requires at
          least 30 active agencies plus 100+ prediction runs per niche. Current network size
          is below that threshold — insights will appear once the network grows.
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {Array.from(grouped.entries()).map(([type, items]) => (
            <section key={type}>
              <h2 className="mb-3 text-lg font-semibold text-white">{typeLabel(type)}</h2>
              <div className="space-y-3">
                {items.map((i) => (
                  <article
                    key={i.id}
                    className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-mono">{i.niche_scope}</span>
                      <span>
                        {i.supporting_agency_count} agencies · {i.supporting_run_count} runs ·
                        confidence {(i.confidence_score * 100).toFixed(0)}%
                        {i.llm_model ? ` · ${i.llm_model}` : ' · template'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-100">{i.insight_text}</p>
                    <details className="mt-3 text-xs text-slate-500">
                      <summary className="cursor-pointer">Statistical payload</summary>
                      <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-2 text-slate-300">
                        {JSON.stringify(i.statistical_payload, null, 2)}
                      </pre>
                    </details>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-10 text-sm text-slate-500">
        <Link href="/admin/operations" className="underline">← Back to operations</Link>
      </p>
    </main>
  )
}
