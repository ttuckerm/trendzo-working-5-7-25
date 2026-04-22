#!/usr/bin/env node
/**
 * Stage 3 Phase 2 (v2) chat-route verifier.
 *
 * POSTs a minimal "nudge Marcus" prompt to /api/agency-chat and consumes the
 * streamed UIMessage response. Pass criteria:
 *   1. Response status is 200 (no AI SDK validation error — v1 crashed here)
 *   2. Stream produces output WITHOUT containing the "ModelMessage[] schema"
 *      error string that killed v1
 *   3. Either a tool call to propose_nudge_creator appears in the stream, or
 *      text appears — proves the agent at least produced valid output
 *
 * Requires:
 *   - Dev server running on http://localhost:3000 (npm run dev in another terminal)
 *   - NEXT_PUBLIC_DISABLE_AUTH=true in .env.local, OR a valid cookie in COOKIE env
 *
 * Usage:
 *   node scripts/test-phase2-chat.mjs
 *   # or with explicit cookie
 *   COOKIE="sb-xyz=..." node scripts/test-phase2-chat.mjs
 */

import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

async function loadEnv() {
  try {
    const txt = await readFile('.env.local', 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  } catch {}
}
await loadEnv();

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const COOKIE = process.env.COOKIE || '';

const body = {
  messages: [
    {
      id: randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: 'Nudge Marcus about his overdue brief.' }],
    },
  ],
};

console.log('Stage 3 Phase 2 (v2) chat-route verifier\n');
console.log(`Endpoint: ${BASE}/api/agency-chat`);
console.log(`Prompt: "${body.messages[0].parts[0].text}"\n`);

const started = Date.now();
let response;
try {
  response = await fetch(`${BASE}/api/agency-chat`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(COOKIE ? { cookie: COOKIE } : {}),
    },
    body: JSON.stringify(body),
  });
} catch (err) {
  console.error('FAIL — could not reach dev server.');
  console.error(`Is 'npm run dev' running at ${BASE}?`);
  console.error(`Error: ${err.message}`);
  process.exit(2);
}

console.log(`HTTP ${response.status} ${response.statusText}`);

if (response.status === 401) {
  console.error('\nFAIL — 401 Unauthorized.');
  console.error('Either set NEXT_PUBLIC_DISABLE_AUTH=true in .env.local, or pass COOKIE env.');
  const txt = await response.text().catch(() => '');
  if (txt) console.error(`Body: ${txt.slice(0, 500)}`);
  process.exit(2);
}

if (!response.ok || !response.body) {
  const txt = await response.text().catch(() => '');
  console.error(`\nFAIL — non-200 response.`);
  console.error(`Body: ${txt.slice(0, 2000)}`);
  process.exit(1);
}

// Stream into a buffer, watching for known failure signatures.
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let saw = {
  modelMessageError: false,
  toolCallPropose: false,
  anyText: false,
  anyToolCall: false,
  errorEvent: null,
};
let chunks = 0;

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  buffer += chunk;
  chunks++;

  if (buffer.includes('ModelMessage[] schema')) saw.modelMessageError = true;
  if (buffer.includes('propose_nudge_creator')) saw.toolCallPropose = true;
  if (/"type":"text-delta"/.test(chunk) || /"type":"text"/.test(chunk)) saw.anyText = true;
  if (/"type":"tool-input-start"/.test(chunk) || /"type":"tool-call"/.test(chunk)) saw.anyToolCall = true;
  // AI SDK UI stream error events
  const errMatch = chunk.match(/"type":"error"[^}]*"errorText":"([^"]*)"/);
  if (errMatch && !saw.errorEvent) saw.errorEvent = errMatch[1];
}

const elapsed = Date.now() - started;
console.log(`Stream finished in ${elapsed}ms, ${chunks} chunks, ${buffer.length} bytes total.\n`);

// ── Verdict ────────────────────────────────────────────────────────────
const results = [];
function record(name, ok, detail) { results.push({ name, ok, detail }); }

record(
  'response is 200 OK',
  response.ok,
  `got ${response.status}`,
);
record(
  'no "ModelMessage[] schema" error in stream (v1 signature)',
  !saw.modelMessageError,
  saw.modelMessageError ? 'PRESENT — same error as v1' : 'not present',
);
record(
  'no UI stream error event',
  saw.errorEvent == null,
  saw.errorEvent ? `error event: "${saw.errorEvent}"` : 'none',
);
record(
  'agent produced SOMETHING (text or tool call)',
  saw.anyText || saw.anyToolCall,
  `text=${saw.anyText} toolCall=${saw.anyToolCall}`,
);

const proposeCalled = saw.toolCallPropose;
if (proposeCalled) {
  record('bonus: propose_nudge_creator was called', true, 'yes — ideal path');
}

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;

console.log('Results:');
for (const r of results) {
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`);
  console.log(`        ${r.detail}`);
}
console.log('');
console.log(`${passed} passed, ${failed} failed.\n`);

if (failed > 0) {
  console.log('--- FIRST 4KB OF STREAM (for debugging) ---');
  console.log(buffer.slice(0, 4000));
  console.log('--- END STREAM PREVIEW ---\n');
}

if (saw.modelMessageError) {
  console.log('The v1 error signature is still present in v2. The propose-only redesign did');
  console.log('not fix the underlying issue. Paste this entire script output to Claude.');
}

process.exit(failed === 0 ? 0 : 1);
