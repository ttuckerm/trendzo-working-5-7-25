import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const id = ctx.params.id
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('template_definitions').select('framework_id,genes,format').eq('template_id', id).limit(1)
  const row = (data||[])[0]
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(row)
}


