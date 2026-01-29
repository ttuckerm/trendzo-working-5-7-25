import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin, withCache } from '../_lib'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ nodes: [], edges: [], error: e?.message || 'db_unavailable' }, { status: 503 })
  }
  const [nodes, edges] = await Promise.all([
    db.from('pipeline_dag_nodes').select('*').order('id'),
    db.from('pipeline_dag_edges').select('*')
  ])
  return withCache({ nodes: nodes.data || [], edges: edges.data || [] }, 60)
}


