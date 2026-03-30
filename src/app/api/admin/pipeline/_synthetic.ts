export const MODULE_IDS = [
  'tiktok-scraper','viral-pattern-analyzer','template-discovery','draft-video-analyzer',
  'script-intelligence','recipe-book-generator','prediction-engine','performance-validator',
  'marketing-content-creator','dashboard-aggregator','system-health-monitor','process-intelligence-layer'
]

export function synthStatus() {
  return {
    range: '24h',
    processed_count: 1234,
    modules_online: 12,
    modules_total: 12,
    uptime_percent: 99.95,
    predictions_today: 256,
    data_freshness_ts: new Date().toISOString(),
    window: { start: new Date(Date.now()-24*3600*1000).toISOString(), end: new Date().toISOString() },
    readiness: { ok: true, failing: [] }
  }
}

export function synthThroughput() {
  const now = Date.now()
  const bucket = 15*60*1000
  const buckets = Array.from({ length: 24*60*60 / (bucket/1000) }, (_, i)=> new Date(now - (bucketsToMs(i+1,bucket))).toISOString()).reverse()
  function bucketsToMs(i:number, b:number){ return i*b }
  return {
    range: '24h',
    bucket_sec: 900,
    ingest_per_bucket: buckets.map(t=> ({ t, count: Math.floor(10+Math.random()*10) })),
    p95_ms: buckets.map(t=> ({ t, ms: Math.floor(1000+Math.random()*800) })),
    p99_ms: buckets.map(t=> ({ t, ms: Math.floor(1500+Math.random()*1200) })),
    error_rate: buckets.map(t=> ({ t, rate: Number((Math.random()*0.03).toFixed(3)) }))
  }
}

export function synthModules() {
  const now = new Date().toISOString()
  return {
    items: MODULE_IDS.map((id)=> ({
      id,
      name: toName(id),
      version: '1.0.0',
      enabled: true,
      uptime_percent: 99.9,
      last_status: 'success',
      last_run_at: now,
      processed: Math.floor(Math.random()*100),
      p95_ms: Math.floor(1000+Math.random()*800),
      error_rate_1h: Number((Math.random()*0.02).toFixed(3)),
      items_processed_1h: Math.floor(5+Math.random()*20),
      overall_status: 'green',
      reasons: []
    }))
  }
}

export function synthBacklog() {
  return {
    backlog: Math.floor(Math.random()*50),
    rate_per_sec: Number((0.5+Math.random()).toFixed(2)),
    drain_eta_sec: Math.floor(100+Math.random()*500),
    cron: { ingest_cron: { last_run: new Date().toISOString(), last_status: 'success', misses: 0 } }
  }
}

export function synthAlerts() {
  return {
    alerts: [
      { id: 'a1', type: 'freshness_breach', severity: 'warn', title: 'Freshness lag', description: 'TikTok Scraper freshness 2.5h', created_at: new Date().toISOString() }
    ]
  }
}

function toName(id: string): string {
  return id.split('-').map(s=> s.charAt(0).toUpperCase()+s.slice(1)).join(' ')
}


