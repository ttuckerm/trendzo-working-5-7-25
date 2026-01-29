'use client'
import React from 'react'

export default function DraftAnalyze(){
  const [file, setFile] = React.useState<File|null>(null)
  const [res, setRes] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const onSubmit = async()=>{
    setLoading(true)
    const r = await fetch('/api/drafts/analyze', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ url: 'mock' }) })
    const j = await r.json()
    setRes(j)
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Instant Draft Analysis</h1>
      <div data-testid="dropzone-draft" className="border-dashed border p-6 rounded">
        <input type="file" onChange={e=> setFile(e.target.files?.[0]||null)} />
      </div>
      <button data-testid="btn-rescore" className="border rounded px-3 py-1" disabled={loading} onClick={onSubmit}>{loading? 'Scoring…':'Analyze'}</button>
      {res && (
        <div className="space-y-2">
          <div data-testid="dial-score" className="text-xl">Score: {Math.round((res.probability||0)*100)}%</div>
          <ul data-testid="list-top-fixes" className="list-disc pl-5">
            {(res.recommendations||[]).slice(0,5).map((f:any,i:number)=> (<li key={i}>{f.title} — {f.change}</li>))}
          </ul>
        </div>
      )}
    </div>
  )
}


