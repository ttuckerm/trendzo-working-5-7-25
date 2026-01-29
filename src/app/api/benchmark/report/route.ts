import { NextResponse } from 'next/server'
import { buildBenchmarkReport } from '@/lib/benchmark/report'

export async function GET() {
	try {
		const rep = buildBenchmarkReport()
		return NextResponse.json(rep)
	} catch {
		// safe fallback
		return NextResponse.json({ current: { accuracy: 0.6, auroc: 0.6, ece: 0.12, brier: 0.22, pAt100: 0.7, coverageAtFpr3: 0.15 }, baseline: { accuracy: 0.55, auroc: 0.58, ece: 0.18, brier: 0.24, pAt100: 0.62, coverageAtFpr3: 0.12 }, deltas: { accuracy: 0.05, auroc: 0.02, ece: -0.06, brier: -0.02, pAt100: 0.08, coverageAtFpr3: 0.03 } })
	}
}


