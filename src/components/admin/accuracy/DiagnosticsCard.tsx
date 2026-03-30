'use client'

import React from 'react'
import { useAccuracyStore } from './state'

type StepStatus = 'PENDING' | 'OK' | 'ERROR'

type StepRow = {
  name: 'Reset' | 'Seed' | 'Calibrate' | 'Metrics'
  status: StepStatus
  info: Record<string, any>
  error?: string
}

export default function DiagnosticsCard(){
  const [serverUp, setServerUp] = React.useState<boolean | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [rows, setRows] = React.useState<StepRow[]>([ 
    { name: 'Reset', status: 'PENDING', info: {} },
    { name: 'Seed', status: 'PENDING', info: {} },
    { name: 'Calibrate', status: 'PENDING', info: {} },
    { name: 'Metrics', status: 'PENDING', info: {} }
  ])
  const setDiagStates = React.useCallback((_u: any) => {}, [])

  const setDevMode = useAccuracyStore((s) => s.setDevMode)
  const setLastMetrics = useAccuracyStore((s) => s.setLastMetrics)
  const setSelectedCohort = useAccuracyStore((s) => s.setSelectedCohort)
  const bumpRefresh = useAccuracyStore((s) => s.bumpRefresh)

  const cohortKey = 'demo-tt-001::v1'

  function fmtCounts(o?: { predictions?: number; outcomes?: number; labels?: number }) {
    if (!o) return '—'
    const parts: string[] = []
    if (o.predictions != null) parts.push(`${o.predictions} preds`)
    if (o.outcomes != null) parts.push(`${o.outcomes} outcomes`)
    if (o.labels != null) parts.push(`${o.labels} labels`)
    return parts.join(' · ')
  }

  React.useEffect(()=>{ (async()=>{
    try {
      const r = await fetch('/api/ping', { cache: 'no-store' })
      setServerUp(r.ok)
    } catch { setServerUp(false) }
  })() }, [])

  function setRow(idx: number, patch: Partial<StepRow>) {
    setRows(prev => prev.map((r, i) => i===idx? { ...r, ...patch } : r))
  }

  async function runReset() {
    setBusy(true)
    setRow(0, { status: 'PENDING', error: undefined })
    try {
      const r = await fetch('/api/dev/reset', { method: 'POST' })
      const j = await r.json().catch(()=> ({}))
      if (!r.ok) throw new Error(j?.error || j?.message || 'reset_failed')
      setRow(0, { status: 'OK', info: { cleared: j?.cleared, remaining: j?.remaining } })
      return { ok: true, json: j }
    } catch (e: any) {
      const msg = String(e?.message || e)
      console.error('[Diagnostics] reset error', msg)
      setRow(0, { status: 'ERROR', error: msg })
      return { ok: false, error: msg }
    } finally { setBusy(false) }
  }

  async function runSeed() {
    setBusy(true)
    setRow(1, { status: 'PENDING', error: undefined })
    try {
      const r = await fetch('/api/debug/seed-p1-demo', { method: 'POST' })
      const j = await r.json().catch(()=> ({}))
      if (!r.ok) throw new Error(j?.error || j?.message || 'seed_failed')
      setRow(1, { status: 'OK', info: { predictions: j?.predictions ?? 0, outcomes: j?.outcomes ?? 0, labels: (j?.labels ?? j?.labelCount ?? 0) } })
      return { ok: true, json: j }
    } catch (e: any) {
      const msg = String(e?.message || e)
      console.error('[Diagnostics] seed error', msg)
      setRow(1, { status: 'ERROR', error: msg })
      return { ok: false, error: msg }
    } finally { setBusy(false) }
  }

  async function runCalibrate() {
    setBusy(true)
    setRow(2, { status: 'PENDING', error: undefined })
    try {
      const r = await fetch('/api/jobs/calibrate?dev=1', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ cohort: cohortKey }) })
      const j = await r.json().catch(()=> ({}))
      if (!r.ok) throw new Error(j?.error || j?.message || 'calibrate_failed')
      const binsLen = Array.isArray(j?.reliabilityByCohort?.[cohortKey]) ? j.reliabilityByCohort[cohortKey].length : 0
      setRow(2, { status: 'OK', info: { mode: j?.mode, cohortsProcessed: j?.cohortsProcessed ?? j?.cohorts ?? 0, rowsJoined: j?.rowsJoined ?? 0, bins: binsLen, avgECE: j?.avgECE, avgAUC: j?.avgAUC } })
      return { ok: true, json: j }
    } catch (e: any) {
      const msg = String(e?.message || e)
      console.error('[Diagnostics] calibrate error', msg)
      setRow(2, { status: 'ERROR', error: msg })
      return { ok: false, error: msg }
    } finally { setBusy(false) }
  }

  // NEW: Safe Metrics runner
  async function runMetricsSafe(setDiag: (u: any) => void) {
    // show PENDING in the card
    setBusy(true)
    setRow(3, { status: 'PENDING', error: undefined })
    try { setDiag((s: any) => ({ ...s, metrics: { status: 'PENDING' } })) } catch {}
    try {
      // Hard-code the demo cohort and force dev=1
      const cohort = 'demo-tt-001::v1'
      const res = await fetch(
        `/api/metrics/accuracy?cohort=${encodeURIComponent(cohort)}&dev=1`,
        { cache: 'no-store' }
      )

      // If the endpoint throws HTML or non-JSON, guard it
      let data: any = null
      try {
        data = await res.json()
      } catch {
        throw new Error(`metrics endpoint did not return JSON (status ${res.status})`)
      }
      if (!res.ok) {
        throw new Error(
          data?.error
            ? String(data.error)
            : `metrics returned ${res.status}`
        )
      }

      // Save mode + numbers for the rest of the UI
      setDevMode(data?.mode === 'dev')
      setLastMetrics({
        ece: Number(data?.ece ?? 0),
        auc: Number(data?.auc ?? 0.5),
        accuracy: Number(data?.accuracy ?? 0),
        mode: data?.mode,
      })
      // Reflect success in the Diagnostics table
      setRow(3, {
        status: 'OK',
        info: {
          mode: data?.mode ?? 'dev',
          bins: Array.isArray(data?.reliability?.x) ? data.reliability.x.length : (data?.bins ?? 10),
          auc: Number(data?.auc ?? 0),
          ece: Number(data?.ece ?? 0),
        },
      })

      // Ensure the cohort is set and force the chart to reload
      setSelectedCohort('demo-tt-001::v1')
      bumpRefresh()
    } catch (e: any) {
      setRow(3, { status: 'ERROR', error: String(e?.message ?? e) })
      try { setDiag((s: any) => ({ ...s, metrics: { status: 'ERROR', error: String(e?.message ?? e) } })) } catch {}
    } finally {
      setBusy(false)
    }
  }

  async function runAll() {
    // Clear prior state
    setRows([ { name:'Reset', status:'PENDING', info:{} }, { name:'Seed', status:'PENDING', info:{} }, { name:'Calibrate', status:'PENDING', info:{} }, { name:'Metrics', status:'PENDING', info:{} } ])
    const a = await runReset(); if (!a.ok) return
    const b = await runSeed(); if (!b.ok) return
    const c = await runCalibrate(); if (!c.ok) return
    await runMetricsSafe(setDiagStates)
  }

  function statusPill(s: StepStatus) {
    const color = s==='OK'? 'bg-green-600' : s==='ERROR'? 'bg-red-600' : 'bg-gray-600'
    return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-white ${color}`}>{s}</span>
  }

  return (
    <div className="p-4 border rounded-lg bg-black/40 text-gray-100 w-full max-w-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Diagnostics</div>
        <div className="text-xs">Server: <span className={`font-semibold ${serverUp? 'text-green-400' : serverUp===false? 'text-red-400' : 'text-gray-400'}`}>{serverUp? 'UP' : serverUp===false? 'DOWN' : '—'}</span></div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <button className="text-sm border rounded px-3 py-2 font-semibold bg-white text-black disabled:opacity-60" disabled={busy} onClick={runAll}>Run Full DEV Demo</button>
        <button className="text-xs border rounded px-2 py-1 disabled:opacity-60" disabled={busy} onClick={runReset}>Reset</button>
        <button className="text-xs border rounded px-2 py-1 disabled:opacity-60" disabled={busy} onClick={runSeed}>Seed</button>
        <button className="text-xs border rounded px-2 py-1 disabled:opacity-60" disabled={busy} onClick={runCalibrate}>Calibrate</button>
        <button className="text-xs border rounded px-2 py-1 disabled:opacity-60" disabled={busy} onClick={() => runMetricsSafe(setDiagStates)}>Metrics</button>
        <button className="text-xs border rounded px-2 py-1 disabled:opacity-60 ml-auto" disabled={busy} onClick={()=>{
          try {
            const payload = {
              steps: rows,
            }
            const text = JSON.stringify(payload, null, 2)
            navigator.clipboard.writeText(text)
          } catch (e) { console.error('copy failed', e) }
        }}>Copy debug bundle</button>
      </div>
      <div className="space-y-2">
        {rows.map((r, i)=> (
          <div key={r.name} className="p-3 rounded border bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">{i+1}. {r.name}</div>
              {statusPill(r.status)}
            </div>
            {r.status !== 'PENDING' && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1">
                  {Object.keys(r.info || {}).map(k => {
                    const v = (r.info as any)[k]
                    const display = (k === 'cleared' || k === 'remaining') ? fmtCounts(v) : String(v)
                    return (
                      <div key={k}>
                        <span className="text-gray-400">{k}:</span> <span className="font-semibold">{display}</span>
                      </div>
                    )
                  })}
                </div>
                {r.error && (
                  <div className="text-red-400 break-all">{r.error}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


