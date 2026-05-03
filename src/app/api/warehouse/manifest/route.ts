import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const dir = path.join(process.cwd(), 'public', 'artifacts', 'warehouse')
  if (!fs.existsSync(dir)) {
    return NextResponse.json({ files: [] })
  }
  const files = fs.readdirSync(dir).map((name) => ({ name, size: fs.statSync(path.join(dir, name)).size }))
  return NextResponse.json({ files })
}



