import { NextRequest, NextResponse } from 'next/server'
import type { CoachInput } from '@/lib/coach/types'
import { applyEdit } from '@/lib/coach/apply'
import { createExperiment } from '@/lib/experiments/store'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(()=>({})) as any
		const suggestionId = String(body?.suggestionId||'')
		const input = body?.input as CoachInput
		const edit = body?.edit || body?.suggestion?.edit || {}
		if (!input || !input.platform) return NextResponse.json({ variant: input, experimentId: null })
		const variant = applyEdit(input, edit)
		// Create a bandit experiment with 2 variants: baseline vs variant
		let experimentId: string | null = null
		try {
			const exp = await createExperiment({
				name: `Coach — ${suggestionId||'variant'}`,
				mode: 'bandit',
				objective: 'viral48h',
				variants: [
					{ id: 'A', name: 'Baseline', meta: { draft: input } },
					{ id: 'B', name: 'Variant', meta: { draft: variant, suggestionId } }
				],
				autopilot: !!body?.autopilot
			})
			experimentId = exp.id
		} catch { experimentId = 'demo' }
		return NextResponse.json({ variant, experimentId })
	} catch {
		return NextResponse.json({ variant: null, experimentId: null })
	}
}

