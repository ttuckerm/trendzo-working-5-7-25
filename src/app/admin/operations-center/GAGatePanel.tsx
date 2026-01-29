"use client"
import React, { useEffect, useState } from 'react'

export default function GAGatePanel() {
  const [last, setLast] = useState<any>({ status: 'UNKNOWN' })
  useEffect(()=>{ (async()=>{ const r = await fetch('/api/ga/last-run'); const j = await r.json(); setLast(j) })() }, [])
  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">GA Gate</h2>
      <div data-testid='ga-gate-panel' className="text-sm text-gray-300">Last run: {last.status}</div>
    </div>
  )
}










