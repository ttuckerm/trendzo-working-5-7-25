import type { NextRequest } from 'next/server'
import { NextResponse as NRes } from 'next/server'
import { evaluateFlag } from '@/server/flags/evaluator'
import { getUserRoles } from '@/server/flags/providers/corteza'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))

  const keys: string[] = Array.isArray(body.keys) ? body.keys.map(String) : []
  const userId: string | undefined = body.userId ? String(body.userId) : undefined
  const tenantId: string | undefined = body.tenantId ? String(body.tenantId) : undefined
  const plans: string[] | undefined = Array.isArray(body.plans) ? body.plans.map(String) : undefined

  // Roles are optional; if Corteza isn't reachable, default to []
  const roles: string[] = userId ? await getUserRoles(userId).catch(() => []) : []
  const seed = userId || tenantId || 'anon'

  const results = await Promise.all(
    keys.map((k) => evaluateFlag(k, { userId, tenantId, plans, roles, seed }))
  )

  const payload = Object.fromEntries(keys.map((k, i) => [k, results[i].enabled]))
  return NRes.json(payload)
}


