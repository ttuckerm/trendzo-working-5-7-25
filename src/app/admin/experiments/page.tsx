'use client'

import React from 'react'

export default function ExperimentsAdminPage(){
  const [exps, setExps] = React.useState<any[]>([])
  const [name, setName] = React.useState('Demo Experiment')
  const [mode, setMode] = React.useState<'ab'|'bandit'>('bandit')
  const [variants, setVariants] = React.useState<Array<{name:string}>>([{name:'A'},{name:'B'}])
  const [summary, setSummary] = React.useState<any|null>(null)

  const load = async () => {
    try { const r = await fetch('/api/experiments/leaderboard', { cache:'no-store' }); setExps(await r.json()) } catch {}
  }
  React.useEffect(()=>{ (async()=>{ await load() })() },[])

  const create = async () => {
    try{
      const body = { name, mode, variants: variants.map((v,i)=>({ name: v.name, id: String.fromCharCode(65+i) })), autopilot:true }
      const r = await fetch('/api/experiments/create', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) })
      if (!r.ok) throw new Error('create_failed')
      await load()
    }catch{}
  }
  const simulate = async (id:string) => {
    const r = await fetch('/api/experiments/simulate', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ experimentId:id, ticks:50 }) })
    const j = await r.json(); setSummary(j.summary||null); await load()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Experiments</h1>

      <div className="p-4 border rounded">
        <div className="text-sm text-gray-500 mb-2">Create Experiment</div>
        <div className="flex gap-2 items-center">
          <input className="border rounded px-2 py-1" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <select className="border rounded px-2 py-1" value={mode} onChange={e=> setMode(e.target.value as any)}>
            <option value="ab">A/B</option>
            <option value="bandit">Bandit</option>
          </select>
          <button className="text-sm border rounded px-3 py-1" onClick={create}>Create</button>
        </div>
      </div>

      <div className="p-4 border rounded">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">Active Experiments</div>
          <div className="flex gap-2">
            <button className="text-xs border rounded px-2 py-1" onClick={load}>Refresh</button>
            <button className="text-xs border rounded px-2 py-1" title="Seed demo data (MOCK only)" onClick={async()=>{ try{ await fetch('/api/experiments/simulate', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ ticks: 30 }) }) }catch{}; await load() }}>Seed Demo</button>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="text-gray-500"><th className="text-left">Name</th><th>Mode</th><th>Status</th><th>Impr</th><th>Successes</th><th>Winner</th><th></th></tr></thead>
          <tbody>
            {exps.map((e:any)=> (
              <tr key={e.id} className="border-t">
                <td className="py-1">{e.name}</td>
                <td className="text-center">{e.mode}</td>
                <td className="text-center">{e.status}</td>
                <td className="text-center">{e.totals?.impressions||0}</td>
                <td className="text-center">{e.totals?.successes||0}</td>
                <td className="text-center">{e.winnerVariantId||'-'}</td>
                <td className="text-right"><button className="text-xs border rounded px-2 py-1" onClick={()=> simulate(e.id)}>Simulate</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {summary && (
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500 mb-2">Summary</div>
          <div className="text-xs">Winner: {summary.winnerVariantId || '-'}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            {summary.variants?.map((v:any)=> (
              <div key={v.variantId} className="p-2 border rounded">
                <div className="font-semibold">{v.name} ({v.variantId})</div>
                <div>Impr {v.impressions}, SR {(v.successRate*100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
