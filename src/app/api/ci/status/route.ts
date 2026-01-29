import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function readJsonSafe(p: string) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return null }
}

export async function GET() {
  const artifactsDir = path.join(process.cwd(), 'artifacts', 'test')
  const unit = readJsonSafe(path.join(artifactsDir, 'unit.json'))?.passed === true
  const integration = readJsonSafe(path.join(artifactsDir, 'integration.json'))?.passed === true
  const e2e = readJsonSafe(path.join(artifactsDir, 'e2e.json'))?.passed === true
  const passed = !!unit && !!integration && !!e2e
  return NextResponse.json({ passed, suites: { unit, integration, e2e } })
}


