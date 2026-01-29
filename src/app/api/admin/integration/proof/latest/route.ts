import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'

async function findLatestProof(): Promise<null | { absolutePath: string; relativePath: string }>{
  const dir = path.join(process.cwd(), 'storage', 'proof')
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files = await Promise.all(
      entries
        .filter(e => e.isFile())
        .map(async e => {
          const full = path.join(dir, e.name)
          const stat = await fs.stat(full)
          return { name: e.name, full, mtime: stat.mtimeMs }
        })
    )
    if (!files.length) return null
    const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'))
    const pool = zipFiles.length ? zipFiles : files
    pool.sort((a, b) => b.mtime - a.mtime)
    const top = pool[0]
    const rel = path.join('storage', 'proof', top.name).replace(/\\/g, '/')
    return { absolutePath: top.full, relativePath: rel }
  } catch {
    return null
  }
}

export async function GET() {
  const latest = await findLatestProof()
  if (!latest) return NextResponse.json({ ok: false, error: 'no_proof_found' }, { status: 404 })
  return NextResponse.json({ ok: true, path: latest.relativePath, absolute_path: latest.absolutePath, download_url: '/api/admin/integration/proof/latest/download' })
}







