"use client"
import { useState } from 'react'

export default function Controls() {
  const [status, setStatus] = useState<string>('')
  async function send(action: string) {
    const res = await fetch('/api/system/controls', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action }) })
    setStatus(res.ok ? `${action} ok` : `${action} failed`)
  }
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => send('pause')} className="px-3 py-1 rounded border">Pause</button>
      <button onClick={() => send('resume')} className="px-3 py-1 rounded border">Resume</button>
      <a href="/api/ingest/upsert" target="_blank" className="px-3 py-1 rounded border">List items</a>
      <span className="text-xs text-gray-500">{status}</span>
    </div>
  )
}


