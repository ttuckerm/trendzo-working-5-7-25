#!/usr/bin/env node
/**
 * Stage 3 Phase 2 (v2) verifier.
 *
 * Exercises the propose → confirm → consume pipeline end-to-end against real
 * Supabase, WITHOUT needing the dev server or a browser. Uses the Supabase
 * service key to write a proposal directly, then calls the consume RPC.
 *
 * Pass criteria:
 *   1. INSERT of an agent.proposal row succeeds
 *   2. First consume_agent_proposal call returns true
 *   3. Second consume_agent_proposal call with the same proposal_id returns
 *      false (double-click protection working)
 *   4. A stale proposal (> 10 min old, simulated via created_at backdate)
 *      returns false (TTL enforced)
 *   5. A wrong-hash call returns false (tamper detection)
 *
 * Usage:
 *   node scripts/test-phase2-v2.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_KEY from .env.local.
 */

import { readFile } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';

// ── Load .env.local ────────────────────────────────────────────────────────
async function loadEnv() {
  try {
    const txt = await readFile('.env.local', 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch {
    // no .env.local — rely on process.env
  }
}
await loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('FAIL — missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY.');
  console.error('Make sure .env.local is populated (same vars the dev server uses).');
  process.exit(2);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function canonicalize(input) {
  if (input === null || typeof input !== 'object') return JSON.stringify(input);
  if (Array.isArray(input)) return '[' + input.map(canonicalize).join(',') + ']';
  const keys = Object.keys(input).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(input[k])).join(',') + '}';
}
function hashPayload(p) {
  return createHash('sha256').update(canonicalize(p)).digest('hex');
}

async function sbFetch(path, init = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'content-type': 'application/json',
      prefer: 'return=representation',
      ...(init.headers || {}),
    },
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`Supabase ${r.status} ${path}: ${body}`);
  try { return body ? JSON.parse(body) : null; } catch { return body; }
}

async function rpc(name, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const body = await r.text();
  if (!r.ok) throw new Error(`RPC ${name} ${r.status}: ${body}`);
  try { return JSON.parse(body); } catch { return body; }
}

async function insertProposal({ proposalId, payloadHash, actionPayload, createdAt }) {
  const row = {
    event_type: 'agent.proposal',
    payload: {
      proposal_id: proposalId,
      payload_hash: payloadHash,
      action_id: 'nudge_creator',
      action_payload: actionPayload,
      expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      consumed: false,
    },
    actor_type: 'agent',
    actor_id: null,
    agency_id: null,
    correlation_id: randomUUID(),
  };
  if (createdAt) row.created_at = createdAt;
  const [inserted] = await sbFetch('platform_events', {
    method: 'POST',
    body: JSON.stringify(row),
  });
  return inserted;
}

// ── Test runner ────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  if (ok) passed++; else failed++;
}

async function main() {
  console.log('Stage 3 Phase 2 (v2) verifier\n');
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  // ── Test 1: INSERT a fresh proposal, then consume it. Should return true.
  {
    const proposalId = randomUUID();
    const args = { briefId: 'test-brief-' + randomUUID().slice(0, 8), creatorId: 'test-creator' };
    const hash = hashPayload(args);
    try {
      await insertProposal({ proposalId, payloadHash: hash, actionPayload: args });
      const consumed = await rpc('consume_agent_proposal', {
        p_proposal_id: proposalId,
        p_payload_hash: hash,
      });
      record(
        'fresh proposal → consume returns true',
        consumed === true,
        `RPC returned ${JSON.stringify(consumed)}`,
      );
    } catch (e) {
      record('fresh proposal → consume returns true', false, e.message);
    }
  }

  // ── Test 2: Double-click the same proposal. Second consume should return false.
  {
    const proposalId = randomUUID();
    const args = { briefId: 'test-brief-' + randomUUID().slice(0, 8), creatorId: 'test-creator' };
    const hash = hashPayload(args);
    try {
      await insertProposal({ proposalId, payloadHash: hash, actionPayload: args });
      const first = await rpc('consume_agent_proposal', {
        p_proposal_id: proposalId,
        p_payload_hash: hash,
      });
      const second = await rpc('consume_agent_proposal', {
        p_proposal_id: proposalId,
        p_payload_hash: hash,
      });
      record(
        'double-click → first=true, second=false',
        first === true && second === false,
        `first=${JSON.stringify(first)} second=${JSON.stringify(second)}`,
      );
    } catch (e) {
      record('double-click → first=true, second=false', false, e.message);
    }
  }

  // ── Test 3: Wrong hash → consume returns false.
  {
    const proposalId = randomUUID();
    const args = { briefId: 'test-brief-' + randomUUID().slice(0, 8), creatorId: 'test-creator' };
    const realHash = hashPayload(args);
    const wrongHash = hashPayload({ ...args, briefId: 'tampered' });
    try {
      await insertProposal({ proposalId, payloadHash: realHash, actionPayload: args });
      const consumed = await rpc('consume_agent_proposal', {
        p_proposal_id: proposalId,
        p_payload_hash: wrongHash,
      });
      record(
        'wrong hash → consume returns false',
        consumed === false,
        `RPC returned ${JSON.stringify(consumed)}`,
      );
    } catch (e) {
      record('wrong hash → consume returns false', false, e.message);
    }
  }

  // ── Test 4: Stale proposal (created 15 min ago) → consume returns false.
  {
    const proposalId = randomUUID();
    const args = { briefId: 'test-brief-' + randomUUID().slice(0, 8), creatorId: 'test-creator' };
    const hash = hashPayload(args);
    const fifteenMinAgo = new Date(Date.now() - 15 * 60_000).toISOString();
    try {
      await insertProposal({ proposalId, payloadHash: hash, actionPayload: args, createdAt: fifteenMinAgo });
      const consumed = await rpc('consume_agent_proposal', {
        p_proposal_id: proposalId,
        p_payload_hash: hash,
      });
      record(
        'stale (>10 min) → consume returns false',
        consumed === false,
        `RPC returned ${JSON.stringify(consumed)}`,
      );
    } catch (e) {
      record('stale (>10 min) → consume returns false', false, e.message);
    }
  }

  // ── Test 5: Nonexistent proposal_id → consume returns false.
  {
    try {
      const consumed = await rpc('consume_agent_proposal', {
        p_proposal_id: randomUUID(),
        p_payload_hash: 'nonexistent',
      });
      record(
        'nonexistent proposal_id → consume returns false',
        consumed === false,
        `RPC returned ${JSON.stringify(consumed)}`,
      );
    } catch (e) {
      record('nonexistent proposal_id → consume returns false', false, e.message);
    }
  }

  // ── Print summary ──────────────────────────────────────────────────────
  console.log('Results:');
  for (const r of results) {
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
    if (!r.ok) console.log(`        ${r.detail}`);
  }
  console.log('');
  console.log(`${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    console.log('');
    console.log('If all tests failed with "RPC ... 404" the v2 migration was not applied.');
    console.log('Run supabase/migrations/20260421b_agent_proposal_consume_v2.sql in the Supabase SQL editor.');
  }
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Script crashed:', err);
  process.exit(3);
});
