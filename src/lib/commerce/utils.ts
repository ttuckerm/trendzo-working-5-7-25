import { createHash } from 'crypto'

export function hashIp(ip: string | null): string | null {
	if (!ip) return null
	const salt = new Date().toISOString().slice(0,10) // YYYY-MM-DD
	const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'local'
	return createHash('sha256').update(`${ip}|${salt}|${secret}`).digest('hex')
}

export function parseUtm(searchParams: URLSearchParams): any {
	const utm: any = {}
	for (const k of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']) {
		const v = searchParams.get(k)
		if (v) utm[k] = v
	}
	return utm
}

export function getClientIp(req: Request): string | null {
	// fastly/next headers
	const h = (name: string) => (req.headers.get(name) || '')
	return h('x-forwarded-for').split(',')[0].trim() || h('x-real-ip') || null
}

export function corsHeaders() {
	return {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
	}
}


