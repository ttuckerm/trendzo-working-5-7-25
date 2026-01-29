import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type Plan = 'free' | 'pro' | 'enterprise'

export type KeyRotation = { keyId: string; keyHash: string; atISO: string }

export type KeyRecord = {
	keyId: string
	keyHash: string
	plan: Plan
	createdAtISO: string
	revoked?: boolean
	rotations: KeyRotation[]
	limits: { rpm: number; rpd: number }
	usage: { minute: number; day: number; total: number }
}

type KeysFileShape = { keys: KeyRecord[] }

const ROOT_DIR = path.join(process.cwd(), 'fixtures', 'keys')
const KEYS_FILE = path.join(ROOT_DIR, 'keys.json')

function ensureDir() {
	if (!fs.existsSync(ROOT_DIR)) fs.mkdirSync(ROOT_DIR, { recursive: true })
}

function writeAtomicJson(file: string, data: unknown) {
	ensureDir()
	const tmp = file + '.tmp'
	fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
	fs.renameSync(tmp, file)
}

function readKeysFile(): KeysFileShape {
	try {
		const raw = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'))
		if (!raw || typeof raw !== 'object' || !Array.isArray((raw as any).keys)) return { keys: [] }
		return raw as KeysFileShape
	} catch {
		return { keys: [] }
	}
}

function saveKeysFile(next: KeysFileShape) {
	writeAtomicJson(KEYS_FILE, next)
}

function getPlanLimits(plan: Plan): { rpm: number; rpd: number } {
	if (plan === 'enterprise') return { rpm: 600, rpd: 100000 }
	if (plan === 'pro') return { rpm: 120, rpd: 10000 }
	return { rpm: 30, rpd: 1000 }
}

function generateKeyId(): string {
	return 'k_' + crypto.randomBytes(6).toString('hex')
}

function generatePlaintextKey(): string {
	// 32 chars, url-safe
	return crypto.randomBytes(24).toString('base64url')
}

function getSalt(): string {
	return process.env.KEY_SALT || process.env.ADMIN_TOKEN || 'trendzo-default-salt'
}

function hashKey(plaintext: string): string {
	const salt = getSalt()
	return crypto
		.createHmac('sha256', salt)
		.update(plaintext)
		.digest('hex')
}

export function maskKeyId(id: string): string {
	return id.slice(0, 10)
}

export function last4(plaintext: string): string {
	return plaintext.slice(-4)
}

export function listKeysMasked(): Array<Pick<KeyRecord, 'keyId' | 'plan' | 'createdAtISO' | 'revoked' | 'limits' | 'usage'>> {
	const f = readKeysFile()
	return f.keys.map((k) => ({ keyId: maskKeyId(k.keyId), plan: k.plan, createdAtISO: k.createdAtISO, revoked: !!k.revoked, limits: k.limits, usage: k.usage }))
}

export function findKey(keyOrId: string): KeyRecord | null {
	const f = readKeysFile()
	const salt = getSalt()
	const byId = f.keys.find((k) => k.keyId === keyOrId)
	if (byId) return byId
	// Try by plaintext (hash comparison)
	try {
		const hash = crypto.createHmac('sha256', salt).update(keyOrId).digest('hex')
		const byHash = f.keys.find((k) => k.keyHash === hash)
		return byHash || null
	} catch {
		return null
	}
}

export function issueKey(plan: Plan = 'free'): { keyId: string; plaintext: string; keyLast4: string; plan: Plan; limits: { rpm: number; rpd: number } } {
	const f = readKeysFile()
	const keyId = generateKeyId()
	const plaintext = generatePlaintextKey()
	const keyHash = hashKey(plaintext)
	const limits = getPlanLimits(plan)
	const rec: KeyRecord = {
		keyId,
		keyHash,
		plan,
		createdAtISO: new Date().toISOString(),
		rotations: [],
		limits,
		usage: { minute: 0, day: 0, total: 0 },
	}
	const next: KeysFileShape = { keys: [rec, ...f.keys] }
	saveKeysFile(next)
	return { keyId, plaintext, keyLast4: last4(plaintext), plan, limits }
}

export function rotateKey(keyId: string): { keyId: string; plaintext: string; keyLast4: string } | null {
	const f = readKeysFile()
	const idx = f.keys.findIndex((k) => k.keyId === keyId)
	if (idx === -1) return null
	const plaintext = generatePlaintextKey()
	const keyHash = hashKey(plaintext)
	const now = new Date().toISOString()
	const prev = f.keys[idx]
	const rotation: KeyRotation = { keyId: prev.keyId, keyHash: prev.keyHash, atISO: now }
	f.keys[idx] = { ...prev, keyHash, rotations: [rotation, ...prev.rotations] }
	saveKeysFile(f)
	return { keyId, plaintext, keyLast4: last4(plaintext) }
}

export function revokeKey(keyId: string): boolean {
	const f = readKeysFile()
	const idx = f.keys.findIndex((k) => k.keyId === keyId)
	if (idx === -1) return false
	f.keys[idx] = { ...f.keys[idx], revoked: true }
	saveKeysFile(f)
	return true
}

export function recordUsage(keyId: string, cost: number = 1): void {
	const f = readKeysFile()
	const idx = f.keys.findIndex((k) => k.keyId === keyId)
	if (idx === -1) return
	const cur = f.keys[idx]
	const nextUsage = {
		minute: Math.max(0, (cur.usage?.minute || 0) + cost),
		day: Math.max(0, (cur.usage?.day || 0) + cost),
		total: Math.max(0, (cur.usage?.total || 0) + cost),
	}
	f.keys[idx] = { ...cur, usage: nextUsage }
	saveKeysFile(f)
}

export function resetRollingCountersIfNeeded(keyId: string): void {
	// Soft reset minute/day counters when persisted usage drifts; rate.ts owns windows strictly.
	const f = readKeysFile()
	const idx = f.keys.findIndex((k) => k.keyId === keyId)
	if (idx === -1) return
	const cur = f.keys[idx]
	f.keys[idx] = { ...cur, usage: { ...cur.usage, minute: cur.usage.minute, day: cur.usage.day } }
	saveKeysFile(f)
}

export function getMaskedKeyForAdmin(key: KeyRecord): { keyId: string; plan: Plan; createdAtISO: string; revoked?: boolean; limits: { rpm: number; rpd: number }; usage: { minute: number; day: number; total: number } } {
	return { keyId: key.keyId, plan: key.plan, createdAtISO: key.createdAtISO, revoked: key.revoked, limits: key.limits, usage: key.usage }
}


