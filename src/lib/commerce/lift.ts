import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

type Slice = { platform: string; niche: string; format?: string }

export async function estimateLift(input: { score_old?: number; score_new: number; video_id?: string; platform: string; niche: string; expected_impressions: number; aov_cents?: number; format?: string }): Promise<any> {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	let aov_cents = Number(input.aov_cents || 0)
	if (!aov_cents) {
		const since = new Date(Date.now()-30*24*3600*1000).toISOString()
		const { data } = await db.from('orders').select('revenue_cents,qty').gte('ts', since)
		const arr = (data||[])
		const sum = arr.reduce((a:any,b:any)=> a + Number(b.revenue_cents||0), 0)
		const n = arr.reduce((a:any,b:any)=> a + Number(b.qty||1), 0)
		aov_cents = n ? Math.round(sum / n) : 4500
	}
	const f = await loadConversionMapping({ platform: input.platform, niche: input.niche, format: input.format || 'short_video' })
	const score_old = Number(input.score_old || 0)
	const score_new = Number(input.score_new || 0)
	const conv_old = f(score_old)
	const conv_new = f(score_new)
	const delta_conv = conv_new - conv_old
	const expected_orders = input.expected_impressions * delta_conv
	const expected_revenue_delta_cents = Math.round(expected_orders * aov_cents)
	return { score_old, score_new, conv_old, conv_new, delta_conv, expected_impressions: input.expected_impressions, aov_cents, expected_revenue_delta_cents }
}

async function loadConversionMapping(slice: Slice): Promise<(score: number)=>number> {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	try {
		await (db as any).rpc?.('exec_sql', { query: "create table if not exists conversion_models (platform text, niche text, format text, trained_at timestamptz, points jsonb, primary key(platform,niche,format));" })
		const { data } = await db.from('conversion_models').select('points').eq('platform', slice.platform).eq('niche', slice.niche).eq('format', slice.format || 'short_video').order('trained_at', { ascending: false }).limit(1)
		const pts = Array.isArray(data) && data.length ? (data[0] as any).points as Array<{ x:number;y:number }> : defaultMapping()
		return (score: number) => piecewiseLinear(score, pts)
	} catch { return (score:number)=> piecewiseLinear(score, defaultMapping()) }
}

function defaultMapping(): Array<{x:number;y:number}> {
	// score 0..100 → conv rate 0..0.03 baseline
	return [ { x: 0, y: 0.001 }, { x: 40, y: 0.006 }, { x: 60, y: 0.010 }, { x: 75, y: 0.016 }, { x: 85, y: 0.022 }, { x: 95, y: 0.030 } ]
}

function piecewiseLinear(x: number, pts: Array<{x:number;y:number}>): number {
	const p = pts.slice().sort((a,b)=> a.x - b.x)
	if (x <= p[0].x) return p[0].y
	if (x >= p[p.length-1].x) return p[p.length-1].y
	for (let i=1;i<p.length;i++) {
		if (x <= p[i].x) {
			const x0=p[i-1].x, y0=p[i-1].y, x1=p[i].x, y1=p[i].y
			const t = (x - x0) / Math.max(1, (x1 - x0))
			return y0 + t * (y1 - y0)
		}
	}
	return p[p.length-1].y
}


