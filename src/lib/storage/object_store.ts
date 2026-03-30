import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { randomUUID } from 'crypto'

export type StorageProvider = 'supabase'

export const STORAGE_PROVIDER: StorageProvider = 'supabase'
export const STORAGE_BUCKET = 'vl-artifacts'

export function sanitizePathSegment(segment: string): string {
  const s = String(segment || '')
  if (s.includes('..')) throw new Error('invalid path segment')
  if (s.startsWith('/') || s.startsWith('\\')) throw new Error('absolute paths forbidden')
  return s.replace(/[^a-zA-Z0-9_.\-\/]/g, '-')
}

export async function ensureBucket(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    // Try to list; if error, attempt create
    const { error: listErr } = await db.storage.from(STORAGE_BUCKET).list()
    if (listErr) {
      // @ts-ignore
      await (db.storage as any).createBucket?.(STORAGE_BUCKET, { public: false })
    }
  } catch {}
}

export async function putJson(folder: 'models'|'evidence'|'proof'|'raw'|'transcripts', json: any, opts?: { filename?: string; contentType?: string }): Promise<{ path: string; url?: string }> {
  await ensureBucket()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const id = opts?.filename && !opts.filename.includes('..') ? opts.filename : `${randomUUID()}.json`
  const key = sanitizePathSegment(`${folder}/${id}`)
  const { error } = await db.storage.from(STORAGE_BUCKET).upload(key, new Blob([JSON.stringify(json)], { type: opts?.contentType || 'application/json' }), { upsert: true })
  if (error) throw error
  const { data: signed } = await db.storage.from(STORAGE_BUCKET).createSignedUrl(key, 24*3600)
  return { path: key, url: signed?.signedUrl }
}

export async function getJson(path: string): Promise<any | null> {
  await ensureBucket()
  const key = sanitizePathSegment(path)
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data, error } = await db.storage.from(STORAGE_BUCKET).download(key)
  if (error) return null
  const text = await data.text()
  return JSON.parse(text)
}

export async function getSignedUrl(path: string, ttlSeconds = 24*3600): Promise<string | null> {
  await ensureBucket()
  const key = sanitizePathSegment(path)
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data, error } = await db.storage.from(STORAGE_BUCKET).createSignedUrl(key, ttlSeconds)
  if (error) return null
  return data?.signedUrl || null
}

export async function putText(folder: 'models'|'evidence'|'proof'|'raw'|'transcripts', text: string, opts?: { filename?: string; contentType?: string }): Promise<{ path: string; url?: string }> {
  await ensureBucket()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const id = opts?.filename && !opts.filename.includes('..') ? opts.filename : `${randomUUID()}.txt`
  const key = sanitizePathSegment(`${folder}/${id}`)
  const { error } = await db.storage.from(STORAGE_BUCKET).upload(key, new Blob([text], { type: opts?.contentType || 'text/plain' }), { upsert: true })
  if (error) throw error
  const { data: signed } = await db.storage.from(STORAGE_BUCKET).createSignedUrl(key, 24*3600)
  return { path: key, url: signed?.signedUrl }
}


