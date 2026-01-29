'use client'
import React from 'react'

type Creator = { id:string; handle:string; niche:string; platformSet:string[]; createdAtISO:string }
type Session = { day:number; outcomes:{ views:number; viral:boolean; followersDelta:number } }

async function api<T=any>(url:string, init?: RequestInit): Promise<T>{
  const r = await fetch(url, { cache:'no-store', ...init })
  if (!r.ok) throw new Error('request_failed')
  return r.json()
}

export default function ScaleLabPage(){
  const [creators, setCreators] = React.useState<Creator[]>([])
  const [loading, setLoading] = React.useState(false)
  const [summary, setSummary] = React.useState<any>(null)
  const [selected, setSelected] = React.useState<string>('')
  const [sessions, setSessions] = React.useState<Record<string, Session[]>>({})

  const refresh = React.useCallback(async()=>{
    try{
      const list = await api<any>('/api/scale/list')
      setCreators(list.creators||[])
      const s = await api<any>('/api/scale/summary')
      setSummary(s)
    }catch{}
  },[])

  React.useEffect(()=>{ refresh() }, [refresh])

  async function createCreator(){
    const handle = prompt('Handle?')||''
    const niche = prompt('Niche?')||'general'
    if (!handle) return
    setLoading(true)
    try{
      const { creator } = await api('/api/scale/create-creator', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ handle, niche }) })
      setCreators((c)=>[...c, creator])
      setSelected(creator.id)
      await refresh()
    } finally { setLoading(false) }
  }

  async function generatePlan(id:string){
    setLoading(true)
    try{ await api('/api/scale/plan', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ creatorId:id }) }); await refresh() } finally{ setLoading(false) }
  }
  async function runDay(id:string){
    const dayStr = prompt('Day (1-30)?')||''
    const day = Number(dayStr)
    if (!day || day<1 || day>30) return
    setLoading(true)
    try{ const { session } = await api('/api/scale/run-day', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ creatorId:id, day }) }); setSessions(s=>({ ...s, [id]: [ ...(s[id]||[]), session ] })); await refresh() } finally{ setLoading(false) }
  }
  async function run30(id:string){ setLoading(true); try{ await api('/api/scale/run-30d', { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ creatorId:id }) }); await refresh() } finally{ setLoading(false) } }

  const kpi = summary?.metrics

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scale Lab</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={createCreator} disabled={loading}>Create Creator</button>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={refresh}>Refresh</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={async()=>{ setLoading(true); try{ await api('/api/scale/reset', { method:'POST' }); await refresh() } finally{ setLoading(false) } }}>Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="font-semibold mb-2">Creators</div>
          <ul className="space-y-2">
            {creators.map(c=> (
              <li key={c.id} className={`p-2 border rounded ${selected===c.id?'bg-blue-50':''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.handle}</div>
                    <div className="text-sm text-gray-500">{c.niche} — {c.platformSet.join(', ')}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs px-2 py-1 bg-indigo-600 text-white rounded" onClick={()=>generatePlan(c.id)} disabled={loading}>Generate Plan</button>
                    <button className="text-xs px-2 py-1 bg-emerald-600 text-white rounded" onClick={()=>runDay(c.id)} disabled={loading}>Run Day</button>
                    <button className="text-xs px-2 py-1 bg-emerald-700 text-white rounded" onClick={()=>run30(c.id)} disabled={loading}>Run 30 Days</button>
                    <a className="text-xs px-2 py-1 bg-gray-700 text-white rounded" href={`/api/scale/case-study/${c.id}?format=csv`} target="_blank" rel="noreferrer">Export</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border rounded">
          <div className="font-semibold mb-2">KPIs</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="p-2 bg-gray-50 rounded">Viral Events: <span className="font-mono">{kpi?.viralEvents||0}</span></div>
            <div className="p-2 bg-gray-50 rounded">Median TTFV: <span className="font-mono">{kpi?.medianTimeToFirstViral ?? '-'}</span></div>
            <div className="p-2 bg-gray-50 rounded">Avg Followers Δ: <span className="font-mono">{(kpi?.avgFollowerDelta||0).toFixed(1)}</span></div>
            <div className="p-2 bg-gray-50 rounded">Success Rate: <span className="font-mono">{((kpi?.successRate||0)*100).toFixed(1)}%</span></div>
            <div className="p-2 bg-gray-50 rounded">Coach Uplift Avg: <span className="font-mono">{(kpi?.coachUpliftAvg||0).toFixed(3)}</span></div>
          </div>
        </div>

        <div className="p-4 border rounded">
          <div className="font-semibold mb-2">Timeline</div>
          <div className="text-xs text-gray-600">After running, sessions will show here.</div>
          {selected && (sessions[selected]||[]).length>0 && (
            <div className="mt-2 space-y-1">
              {(sessions[selected]||[]).sort((a,b)=>a.day-b.day).map(s=> (
                <div key={s.day} className={`p-2 rounded ${s.outcomes.viral?'bg-yellow-100':'bg-gray-50'}`}>Day {s.day}: {s.outcomes.views} views, +{s.outcomes.followersDelta} followers {s.outcomes.viral?'🔥':''}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


