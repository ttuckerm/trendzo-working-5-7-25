import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'

export async function GET(req: NextRequest) {
  const demoPath = path.join(process.cwd(), 'storage', 'proof', 'demo_current.json')
  try {
    const data = await fs.readFile(demoPath)
    const download = req.nextUrl.searchParams.get('download') === '1'
    if (download) {
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Content-Disposition', 'attachment; filename=demo_current.json')
      return new NextResponse(data, { headers })
    }
    return new NextResponse(data, { headers: { 'Content-Type': 'application/json' } })
  } catch {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }
}







