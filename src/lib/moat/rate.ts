import fs from 'fs'
import path from 'path'

type TokenBucket = {
	capacity: number
	refillPerSec: number
	tokens: number
	updatedAtMs: number
}

type UsagePersist = {
	minuteWindowISO: string
	dayWindowISO: string
	counters: Record<string, { minute: number; day: number; total: number }>
}

const PERSIST_FILE = path.join(process.cwd(), 'fixtures', 'keys', 'usage.json')

function ensureDir() {
	const dir = path.dirname(PERSIST_FILE)
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeAtomic(file: string, data: unknown) {
	ensureDir()
	const tmp = file + '.tmp'
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
	fs.renameSync(tmp, file)
}

function readPersist(): UsagePersist {
	try {
		const raw = JSON.parse(fs.readFileSync(PERSIST_FILE, 'utf8'))
		if (!raw || typeof raw !== 'object') throw new Error('bad')
		return raw as UsagePersist
	} catch {
		const now = new Date()
		const minuteWindowISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).toISOString()
		const dayWindowISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
		return { minuteWindowISO, dayWindowISO, counters: {} }
	}
}

const buckets: Map<string, TokenBucket> = new Map()

function advance(bucket: TokenBucket): void {
	const now = Date.now()
	const delta = Math.max(0, (now - bucket.updatedAtMs) / 1000)
	bucket.tokens = Math.min(bucket.capacity, bucket.tokens + delta * bucket.refillPerSec)
	bucket.updatedAtMs = now
}

export function enforce(keyId: string, limits: { rpm: number; rpd: number }, cost: number = 1): { ok: boolean; reason?: 'rpm' | 'rpd' } {
	// Token-bucket for rpm
	const cap = limits.rpm
	const refillPerSec = cap / 60
	let b = buckets.get(keyId)
	if (!b) {
		b = { capacity: cap, refillPerSec, tokens: cap, updatedAtMs: Date.now() }
		buckets.set(keyId, b)
	}
	advance(b)
	if (b.tokens < cost) {
		return { ok: false, reason: 'rpm' }
	}
	b.tokens -= cost

	// Persisted counters for rpm/rpd windows
	const p = readPersist()
	const now = new Date()
	const minuteWindowISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).toISOString()
	const dayWindowISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
	const prevMinute = p.minuteWindowISO
	const prevDay = p.dayWindowISO
	const minuteChanged = prevMinute !== minuteWindowISO
	const dayChanged = prevDay !== dayWindowISO
	if (minuteChanged) p.minuteWindowISO = minuteWindowISO
	if (dayChanged) p.dayWindowISO = dayWindowISO
	if (minuteChanged || dayChanged) {
		for (const k of Object.keys(p.counters)) {
			if (minuteChanged) p.counters[k].minute = 0
			if (dayChanged) p.counters[k].day = 0
		}
	}
	const cur = p.counters[keyId] || { minute: 0, day: 0, total: 0 }
	cur.minute += cost
	cur.day += cost
	cur.total += cost
	p.counters[keyId] = cur

	if (cur.minute > limits.rpm) {
		writeAtomic(PERSIST_FILE, p)
		return { ok: false, reason: 'rpm' }
	}
	if (cur.day > limits.rpd) {
		writeAtomic(PERSIST_FILE, p)
		return { ok: false, reason: 'rpd' }
	}
	writeAtomic(PERSIST_FILE, p)
	return { ok: true }
}


