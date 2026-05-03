import { NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
	try {
		// In future: compute from monitoring tables; for now synthetic demo values
		return NextResponse.json({
			system: { accuracy_pct: 0.873 },
			templates: { active_count: 156 },
			discovery: { freshness_seconds: 180 }
		})
	} catch (e: any) {
		return NextResponse.json({ system: { accuracy_pct: 0 }, templates: { active_count: 0 }, discovery: { freshness_seconds: 999999 }, error: e?.message || 'metrics_failed' }, { status: 200 })
	}
}


