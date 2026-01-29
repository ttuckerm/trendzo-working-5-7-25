import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, guardAdmin } from '../_lib'

export async function GET(req: NextRequest) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  try { getAdminDb() } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'db_unavailable' }, { status: 503 })
  }
  const url = new URL(req.url)
  const fmt = (url.searchParams.get('format') || 'json').toLowerCase()

  const [status, alerts] = await Promise.all([
    fetch(new URL('/api/admin/pipeline/status', url.origin), { headers: req.headers as any }).then(r=>r.json()),
    fetch(new URL('/api/admin/pipeline/alerts', url.origin), { headers: req.headers as any }).then(r=>r.json())
  ])

  const payload = { ts: new Date().toISOString(), status, alerts }
  if (fmt === 'csv') {
    const rows = [
      ['ts','processed_count','modules_online','modules_total','predictions_today','data_freshness_ts'].join(',')
    ]
    rows.push([
      payload.ts,
      status.processed_count,
      status.modules_online,
      status.modules_total,
      status.predictions_today,
      JSON.stringify(status.data_freshness_ts||'')
    ].join(','))
    const body = rows.join('\n')
    return new NextResponse(body, { status: 200, headers: { 'content-type': 'text/csv' } })
  }
  return NextResponse.json(payload)
}


