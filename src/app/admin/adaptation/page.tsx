'use client'

import React from 'react'

export default function AdaptationCenterPage(){
  const [summary, setSummary] = React.useState<any|null>(null)
  const [loading, setLoading] = React.useState(false)
  const auto = (summary?.autoPromote === true)

  const load = async () => {
    try {
      const r = await fetch('/api/adaptation/summary', { cache:'no-store' })
      const j = await r.json()
      setSummary(j)
    } catch {}
  }
  React.useEffect(()=>{ load() },[])

  const scan = async () => {
    setLoading(true)
    try { await fetch('/api/adaptation/scan', { method:'POST' }) } catch {}
    await load()
    setLoading(false)
  }
  const apply = async () => {
    setLoading(true)
    try { await fetch('/api/adaptation/apply', { method:'POST' }) } catch {}
    await load()
    setLoading(false)
  }
  const promote = async () => {
    setLoading(true)
    try { await fetch('/api/learning/promote', { method:'POST' }) } catch {}
    await load()
    setLoading(false)
  }

  const rollback = async () => {
    setLoading(true)
    try {
      // Rollback: promote previous version file if exists
      await fetch('/api/learning/promote?rollback=1', { method:'POST' })
    } catch {}
    await load()
    setLoading(false)
  }

  const s = summary
  const sig = (s as any)?.signals || null
  const prop = (s as any)?.latestProposal || null
  const changes = (s as any)?.recentChanges || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Adaptation Center</h1>
        <span className={`text-xs px-2 py-1 rounded ${auto?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>Auto-promote: {auto?'On':'Off'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500 mb-1">Signals</div>
          <div className="text-xs">PSI(prob): {(sig?.psiProb??0).toFixed(3)}</div>
          <div className="text-xs">PSI(features): {(sig?.psiFeatures??0).toFixed(3)}</div>
          <div className="text-xs">ΔECE: {(sig?.dECE??0).toFixed(3)}</div>
          <div className="text-xs">ΔAcc: {(sig?.dAcc??0).toFixed(3)}</div>
          <div className="text-xs">JS(template): {(sig?.jsTemplate??0).toFixed(3)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500 mb-1">Proposed Change</div>
          {prop? (
            <div className="text-xs space-y-1">
              <div>Severity: {prop.severity}</div>
              <div>Threshold → {prop.newThreshold?.toFixed?.(2)}</div>
              <div>Weights: {Object.keys(prop.newWeights||{}).map(k=>`${k}:${Number(prop.newWeights[k]).toFixed(2)}`).join(', ')}</div>
              <div>Expected: acc {prop.expected?.accuracy?.toFixed?.(3)} ece {prop.expected?.ece?.toFixed?.(3)}</div>
            </div>
          ) : <div className="text-xs text-gray-500">No proposal yet</div>}
        </div>
        <div className="p-4 border rounded md:col-span-2">
          <div className="text-sm text-gray-500 mb-1">Recent Changes</div>
          <div className="text-xs space-y-1 max-h-40 overflow-auto">
            {changes.map((c:any,i:number)=> (
              <div key={i} className="flex justify-between border-b py-1">
                <div>{new Date(c.appliedAtISO || c.proposed?.createdAtISO || Date.now()).toLocaleString()}</div>
                <div>{c.applied? 'APPLIED' : 'PROPOSED'}</div>
                <div>{c.proposed?.severity}</div>
                <div>thr {c.proposed?.newThreshold?.toFixed?.(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button disabled={loading} className="text-sm border rounded px-3 py-1" onClick={scan}>Scan</button>
        <button disabled={loading || !prop} className="text-sm border rounded px-3 py-1" onClick={apply}>Apply</button>
        <button disabled={loading} className="text-sm border rounded px-3 py-1" onClick={promote}>Promote Candidate</button>
        <button disabled={loading} className="text-sm border rounded px-3 py-1" onClick={rollback}>Rollback</button>
      </div>

      <div className="p-4 border rounded">
        <div className="text-sm text-gray-500">Safety</div>
        <div className="text-xs">FP cap: decision threshold grid search holds FP ≤ +3% absolute vs current window.</div>
      </div>
    </div>
  )
}


