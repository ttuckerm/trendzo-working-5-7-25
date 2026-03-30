import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function ensureCommerceTables(): Promise<void> {
	const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
	const sql = `
	create table if not exists sku_catalog(
	  sku_id text primary key,
	  name text,
	  price_cents int,
	  currency text,
	  tags text[]
	);
	create table if not exists commerce_sessions(
	  session_id text primary key,
	  first_seen timestamptz,
	  last_seen timestamptz,
	  user_agent text,
	  ip_hash text,
	  country text,
	  privacy_mode bool default false
	);
	create table if not exists commerce_events(
	  id uuid primary key default gen_random_uuid(),
	  session_id text,
	  ts timestamptz,
	  event_type text check (event_type in ('view','click','add_to_cart','order_confirm')),
	  video_id text,
	  sku_id text,
	  referrer text,
	  utm jsonb,
	  meta jsonb
	);
	create index if not exists idx_commerce_events_video on commerce_events(video_id);
	create index if not exists idx_commerce_events_sku on commerce_events(sku_id);
	create index if not exists idx_commerce_events_ts on commerce_events(ts);
	create index if not exists idx_commerce_events_type on commerce_events(event_type);
	create index if not exists idx_commerce_events_session_ts on commerce_events(session_id, ts);
	create table if not exists orders(
	  order_id text primary key,
	  session_id text,
	  ts timestamptz,
	  sku_id text,
	  qty int,
	  revenue_cents int,
	  currency text,
	  video_id text
	);
	create table if not exists attribution_results(
	  id uuid primary key default gen_random_uuid(),
	  order_id text unique,
	  video_id text,
	  sku_id text,
	  session_id text,
	  model text,
	  weight numeric,
	  window_hours int,
	  decay numeric,
	  revenue_cents int,
	  created_at timestamptz default now()
	);
	create index if not exists idx_orders_video on orders(video_id);
	create index if not exists idx_orders_sku on orders(sku_id);
	create index if not exists idx_orders_ts on orders(ts);
	`;
	try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}


