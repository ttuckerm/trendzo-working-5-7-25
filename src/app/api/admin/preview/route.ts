import type { NextRequest } from 'next/server'
import { NextResponse as NRes } from 'next/server'
import { evaluateFlag } from '@/server/flags/evaluator'
import { getUserRoles } from '@/server/flags/providers/corteza'
import { requireRole } from '@/lib/auth/server-auth'

export async function POST(req: NextRequest){
  const guard = await requireRole(req, ['chairman'])
  if (guard) return guard
  const { userId, keys } = await req.json()
  const roles = userId ? await getUserRoles(String(userId)) : []
  const results = await Promise.all((Array.isArray(keys) ? keys : []).map((k: string) => evaluateFlag(k, { userId, roles, seed: userId || 'anon' })))
  const map = Object.fromEntries((keys as string[]).map((k: string, i: number) => [k, results[i]?.enabled || false]))
  return NRes.json(map)
}


