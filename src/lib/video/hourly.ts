import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function ensureVideoHourlyTable(db?: any): Promise<void> {
  const client = db || createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (client as any).rpc?.('exec_sql', { query: `
    create table if not exists video_hourly (
      video_id text not null,
      hour_n int not null,
      views int default 0,
      likes int default 0,
      comments int default 0,
      shares int default 0,
      created_at timestamptz not null default now(),
      primary key(video_id, hour_n)
    );
    create index if not exists idx_video_hourly_created on video_hourly(created_at desc);
  ` }) } catch {}
}

export async function upsertVideoHourly(params: { video_id: string; hour_n: number; views?: number; likes?: number; comments?: number; shares?: number }): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureVideoHourlyTable(db)
  const row:any = { video_id: params.video_id, hour_n: params.hour_n, views: params.views||0, likes: params.likes||0, comments: params.comments||0, shares: params.shares||0 }
  try { await db.from('video_hourly').upsert(row as any, { onConflict: 'video_id,hour_n' } as any) } catch {}
}

export async function getVideoHourlySeries(video_id: string, lastN = 8): Promise<Array<{ hour_n:number; views:number; likes:number; comments:number; shares:number }>> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await ensureVideoHourlyTable(db)
  const { data } = await db
    .from('video_hourly')
    .select('hour_n,views,likes,comments,shares')
    .eq('video_id', video_id)
    .order('hour_n', { ascending: true })
    .limit(lastN)
  return (data||[]) as any
}


