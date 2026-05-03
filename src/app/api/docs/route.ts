import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const docsDir = path.join(process.cwd(), 'docs')
  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md') || f.endsWith('.mdx'))
  return NextResponse.json({ files })
}



