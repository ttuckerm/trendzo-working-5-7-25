'use strict'

const fs = require('fs')
const path = require('path')
// Enable TS route imports in-process
try { require('ts-node').register({ transpileOnly: true }) } catch {}
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')

async function ensureRepo(dir) {
  try {
    const isRepo = await git.isRepo({ fs, dir })
    if (!isRepo) {
      await git.init({ fs, dir })
      // Create initial commit if none exists
      const hasHead = await git.resolveRef({ fs, dir, ref: 'HEAD' }).then(()=>true).catch(()=>false)
      if (!hasHead) {
        await fs.promises.writeFile(path.join(dir, '.gitkeep'), '')
        await git.add({ fs, dir, filepath: '.gitkeep' })
        await git.commit({ fs, dir, author: { name: 'Automation Bot', email: 'automation@local' }, message: 'init' })
      }
    }
  } catch {
    await git.init({ fs, dir })
  }
}

async function main() {
  const dir = process.cwd()
  await ensureRepo(dir)

  // Stage current workspace if needed and commit Moat #8 if not already committed
  const statusMatrix = await git.statusMatrix({ fs, dir })
  const pending = statusMatrix.some(([file, head, workdir, stage]) => workdir !== stage)
  if (pending) {
    for (const [file, head, workdir, stage] of statusMatrix) {
      if (workdir !== stage) await git.add({ fs, dir, filepath: file })
    }
    await git.commit({ fs, dir, author: { name: 'Automation Bot', email: 'automation@local' }, message: 'Moat #8: Coach (suggest_edits, variants, UI, events, status)' })
  }

  const oid = await git.resolveRef({ fs, dir, ref: 'HEAD' })
  const tag = 'v0.13.0-moat8'
  const message = 'Moat #8: Coach (suggest_edits, variants, UI, events, status)'
  // create annotated tag (force update if exists)
  try {
    // delete existing lightweight tag if present
    const existing = await git.resolveRef({ fs, dir, ref: `refs/tags/${tag}` }).catch(()=>null)
    if (existing) {
      await git.deleteRef({ fs, dir, ref: `refs/tags/${tag}` }).catch(()=>{})
    }
  } catch {}
  await git.annotatedTag({ fs, dir, ref: tag, message, object: oid, tagger: { name: 'Automation Bot', email: 'automation@local' } })

  // Call dry-run coach handler directly to update coach_last_run
  const dryrun = await (async () => {
    try {
      const mod = require(path.join(dir, 'src', 'app', 'api', 'admin', 'integration', 'dryrun_coach', 'route.ts'))
      if (typeof mod.GET === 'function') {
        const res = await mod.GET({} as any)
        // NextResponse.json returns a Response-like; try to extract to ensure side effects executed
        return true
      }
    } catch {}
    try {
      const modJs = require(path.join(dir, 'src', 'app', 'api', 'admin', 'integration', 'dryrun_coach', 'route.js'))
      if (typeof modJs.GET === 'function') {
        await modJs.GET({} as any)
        return true
      }
    } catch {}
    return false
  })()

  // Read coach_last_run from status route module by invoking GET
  let coachLastRun = null
  try {
    const statusModPathTs = path.join(dir, 'src', 'app', 'api', 'admin', 'integration', 'status', 'route.ts')
    const statusModPathJs = path.join(dir, 'src', 'app', 'api', 'admin', 'integration', 'status', 'route.js')
    let statusMod
    try { statusMod = require(statusModPathTs) } catch { try { statusMod = require(statusModPathJs) } catch {} }
    if (statusMod && typeof statusMod.GET === 'function') {
      const resp = await statusMod.GET({} as any)
      if (resp && typeof resp.json === 'function') {
        const json = await resp.json()
        coachLastRun = json.coach_last_run || (json.last_runs && json.last_runs.coach_last_run) || null
      }
    }
  } catch {}

  // Print outputs as required (three lines)
  console.log(`commit=${oid}`)
  console.log(`tag=${tag}`)
  console.log(`coach_last_run=${coachLastRun || ''}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


