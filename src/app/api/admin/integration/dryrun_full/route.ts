import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(_req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/admin/integration/readiness_report`).then(r=>r.json()).catch(()=>null)
  const ts = Date.now()
  const dir = path.join(process.cwd(), 'storage', 'proof')
  await fs.mkdir(dir, { recursive: true })
  const jsonPath = path.join(dir, `readiness_${ts}.json`)
  await fs.writeFile(jsonPath, JSON.stringify(res||{}, null, 2))
  // Zip pack (simple: write as .zip placeholder with JSON contents)
  const zipPath = path.join(dir, `readiness_${ts}.zip`)
  await fs.writeFile(zipPath, JSON.stringify({ files: [path.basename(jsonPath)] }))
  return NextResponse.json({ ok: true, proof_file: `storage/proof/readiness_${ts}.zip` })
}












