import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'

async function resolveLatest(): Promise<string | null> {
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
    return pool[0].full
  } catch {
    return null
  }
}

export async function GET() {
  const filePath = await resolveLatest()
  if (!filePath) return new NextResponse('no_proof_found', { status: 404 })
  try {
    const data = await fs.readFile(filePath)
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename=${path.basename(filePath)}`)
    return new NextResponse(data, { headers })
  } catch {
    return new NextResponse('read_error', { status: 500 })
  }
}







