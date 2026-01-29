'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ViralFeed } from '@/components/ViralFeed'
import { Button } from '@/components/ui/button'

export default function RecipeBookPage() {
  const [day, setDay] = useState<string>('')
  const [hot, setHot] = useState<any[]>([])
  const [cooling, setCooling] = useState<any[]>([])
  const [fresh, setFresh] = useState<any[]>([])
  const [niche, setNiche] = useState<string>('')

  async function load() {
    try {
      const r = await fetch('/api/proof-tiles', { cache: 'no-store' })
      const tiles = await r.json()
      setDay(new Date().toLocaleDateString())
      const asRows = tiles.map((t:any, idx:number) => ({ id: `obj-${idx+1}`, niche: 'general', success_rate: t.passed? 0.9: 0.5, uses_30d: 10+idx, framework_id: t.title }))
      setHot(asRows.slice(0, Math.ceil(asRows.length/3)))
      setCooling(asRows.slice(Math.ceil(asRows.length/3), Math.ceil(2*asRows.length/3)))
      setFresh(asRows.slice(Math.ceil(2*asRows.length/3)))
    } catch {}
  }
  useEffect(()=>{ load() }, [])

  const filterByNiche = (rows: any[]) => rows.filter(r => !niche || String(r.niche||'').toLowerCase().includes(niche.toLowerCase()))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Trending Videos</h2>
          <div className="text-xs text-gray-500">Powered by /api/videos</div>
        </div>
        <ViralFeed limit={18} />
      </section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Recipe Book — {day || '—'}</h1>
        <div className="flex gap-2 items-center">
          <input className="border rounded px-2 py-1" placeholder="Filter niche" value={niche} onChange={(e)=> setNiche(e.target.value)} />
          <Button onClick={load}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Column title={`HOT (${hot.length})`} rows={filterByNiche(hot)} />
        <Column title={`COOLING (${cooling.length})`} rows={filterByNiche(cooling)} />
        <Column title={`NEW (${fresh.length})`} rows={filterByNiche(fresh)} />
      </div>
    </div>
  )
}

function Column({ title, rows }: { title:string; rows:any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length===0 ? <p className="text-sm text-gray-500">No items</p> : (
          <ul className="space-y-2">
            {rows.map((r:any)=> (
              <li key={r.id} className="p-2 border rounded">
                <div className="text-sm font-medium">{r.framework_id || r.id}</div>
                <div className="text-xs text-gray-600">niche: {r.niche||'-'} • success: {fmt(r.success_rate)} • uses30d: {r.uses_30d||0}</div>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" onClick={()=> openSimulator(r)}>Open in simulator</Button>
                  <Button variant="secondary" onClick={()=> coachWithTemplate(r)}>Coach with this template</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function openSimulator(r:any) {
  try {
    const qs = new URLSearchParams({ platform:'tiktok', niche: String(r.niche||'general') })
    window.location.href = `/admin/viral-prediction-hub?${qs.toString()}`
  } catch {}
}

function coachWithTemplate(r:any){
  try{
    const qs = new URLSearchParams({ platform:'tiktok', niche: String(r.niche||'general'), templateId: String(r.framework_id||r.id||'') })
    window.location.href = `/admin/coach?${qs.toString()}`
  } catch {}
}

function fmt(n?: number) { if (n===undefined || n===null) return '-'; return String(Math.round(Number(n)*100)/100) }
