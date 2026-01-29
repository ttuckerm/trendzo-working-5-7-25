'use client'

import React, { useEffect, useState } from 'react'
import RunPredictionPanel from '@/components/admin/accuracy/RunPredictionPanel'
import OutcomeForm from '@/components/admin/accuracy/OutcomeForm'
import RecalibratePanel from '@/components/admin/accuracy/RecalibratePanel'
import ReliabilityChart from '@/components/admin/accuracy/ReliabilityChart'
import WeatherPill from '@/components/admin/accuracy/WeatherPill'
import AdminProtectionWrapper from '@/lib/components/AdminProtectionWrapper'
import Link from 'next/link'
import { useAccuracyStore } from '@/components/admin/accuracy/state'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import DiagnosticsCard from '@/components/admin/accuracy/DiagnosticsCard'

export default function AdminValidationCommandCenter() {
  const [cohort, setCohort] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const setSelectedCohort = useAccuracyStore(s => s.setSelectedCohort)
  const selectedCohort = useAccuracyStore(s => s.selectedCohort)
  const bumpRefresh = useAccuracyStore(s => s.bumpRefresh)
  const lastMetrics = useAccuracyStore(s => s.lastMetrics)
  const { toast } = useToast()
  const [demoStats, setDemoStats] = useState<any>(null)

  useEffect(()=>{
    const url = new URL(window.location.href)
    const c = url.searchParams.get('cohort')
    if (c) {
      setCohort(c)
      setSelectedCohort(c)
    }
  }, [])

  useEffect(() => {
    if (selectedCohort && selectedCohort !== cohort) {
      setCohort(selectedCohort)
    }
  }, [selectedCohort])

  return (
    <AdminProtectionWrapper>
      <div className="px-6 py-5 space-y-4">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-400">
          <Link href="/admin/command-center" className="hover:underline">Command Center</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-200">Prediction Validation</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Prediction Validation — Operator Controls</h1>
            <p className="text-sm text-gray-500">Run predictions, log outcomes, and recalibrate the model</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-medium text-amber-600">Demo Controls (DEV)</div>
              <div className="flex items-center gap-2 justify-end"></div>
            </div>
            <WeatherPill cohort={cohort} />
          </div>
        </div>

        {/* Controls and Diagnostics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RunPredictionPanel />
          <OutcomeForm />
          <RecalibratePanel />
        </div>
        <div className="flex justify-end"><DiagnosticsCard /></div>

        {/* Cohort selector & chart */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input placeholder="cohort key (optional)" value={cohort} onChange={e=> { setCohort(e.target.value); setSelectedCohort(e.target.value) }} />
            <span className="text-xs text-gray-500">Format: templateId::variant or cohort hash</span>
            <button className="text-sm border rounded px-3 py-1 ml-auto disabled:opacity-60" disabled={busy} onClick={async()=>{
              setBusy(true)
              try {
                const r = await fetch(`/api/debug/seed-p1-demo?cohort=${encodeURIComponent(cohort||'')}`, { method: 'POST' })
                const j = await r.json()
                if (!r.ok) throw new Error(j?.error || 'seed_failed')
                // Auto-select cohort if not set, use first returned
                const first = 'demo-tt-001::v1'
                if (!cohort) { setCohort(first); setSelectedCohort(first) }
                // Auto-run calibrate
                const rc = await fetch('/api/jobs/calibrate?dev=1', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ cohort: first }) })
                const jc = await rc.json().catch(()=> ({}))
                if (!rc.ok) throw new Error(jc?.error || 'calibrate_failed')
                // Fetch metrics to ensure bins are present
                const rm = await fetch(`/api/metrics/accuracy?cohort=${encodeURIComponent(first)}&dev=1`, { cache:'no-store' })
                const jm = await rm.json().catch(()=> ({}))
                setDemoStats({ mode: jc?.mode || jm?.mode, predictions: j?.predictions ?? 0, outcomes: j?.outcomes ?? 0, labels: (j?.labels ?? j?.labelCount ?? 0) })
                try { const el = document.getElementById('toast-container'); if (el) el.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2' } catch {}
                toast({ title: `Demo ready — bins:10 · AUROC:${(jm?.auc ?? 0).toFixed?.(3)} · ECE:${(jm?.ece ?? 0).toFixed?.(3)} (DEV)`, description: `Cohort: ${first}`, duration: 6000 })
                bumpRefresh()
              } catch (e: any) {
                toast({ title: 'Operation failed', description: String(e?.message || e), variant: 'destructive', duration: 6000 })
              } finally { setBusy(false) }
            }}>Seed demo data (dev)</button>
          </div>
          {demoStats && (
            <div className="border rounded p-3 text-xs text-gray-600">
              <div className="font-medium mb-1">Demo status</div>
              <div className="grid grid-cols-4 gap-2">
                <div>Mode: <span className="font-semibold">DEV</span></div>
                <div>Preds: <span className="font-semibold">{demoStats.predictions}</span></div>
                <div>Outcomes: <span className="font-semibold">{demoStats.outcomes}</span></div>
                <div>Labels: <span className="font-semibold">{demoStats.labels}</span></div>
              </div>
            </div>
          )}
          {/* Top stats strip bound to store */}
          <div className="w-full bg-black text-white rounded px-3 py-2 text-sm flex gap-6">
            {(() => {
              const accuracyPct = lastMetrics ? `${(lastMetrics.accuracy * 100).toFixed(1)}%` : '0.0%'
              const eceVal = lastMetrics ? lastMetrics.ece.toFixed(3) : '0.000'
              const aucVal = lastMetrics ? lastMetrics.auc.toFixed(3) : '0.500'
              return (
                <>
                  <div><span className="opacity-70">Accuracy:</span> <span className="font-semibold">{accuracyPct}</span></div>
                  <div><span className="opacity-70">ECE:</span> <span className="font-semibold">{eceVal}</span></div>
                  <div><span className="opacity-70">AUROC:</span> <span className="font-semibold">{aucVal}</span></div>
                </>
              )
            })()}
          </div>

          <ReliabilityChart cohort={selectedCohort || cohort} />
        </div>
      </div>
    </AdminProtectionWrapper>
  )
}


