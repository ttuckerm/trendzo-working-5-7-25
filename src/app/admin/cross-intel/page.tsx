'use client'

import React from 'react'

export default function CrossIntelPage(){
  const [cascades, setCascades] = React.useState<any[]>([])
  const [sum, setSum] = React.useState<any|null>(null)
  const [platform, setPlatform] = React.useState<'tiktok'|'instagram'|'youtube'>('tiktok')
  const [videoId, setVideoId] = React.useState('')
  const [templateId, setTemplateId] = React.useState('')
  const [niche, setNiche] = React.useState('')
  const [pred, setPred] = React.useState<any|null>(null)

  const load = async () => {
    const r1 = await fetch('/api/cross/cascades?window=30d', { cache:'no-store' })
    const j1 = await r1.json()
    setCascades(j1.cascades||[])
    const r2 = await fetch('/api/cross/summary', { cache:'no-store' })
    const j2 = await r2.json()
    setSum(j2)
  }
  React.useEffect(()=>{ load() }, [])

  const runPredict = async () => {
    const r = await fetch('/api/cross/predict', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ platform, videoId: videoId||undefined, templateId: templateId||undefined, niche: niche||undefined }) })
    const j = await r.json()
    setPred(j)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cross-Platform Intelligence</h1>
        <div className="text-xs text-gray-500">Window: 30d</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded md:col-span-2">
          <div className="text-sm text-gray-500 mb-2">Cascades</div>
          <div className="text-xs text-gray-500 mb-2">{cascades.length} cascades</div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-gray-500"><th className="text-left">Creator</th><th className="text-left">Leader</th><th className="text-left">Signature</th><th>TT→IG</th><th>IG→YT</th><th>TT→YT</th><th>CrossSR</th></tr></thead>
              <tbody>
                {cascades.map((c:any,i:number)=> (
                  <tr key={i} className="border-t">
                    <td className="py-1">@{c.creator}</td>
                    <td>{c.leader}</td>
                    <td className="line-clamp-1" title={c.signature}>{c.signature.slice(0,38)}</td>
                    <td className="text-center">{c.lags?.tikTokToIG ?? '-'}</td>
                    <td className="text-center">{c.lags?.igToYT ?? '-'}</td>
                    <td className="text-center">{c.lags?.tikTokToYT ?? '-'}</td>
                    <td className="text-center">{(c.crossSR*100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500 mb-2">Predict</div>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-gray-500 mb-1">Leader Platform</label>
              <select value={platform} onChange={e=> setPlatform(e.target.value as any)} className="border rounded px-2 py-1 w-full">
                <option value="tiktok">tiktok</option>
                <option value="instagram">instagram</option>
                <option value="youtube">youtube</option>
              </select>
            </div>
            <input className="border rounded px-2 py-1 w-full" placeholder="Seed video ID (optional)" value={videoId} onChange={e=> setVideoId(e.target.value)} />
            <input className="border rounded px-2 py-1 w-full" placeholder="Template ID (optional)" value={templateId} onChange={e=> setTemplateId(e.target.value)} />
            <input className="border rounded px-2 py-1 w-full" placeholder="Niche (optional)" value={niche} onChange={e=> setNiche(e.target.value)} />
            <button className="text-xs border rounded px-2 py-1" onClick={runPredict}>Predict</button>
            {pred && (
              <div className="text-xs mt-2 space-y-1">
                <div>probIG: <span className="font-mono">{pred.probIG}</span>, probYT: <span className="font-mono">{pred.probYT}</span> ({pred.confidence})</div>
                <div>Recommended: repost IG in {pred.recommendedLags.toIG}h, YT in {pred.recommendedLags.toYT}h</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Top Leader</div>
          <div className="text-xl font-bold">{sum?.topLeader || '-'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Avg Lags</div>
          <div className="text-xs">TT→IG {sum?.avgLags?.tikTokToIG ?? '-'}h, IG→YT {sum?.avgLags?.igToYT ?? '-'}h</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Active Cascades</div>
          <div className="text-xl font-bold">{sum?.activeCascades ?? 0}</div>
        </div>
      </div>
    </div>
  )
}


