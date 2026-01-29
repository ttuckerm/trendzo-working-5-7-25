import { NextResponse } from 'next/server'
import { checkPrereqs } from '@/lib/admin/flipboard_prereq'

export async function GET() {
  const ids: any[] = ['ingestion','validation','telemetry','billing','alarms']
  const out: Record<string, any> = {}
  for (const id of ids) {
    const r = await checkPrereqs(id)
    out[id] = { ok: r.ok, missing: r.missing, warnings: r.warnings }
  }
  return NextResponse.json(out)
}







