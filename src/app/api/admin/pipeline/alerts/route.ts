import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin, withCache } from '../_lib'
import { synthAlerts } from '../_synthetic'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return withCache(synthAlerts(), 3)
  }

  const { data, error } = await db
    .from('pipeline_alerts')
    .select('*')
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return withCache({ alerts: [], error: error.message }, 3)
  }

  return withCache({ alerts: data || [] }, 3)
}


