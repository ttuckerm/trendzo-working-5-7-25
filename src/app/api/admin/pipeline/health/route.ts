import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin, parseRange, getWindow, withCache } from '../_lib'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'db_unavailable' }, { status: 503 })
  }
  const range = parseRange(req)
  const { start } = getWindow(range)
  const sinceIso = start.toISOString()

  const [writes, errs, dbSize] = await Promise.all([
    db.from('videos_write_log').select('op,at').gte('at', sinceIso),
    db.from('module_logs').select('level').gte('ts', sinceIso),
    (db as any).rpc?.('exec_sql', { query: "select pg_database_size(current_database()) as bytes" })
  ])

  const ops = Array.isArray(writes.data) ? writes.data as any[] : []
  const inserts = ops.filter(r=> r.op==='insert').length
  const updates = ops.filter(r=> r.op==='update').length
  const dedupeRate = (updates+inserts) ? Number((updates/(updates+inserts)).toFixed(4)) : 0

  const failedWrites = (Array.isArray(errs.data) ? (errs.data as any[]).filter(r=> String(r.level).toLowerCase()==='error').length : 0)
  const dbBytes = (dbSize?.data && (dbSize.data[0] as any)?.bytes) || null

  return withCache({ dedupe_rate: dedupeRate, failed_writes: failedWrites, db_size_bytes: dbBytes, storage_headroom: null }, 10)
}


