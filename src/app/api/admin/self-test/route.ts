import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, logSupabaseRuntimeEnv } from '@/lib/env';

// Lazily create inside handler to avoid import-time env requirements
function getClient(){ return createClient(SUPABASE_URL, SUPABASE_ANON_KEY) }

export async function GET(req: NextRequest) {
  const checks: { name: string; ok: boolean; info?: any }[] = [];
  const start = Date.now();
  try {
    // 1. Env present
    const envOk = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    checks.push({ name: 'env.supabase', ok: envOk });

    // 2. DB connect and basic query
    const { data: ping, error: pingErr } = await supabase.from('videos').select('id').limit(1);
    checks.push({ name: 'db.connect', ok: !pingErr, info: pingErr?.message || (ping?.length ?? 0) });

    // 3. Required tables/columns minimal
    const requiredTables = ['videos', 'templates'];
    for (const tbl of requiredTables) {
      const { error } = await supabase.from(tbl).select('count').limit(1);
      checks.push({ name: `db.table.${tbl}`, ok: !error, info: error?.message });
    }

    // 4. Gallery endpoints reachable
    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const endpoints = ['/api/gallery/recipe-book', '/api/gallery/proving-grounds', '/api/gallery/lab?status=active'];
    for (const path of endpoints) {
      try {
        const full = new URL(path, origin).toString();
        const res = await fetch(full, { cache: 'no-store' });
        checks.push({ name: `api${path}`, ok: res.ok, info: res.status });
      } catch (e: any) {
        checks.push({ name: `api${path}`, ok: false, info: e?.message });
      }
    }

    // 5. Flags are safe by default
    const safeFlags = {
      SCRAPING_ENABLED: process.env.SCRAPING_ENABLED || 'false',
      FEATURE_OCR_ENABLED: process.env.FEATURE_OCR_ENABLED || 'false',
    };
    checks.push({ name: 'flags.safe', ok: safeFlags.SCRAPING_ENABLED === 'false', info: safeFlags });

    const ok = checks.every(c => c.ok);
    return NextResponse.json({ ok, took_ms: Date.now() - start, checks });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message, checks }, { status: 200 });
  }
}


