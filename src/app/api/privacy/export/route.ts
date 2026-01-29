import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { writeEvidenceZip } from '@/lib/audit/audit_utils'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const subjectId = url.searchParams.get('subject_id')
    if (!subjectId) return NextResponse.json({ error: 'subject_id_required' }, { status: 400 })
    // Example export across a few tables; extend as needed
    const out: Record<string, any> = {}
    const tables = ['pixel_event', 'consent', 'usage_events']
    for (const t of tables) {
      try {
        const { data } = await db.from(t).select('*').eq('subject_id', subjectId)
        out[`${t}.json`] = JSON.stringify(data || [], null, 2)
      } catch {
        out[`${t}.json`] = JSON.stringify([], null, 2)
      }
    }
    const zipPath = await writeEvidenceZip(`dsar_${subjectId}_${Date.now()}`, out)
    return NextResponse.json({ artifact: zipPath })
  } catch (e: any) {
    return NextResponse.json({ error: 'export_failed' }, { status: 500 })
  }
}


