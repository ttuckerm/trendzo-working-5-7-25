import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole } from '@/lib/auth/server-auth'
import { commonRateLimiters } from '@/lib/security/rate-limiter'
import { computeDiscoveryReadiness } from '@/lib/discovery/discovery_readiness'

function db(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

async function ensureTables(client: SupabaseClient) {
  try { await (client as any).rpc?.('exec_sql', { query: `
    create table if not exists template_reservoir(
      id text primary key,
      name text,
      niche text,
      status text,
      success_rate double precision,
      delta7d double precision,
      uplift_pct double precision,
      support int,
      safety jsonb,
      entity jsonb,
      examples_count int,
      last_seen_at timestamptz,
      trend jsonb
    );
    create table if not exists template_examples(
      template_id text,
      video_id text,
      thumb_url text,
      ts timestamptz,
      caption text
    );
    create table if not exists discovery_metrics(
      id bigserial primary key,
      created_at timestamptz default now(),
      system jsonb,
      templates jsonb,
      discovery jsonb
    );
    create table if not exists entity_velocity(
      id bigserial primary key,
      kind text check (kind in ('sound','hashtag')),
      name text,
      velocity_24h double precision,
      velocity_7d double precision,
      updated_at timestamptz default now()
    );
    create table if not exists pipeline_control_actions(
      id uuid default gen_random_uuid() primary key,
      created_at timestamptz default now(),
      action text,
      module_id text,
      user_id text,
      params jsonb
    );
  ` }) } catch {}
}

function rand(min: number, max: number) { return Math.random()*(max-min)+min }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)] }

export async function POST(req: NextRequest) {
  // RBAC + rate limit
  const rl = await commonRateLimiters.admin(req)
  if (rl) return rl
  const guard = await requireRole(req, ['chairman', 'sub_admin'])
  if (guard) return guard

  const userId = req.headers.get('x-user-id') || 'local-admin'
  const seedId = `seed_${Math.random().toString(36).slice(2,8)}${Date.now()}`

  const client = db()
  await ensureTables(client)

  // Generate templates (>=90) and examples (>=3 each)
  const niches = ['fitness','business','tech','beauty','cooking','gaming','travel','education']
  const sounds = ['PopBeat','LoFiChill','EpicRise','RetroWave','TrapLoop','AmbientPad']
  const statuses = ['HOT','COOLING','NEW'] as const
  const templates: any[] = []
  const examples: any[] = []
  const totalTemplates = 96
  const now = Date.now()
  for (let i=0;i<totalTemplates;i++) {
    const id = `tpl_${i+1}`
    const status = statuses[i%3]
    const success = status==='HOT'? rand(0.82,0.95) : status==='COOLING'? rand(0.55,0.79) : rand(0.25,0.49)
    const uses = status==='NEW' ? Math.floor(rand(1,9)) : Math.floor(rand(10,200))
    const last = new Date(now - rand(0, 6*3600*1000)).toISOString()
    const trend = Array.from({length: 30}).map((_,k)=> Math.max(0, Math.sin((k+i)/5)+1 + (status==='NEW'? 0.2:0)))
    const exCount = Math.floor(rand(3, 8))
    const safety = { nsfw: Math.random()<0.9? 0 : 1, copyright: Math.random()<0.9? 0 : 1 }
    const entity = { sound: pick(sounds), hashtags: ['#viral','#trendzo', `#${pick(niches)}`] }
    templates.push({ id, name: `Template ${i+1}`, niche: pick(niches), status, success_rate: success, delta7d: rand(-0.08, 0.22), uplift_pct: Math.round(rand(5,35)), support: uses, safety, entity, examples_count: exCount, last_seen_at: last, trend })
    for (let j=0;j<exCount;j++) {
      examples.push({ template_id: id, video_id: `${id}_ex_${j+1}`, thumb_url: `https://img.example.com/${id}/${j+1}.jpg`, ts: new Date(now - rand(0, 10*24*3600*1000)).toISOString(), caption: `Example ${j+1} for ${id}` })
    }
  }

  // Upsert reservoir and examples (truncate-like behavior optional)
  try { await client.from('template_reservoir').upsert(templates as any) } catch {}
  try { await client.from('template_examples').upsert(examples as any) } catch {}

  // Discovery metrics snapshot
  const metrics = {
    system: { accuracy_pct: Math.round(rand(90, 97)*10)/10 },
    templates: { active_count: totalTemplates },
    discovery: { freshness_seconds: 60, new_per_day: 64, churn_pct: Math.round(rand(8,15)*10)/10, coverage_pct: 96.2 }
  }
  try { await client.from('discovery_metrics').insert({ system: metrics.system as any, templates: metrics.templates as any, discovery: metrics.discovery as any } as any) } catch {}

  // Entity velocity
  const evRows = [
    ...sounds.slice(0,4).map(n=> ({ kind:'sound', name:n, velocity_24h: rand(1.2,2.4), velocity_7d: rand(0.8,1.6) })),
    ...['#viral','#trendzo','#foryou','#ai','#business','#fitness'].map(n=> ({ kind:'hashtag', name:n, velocity_24h: rand(1.1,2.0), velocity_7d: rand(0.9,1.4) }))
  ]
  try { await client.from('entity_velocity').insert(evRows as any) } catch {}

  // Minimal A/B and validation tables
  try { await (client as any).rpc?.('exec_sql', { query: `
    create table if not exists ab_tests(id uuid default gen_random_uuid() primary key, created_at timestamptz default now(), name text, status text);
    create table if not exists validation_runs(id uuid default gen_random_uuid() primary key, created_at timestamptz default now(), run_name text, status text, target_accuracy double precision, current_accuracy double precision);
  ` }) } catch {}
  try { await client.from('ab_tests').upsert({ name: 'seeded_ab', status: 'running' } as any) } catch {}
  try { await client.from('validation_runs').upsert({ run_name: 'seed_validation', status: 'completed', target_accuracy: 0.9, current_accuracy: 0.923 } as any) } catch {}

  // DAG nodes and edges: add Template Discovery, Entity Velocity, Schedule Intelligence
  try { await (client as any).rpc?.('exec_sql', { query: `
    create table if not exists pipeline_dag_nodes(id text primary key, label text, group_id text);
    create table if not exists pipeline_dag_edges(id uuid default gen_random_uuid() primary key, upstream_node_id text, downstream_node_id text);
  ` }) } catch {}
  try {
    const nodes = [
      { id: 'extraction', label: 'Extraction', group_id: 'ingest' },
      { id: 'template_discovery', label: 'Template Discovery', group_id: 'discovery' },
      { id: 'entity_velocity', label: 'Entity Velocity', group_id: 'discovery' },
      { id: 'schedule_intelligence', label: 'Schedule Intelligence', group_id: 'discovery' }
    ]
    await client.from('pipeline_dag_nodes').upsert(nodes as any)
    const edges = [
      { upstream_node_id: 'extraction', downstream_node_id: 'template_discovery' },
      { upstream_node_id: 'template_discovery', downstream_node_id: 'entity_velocity' },
      { upstream_node_id: 'entity_velocity', downstream_node_id: 'schedule_intelligence' }
    ]
    await client.from('pipeline_dag_edges').insert(edges as any)
  } catch {}

  // Audit
  let auditId: string | null = null
  try {
    const ins = await client.from('pipeline_control_actions').insert({ action: 'discovery_qa_seed', user_id: userId, params: { seed_id: seedId, counts: { templates: templates.length, examples: examples.length, entities: evRows.length } } } as any).select('id').limit(1)
    auditId = (ins.data as any)?.[0]?.id || null
  } catch {}

  // Compute readiness after seed (best effort) and log summary
  let readiness: any = null
  try { readiness = await computeDiscoveryReadiness(); console.log('[qa-seed] readiness', JSON.stringify(readiness)) } catch {}

  return NextResponse.json({ seed_id: seedId, counts: { templates: templates.length, examples: examples.length, entities: evRows.length }, readiness, audit_id: auditId })
}


