import { NextRequest, NextResponse } from 'next/server'
import { approveTask, cancelTask, createTask, listTasks, pauseTask, resumeTask, startTask, runOnce } from '@/lib/jarvis/store'

export const dynamic = 'force-dynamic'

function actorFrom(req: Request) {
  return req.headers.get('x-actor-id') || 'dev@local'
}

async function resolveActor(req: NextRequest, disableAuth: boolean): Promise<string> {
  if (disableAuth) return actorFrom(req as unknown as Request)
  // Lazy-load auth to avoid evaluating it during module load (prevents rolePermissions init error)
  const mod = await import('@/lib/security/auth-middleware')
  const guard = mod.requireRole(mod.UserRole.ADMIN)
  const { authContext, response } = await guard(req)
  if (response) throw response
  return authContext?.user?.id || 'unknown'
}

function bad(body?: any, status = 400) {
  return NextResponse.json(
    { code: status === 400 ? 'BAD_REQUEST' : 'INTERNAL', message: body?.message ?? body ?? 'Bad request' },
    { status }
  )
}

export async function GET(req: NextRequest) {
  const disableAuth = process.env.NODE_ENV === 'development'
  if (!disableAuth) {
    try { await resolveActor(req, false) } catch (resp: any) { return resp }
  }
  const tasks = listTasks()
  return NextResponse.json({ tasks })
}

export async function POST(req: NextRequest) {
  const disableAuth = process.env.NODE_ENV === 'development'
  try {
    let actor: string
    try { actor = await resolveActor(req, disableAuth) } catch (resp: any) { return resp }

    const text = await req.text()
    let body: any = {}
    try { body = text ? JSON.parse(text) : {} } catch (e: any) { return bad({ message: `Invalid JSON: ${e.message}` }, 400) }

    const raw = body?.input ?? { goal: body?.goal, context: body?.context, data: body?.data, maxTokens: body?.maxTokens }
    const requiresApproval = Boolean(body?.requiresApproval ?? raw?.requiresApproval)
    if (!raw || typeof raw.goal !== 'string' || !raw.goal.trim()) return bad({ message: 'Missing input.goal (string)' }, 400)

    const task = createTask(
      { goal: raw.goal, context: raw.context ?? {}, data: raw.data ?? {}, maxTokens: raw.maxTokens },
      { requiresApproval, createdBy: actor || 'dev@local' }
    )
    return NextResponse.json({ task }, { status: 201 })
  } catch (err: any) {
    console.error('[tasks.POST]', err)
    const msg = String(err?.message || err)
    const map: Record<string, number> = { BAD_INPUT_GOAL: 400 }
    const status = map[msg] ?? 500
    if (status !== 500) {
      return NextResponse.json({ code: 'BAD_REQUEST', message: msg }, { status })
    }
    const body: any = { code: 'INTERNAL', message: msg }
    if (process.env.NODE_ENV !== 'production') body.stack = String(err?.stack || '')
    return NextResponse.json(body, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const disableAuth = process.env.NODE_ENV === 'development'
  try {
    let actor: string
    try { actor = await resolveActor(req, disableAuth) } catch (resp:any) { return resp }
    const text = await req.text()
    let body: any = {}
    try { body = text ? JSON.parse(text) : {} } catch (e:any) { return bad({ message: `Invalid JSON: ${e.message}` }, 400) }
    const { id, action } = body || {}
    if (!id || !action) return NextResponse.json({ code:'BAD_REQUEST', message:'Missing id/action' }, { status: 400 })
    if (action === 'approve') { const t = approveTask(id, actor || body?.approver || 'approver@local'); return NextResponse.json({ task: t }) }
    if (action === 'start') { const t1 = startTask(id); const t2 = await runOnce(id); return NextResponse.json({ task: t2 }) }
    if (action === 'pause')  return NextResponse.json({ task: pauseTask(id) })
    if (action === 'resume') return NextResponse.json({ task: resumeTask(id) })
    if (action === 'cancel') return NextResponse.json({ task: cancelTask(id) })
    return NextResponse.json({ code:'BAD_REQUEST', message:'Unknown action' }, { status: 400 })
  } catch (err:any) {
    const msg = String(err?.message || err)
    const map: Record<string, number> = { NOT_FOUND:404, APPROVAL_REQUIRED:400, NOT_AWAITING_APPROVAL:400, APPROVER_MUST_DIFFER:400, BAD_STATE:400 }
    const status = map[msg] ?? 500
    if (status !== 500) {
      return NextResponse.json({ code: 'BAD_REQUEST', message: msg }, { status })
    }
    const body: any = { code: 'INTERNAL', message: msg }
    if (process.env.NODE_ENV !== 'production') body.stack = String(err?.stack || '')
    return NextResponse.json(body, { status: 500 })
  }
}


