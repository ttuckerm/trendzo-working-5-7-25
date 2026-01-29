'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MarketingInceptionPage() {
  const [rows, setRows] = useState<any[]>([])

  async function load() {
    const r = await fetch('/api/admin/integration/dryrun_marketing', { cache:'no-store' })
    const j = await r.json()
    // After dry-run, fetch assets directly
    const r2 = await fetch('/api/admin/integration/dryrun_marketing', { cache:'no-store' })
    const j2 = await r2.json()
    setRows(j2?.case_study_template?.predictions || [])
  }
  useEffect(()=>{ load() }, [])

  function copy(txt: string) { try { navigator.clipboard.writeText(txt) } catch {} }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketing Inception (Drafts)</h1>
        <Button onClick={load}>Generate Drafts</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Draft Assets (sample)</CardTitle></CardHeader>
        <CardContent>
          {rows.length===0 ? <p className="text-sm text-gray-500">No drafts yet</p> : (
            <table className="w-full text-sm">
              <thead><tr><th className="text-left">ID</th><th>Kind</th><th>Predicted</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((r:any)=> (
                  <tr key={r.id} className="border-b">
                    <td className="font-mono">{r.id}</td>
                    <td>{r.kind}</td>
                    <td className="text-center">{Math.round((r.predicted_score||0)*100)/100}</td>
                    <td className="space-x-2">
                      <Button variant="secondary" onClick={()=> window.location.href = `/admin/viral-prediction-hub?niche=general`}>Open in simulator</Button>
                      <Button variant="outline" onClick={()=> copy(JSON.stringify(r))}>Copy</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


