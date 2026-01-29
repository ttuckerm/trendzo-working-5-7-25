'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const ORDER = ['ingest_started','template_picked','script_generated','edit_made','score_checked','publish_ready']

export default function ProcessIntelPage() {
  const [funnel, setFunnel] = useState<any[]>([])
  const [top, setTop] = useState<any>({ step: '', drop: 0 })
  const [win, setWin] = useState('24h')

  async function load() {
    const r = await fetch(`/api/process/funnel?window=${encodeURIComponent(win)}`, { cache:'no-store' })
    const j = await r.json()
    setFunnel(j.funnel||[])
    setTop(j.top_bottleneck||{ step:'', drop:0 })
  }
  useEffect(()=>{ load() }, [win])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Process Intelligence</h1>
        <div className="flex gap-2 items-center">
          <select className="border rounded px-2 py-1" value={win} onChange={(e)=> setWin(e.target.value)}>
            <option value="24h">24h</option>
            <option value="48h">48h</option>
            <option value="72h">72h</option>
          </select>
          <Button onClick={load}>Refresh</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            {ORDER.map((name, i)=> {
              const row = funnel.find((f:any)=> f.step===name) || { count: 0, drop: 0 }
              return (
                <div key={name} className="p-2 border rounded text-center">
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-2xl font-bold">{row.count}</div>
                  {i>0 && <div className="text-xs text-red-600">- {row.drop}</div>}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Bottlenecks</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {suggestions(top).map((s,idx)=> (<li key={idx}>{s}</li>))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function suggestions(top:{ step:string; drop:number }) {
  if (!top?.step) return ['No obvious bottlenecks in the window']
  const map: Record<string,string[]> = {
    ingest_started: ['Increase ingestion capacity', 'Add fallback seeds'],
    template_picked: ['Improve template discovery surfacing', 'Highlight top HOT templates'],
    script_generated: ['Enhance script assistant prompts', 'Suggest examples from HOT bucket'],
    edit_made: ['Add inline edit suggestions', 'Show live score delta'],
    score_checked: ['Auto-refresh scoring on edits', 'Badge confidence & label'],
    publish_ready: ['Add publish checklist', 'Provide final QA hints']
  }
  return [`Top drop at ${top.step} (Δ ${top.drop})`, ... (map[top.step]||['Review this step in depth'])]
}


