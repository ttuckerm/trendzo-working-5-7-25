"use client"
import React, { useEffect, useState } from 'react'

export default function ChaosPanel() {
  const [active, setActive] = useState(false)
  const [latencyMs, setLatencyMs] = useState(150)
  const toggle = async () => {
    await fetch('/api/ops/chaos/toggle', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ latency_ms: active ? 0 : latencyMs, duration_min: 10 }) })
    setActive(!active)
  }
  useEffect(()=>{ (async()=>{ const r = await fetch('/api/ops/chaos/status'); const j = await r.json(); setActive(Boolean(j.active)) })() }, [])
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Chaos Drill</h2>
      <div className="flex items-center gap-2">
        <input aria-label="Latency (ms)" type="number" value={latencyMs} onChange={e=>setLatencyMs(Number(e.target.value))} className="px-2 py-1 bg-black/30 border border-white/10 rounded" />
        <button data-testid='chaos-toggle' onClick={toggle} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">{active? 'Disable' : 'Enable'} latency drill</button>
      </div>
      {active && (<div className="mt-2 text-yellow-400">Chaos drill active (auto reverts in 10m)</div>)}
    </div>
  )
}










