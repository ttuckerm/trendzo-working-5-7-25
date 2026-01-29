'use client'
import React from 'react'

export default function ScriptIntelLab(){
  const [text, setText] = React.useState('Hook: Do this now!\nBody: Steps...\nCTA: Follow for more')
  const [res, setRes] = React.useState<any>(null)
  const analyze = async()=>{
    const r = await fetch('/api/script/intel', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text }) })
    const j = await r.json()
    setRes(j)
  }
  React.useEffect(()=>{ analyze() }, [])
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Script Intelligence</h1>
      <textarea className="w-full border rounded p-2" rows={8} value={text} onChange={e=> setText(e.target.value)} />
      <button data-testid="btn-insert-cta" className="border rounded px-3 py-1" onClick={()=> setText(t=> t + '\nCTA: Follow for proven playbooks.')}>Insert CTA</button>
      <button className="border rounded px-3 py-1 ml-2" onClick={analyze}>Analyze</button>
      {res && (
        <>
          <div data-testid="timeline-beats" className="grid grid-cols-4 gap-2">
            {(res.beats||[]).map((b:any)=> (<div key={b.id} className="p-2 border rounded text-center">{b.id}</div>))}
          </div>
          <div className="space-x-2">
            <span data-testid="badge-hook" className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">HOOK</span>
          </div>
        </>
      )}
    </div>
  )
}


