import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminDb, guardAdmin, withCache } from '../../../_lib'

const Params = z.object({ id: z.string().min(1) })

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  let db
  try { db = getAdminDb() } catch (e: any) {
    return NextResponse.json({ markdown: defaultRunbook(params.id) }, { status: 200 })
  }
  try {
    const { id } = Params.parse(params)
    const { data } = await db.from('module_runbooks').select('markdown').eq('module_id', id).limit(1)
    const md = (data && data[0] && (data[0] as any).markdown) || defaultRunbook(id)
    return withCache({ markdown: md }, 60)
  } catch {
    return NextResponse.json({ markdown: defaultRunbook(params.id) }, { status: 200 })
  }
}

function defaultRunbook(id: string): string {
  return `# ${id} Runbook\n\n## Purpose\nDescribe what this module does.\n\n## SLOs\n- Freshness: <= 2h\n- Throughput: >= 1/h\n- Latency (p95): <= 5s\n- Error rate: <= 10%\n\n## On-call Cheatsheet\n- Check alerts page for incidents\n- Restart failing via Controls bar\n- Review last 50 runs\n\n## Rollback\n- Use Controls bar → Rollback\n\n## Links\n- DAG view\n- Logs\n`
}


