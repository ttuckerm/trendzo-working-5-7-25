'use client'
import { useEffect, useState } from 'react'

export default function UsageWidget() {
  const [data, setData] = useState<any>(null)
  useEffect(()=>{ fetch('/api/admin/usage/summary').then(r=>r.json()).then(setData).catch(()=>{}) }, [])
  if (!data) return <div className="text-sm">Loading usage…</div>
  return (
    <div className="text-sm">
      <div><b>Usage (24h)</b>: {data.last24h.requests} req, quota hits {data.last24h.quota_hits}</div>
      <div><b>MTD</b>: {data.monthToDate.requests} req, quota hits {data.monthToDate.quota_hits}</div>
    </div>
  )
}







