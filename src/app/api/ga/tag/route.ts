import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(_req: NextRequest) {
  // Simulate creating a release tag and recording commit SHA
  const sha = process.env.GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'local-dev'
  const tagsDir = path.join(process.cwd(), 'public', 'artifacts', 'ga')
  fs.mkdirSync(tagsDir, { recursive: true })
  const tag = { tag: 'ga-v1.0.0', commit_sha: sha, created_at: new Date().toISOString() }
  fs.writeFileSync(path.join(tagsDir, 'tag.json'), JSON.stringify(tag, null, 2))
  return NextResponse.json(tag)
}



