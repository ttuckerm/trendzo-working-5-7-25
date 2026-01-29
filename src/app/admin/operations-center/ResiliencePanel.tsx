"use client"
import React, { useEffect, useState } from 'react'

export default function ResiliencePanel() {
  const [health, setHealth] = useState<any>({ regions: [] })
  const [dr, setDr] = useState<any>({})
  const load = async () => {
    const h = await fetch('/api/ops/regions/health')
    setHealth(await h.json())
    const d = await fetch('/api/ops/dr/status')
    setDr(await d.json())
  }
  useEffect(()=>{ load() }, [])
  const drill = async () => { await fetch('/api/ops/regions/failover', { method:'POST' }); load() }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Resilience</h2>
      <div data-testid='region-health' className="text-sm text-gray-300 mb-2">Primary: {health.primary} • Secondary: {health.secondary} • Active: {health.active}</div>
      <button onClick={drill} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Initiate Failover Drill</button>
      <div data-testid='dr-status' className="mt-2 text-sm text-gray-300">RPO: {dr.rpo_minutes ?? 0}m • RTO: {dr.rto_minutes ?? 0}m</div>
    </div>
  )
}










