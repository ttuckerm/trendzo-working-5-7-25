'use client'
import React from 'react'

export default function LabelsPage(){
  const [dist, setDist] = React.useState<any[]>([])
  const load = async()=>{
    const r = await fetch('/api/labels/norm-24h', { cache:'no-store' })
    const j = await r.json()
    setDist(j.distribution||[])
  }
  React.useEffect(()=>{ load() }, [])
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Success Labeling (Normalized)</h1>
      <button data-testid="btn-rebuild-baselines" className="border rounded px-3 py-1" onClick={async()=>{
        await fetch('/api/labels/rebuild-baselines', { method:'POST' }); load()
      }}>Rebuild Baselines</button>
      <div data-testid="chart-norm-24h" className="grid grid-cols-5 gap-2">
        {dist.map((b)=> (<div key={b.bin} className="h-24 bg-blue-200" style={{height: `${Math.round(b.pct*100)}px`}} />))}
      </div>
    </div>
  )
}


