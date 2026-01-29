'use strict'
const path = require('path')
try { require('ts-node').register({ transpileOnly: true }) } catch {}

async function main() {
  const dir = process.cwd()
  // Call dryrun distribution GET directly (no HTTP)
  let seeded = false
  try {
    const modTs = path.join(dir, 'src','app','api','admin','integration','dryrun_distribution','route.ts')
    const modJs = path.join(dir, 'src','app','api','admin','integration','dryrun_distribution','route.js')
    let mod = null
    try { mod = require(modTs) } catch { try { mod = require(modJs) } catch {} }
    if (mod && typeof mod.GET === 'function') {
      await mod.GET({} )
      seeded = true
    }
  } catch {}

  // Read status via direct GET
  let partner = 0, last = null
  try {
    const statusTs = path.join(dir, 'src','app','api','admin','integration','status','route.ts')
    const statusJs = path.join(dir, 'src','app','api','admin','integration','status','route.js')
    let statusMod = null
    try { statusMod = require(statusTs) } catch { try { statusMod = require(statusJs) } catch {} }
    if (statusMod && typeof statusMod.GET === 'function') {
      const resp = await statusMod.GET({} )
      const json = await resp.json()
      partner = json.partner_signals_24h ?? 0
      last = json.distribution_last_ingest || null
    }
  } catch {}
  console.log(`status=${JSON.stringify({ partner_signals_24h: partner, distribution_last_ingest: last })}`)
}

main().catch(err => { console.error(err); process.exit(1) })







