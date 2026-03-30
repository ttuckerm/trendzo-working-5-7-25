#!/usr/bin/env node
const fs = require('fs')

async function run() {
  const apiKey = process.argv[2] || process.env.PUBLIC_API_KEY || ''
  const featuresPath = process.argv[3] || ''
  if (!apiKey) { console.error('Provide API key'); process.exit(1) }
  let features = {}
  if (featuresPath && fs.existsSync(featuresPath)) {
    features = JSON.parse(fs.readFileSync(featuresPath,'utf8'))
  }
  const res = await fetch('/public/score', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key': apiKey }, body: JSON.stringify({ features }) })
  const data = await res.json()
  console.log(JSON.stringify(data))
}

run().catch(e=>{ console.error(e); process.exit(1) })








