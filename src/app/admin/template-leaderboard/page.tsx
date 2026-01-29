'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TemplateLeaderboardPage() {
  const [windowSel, setWindowSel] = useState<'24h'|'7d'|'30d'>('7d')
  const [platform, setPlatform] = useState('tiktok')
  const [niche, setNiche] = useState('beauty')
  const [format, setFormat] = useState<string>('short')
  const [items, setItems] = useState<any[]>([])
  const [artifactUrl, setArtifactUrl] = useState<string| null>(null)

  async function load() {
    const r = await fetch(`/api/templates/leaderboard?window=${windowSel}&platform=${platform}&niche=${niche}&format=${format}`)
    const js = await r.json()
    setItems(js.items||[])
  }

  useEffect(()=>{ load() }, [windowSel, platform, niche, format])

  async function runNow() {
    await fetch('/api/admin/templates/aggregate/run-now', { method: 'POST' })
    await load()
    const dry = await fetch('/api/admin/integration/dryrun_templates')
    const dj = await dry.json()
    setArtifactUrl(dj.artifact_url||null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Template Leaderboard</h1>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={runNow}>Run Aggregation Now</button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 text-sm items-center">
            <label>Window<select className="ml-2 border px-2 py-1" value={windowSel} onChange={e=> setWindowSel(e.target.value as any)}><option>24h</option><option>7d</option><option>30d</option></select></label>
            <label>Platform<select className="ml-2 border px-2 py-1" value={platform} onChange={e=> setPlatform(e.target.value)}><option>tiktok</option><option>instagram</option><option>youtube</option></select></label>
            <label>Niche<input className="ml-2 border px-2 py-1" value={niche} onChange={e=> setNiche(e.target.value)} /></label>
            <label>Format<select className="ml-2 border px-2 py-1" value={format} onChange={e=> setFormat(e.target.value)}><option value="short">short</option><option value="carousel">carousel</option><option value="3min">3min</option></select></label>
            {artifactUrl ? <Link href={artifactUrl} className="text-blue-600 underline">Artifact</Link> : null}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Leaderboard</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="text-left"><th>Template</th><th>Framework</th><th>Success</th><th>Median</th><th>Instances</th><th>Velocity</th><th>Avg Lift</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {items.map((r:any)=> (
                <tr key={`${r.template_id}|${r.window}|${r.platform}|${r.niche}`} className="border-b border-gray-200">
                  <td className="font-mono">{r.template_id}</td>
                  <td>{r.framework_id || '-'}</td>
                  <td>{(r.success_rate*100).toFixed(1)}%</td>
                  <td>{Number(r.median_score).toFixed(2)}</td>
                  <td>{r.instances}</td>
                  <td>{Number(r.velocity).toFixed(3)}</td>
                  <td>{r.avg_lift===null?'-':Number(r.avg_lift).toFixed(3)}</td>
                  <td>{r.updated_at}</td>
                  <td><OpenSim templateId={r.template_id} platform={r.platform} niche={r.niche} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function OpenSim({ templateId, platform, niche }: { templateId: string; platform: string; niche: string }) {
  async function open() {
    const res = await fetch('/api/templates/open_in_simulator', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ template_id: templateId, platform, niche }) })
    const js = await res.json()
    const payload = encodeURIComponent(JSON.stringify(js.payload))
    window.location.href = `/admin/viral-prediction-hub?template_id=${encodeURIComponent(templateId)}&sim=${payload}`
  }
  return <button className="px-3 py-1 bg-gray-900 text-white rounded" onClick={open}>Open in Simulator</button>
}


