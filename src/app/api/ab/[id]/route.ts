import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/server-auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
	const guard = await requireRole(req, ['chairman', 'sub_admin'])
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


