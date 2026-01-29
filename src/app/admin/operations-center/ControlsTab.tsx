"use client";
import { useEffect, useState } from 'react'

type FlagRow = { name: string; enabled: boolean; audience: string; updated_at: string; updated_by?: string | null }

export default function ControlsTab() {
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [loading, setLoading] = useState(false)
  async function load() {
    setLoading(true)
    const res = await fetch('/api/flags', { headers: { 'x-tenant-id': 'demo' } })
    const data = await res.json()
    setFlags(Array.isArray(data) ? data : (data.flags || []))
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  async function toggle(name: string, enabled: boolean) {
    await fetch('/api/flags', { method: 'POST', headers: { 'content-type': 'application/json', 'x-actor': 'admin' }, body: JSON.stringify({ name, enabled }) })
    await load()
  }
  return (
    <div>
      <h3>Controls</h3>
      <div data-testid='flags-table'>
        {loading ? 'Loading…' : flags.map(f => (
          <div key={f.name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ width: 240 }}>{f.name}</div>
            <label>
              <input
                type="checkbox"
                aria-label={`Toggle ${f.name}`}
                checked={!!f.enabled}
                onChange={e => toggle(f.name, e.target.checked)}
              />
              <span style={{ marginLeft: 8 }}>{f.enabled ? 'On' : 'Off'}</span>
            </label>
            <div style={{ opacity: 0.7 }}>audience: {f.audience}</div>
            <div style={{ opacity: 0.7 }}>updated: {new Date(f.updated_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


