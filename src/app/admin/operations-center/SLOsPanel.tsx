"use client"
import React, { useEffect, useState } from 'react'

type WindowStats = { p95_ms: number; error_rate: number; uptime: number }

export default function SLOsPanel() {
  const [w, setW] = useState<Record<string, WindowStats>>({})
  const [burn, setBurn] = useState(0)
  useEffect(()=>{ (async()=>{
    const r = await fetch('/api/ops/metrics')
    const j = await r.json()
    setW(j.windows||{})
    setBurn(Number(j.burn_rate||0))
  })() }, [])
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">SLOs & Error Budgets</h2>
      <div data-testid='slo-cards' className="grid grid-cols-3 gap-3 text-sm text-gray-300">
        {['1h','24h','7d'].map(k => (
          <div key={k} className="rounded border border-white/10 p-3">
            <div className="text-gray-400">Window: {k}</div>
            <div>p95: {w[k]?.p95_ms ?? 0} ms</div>
            <div>Error rate: {(w[k]?.error_rate ?? 0).toFixed(2)}%</div>
            <div>Uptime: {(w[k]?.uptime ?? 0).toFixed(2)}%</div>
          </div>
        ))}
      </div>
      <div id="load-summary" data-testid='load-summary' className="mt-2 text-sm text-gray-300">Burn rate (1h): {burn.toFixed(2)}x</div>
    </div>
  )
}










