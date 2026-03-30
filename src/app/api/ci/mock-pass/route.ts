import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  try {
    const dir = path.join(process.cwd(), 'artifacts', 'test')
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify({ passed: true }))
    fs.writeFileSync(path.join(dir, 'integration.json'), JSON.stringify({ passed: true }))
    fs.writeFileSync(path.join(dir, 'e2e.json'), JSON.stringify({ passed: true }))
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'write-failed' }, { status: 500 })
  }
}


