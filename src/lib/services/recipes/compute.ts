import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type RecipeItem = { id: string; framework_id: string|null; niche: string|null; success_rate: number|null; uses_30d: number|null; last_seen: string|null; status: string|null }

async function ensureTables(db: any) {
  try { await (db as any).rpc?.('exec_sql', { query: `
    create table if not exists viral_templates (
      id uuid default gen_random_uuid() primary key,
      framework_id text,
      niche text,
      success_rate double precision,
      uses_30d int,
      last_seen timestamptz,
      status text
    );
    create table if not exists daily_recipe_book (
      day date primary key,
      hot jsonb not null default '[]'::jsonb,
      cooling jsonb not null default '[]'::jsonb,
      new jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now()
    );
  ` }) } catch {}
}

function toUTCDateString(d = new Date()): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth()+1).padStart(2,'0')
  const day = String(d.getUTCDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

export async function computeDailyRecipeBook(): Promise<{ day: string; counts: { hot: number; cooling: number; new: number } }> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureTables(db)
  const day = toUTCDateString()
  const since30 = new Date(Date.now()-30*24*3600*1000).toISOString()
  const { data } = await db.from('viral_templates').select('id,framework_id,niche,success_rate,uses_30d,last_seen,status').gte('last_seen', since30).limit(10000)
  const rows: RecipeItem[] = (data||[]) as any
  const HOT: RecipeItem[] = []
  const COOLING: RecipeItem[] = []
  const NEW: RecipeItem[] = []
  for (const r of rows) {
    const uses = Number(r.uses_30d||0)
    const sr = typeof r.success_rate === 'number' ? r.success_rate! : null
    if (uses < 10) { NEW.push(r); continue }
    if (sr !== null && sr >= 0.80) { HOT.push(r); continue }
    if (sr !== null && sr >= 0.50 && sr < 0.80) { COOLING.push(r); continue }
  }
  const payload = { hot: HOT.slice(0,100), cooling: COOLING.slice(0,100), new: NEW.slice(0,100) }
  try {
    await db.from('daily_recipe_book').upsert({ day, hot: payload.hot as any, cooling: payload.cooling as any, new: payload.new as any } as any)
    await db.from('integration_job_runs').upsert({ job: 'recipes_daily', last_run: new Date().toISOString() } as any)
  } catch {}
  return { day, counts: { hot: payload.hot.length, cooling: payload.cooling.length, new: payload.new.length } }
}


