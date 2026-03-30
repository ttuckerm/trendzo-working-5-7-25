import { promises as fs } from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../src/lib/env'

async function run() {
  const plugins = [
    { name: 'premiere', file: 'plugins/premiere/panel.html' },
    { name: 'descript', file: 'plugins/descript/score-cli.js' },
    { name: 'capcut', file: 'plugins/capcut/score-helper.js' }
  ]
  const results: Array<{ name: string; ok: boolean }> = []
  for (const p of plugins) {
    try {
      const abs = path.join(process.cwd(), p.file)
      await fs.stat(abs)
      results.push({ name: p.name, ok: true })
    } catch {
      results.push({ name: p.name, ok: false })
    }
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists plugin_compat (id bigserial primary key, version text, name text, ok boolean, ts timestamptz default now());" }) } catch {}
  const version = 'v' + (process.env.npm_package_version || 'local')
  for (const r of results) { try { await db.from('plugin_compat').insert({ version, name: r.name, ok: r.ok } as any) } catch {} }
  console.log(JSON.stringify({ plugins_tested: results.length, fail: results.filter(r=>!r.ok).length }))
}

run().catch(e => { console.error(e); process.exit(1) })












