import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin, withCache } from '../_lib'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ items: [], error: e?.message || 'db_unavailable' }, { status: 503 })
  }
  const { data, error } = await db
    .from('ops_changelog')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return withCache({ items: [], error: error.message }, 5)
  return withCache({ items: data || [] }, 5)
}


