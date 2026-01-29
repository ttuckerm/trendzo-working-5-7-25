#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function summarize(reportPath) {
  const json = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  const metrics = json?.aggregate?.summaries || json?.aggregate || {}
  const p95 = metrics['http.request']?.p95 || metrics['http.response_time']?.p95 || 0
  const failures = json?.aggregate?.counters?.['http.requests.failed']?.count || 0
  const total = json?.aggregate?.counters?.['http.requests']?.count || 1
  const errRate = total ? (failures / total) * 100 : 0
  return { p95_ms: p95, err_rate: Number(errRate.toFixed(2)), total_requests: total }
}

function main() {
  const artifactsDir = path.join(process.cwd(), 'artifacts','load')
  fs.mkdirSync(artifactsDir, { recursive: true })
  const input = process.argv[2]
  if (!input || !fs.existsSync(input)) {
    console.error('Usage: node scripts/load-report.js <artillery-json-report>')
    process.exit(1)
  }
  const summary = summarize(input)
  fs.writeFileSync(path.join(artifactsDir, 'capacity.json'), JSON.stringify({ last_smoke: summary }, null, 2))
  console.log('Wrote capacity summary', summary)
}

if (require.main === module) main()










