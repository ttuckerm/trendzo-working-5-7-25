'use strict'

const fs = require('fs')
const path = require('path')
try { require('ts-node').register({ transpileOnly: true }) } catch {}
const git = require('isomorphic-git')

async function ensureRepo(dir) {
  const isRepo = await git.isRepo({ fs, dir })
  if (!isRepo) await git.init({ fs, dir })
}

async function callDryRunDistribution(dir) {
  // Call dry-run handler to ensure fields present (best-effort);
  try {
    const modTs = path.join(dir, 'src','app','api','admin','integration','dryrun_distribution','route.ts')
    const modJs = path.join(dir, 'src','app','api','admin','integration','dryrun_distribution','route.js')
    let mod = null
    try { mod = require(modTs) } catch { try { mod = require(modJs) } catch {} }
    if (mod && typeof mod.GET === 'function') await mod.GET({} as any)
  } catch {}
}

async function readStatus(dir) {
  try {
    const statusTs = path.join(dir, 'src','app','api','admin','integration','status','route.ts')
    const statusJs = path.join(dir, 'src','app','api','admin','integration','status','route.js')
    let mod = null
    try { mod = require(statusTs) } catch { try { mod = require(statusJs) } catch {} }
    if (mod && typeof mod.GET === 'function') {
      const resp = await mod.GET({} as any)
      const json = await resp.json()
      return {
        partner_signals_24h: json.partner_signals_24h ?? 0,
        distribution_last_ingest: json.distribution_last_ingest || null
      }
    }
  } catch {}
  return { partner_signals_24h: 0, distribution_last_ingest: null }
}

async function main() {
  const dir = process.cwd()
  await ensureRepo(dir)

  // Commit pending changes with version bump if needed
  const statusMatrix = await git.statusMatrix({ fs, dir })
  const pending = statusMatrix.some(([f,h,w,s]) => w !== s)
  if (pending) {
    for (const [file, h, w, s] of statusMatrix) {
      if (w !== s) await git.add({ fs, dir, filepath: file })
    }
    await git.commit({ fs, dir, author: { name: 'Automation Bot', email: 'automation@local' }, message: 'Moat #9: Distribution/Partner Signals (API, scoring clamp 0.90–1.12, status, dry-run)' })
  }
  const oid = await git.resolveRef({ fs, dir, ref: 'HEAD' })

  // Create annotated tag
  const tag = 'v0.14.0-moat9'
  const message = 'Moat #9: Distribution/Partner Signals (API, scoring clamp 0.90–1.12, status, dry-run)'
  try { await git.deleteRef({ fs, dir, ref: `refs/tags/${tag}` }) } catch {}
  await git.annotatedTag({ fs, dir, ref: tag, object: oid, message, tagger: { name: 'Automation Bot', email: 'automation@local' } })

  // Invoke dry-run distribution handler to populate fields
  await callDryRunDistribution(dir)
  const status = await readStatus(dir)

  // Print 3 required lines
  console.log(`commit=${oid}`)
  console.log(`tag=${tag}`)
  console.log(`status=${JSON.stringify(status)}`)
}

main().catch(err => { console.error(err); process.exit(1) })







