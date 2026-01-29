import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAccess } from '@/middleware/rbac'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	const guard = await requireTenantAccess({ roles: ['admin','super_admin','analyst','viewer'] })(req)
	if (guard) return guard
	const id = params.id
	const start = parseInt(id.split('_').pop() || '0', 10) || Date.now()
	const elapsed = Date.now() - start
	const completed = elapsed > 5000
	const status = completed ? 'completed' : 'active'
	const winner = completed ? 'B' : null
	const results = completed ? { lift_pct: 0.185, views: { A: 920000, B: 1350000 } } : undefined
	return NextResponse.json({ id, status, winner, results })
}


