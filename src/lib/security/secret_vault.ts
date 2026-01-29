import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const ALGO = 'aes-256-gcm'

function getMasterKey(): Buffer {
	const b64 = process.env.VIRALLAB_MASTER_KEY || ''
	if (!b64) throw new Error('VIRALLAB_MASTER_KEY missing')
	const raw = Buffer.from(b64, 'base64')
	if (raw.length !== 32) throw new Error('VIRALLAB_MASTER_KEY must be 32 bytes base64')
	return raw
}

async function ensureVaultTable() {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	const sql = `
	create table if not exists secrets_vault (
		id uuid default gen_random_uuid() primary key,
		name text not null,
		version int not null,
		cipher text not null,
		iv bytea not null,
		tag bytea not null,
		created_at timestamptz not null default now(),
		active boolean not null default true,
		not_before timestamptz,
		not_after timestamptz
	);
	create unique index if not exists secrets_vault_name_version on secrets_vault(name, version);
	`;
	try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function putSecret(name: string, plaintext: string): Promise<{ version: number }>{
	await ensureVaultTable()
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	// Find latest version
	let latest = 0
	try {
		const { data } = await db.from('secrets_vault').select('version').eq('name', name).order('version', { ascending: false }).limit(1)
		if (Array.isArray(data) && data.length) latest = Number((data[0] as any).version || 0)
	} catch {}
	const version = latest + 1
	const key = getMasterKey()
	const iv = randomBytes(12)
	const cipher = createCipheriv(ALGO, key, iv)
	const enc = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()])
	const tag = cipher.getAuthTag()
	await db.from('secrets_vault').insert({ name, version, cipher: enc.toString('base64'), iv, tag, active: true } as any)
	return { version }
}

export async function getSecret(name: string, version?: number): Promise<string | null> {
	await ensureVaultTable()
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	let row: any = null
	if (version) {
		const { data } = await db.from('secrets_vault').select('*').eq('name', name).eq('version', version).limit(1)
		row = (data||[])[0]
	} else {
		const { data } = await db.from('secrets_vault').select('*').eq('name', name).eq('active', true).order('version', { ascending: false }).limit(1)
		row = (data||[])[0]
	}
	if (!row) return null
	const key = getMasterKey()
	const iv: Buffer = Buffer.isBuffer(row.iv) ? row.iv : Buffer.from(row.iv, 'base64')
	const tag: Buffer = Buffer.isBuffer(row.tag) ? row.tag : Buffer.from(row.tag, 'base64')
	const decipher = createDecipheriv(ALGO, key, iv)
	decipher.setAuthTag(tag)
	const dec = Buffer.concat([decipher.update(Buffer.from(String(row.cipher), 'base64')), decipher.final()])
	return dec.toString('utf8')
}












