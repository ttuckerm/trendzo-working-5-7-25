'use client'

import React, { useEffect, useState } from 'react'

type Tile = { id:number; title:string; target:string; value:string; passed:boolean; updatedAt:string }

export default function AdminChecklistPage() {
  const [tiles, setTiles] = useState<Tile[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string>('')

  useEffect(()=>{ (async()=>{
    try {
      const r = await fetch('/api/proof-tiles', { cache:'no-store' })
      if (!r.ok) throw new Error('failed')
      const j = await r.json()
      setTiles(j)
    } catch(e:any) {
      setErr(String(e?.message||e))
    } finally { setLoading(false) }
  })() }, [])

  if (loading) return <div className="container mx-auto p-6">Loading…</div>
  if (err) return <div className="container mx-auto p-6">Error: {err}</div>

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin Checklist</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map(t => (
          <div key={t.id} className={`p-4 border rounded ${t.passed? 'border-green-400/40' : 'border-red-400/40'}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium">{t.step? `${t.step}. `: ''}{t.title}</div>
              <span className={`text-xs px-2 py-0.5 rounded ${t.passed? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{t.passed? 'PASS':'FAIL'}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Target: {t.target}</div>
            <div className="text-xs text-gray-500">Value: {t.value}</div>
            <div className="text-[10px] text-gray-400 mt-2">Updated {new Date(t.updatedAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


