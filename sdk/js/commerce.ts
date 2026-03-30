type PixelInit = { siteKey?: string; defaultVideoId?: string }

let _cfg: PixelInit = {}

export function init(cfg: PixelInit) { _cfg = cfg || {} }

export function track(ev: 'view'|'click'|'add_to_cart'|'order_confirm', payload: any = {}) {
	const sid = getSid()
	const qs = new URLSearchParams({ ev, sid, video_id: payload.video_id || _cfg.defaultVideoId || '', sku_id: payload.sku_id || '' })
	const url = `/px.gif?${qs.toString()}`
	if (navigator.sendBeacon) { navigator.sendBeacon(url) }
	else { const img = new Image(1,1); img.src = url }
}

export async function order(payload: { order_id: string; revenue_cents: number; currency?: string; sku_id: string; qty?: number; video_id?: string }) {
	await fetch('/api/commerce/order', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
}

function getSid(): string {
	const name = 'vl_sid'
	const m = document.cookie.match(/(?:^|; )vl_sid=([^;]*)/)
	if (m) return decodeURIComponent(m[1])
	const sid = crypto.randomUUID()
	document.cookie = `${name}=${encodeURIComponent(sid)}; Path=/; Max-Age=${180*24*3600}`
	return sid
}

export const ViralLabPixel = { init, track, order }


