'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Bin = { p_mid:number; frac_positive:number; count:number }

export default function PublicAccuracyPage() {
  const [summary, setSummary] = useState<any|null>(null)
  const [learning, setLearning] = useState<any|null>(null)
  const [adapt, setAdapt] = useState<any|null>(null)
  const [err, setErr] = useState<string>('')

  const load = async () => {
    try {
      const r = await fetch('/api/validation/summary', { cache: 'no-store' })
      const j = await r.json()
      setSummary(j)
      try {
        const lr = await fetch('/api/learning/summary', { cache: 'no-store' })
        const lj = await lr.json()
        setLearning(lj)
      } catch {}
      try {
        const ar = await fetch('/api/adaptation/summary', { cache: 'no-store' })
        const aj = await ar.json()
        setAdapt(aj)
      } catch {}
    } catch (e:any) { setErr(String(e?.message||e)) }
  }

  useEffect(()=>{ load() }, [])

  const accPct = useMemo(()=> (summary && summary.validated>0 ? (summary.correct/summary.validated*100) : 0), [summary])

  const recompute = async () => {
    await fetch('/api/validation/recompute', { method:'POST' })
    await load()
  }

  if (err) return <div className="container mx-auto p-6"><p className="text-sm text-gray-600">{err}</p></div>
  if (!summary) return <div className="container mx-auto p-6"><p>Loading…</p></div>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Accuracy</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Accuracy</div>
          <div className="text-2xl font-bold">{accPct.toFixed(1)}% — {summary.correct}/{summary.validated}</div>
          <div className="text-xs text-gray-500">Rule: z≥2 & percentile≥95 within first 48h</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">AUROC</div>
          <div className="text-xl font-bold">{summary.auroc.toFixed(3)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">ECE</div>
          <div className="text-xl font-bold">{summary.ece.toFixed(3)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Validated</div>
              <div className="text-xl font-bold">{summary.validated}</div>
              <div className="text-xs text-gray-500">Window={process.env.VALIDATION_WINDOW_HOURS||48}h</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Model</div>
              <div className="text-sm font-semibold">v{learning?.currentVersion || 1}{learning?.candidateVersion? <span className="ml-1 text-xs border rounded px-1">candidate v{learning.candidateVersion}</span>: null}</div>
              <div className="text-[10px] text-gray-500">Algorithm Weather</div>
              <div className={`text-xs ${adapt?.weather?.status==='Stable'?'text-green-600': adapt?.weather?.status==='Shifting'?'text-yellow-600':'text-red-600'}`}>Weather: {adapt?.weather?.status||'Unknown'}</div>
              <div className="text-[10px] text-gray-500">Last change: {adapt?.weather?.lastChangeISO ? new Date(adapt.weather.lastChangeISO).toLocaleString() : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border rounded">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">Reliability curve</div>
          <div className="flex gap-2">
            <button className="text-xs border rounded px-2 py-1" onClick={recompute}>Recompute now</button>
            <button className="text-xs border rounded px-2 py-1" onClick={async()=>{ await fetch('/api/adaptation/scan', { method:'POST' }); await load() }}>Scan for changes</button>
            {adapt?.latestProposal && <button className="text-xs border rounded px-2 py-1" onClick={async()=>{ await fetch('/api/adaptation/apply', { method:'POST' }); await load() }}>Apply proposal</button>}
            <button className="text-xs border rounded px-2 py-1" onClick={async()=>{ await fetch('/api/learning/update', { method:'POST' }); await load() }}>Update Model</button>
            {learning?.candidateVersion && <button className="text-xs border rounded px-2 py-1" onClick={async()=>{ await fetch('/api/learning/promote', { method:'POST' }); await load() }}>Promote Candidate</button>}
          </div>
        </div>
        {adapt?.latestProposal && (
          <div className="text-xs text-gray-700 mb-2">
            <div>Proposed: Δthreshold → {adapt.latestProposal.newThreshold?.toFixed?.(2)}; ΔECE≈ {Number.isFinite(adapt?.weather?.driftIndex)? adapt.weather.driftIndex.toFixed(3):'-'}</div>
          </div>
        )}
        <div className="grid grid-cols-10 gap-1 items-end h-32">
          {(summary.bins as Bin[]).map((b, i)=>{
            const h = Math.max(1, Math.round(b.frac_positive*100))
            return <div key={i} title={`bin ${i+1}: pred ${b.p_mid}, emp ${b.frac_positive}`} className="bg-blue-500" style={{ height: `${h}%` }} />
          })}
        </div>
      </div>
    </div>
  )
}

