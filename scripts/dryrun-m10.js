'use strict'
const path = require('path')
try { require('ts-node').register({ transpileOnly: true }) } catch {}

async function simulate() {
  // Mint a key with low daily quota=2
  const keysModTs = path.join(process.cwd(), 'src','app','api','admin','keys','route.ts')
  const keysModJs = path.join(process.cwd(), 'src','app','api','admin','keys','route.js')
  let keysMod = null
  try { keysMod = require(keysModTs) } catch { try { keysMod = require(keysModJs) } catch {} }
  const reqObj = (body) => ({ json: async ()=> body, headers: new Map() })
  const mintRes = await keysMod.POST(reqObj({ action: 'mint', scopes: ['coach'], quota_daily: 2, quota_monthly: 100 }))
  const mintJson = await mintRes.json()
  const apiKey = mintJson.key

  // Simulate 3 calls via enforcement util (no HTTP)
  const { checkAndConsume } = require(path.join(process.cwd(), 'src','lib','billing','enforcement.ts'))
  const r1 = await checkAndConsume('/api/coach/suggest_edits', apiKey, 'coach')
  const r2 = await checkAndConsume('/api/coach/generate_variants', apiKey, 'coach')
  const r3 = await checkAndConsume('/api/coach/suggest_edits', apiKey, 'coach')
  const results = [r1, r2, r3]
  const allowed = results.filter(r=> r.allowed).length
  const blocked = results.filter(r=> !r.allowed).length
  const blocked_reason = results.find(r=> !r.allowed)?.reason || null

  // Read status summary
  const statusModTs = path.join(process.cwd(), 'src','app','api','admin','integration','status','route.ts')
  let statusMod = null
  try { statusMod = require(statusModTs) } catch {}
  const statusRes = await statusMod.GET({} as any)
  const status = await statusRes.json()
  const requests_24h = status.requests_24h || 0
  const quota_hits_24h = status.quota_hits_24h || 0
  console.log(JSON.stringify({ allowed, blocked, blocked_reason, requests_24h, quota_hits_24h }))
}

simulate().catch(err => { console.error(err); process.exit(1) })







