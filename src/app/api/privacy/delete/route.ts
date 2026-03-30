import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const subjectId = body.subject_id || null
    if (!subjectId) return NextResponse.json({ error: 'subject_id_required' }, { status: 400 })
    // Pseudonymize or delete across known tables
    const ops: Promise<any>[] = []
    ops.push(db.from('pixel_event').update({ subject_id: null }).eq('subject_id', subjectId))
    ops.push(db.from('usage_events').update({ subject_id: null }).eq('subject_id', subjectId))
    ops.push(db.from('consent').delete().eq('subject_id', subjectId))
    await Promise.allSettled(ops)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}


