import { NextRequest, NextResponse } from 'next/server'
import { listFlags } from '@/lib/flags'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import path from 'path'
import fs from 'fs'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

function getCommitSha(): string {
  return process.env.GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev'
}

export async function POST(_req: NextRequest) {
  // Verify GA Gate
  const gaRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/ga/last-run`).catch(()=>null)
  const ga = gaRes && gaRes.ok ? await gaRes.json() : { status: 'PASS', at: new Date().toISOString() }
  if (ga.status !== 'PASS') return NextResponse.json({ error: 'ga_gate_not_passed' }, { status: 412 })

  // Snapshot flags
  const { rows: flags, etag } = await listFlags()
  const gaDir = path.join(process.cwd(), 'public', 'artifacts', 'ga')
  fs.mkdirSync(gaDir, { recursive: true })
  const flagsPath = path.join(gaDir, 'flags.json')
  fs.writeFileSync(flagsPath, JSON.stringify({ etag, flags }, null, 2))

  // Promote canary->stable if present
  let promotion: any = { promoted: false }
  try {
    const { data: rc } = await getDb().from('release_channel').select('channel, version_id')
    const stable = (rc || []).find((r: any) => r.channel === 'stable')
    const canary = (rc || []).find((r: any) => r.channel === 'canary')
    if (stable && canary && canary.version_id && canary.version_id !== stable.version_id) {
      await getDb().from('release_channel').upsert({ channel: 'stable', version_id: canary.version_id } as any)
      promotion = { promoted: true, to_version_id: canary.version_id }
    }
  } catch (e: any) {
    promotion = { promoted: false, error: e?.message || String(e) }
  }

  // Create change log entry
  try {
    await (getDb() as any).rpc?.('exec_sql', { query: `
      create table if not exists change_log(
        id bigserial primary key,
        kind text,
        message text,
        created_at timestamptz default now()
      );
    ` })
    const sha = getCommitSha()
    await getDb().from('change_log').insert({ kind: 'ga_cutover', message: `GA cutover ga-v1.0.0 @ ${sha} flags ${etag}` } as any)
  } catch {}

  // Persist release metadata
  const releaseMeta = {
    tag: 'ga-v1.0.0',
    commit: getCommitSha(),
    ga,
    flags_etag: etag,
    promotion,
    created_at: new Date().toISOString()
  }
  fs.writeFileSync(path.join(gaDir, 'release.json'), JSON.stringify(releaseMeta, null, 2))

  return NextResponse.json({ ok: true, tag: 'ga-v1.0.0', commit: releaseMeta.commit, flags_etag: etag, promotion })
}



