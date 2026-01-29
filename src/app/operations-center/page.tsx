'use client'

import React, { useEffect, useState } from 'react'

type OnCallNow = { user: string; contacts: { email?: string; sms?: string } }
type BugSlaSummary = { open_p1: number; open_p2: number; breach_count: number }
type VocSummary = { feedback_count: number; nps_avg: number; csat_by_flow: Record<string, number> }
type DocsIdx = { items: { slug: string; title: string }[]; tutorials: { title: string; url: string; type: string; duration_s: number }[] }
type GrowthSummary = { activation_rate: number; d7_retention: number }
type WarehouseManifest = { files: { name: string; size: number }[] }

export default function OperationsCenter() {
  const [oncall, setOncall] = useState<OnCallNow | null>(null)
  const [bugSla, setBugSla] = useState<BugSlaSummary | null>(null)
  const [voc, setVoc] = useState<VocSummary | null>(null)
  const [docs, setDocs] = useState<DocsIdx | null>(null)
  const [growth, setGrowth] = useState<GrowthSummary | null>(null)
  const [warehouse, setWarehouse] = useState<WarehouseManifest | null>(null)
  const [releaseOk, setReleaseOk] = useState<boolean>(false)
  const [automationOk, setAutomationOk] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      try {
        const r1 = await fetch('/api/oncall/now')
        if (r1.ok) setOncall(await r1.json())
      } catch {}
      try {
        const r2 = await fetch('/api/bugs/sla/summary')
        if (r2.ok) setBugSla(await r2.json())
      } catch {}
      try {
        const r3 = await fetch('/api/feedback/summary')
        if (r3.ok) setVoc(await r3.json())
      } catch {}
      try {
        const r4 = await fetch('/api/docs/index')
        if (r4.ok) setDocs(await r4.json())
      } catch {}
      try {
        const r5 = await fetch('/api/growth/summary')
        if (r5.ok) setGrowth(await r5.json())
      } catch {}
      try {
        const r6 = await fetch('/api/warehouse/manifest')
        if (r6.ok) setWarehouse(await r6.json())
      } catch {}
      try {
        const r7 = await fetch('/api/release/notes/latest')
        setReleaseOk(r7.ok)
      } catch {}
      try {
        const r8 = await fetch('/api/automations/status')
        setAutomationOk(r8.ok)
      } catch {}
    })()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Operations Center</h1>

      <section id="incidents" aria-label="Support & Incidents" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Support & Incidents</h2>
        <div className="text-sm text-gray-300 mb-2">On-call now: {oncall?.user || '—'}</div>
        <div data-testid='incidents-table' className="border border-white/10 rounded p-3">
          <div className="text-sm">Use API to create/ack/resolve incidents.</div>
        </div>
      </section>

      <section id="quality" aria-label="Quality" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Quality</h2>
        <div data-testid='bug-sla' className="border border-white/10 rounded p-3 text-sm">
          Open P1: {bugSla?.open_p1 ?? 0} • Open P2: {bugSla?.open_p2 ?? 0} • Breaches: {bugSla?.breach_count ?? 0}
        </div>
      </section>

      <section id="voc" aria-label="Voice of Customer" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Voice of Customer</h2>
        <div data-testid='voc-panel' className="border border-white/10 rounded p-3 text-sm">
          Feedback: {voc?.feedback_count ?? 0} • NPS avg: {voc?.nps_avg?.toFixed?.(2) ?? '0.00'} • CSAT flows: {Object.keys(voc?.csat_by_flow || {}).length}
        </div>
      </section>

      <section id="docs" aria-label="Docs & Tutorials" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Docs & Tutorials</h2>
        <div data-testid='docs-index' className="border border-white/10 rounded p-3 text-sm">
          Docs: {docs?.items?.length ?? 0} • Tutorials: {docs?.tutorials?.length ?? 0}
        </div>
      </section>

      <section id="developers" aria-label="Developers" className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Integrations</h3>
        <div data-testid='integrations-zapier-make' className="border border-white/10 rounded p-3 text-sm">
          Manifests: <a className="underline" href="/integrations/zapier/app.json">Zapier</a> • <a className="underline" href="/integrations/make/app.json">Make</a>
        </div>
      </section>

      <section id="affiliates" aria-label="Referrals & Affiliates" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Referrals & Affiliates</h2>
        <div data-testid='affiliate-panel' className="border border-white/10 rounded p-3 text-sm">
          Create codes, copy links, view stats via API.
        </div>
      </section>

      <section id="growth" aria-label="Growth Analytics" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Growth Analytics</h2>
        <div data-testid='growth-analytics' className="border border-white/10 rounded p-3 text-sm">
          Activation: {growth?.activation_rate?.toFixed?.(2) ?? '0.00'} • D7: {growth?.d7_retention?.toFixed?.(2) ?? '0.00'}
        </div>
      </section>

      <section id="warehouse" aria-label="Warehouse Export" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Warehouse</h2>
        <div data-testid='warehouse-status' className="border border-white/10 rounded p-3 text-sm">
          Files: {warehouse?.files?.length ?? 0}
        </div>
      </section>

      <section id="release" aria-label="Release Manager" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Release Manager</h2>
        <div data-testid='release-notes' className="border border-white/10 rounded p-3 text-sm">
          Latest release note: {releaseOk ? 'Available' : '—'}
        </div>
      </section>

      <section id="automation" aria-label="Automations" className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Close-the-loop Automations</h2>
        <div data-testid='automation-status' className="border border-white/10 rounded p-3 text-sm">
          Status: {automationOk ? 'OK' : '—'}
        </div>
      </section>
    </div>
  )
}



