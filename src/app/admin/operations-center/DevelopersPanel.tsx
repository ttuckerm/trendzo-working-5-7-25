"use client"
import React, { useEffect, useState } from 'react'

type Endpoint = { id: string; url: string; events: string[] }

export default function DevelopersPanel() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState('telemetry.ingested')

  useEffect(() => { (async()=>{
    const r = await fetch('/api/webhooks/endpoints')
    const j = await r.json()
    setEndpoints(j.endpoints || [])
  })() }, [])

  const addEndpoint = async () => {
    const body = { url, secret, events: events.split(',').map(s=>s.trim()).filter(Boolean) }
    await fetch('/api/webhooks/endpoints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const r = await fetch('/api/webhooks/endpoints')
    const j = await r.json()
    setEndpoints(j.endpoints || [])
  }

  const testSlack = async () => {
    await fetch('/api/exports/slack/test', { method: 'POST' })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Developers</h2>
      <section aria-label="Partner Kit" className="mb-3">
        <h3 className="text-lg font-semibold mb-1">Partner Kit</h3>
        <div data-testid='partner-kit' className="flex gap-2 mb-2">
          <a data-testid='download-partner-kit' className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" href="/api/partners/kit" target="_blank" rel="noreferrer">Download Kit</a>
          <a className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" href="/integrations/zapier/app.json" target="_blank" rel="noreferrer">Zapier App JSON</a>
          <a className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" href="/integrations/make/app.json" target="_blank" rel="noreferrer">Make App JSON</a>
          <a data-testid='sheets-pack' className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" href="/api/partners/sheets/download" target="_blank" rel="noreferrer">Sheets Pack</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-gray-400 mb-1">Webhook Signing Example</div>
            <textarea readOnly value={`const sig = btoa(JSON.stringify(payload)); fetch('/api/integrations/make/test',{method:'POST',headers:{'X-TZ-Signature':sig}})`} className="w-full h-20 bg-black/30 border border-white/10 rounded p-2" />
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">API Key header curl</div>
            <textarea readOnly value={`curl -H "X-API-Key: YOUR_KEY" "${typeof window !== 'undefined' ? window.location.origin : ''}/api/public/score"`} className="w-full h-20 bg-black/30 border border-white/10 rounded p-2" />
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button onClick={async()=>{await fetch('/api/integrations/zapier/test',{method:'POST'})}} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Send Zapier Sample</button>
          <button onClick={async()=>{await fetch('/api/integrations/make/test',{method:'POST',body:JSON.stringify({ hello:'world' }), headers:{ 'Content-Type':'application/json' }})}} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Send Make Sample</button>
        </div>
      </section>
      <div className="text-sm text-gray-300 mb-2">
        Integrations: <a className="underline" href="/integrations/zapier/app.json" target="_blank" rel="noreferrer">Zapier</a> • <a className="underline" href="/integrations/make/app.json" target="_blank" rel="noreferrer">Make</a>
      </div>
      <div data-testid='integrations-zapier-make' className="text-sm text-gray-300 mb-2">Manifests available</div>
      <div className="mb-2"><a data-testid='openapi-link' className="underline" href="/api/openapi.json" target="_blank" rel="noreferrer">OpenAPI JSON</a></div>
      <div data-testid='webhooks-table' className="mb-3">
        <div className="text-sm text-gray-400 mb-1">Webhook endpoints</div>
        <ul className="text-sm text-gray-300">
          {endpoints.map((e:any)=> (
            <li key={e.id}>{e.url} — [{(e.events||[]).join(', ')}]</li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2 mb-2">
        <input aria-label="Webhook URL" value={url} onChange={e=>setUrl(e.target.value)} className="px-2 py-1 bg-black/30 border border-white/10 rounded" placeholder="https://example.com/webhook" />
        <input aria-label="Secret" value={secret} onChange={e=>setSecret(e.target.value)} className="px-2 py-1 bg-black/30 border border-white/10 rounded" placeholder="secret" />
        <input aria-label="Events" value={events} onChange={e=>setEvents(e.target.value)} className="px-2 py-1 bg-black/30 border border-white/10 rounded" placeholder="telemetry.ingested, prediction.published" />
        <button onClick={addEndpoint} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Add</button>
      </div>
      <div data-testid='export-buttons' className="flex gap-2">
        <a className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" href="/api/exports/templates.csv" target="_blank" rel="noreferrer">Download CSV</a>
        <a className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" href="/api/exports/metrics.json?window=7d" target="_blank" rel="noreferrer">Metrics JSON</a>
        <button onClick={testSlack} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Test Slack</button>
      </div>
    </div>
  )
}


