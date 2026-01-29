import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const file = searchParams.get('file')
  if (!file) return NextResponse.json({ error: 'missing_file' }, { status: 400 })
  const p = path.join(process.cwd(), 'public', 'artifacts', 'warehouse', file)
  if (!fs.existsSync(p)) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const buf = fs.readFileSync(p)
  return new NextResponse(buf, { status: 200, headers: { 'content-type': 'application/octet-stream' } })
}



