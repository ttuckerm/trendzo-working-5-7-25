'use client'
import React from 'react'

export default function WindowsPage(){
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const load = async()=>{
    setLoading(true)
    const r = await fetch('/api/windows/coverage', { cache:'no-store' })
    const j = await r.json()
    setData(j)
    setLoading(false)
  }
  React.useEffect(()=>{ load() }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Engagement Windows</h1>
      <button data-testid="btn-recompute-window" className="border rounded px-3 py-1" onClick={async()=>{
        await fetch('/api/windows/recompute', { method:'POST' }); load()
      }}>Recompute Window</button>
      <div data-testid="heatmap-windows" className="grid grid-cols-5 gap-3">
        {(data?.windowBands||[]).map((b:any)=> (
          <div key={b.band} className="p-3 border rounded">
            <div className="text-sm">{b.band}</div>
            <div className="text-xl font-bold">{Math.round(b.coverage*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}


