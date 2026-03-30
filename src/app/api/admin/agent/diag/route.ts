import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const store = await import('@/lib/jarvis/store')
    const list = typeof (store as any).listTasks === 'function' ? (store as any).listTasks() : []
    return NextResponse.json({ ok: true, loaded: Object.keys(store), tasksCount: list?.length ?? 0 })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: 'IMPORT_FAIL', message: String(e?.message || e), stack: String(e?.stack || '') },
      { status: 500 }
    )
  }
}


