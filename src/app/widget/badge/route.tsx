import { NextResponse } from 'next/server'
import { getSummary } from '@/lib/validation/summary'
import { source } from '@/lib/data'
import { ensureFixtures } from '@/lib/data/init-fixtures'
import { computeDriftIndex } from '@/lib/learning/summary'

export async function GET() {
	if (process.env.MOCK === '1') try { ensureFixtures() } catch {}
	let s: any = { validated:0, correct:0, accuracy:0, auroc:0, ece:0, bins:[], computedAtISO: new Date().toISOString() }
	try { s = await getSummary() } catch {}
	let w: { status:'Stable'|'Shifting'|'Storm'; lastChangeISO?: string } = { status:'Stable', lastChangeISO: new Date().toISOString() }
	try {
		const m = await source.metrics()
		let drift = 0
		try { drift = computeDriftIndex() } catch {}
		const status: any = drift < 0.15 ? 'Stable' : drift < 0.3 ? 'Shifting' : 'Storm'
		w = { status, lastChangeISO: (m.weather as any)?.lastChangeISO || (m.weather as any)?.lastChange || new Date().toISOString() }
	} catch {}
	const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:0;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif} .badge{border:1px solid #e5e7eb;border-radius:8px;padding:8px 10px;display:inline-flex;gap:8px;align-items:center;background:#fff;white-space:nowrap} .chip{font-size:12px;padding:2px 6px;border-radius:6px;background:#eef2ff;color:#3730a3} .muted{font-size:12px;color:#6b7280} .weather{font-size:12px;padding:2px 6px;border-radius:6px;background:${w.status==='Stable'?'#dcfce7': w.status==='Shifting'?'#fef9c3':'#fee2e2'};color:${w.status==='Stable'?'#166534': w.status==='Shifting'?'#854d0e':'#991b1b'} }</style></head><body><div class="badge"><span style="font-weight:600">Accuracy</span><span class="chip">${(s.accuracy*100).toFixed(1)}%</span><span class="muted">Validated: ${s.validated}</span><span class="weather">${w.status}</span></div></body></html>`
	return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=30', 'access-control-allow-origin': '*' } })
}


