'use client'
import React from 'react'

async function api<T=any>(url:string){ const r = await fetch(url, { cache:'no-store' }); return r.json() }

export default function PublicScaleShowcase(){
  const [data, setData] = React.useState<any>(null)
  React.useEffect(()=>{ (async()=>{ try{ setData(await api('/api/scale/summary')) }catch{} })() },[])
  const k = data?.metrics
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Scale-from-Zero — Public Stats</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 border rounded">Creators: <span className="font-mono">{data?.creators||0}</span></div>
        <div className="p-3 border rounded">Viral Events: <span className="font-mono">{k?.viralEvents||0}</span></div>
        <div className="p-3 border rounded">Median TTFV: <span className="font-mono">{k?.medianTimeToFirstViral ?? '-'}</span></div>
        <div className="p-3 border rounded">Follower Growth: <span className="font-mono">{data?.followerGrowth||0}</span></div>
      </div>
      <div className="text-sm text-gray-600">Powered by Recipe Book, Instant Analysis, Coach, Cross-Intel, and Learning — MOCK-friendly.</div>
    </div>
  )
}


