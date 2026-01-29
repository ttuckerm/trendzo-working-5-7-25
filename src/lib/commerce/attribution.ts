import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type AttributionModel = 'last_touch_decay'|'first_touch'|'multi_touch'

export async function runAttribution(windowHours = 168, model: AttributionModel = 'last_touch_decay', lambda = 0.1): Promise<{ orders: number; rows: number; model: string }> {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	const since = new Date(Date.now() - windowHours*3600*1000).toISOString()
	const { data: orders } = await db.from('orders').select('*').gte('ts', since)
	const ord = (orders||[]).filter((o:any)=>o && o.order_id)
	let rows = 0
	for (const o of ord) {
		// skip if already attributed
		const { data: ex } = await db.from('attribution_results').select('order_id').eq('order_id', o.order_id).limit(1)
		if (ex && ex.length) continue
		const { data: touches } = await db
			.from('commerce_events')
			.select('session_id,ts,event_type,video_id,sku_id')
			.eq('session_id', o.session_id)
			.lte('ts', o.ts)
			.gte('ts', new Date(new Date(o.ts).getTime() - windowHours*3600*1000).toISOString())
			.order('ts', { ascending: false })
		const events = (touches||[]).filter((t:any)=> t.video_id)
		if (!events.length) continue
		let weights: Record<string, number> = {}
		if (model === 'first_touch') {
			const first = events[events.length-1]
			weights[first.video_id] = 1.0
		} else if (model === 'multi_touch') {
			// 70% last-touch, 30% proportional to prior touches
			const last = events.find(e=> e.event_type==='click') || events[0]
			weights[last.video_id] = (weights[last.video_id]||0) + 0.7
			const priors = events.filter(e=> e !== last)
			if (priors.length) {
				const per = 0.3 / priors.length
				for (const p of priors) weights[p.video_id] = (weights[p.video_id]||0) + per
			}
		} else {
			// last_touch_decay: preference click>view, decay by age
			const baseTs = new Date(o.ts).getTime()
			let total = 0
			for (const e of events) {
				const ageH = Math.max(0, (baseTs - new Date(e.ts).getTime()) / 3600000)
				const base = e.event_type === 'click' ? 1.0 : 0.5
				const w = base * Math.exp(-lambda * ageH)
				total += w
				weights[e.video_id] = (weights[e.video_id]||0) + w
			}
			if (total>0) Object.keys(weights).forEach(k=> weights[k] = weights[k]/total)
		}
		for (const [video_id, w] of Object.entries(weights)) {
			await db.from('attribution_results').insert({ order_id: o.order_id, video_id, sku_id: o.sku_id, session_id: o.session_id, model, weight: Number(w), window_hours: windowHours, decay: lambda, revenue_cents: Math.round(Number(o.revenue_cents||0) * Number(w)) } as any)
			rows++
		}
	}
	return { orders: ord.length, rows, model }
}


