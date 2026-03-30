'use client'

import React, { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useAccuracyStore } from './state'

export default function RecalibratePanel({ onDone }: { onDone?: ()=>void }) {
  const [busy, setBusy] = useState(false)
  const [resp, setResp] = useState<any>(null)
  const { toast } = useToast()
  const bumpRefresh = useAccuracyStore(s => s.bumpRefresh)
  const setSelectedCohort = useAccuracyStore(s => s.setSelectedCohort)
  const selectedCohort = useAccuracyStore(s => s.selectedCohort)

  async function run() {
    setBusy(true)
    try {
      const r = await fetch('/api/jobs/calibrate', { method: 'POST' })
      const j = await r.json().catch(()=> ({}))
      setResp(j)
      onDone?.()
      if (r.ok) {
        const msg = `Calibrated ${j?.cohortsProcessed ?? j?.cohorts ?? '—'} cohorts • rows ${j?.rowsJoined ?? '—'} • avgECE ${(j?.avgECE ?? 0).toFixed?.(3)} • avgAUC ${(j?.avgAUC ?? 0).toFixed?.(3)}${j?.mode ? ` • mode ${String(j.mode).toUpperCase()}`:''}`
        toast({ title: 'Recalibration complete', description: msg })
        // If no cohort selected, auto-fill first detail cohort
        const first = Array.isArray(j?.details) && j.details.length ? j.details[0].cohortKey : undefined
        if (!selectedCohort && first) setSelectedCohort(first)
        bumpRefresh()
      } else {
        throw new Error(j?.error || 'calibrate_failed')
      }
    } finally { setBusy(false) }
  }

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="font-medium flex items-center gap-2">
        <span>Recalibrate</span>
        {resp?.mode && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${resp.mode==='dev' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>Mode: {String(resp.mode).toUpperCase()}</span>
        )}
      </div>
      <button className="text-sm border rounded px-3 py-1" onClick={run} disabled={busy}>{busy? 'Recalibrating…' : 'Run calibration'}</button>
      {resp && (
        <div className="text-xs text-gray-600">cohorts: {resp?.cohorts ?? '—'} | avgECE: {(resp?.avgECE ?? 0).toFixed?.(3)}</div>
      )}
    </div>
  )
}


