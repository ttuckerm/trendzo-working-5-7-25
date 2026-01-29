import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getAdminDb, guardAdmin, parsePaging, withCache } from '../../../_lib'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

const Params = z.object({ id: z.string().min(1) })

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || 'db_unavailable' }, { status: 503 })
  }
  const { id } = Params.parse(params)
  const { limit, offset } = parsePaging(req)

  const { data, error } = await db
    .from('module_logs')
    .select('*')
    .eq('module_id', id)
    .order('ts', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return withCache({ items: [], error: error.message }, 3)

  // If any row has file_url, return a signed URL for download
  const firstFile = (data || []).find((r:any) => !!r.file_url)
  let download_url: string | null = null
  if (firstFile && firstFile.file_url && SUPABASE_URL && (SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
      const path = String(firstFile.file_url)
      const b = path.split('/')[0]
      const p = path.split('/').slice(1).join('/')
      const { data: signed } = await supabase.storage.from(b).createSignedUrl(p, 60)
      download_url = signed?.signedUrl || null
    } catch {}
  }

  return withCache({ items: data || [], download_url }, 3)
}


