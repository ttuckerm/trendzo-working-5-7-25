#!/usr/bin/env node
// Stage 3 Phase 1 cache verifier.
// Reads the fire-and-forget usage log written by src/app/api/agency-chat/route.ts
// and prints a pass/fail verdict for prompt caching.
//
// Usage:
//   1. Make sure `npm run dev` is running
//   2. Open /agency in your browser and send TWO messages (any messages)
//   3. node scripts/verify-phase1-cache.mjs
//
// Optional:
//   node scripts/verify-phase1-cache.mjs --reset   # clear the log, then watch
//   node scripts/verify-phase1-cache.mjs --watch   # wait for new entries

import { readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOG_PATH = join(tmpdir(), 'trendzo-agency-cache.log');
const args = new Set(process.argv.slice(2));

function fmt(n) {
  if (n == null) return '?';
  return String(n).padStart(5, ' ');
}

async function readEntries() {
  let text;
  try {
    text = await readFile(LOG_PATH, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function verdict(entries) {
  console.log(`\nLog file: ${LOG_PATH}`);
  console.log(`Entries found: ${entries.length}\n`);

  if (entries.length === 0) {
    console.log('No usage entries yet.');
    console.log('→ Make sure `npm run dev` is running.');
    console.log('→ Open /agency in your browser and send a message.');
    console.log('→ Then run this script again.');
    process.exit(2);
  }

  const tail = entries.slice(-5);
  console.log('Last turns (most recent at bottom):');
  console.log('  #   input  output  cached');
  console.log('  --  -----  ------  ------');
  tail.forEach((e, i) => {
    const n = entries.length - tail.length + i + 1;
    console.log(`  ${String(n).padStart(2)}  ${fmt(e.input)}  ${fmt(e.output)}  ${fmt(e.cached)}`);
  });
  console.log('');

  if (entries.length < 2) {
    console.log('Only one turn logged so far.');
    console.log('→ Send a SECOND message in /agency, then run this script again.');
    console.log('  (Caching only shows up on turn 2+ — turn 1 creates the cache, turn 2 reads it.)');
    process.exit(2);
  }

  const last = entries[entries.length - 1];
  const anyCached = entries.some((e) => (e.cached ?? 0) > 0);

  if (anyCached) {
    const maxCached = Math.max(...entries.map((e) => e.cached ?? 0));
    console.log('PASS — prompt caching is attached.');
    console.log(`      Max cached tokens seen: ${maxCached}`);
    console.log(`      Latest turn: input=${last.input} output=${last.output} cached=${last.cached}`);
    console.log('\nPhase 1 acceptance met. Safe to commit.');
    process.exit(0);
  }

  console.log('FAIL — no cached tokens on any turn.');
  console.log('      Caching is NOT attaching. Likely causes:');
  console.log('      • providerOptions.anthropic.cacheControl missing on system message');
  console.log('      • System prompt shorter than Anthropic minimum for caching (~1024 tokens)');
  console.log('      • @ai-sdk/anthropic version does not forward cache_control');
  console.log('      • Using a model that does not support caching');
  console.log('\nPaste this output back to Claude Code to debug.');
  process.exit(1);
}

async function main() {
  if (args.has('--reset')) {
    await writeFile(LOG_PATH, '');
    console.log(`Cleared ${LOG_PATH}`);
    console.log('Now send 2 messages in /agency, then re-run without --reset.');
    process.exit(0);
  }

  if (args.has('--watch')) {
    console.log(`Watching ${LOG_PATH} for new entries (Ctrl+C to stop)...`);
    let lastSize = 0;
    try { lastSize = (await stat(LOG_PATH)).size; } catch {}
    setInterval(async () => {
      let size = 0;
      try { size = (await stat(LOG_PATH)).size; } catch { return; }
      if (size > lastSize) {
        lastSize = size;
        const entries = await readEntries();
        const e = entries[entries.length - 1];
        console.log(`[${new Date().toLocaleTimeString()}] turn ${entries.length}: input=${e.input} output=${e.output} cached=${e.cached}`);
      }
    }, 500);
    return;
  }

  const entries = await readEntries();
  verdict(entries);
}

main().catch((err) => {
  console.error('Script error:', err);
  process.exit(3);
});
