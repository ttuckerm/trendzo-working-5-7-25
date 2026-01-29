import { NextRequest, NextResponse } from 'next/server'
import { evaluateFlags } from '@/lib/flags/evaluator'

export function requireFeature(flagId: string) {
	return async function handler(req: NextRequest): Promise<NextResponse | null> {
		const user = (req.headers.get('x-user-id') || 'anonymous')
		const plan = req.headers.get('x-user-plan') || null
		const cohorts = (req.headers.get('x-user-cohorts') || '').split(',').filter(Boolean)
		const flags = await evaluateFlags({ userId: user, plan, cohorts })
		if (!flags[flagId]) {
			return new NextResponse(JSON.stringify({ error: 'feature_disabled' }), { status: 403, headers: { 'content-type': 'application/json' } })
		}
		return null
	}
}












