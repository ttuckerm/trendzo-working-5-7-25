'use client'
import React from 'react'

export default function ValidationAdmin(){
  const [metrics, setMetrics] = React.useState<any>(null)
  const [bins, setBins] = React.useState<any[]>([])
  const [cm, setCm] = React.useState<any>(null)

  const load = async()=>{
    const m = await fetch('/api/validation/metrics', { cache:'no-store' }).then(r=>r.json())
    const c = await fetch('/api/validation/calibration', { cache:'no-store' }).then(r=>r.json())
    const cf = await fetch('/api/validation/confusion', { cache:'no-store' }).then(r=>r.json())
    setMetrics(m); setBins(c.bins||[]); setCm(cf)
  }
  React.useEffect(()=>{ load() }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Validation Loop</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 border rounded">AUC: {metrics?.auc?.toFixed?.(3)}</div>
        <div className="p-3 border rounded">Brier: {metrics?.brier?.toFixed?.(3)}</div>
        <div className="p-3 border rounded">ECE: {metrics?.ece?.toFixed?.(3)}</div>
      </div>
      <div data-testid="plot-calibration" className="grid grid-cols-10 gap-1">
        {bins.map((b:any,i:number)=> (<div key={i} className="h-16 bg-green-200" style={{opacity: b.acc}} />))}
      </div>
      <div data-testid="matrix-confusion" className="grid grid-cols-2 gap-2 w-48">
        <div className="p-2 border rounded">TP {cm?.tp}</div>
        <div className="p-2 border rounded">FP {cm?.fp}</div>
        <div className="p-2 border rounded">FN {cm?.fn}</div>
        <div className="p-2 border rounded">TN {cm?.tn}</div>
      </div>
      <a data-testid="btn-export-validation" className="border rounded px-3 py-1 inline-block" href="/api/validation/export">Export CSV</a>
    </div>
  )
}

