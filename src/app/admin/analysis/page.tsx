'use client'
import React from 'react'

export default function InstantAnalysisPage(){
  const [platform, setPlatform] = React.useState<'tiktok'|'instagram'|'youtube'|'linkedin'>('tiktok')
  const [niche, setNiche] = React.useState('general')
  const [url, setUrl] = React.useState('')
  const [script, setScript] = React.useState('')
  const [caption, setCaption] = React.useState('')
  const [durationSec, setDurationSec] = React.useState<number | ''>('')
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<any>(null)
  const [slaOk, setSlaOk] = React.useState<boolean | null>(null)

  const onAnalyze = async () => {
    setLoading(true)
    setResult(null)
    setSlaOk(null)
    const started = Date.now()
    try{
      const r = await fetch('/api/analyze', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ videoUrl: url||undefined, scriptText: script||undefined, platform, niche, caption, durationSec: typeof durationSec==='number'? durationSec: undefined }) })
      const j = await r.json()
      setResult(j)
      setSlaOk(!!j?.timings?.metSLA && (Date.now()-started)<=5000)
    }catch(e){ setResult({ error: String(e) }) }
    finally{ setLoading(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Instant Analysis</h1>
      <div className="text-xs text-gray-500 mb-2">Using Model v{/* dynamic */}{/* We'll fetch learning summary lightweight */}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <input className="w-full border rounded px-3 py-2" placeholder="Video URL (optional)" value={url} onChange={e=>setUrl(e.target.value)} />
          <textarea className="w-full h-36 border rounded px-3 py-2" placeholder="Script text (optional)" value={script} onChange={e=>setScript(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Caption (optional)" value={caption} onChange={e=>setCaption(e.target.value)} />
          <div className="flex gap-2">
            <select className="border rounded px-3 py-2" value={platform} onChange={e=>setPlatform(e.target.value as any)}>
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <input className="flex-1 border rounded px-3 py-2" placeholder="Niche" value={niche} onChange={e=>setNiche(e.target.value)} />
            <input className="w-36 border rounded px-3 py-2" placeholder="Duration (s)" value={durationSec} onChange={e=>setDurationSec(e.target.value? Number(e.target.value): '')} />
          </div>
          <button disabled={loading} className="bg-black text-white rounded px-4 py-2" onClick={onAnalyze} data-testid="btn-analyze">{loading? 'Analyzing…':'Analyze'}</button>
          <button className="ml-2 border rounded px-3 py-2" onClick={()=>{
            const qs = new URLSearchParams({ platform, niche, script: script||'', caption: caption||'', durationSec: String(durationSec||'') })
            window.location.href = `/admin/coach?${qs.toString()}`
          }}>Try Coach</button>
          {loading && <div className="text-sm text-gray-500">Running…</div>}
          {slaOk!==null && <div className={`text-sm ${slaOk? 'text-green-600':'text-red-600'}`}>SLA {slaOk? '≤5s met':'missed'}</div>}
          <div className="text-xs text-gray-500">Viral rule: z≥2 & ≥95th percentile in 48h</div>
        </div>
        <div className="space-y-3">
          {result && !result.error && (
            <div className="space-y-2">
              <div className="text-xl">Probability: <span className="font-semibold">{Math.round((result.probability||0)*100)}%</span></div>
              <div className="w-full bg-gray-200 h-2 rounded"><div className="bg-blue-600 h-2 rounded" style={{ width: `${Math.round((result.confidence||0)*100)}%` }} /></div>
              <div className="text-sm text-gray-600">Confidence</div>
              <div>
                <div className="font-medium mb-1">Top reasons</div>
                <ul className="list-disc pl-5 text-sm">
                  {(result.reasons||[]).slice(0,3).map((r:string, i:number)=>(<li key={i}>{r}</li>))}
                </ul>
              </div>
              <div>
                <div className="font-medium mb-1">Recommendations</div>
                <ul className="space-y-1">
                  {(result.recommendations||[]).map((r:any, i:number)=>(
                    <li key={i} className="border rounded p-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{r.action}</div>
                        <div className="text-xs text-gray-600">{r.rationale}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-600">+{Math.round((r.predictedUplift||0)*100)}%</div>
                        <button className="text-xs border rounded px-2 py-1" onClick={()=>navigator.clipboard.writeText(`${r.action} — ${r.rationale}`)}>Copy</button>
                        <button className="text-xs border rounded px-2 py-1 opacity-50 cursor-not-allowed" title="Coming soon">Apply</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {result && result.error && (
            <div className="text-red-600 text-sm">{String(result.error)}</div>
          )}
        </div>
      </div>
    </div>
  )
}


