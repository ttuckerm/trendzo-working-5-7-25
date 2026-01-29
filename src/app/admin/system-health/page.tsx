"use client"
import React, { useEffect, useState } from 'react'
import useSWR from 'swr'

type ModuleKey = 'scraper'|'patternAnalyzer'|'templateDiscovery'|'draftAnalyzer'|'scriptIntel'|'recipeBook'|'predictor'|'validator'|'marketing'|'dashboard'|'systemHealth'|'processIntel'

const moduleKeys: ModuleKey[] = ['scraper','patternAnalyzer','templateDiscovery','draftAnalyzer','scriptIntel','recipeBook','predictor','validator','marketing','dashboard','systemHealth','processIntel']

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function SystemHealthPage() {
  const { data, mutate } = useSWR('/api/system/health', fetcher, { refreshInterval: 5000 })
  const [mode, setMode] = useState<'DRY_RUN'|'SAMPLE_LIVE'|'FULL_LIVE'>('DRY_RUN')
  const [showDlq, setShowDlq] = useState(false)
  const [restarts, setRestarts] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/system/mode').then(r=>r.json()).then(j=> setMode(j.mode))
  }, [])

  const status = data?.modules || {}
  const paused = Object.values(status).some((s: any) => s?.status === 'pausedByBreaker')

  async function changeMode(next: 'DRY_RUN'|'SAMPLE_LIVE'|'FULL_LIVE') {
    await fetch('/api/system/mode', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: next }) })
    setMode(next)
    mutate()
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>System Health</h1>
        <div>
          <label style={{ marginRight: 8 }}>Mode:</label>
          <select value={mode} onChange={(e)=>changeMode(e.target.value as any)}>
            <option value="DRY_RUN">DRY_RUN</option>
            <option value="SAMPLE_LIVE">SAMPLE_LIVE</option>
            <option value="FULL_LIVE" disabled>FULL_LIVE</option>
          </select>
        </div>
      </div>

      {paused && (
        <div style={{ background: '#fff3cd', padding: 12, border: '1px solid #ffeeba', marginTop: 12 }}>
          <strong>Breaker tripped.</strong> <button onClick={async ()=>{ await fetch('/api/system/mode', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode }) }); await fetch('/api/system/metrics'); mutate() }}>Resume</button>
        </div>
      )}

      <div data-testid="module-grid" style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {moduleKeys.map((k) => {
          const m = status[k] || {}
          return (
            <div data-testid="module-tile" key={k} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{k}</strong>
                <span style={{ color: m.status === 'green' ? 'green' : m.status === 'pausedByBreaker' ? 'orange' : 'red' }}>{m.status || 'green'}</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 6 }}>p95: {m.p95IngestMs || 0} ms</div>
              <div style={{ fontSize: 12 }}>err: {(m.errorRate || 0).toFixed ? (m.errorRate || 0).toFixed(3) : m.errorRate}</div>
              <div style={{ fontSize: 12 }}>dlq: {m.dlqCount || 0}</div>
              <div style={{ fontSize: 12 }}>backlog: {m.backlog || 0}</div>
              <div style={{ fontSize: 12 }}>rps: {m.rps || 0}</div>
              <div style={{ fontSize: 12 }}>processed24h: {m.processed24h || 0}</div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div>Processed24h: <strong>{data?.totalProcessed24h || 0}</strong></div>
        <div>Errors24h: <strong>{data?.totalErrors24h || 0}</strong></div>
        <div>Burn: <strong>${data?.costEstimateUSD?.toFixed ? data?.costEstimateUSD?.toFixed(4) : data?.costEstimateUSD || 0}</strong></div>
        <button onClick={()=>setShowDlq(!showDlq)}>DLQ</button>
        <button onClick={async ()=>{ try { await fetch('/api/system/restarts/mock', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify({ module:'ingest', reason:'manual' }) }); const items = await fetch('/api/system/metrics').then(r=>r.json()); const list = (items['restarts:ingest']||[]).map((s:string)=>{ try { return JSON.parse(s) } catch { return null } }).filter(Boolean); setRestarts(list) } catch {} }}>Log Restart</button>
      </div>

      {restarts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <strong>Recent Restarts (ingest)</strong>
          <ul>
            {restarts.slice(0, 20).map((r, i) => (
              <li key={i} style={{ fontSize: 12 }}>{r.ts} - {r.reason}</li>
            ))}
          </ul>
        </div>
      )}

      {showDlq && <DlqDrawer onClose={()=>setShowDlq(false)} />}
    </div>
  )
}

function DlqDrawer({ onClose }: { onClose: ()=>void }) {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/system/metrics').then(r=>r.json())
        const entries = r['dlq:ingest:entries'] || []
        setItems(entries.map((s: string) => { try { return JSON.parse(s) } catch { return null } }).filter(Boolean))
      } catch {}
    })()
  }, [])
  return (
    <div style={{ position: 'fixed', right: 0, top: 0, width: 420, height: '100%', background: '#fff', borderLeft: '1px solid #eee', padding: 12, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>DLQ</strong>
        <button onClick={onClose}>Close</button>
      </div>
      <ul>
        {items.slice(0, 50).map((it, i) => (
          <li key={i} style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
            <div><strong>{it.reason}</strong> <span style={{ fontSize: 12, color: '#888' }}>{it.firstSeenAt}</span></div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>{JSON.stringify(redact(it.sample), null, 2)}</pre>
          </li>
        ))}
      </ul>
    </div>
  )
}

function redact(sample: any) {
  if (!sample) return sample
  const s = { ...sample }
  if (s.creatorHandle) s.creatorHandle = '***'
  if (s.caption && typeof s.caption === 'string') s.caption = s.caption.slice(0, 64) + '…'
  return s
}



