'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Row = { id:string; name:string; state:'HOT'|'COOLING'|'NEW'; successRate:number; uses:number; examples:number; lastSeenTs:string }

export default function TemplatesLeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [updatedAtISO, setUpdatedAtISO] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [sort, setSort] = useState<'sr'|'uses'>('sr')
  const [window, setWindow] = useState<'7d'|'30d'|'90d'>('30d')
  const [platform, setPlatform] = useState<string>('')
  const [niche, setNiche] = useState<string>('')

  async function load() {
    setLoading(true); setError('')
    const qs = new URLSearchParams({ window })
    if (platform) qs.set('platform', platform)
    if (niche) qs.set('niche', niche)
    const r = await fetch(`/api/templates/leaderboard?${qs.toString()}`, { cache: 'no-store' })
    try {
      const j = await r.json()
      // Normalize to strict shape
      const arr = Array.isArray(j?.items) ? j.items : (Array.isArray(j) ? j : [])
      setUpdatedAtISO(String(j?.updatedAtISO || new Date().toISOString()))
      setRows(arr as Row[])
    } catch (e:any) {
      setError(String(e?.message||e))
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [window, platform, niche])

  const sorted = useMemo(()=> {
    const copy = [...rows]
    copy.sort((a,b)=> sort==='sr' ? b.successRate - a.successRate : b.uses - a.uses)
    return copy
  }, [rows, sort])

  const updatedRelative = useMemo(()=>{
    if (!updatedAtISO) return ''
    const d = new Date(updatedAtISO).getTime(); const now = Date.now();
    const m = Math.max(0, Math.round((now - d)/60000))
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.round(m/60)
    return `${h}h ago`
  }, [updatedAtISO])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Template Leaderboard</h1>
        <select className="border rounded px-2 py-1" value={window} onChange={(e)=> setWindow(e.target.value as any)}>
          <option value="7d">7d</option>
          <option value="30d">30d</option>
          <option value="90d">90d</option>
        </select>
        <input className="border rounded px-2 py-1" placeholder="Platform" value={platform} onChange={(e)=> setPlatform(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="Niche" value={niche} onChange={(e)=> setNiche(e.target.value)} />
        <select className="border rounded px-2 py-1 ml-auto" value={sort} onChange={(e)=> setSort(e.target.value as any)}>
          <option value="sr">Sort by SR%</option>
          <option value="uses">Sort by Uses</option>
        </select>
      </div>
      {updatedAtISO && <div className="text-xs text-gray-500">Updated {updatedRelative}</div>}
      {error && (
        <div className="p-3 border border-red-400/40 bg-red-950/20 rounded text-sm text-red-300">{error} <button className="ml-2 underline" onClick={load}>Retry</button></div>
      )}
      {loading && (
        <table className="w-full text-sm border"><tbody>{Array.from({length:5}).map((_,i)=> (
          <tr key={i} className="border-t"><td className="p-2" colSpan={6}>Loading…</td></tr>
        ))}</tbody></table>
      )}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">State</th>
            <th className="text-right p-2 cursor-pointer" onClick={()=> setSort('sr')}>SR%</th>
            <th className="text-right p-2 cursor-pointer" onClick={()=> setSort('uses')}>Uses</th>
            <th className="text-right p-2">Examples</th>
            <th className="text-right p-2">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length===0 && !loading && !error ? (
            <tr className="border-t"><td className="p-2" colSpan={6}>No templates. <button className="underline" onClick={async()=>{ await fetch('/api/recipe-book/generate', {method:'POST'}); load() }}>Regenerate</button></td></tr>
          ) : sorted.map(r=> (
            <tr key={r.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={()=> { window.location.href = `/templates/${r.id}` }}>
              <td className="p-2"><a className="text-blue-600 underline" href={`/templates/${r.id}`}>{r.name}</a></td>
              <td className="p-2"><span className={`px-2 py-0.5 rounded text-white text-[10px] ${r.state==='HOT'?'bg-red-600': r.state==='COOLING'?'bg-blue-600':'bg-green-600'}`}>{r.state}</span></td>
              <td className="p-2 text-right">{Number.isFinite(r.successRate)? Math.round(r.successRate*100) : 0}%</td>
              <td className="p-2 text-right">{r.uses}</td>
              <td className="p-2 text-right">{r.examples}</td>
              <td className="p-2 text-right">{new Date(r.lastSeenTs).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


