import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { mergeExpectedFirstHourForTokens } from '@/lib/frameworks/mapping_guide'

const GENERIC_TOKENS = ['fyp','viral','trending','generic','HASHTAG_GENERIC']
const HIGH_LIFT_TOKENS = ['hook','before_after','story','pov','controversy','challenge']

function scoreToken(token: string, coeffs: Record<string, number>): number {
  const base: Record<string, number> = {
    hook: 1.0, before_after: 1.2, story: 0.9, pov: 0.7, controversy: 1.1, challenge: 0.8
  }
  const genericPenalty = GENERIC_TOKENS.includes(token.toLowerCase()) ? -0.6 : 0
  return (base[token] || 0.4) + (coeffs[token] || 0) + genericPenalty
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({})) as any
  const tokensMatched: string[] = Array.isArray(body?.tokens_matched) ? body.tokens_matched : []
  const videoFeatures = body?.video_features || {}

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists prediction_events (id bigserial primary key, created_at timestamptz not null default now(), prediction_id text, event text not null, payload jsonb);" }) } catch {}
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz not null);" }) } catch {}

  // Pull creator-specific token coeffs if creator_id present
  const creatorId = String(videoFeatures?.creator_id || videoFeatures?.creatorId || '')
  const coeffs: Record<string, number> = {}
  if (creatorId) {
    try {
      const { data } = await db.from('creator_token_coeffs').select('token,coeff').eq('creator_id', creatorId).limit(200)
      for (const r of (data||[])) coeffs[(r as any).token] = Number((r as any).coeff || 0)
    } catch {}
  }

  // Candidates to add: top high-lift tokens not already present
  const present = new Set(tokensMatched.map(t=>String(t).toLowerCase()))
  const addCandidates = HIGH_LIFT_TOKENS.filter(t => !present.has(t))
  addCandidates.sort((a,b)=> scoreToken(b, coeffs) - scoreToken(a, coeffs))
  const add_tokens = addCandidates.slice(0, 2)

  // Candidates to remove: generic tokens present
  const remove_tokens = tokensMatched.filter(t => GENERIC_TOKENS.includes(String(t).toLowerCase()))

  // Script and pacing suggestions
  const script_changes = [
    'Open with an authority claim within first 3 seconds (AUTHORITY@<3s).',
    'Tighten narrative to a single clear promise and payoff.'
  ]
  const pacing_changes = ['CUTS>=3/5s', 'Add micro-pattern: pattern interrupt at 4-6s']
  const text_on_screen = ['On-screen CTA by 5s', 'Caption key stat within first hook sentence']
  const hook_options = [
    'I bet you didn’t know this shortcut…',
    'Here’s why your videos are underperforming (and how to fix it).',
    'This tiny change 3x’d our views last week.'
  ]

  // Compute expected uplift from tokens and creator coeffs
  let expected_delta = 0
  for (const t of add_tokens) expected_delta += Math.max(0.5, scoreToken(t, coeffs))
  for (const t of remove_tokens) expected_delta += 0.2 // removing generic noise yields small positive
  expected_delta = Math.min(10, Math.max(-5, Number(expected_delta.toFixed(2))))

  // Best-effort: log suggestion event for status metrics
  try {
    await db.from('prediction_events').insert({ event: 'coach_suggested', payload: { add_tokens, remove_tokens, expected_delta } } as any)
    await db.from('integration_job_runs').upsert({ job: 'coach', last_run: new Date().toISOString() } as any)
  } catch {}

  return NextResponse.json({
    add_tokens,
    remove_tokens,
    script_changes,
    hook_options,
    pacing_changes,
    text_on_screen,
    audio_swap: false,
    expected_delta
  })
}


