'use client'
import React, { useEffect, useState } from 'react'

export default function DeprecationBanner() {
  const [deprecations, setDeprecations] = useState<any[]>([])
  useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/admin/integration/status', { cache:'no-store' }); const j = await r.json(); setDeprecations(j.deprecations||[]) } catch {} })() }, [])
  if (!deprecations || deprecations.length === 0) return null
  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 text-sm">
      <div className="container mx-auto px-4 py-2">
        {deprecations.map((d:any)=> (
          <div key={`${d.route}|${d.version}`} className="py-1">
            <strong>Deprecation:</strong> {d.route} {d.version} will be removed on {new Date(d.end_date).toLocaleDateString()} — {d.message || 'see docs/DEPRECATION_POLICY.md'}
          </div>
        ))}
      </div>
    </div>
  )
}


