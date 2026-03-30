import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminDb, guardAdmin, parsePaging, withCache } from '../../../_lib'

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
    .from('module_runs')
    .select('*')
    .eq('module_id', id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return withCache({ items: [], error: error.message }, 3)
  return withCache({ items: data || [] }, 3)
}


