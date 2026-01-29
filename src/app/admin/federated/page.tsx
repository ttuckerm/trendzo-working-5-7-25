'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FederatedPage() {
  const [round, setRound] = useState<any>(null)
  const [log, setLog] = useState<string[]>([])
  const [form, setForm] = useState({ modelName: 'creator_tokens', minParticipants: 5, clipNorm: 1.0, dpSigma: 0.0 })

  async function openRound() {
    const r = await fetch('/api/federated/rounds/new', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(form) })
    const js = await r.json(); setRound(js)
  }
  async function finalize() {
    if (!round?.roundId) return
    const r = await fetch('/api/federated/rounds/finalize', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ roundId: round.roundId }) })
    const js = await r.json(); setLog(l=> [...l, `Finalized: ${JSON.stringify(js)}`])
  }
  async function dryrun() {
    const r = await fetch('/api/admin/integration/dryrun_federated')
    const js = await r.json(); setLog(l=> [...l, `Dryrun: ${JSON.stringify(js)}`])
  }

  useEffect(()=>{ (async()=>{ const r=await fetch('/api/federated/rounds/current?modelName=creator_tokens'); const js = await r.json(); if (js?.roundId) setRound(js) })() },[])

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Open Round</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 text-sm items-center">
            <label>Model<input className="ml-2 border px-2 py-1" value={form.modelName} onChange={e=> setForm({ ...form, modelName: e.target.value })} /></label>
            <label>Min<input className="ml-2 border px-2 py-1 w-16" value={form.minParticipants} onChange={e=> setForm({ ...form, minParticipants: Number(e.target.value) })} /></label>
            <label>Clip<input className="ml-2 border px-2 py-1 w-16" value={form.clipNorm} onChange={e=> setForm({ ...form, clipNorm: Number(e.target.value) })} /></label>
            <label>Sigma<input className="ml-2 border px-2 py-1 w-16" value={form.dpSigma} onChange={e=> setForm({ ...form, dpSigma: Number(e.target.value) })} /></label>
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={openRound}>Open</button>
            <button className="px-3 py-2 bg-gray-900 text-white rounded" onClick={finalize}>Finalize</button>
            <button className="px-3 py-2 bg-gray-700 text-white rounded" onClick={dryrun}>Dry-Run</button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Current Round</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 p-3 rounded border">{JSON.stringify(round,null,2)}</pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Log</CardTitle></CardHeader>
        <CardContent>
          <div className="text-xs space-y-1">{log.map((l,i)=>(<div key={i}>{l}</div>))}</div>
        </CardContent>
      </Card>
    </div>
  )
}


