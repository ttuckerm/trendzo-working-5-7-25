import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(_req: NextRequest) {
  const dir = path.join(process.cwd(), 'integrations', 'zapier', 'templates')
  const items = fs.readdirSync(dir).filter(f => f.endsWith('.json')).map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))
    return { name: raw.name, description: raw.description || '', file: f }
  })
  return NextResponse.json({ templates: items })
}



