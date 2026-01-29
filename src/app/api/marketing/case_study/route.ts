import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'
import { putJson } from '@/lib/storage/object_store'

export async function POST(req: NextRequest) {
  let body:any={}
  try { body = await req.json() } catch {}
  const preds = Array.isArray(body?.predictions)? body.predictions.slice(0,3): []
  const recs = String(body?.recommendations||'')
  if (!preds.length) return NextResponse.json({ ok:false, error:'no_predictions' }, { status: 400 })
  const mdx = `---\ntitle: Case Study\ndate: ${new Date().toISOString()}\n---\n\n## Highlights\n\n- Predictions: ${JSON.stringify(preds)}\n\n## Recommendations\n\n${recs}\n`
  // Save to object storage as proof; also best-effort local docs path if exists
  const saved = await putJson('proof', { mdx }, { filename: `case_study_${Date.now()}.json` })
  try {
    const docsDir = path.join(process.cwd(), 'docs', 'case_studies')
    await fs.mkdir(docsDir, { recursive: true })
    const file = path.join(docsDir, `case_study_${Date.now()}.mdx`)
    await fs.writeFile(file, mdx)
  } catch {}
  return NextResponse.json({ ok:true, storage_path: saved.path, signed_url: saved.url })
}


