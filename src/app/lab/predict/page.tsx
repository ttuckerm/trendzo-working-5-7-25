'use client'
import React from 'react'

export default function PredictLab(){
  const [text, setText] = React.useState('My draft script...')
  const [rows, setRows] = React.useState<any[]>([])
  const [eta, setEta] = React.useState<string>('')

  const onSubmit = async()=>{
    const r = await fetch('/api/predict', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ script: text }) })
    const j = await r.json()
    setRows((s)=> [{ id: j?.receipt?.id, status: j?.receipt?.status, prob: j?.receipt?.probability }, ...s])
    const h = j?.receipt?.etaHours ?? 0, m = j?.receipt?.etaMinutes ?? 0
    setEta(`${h}h ${m}m`)
  }

  React.useEffect(()=>{ (async()=>{
    const r = await fetch('/api/predict')
    const j = await r.json()
    setRows(j.receipts||[])
  })() },[])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Prediction Engine</h1>
      <form onSubmit={e=> { e.preventDefault(); onSubmit() }} className="space-y-2">
        <textarea className="w-full border rounded p-2" rows={6} value={text} onChange={e=> setText(e.target.value)} />
        <button data-testid="btn-create-prediction" className="border rounded px-3 py-1">Submit</button>
        <span data-testid="chip-eta" className="ml-2 text-xs px-2 py-1 rounded bg-gray-100">ETA: {eta||'—'}</span>
      </form>
      <table data-testid="table-receipts" className="w-full text-sm border">
        <thead><tr><th className="text-left p-2">ID</th><th className="text-left p-2">Status</th><th className="text-left p-2">Prob</th></tr></thead>
        <tbody>
          {rows.map((r:any)=> (<tr key={r.id}><td className="p-2">{r.id}</td><td className="p-2">{r.status}</td><td className="p-2">{typeof r.prob==='number'? Math.round(r.prob*100)+'%':'—'}</td></tr>))}
        </tbody>
      </table>
      <div data-testid="form-predict" className="sr-only">predict-form-present</div>
    </div>
  )
}


