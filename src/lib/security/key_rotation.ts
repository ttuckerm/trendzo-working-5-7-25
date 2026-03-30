import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

async function ensureKeyTables() {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	const sql = `
	alter table if exists api_keys add column if not exists version int default 1;
	alter table if exists api_keys add column if not exists not_before timestamptz;
	alter table if exists api_keys add column if not exists not_after timestamptz;
	alter table if exists api_keys add column if not exists rotated_from int;
	alter table if exists telemetry_api_keys add column if not exists version int default 1;
	alter table if exists telemetry_api_keys add column if not exists not_before timestamptz;
	alter table if exists telemetry_api_keys add column if not exists not_after timestamptz;
	alter table if exists telemetry_api_keys add column if not exists rotated_from int;
	create table if not exists prediction_events (id bigserial primary key, created_at timestamptz default now(), event text, key_id text, from_version int, to_version int);
	`;
	try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function rotateApiKey(keyId: string): Promise<{ from: number; to: number; grace_days: number }>{
	await ensureKeyTables()
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	const { data } = await db.from('api_keys').select('version').eq('key', keyId).limit(1)
	const current = (data && data[0] && Number((data[0] as any).version)) || 1
	const next = current + 1
	const now = new Date()
	const graceDays = 7
	const notAfter = new Date(Date.now() + graceDays*24*3600*1000)
	await db.from('api_keys').update({ not_after: notAfter.toISOString() } as any).eq('key', keyId).eq('version', current)
	await db.from('api_keys').insert({ key: keyId, version: next, not_before: now.toISOString(), rotated_from: current, is_revoked: false } as any)
	await db.from('prediction_events').insert({ event: 'key_rotated', key_id: keyId, from_version: current, to_version: next } as any)
	return { from: current, to: next, grace_days: graceDays }
}

export async function scheduleRotation(name: string, days: number): Promise<void> {
	// Placeholder scheduler registration: persisted as integration_job_runs
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz);" })
	await db.from('integration_job_runs').upsert({ job: `rotate_${name}`, last_run: new Date(Date.now()+days*24*3600*1000).toISOString() } as any)
}

export async function expireOldVersions(name: string): Promise<number> {
	await ensureKeyTables()
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	const nowIso = new Date().toISOString()
	const { data } = await db.from('api_keys').select('key,version,not_after').lt('not_after', nowIso)
	const keys = Array.isArray(data) ? data : []
	// Revoke keys past grace window
	for (const k of keys as any[]) {
		try { await db.from('api_keys').update({ is_revoked: true } as any).eq('key', (k as any).key).eq('version', (k as any).version) } catch {}
	}
	return keys.length
}












