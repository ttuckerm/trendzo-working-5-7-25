import fs from 'node:fs';

const r = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-77.json', 'utf8'));
const d = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/batches.json', 'utf8'));
const b = d[77] || d.batches?.[77];
const imports = b.importMap;

const nodes = [];
const edges = [];

function fileNode(path, summary, tags, complexity, languageNotes) {
  const name = path.split('/').pop();
  const node = { id: 'file:' + path, type: 'file', name, filePath: path, summary, tags, complexity };
  if (languageNotes) node.languageNotes = languageNotes;
  nodes.push(node);
}
function fnNode(path, name, startLine, endLine, summary, tags, complexity) {
  nodes.push({
    id: 'function:' + path + ':' + name,
    type: 'function',
    name,
    filePath: path,
    lineRange: [startLine, endLine],
    summary,
    tags,
    complexity
  });
}
function edge(source, target, type, weight) {
  edges.push({ source, target, type, direction: 'forward', weight });
}

// === File nodes ===
fileNode('src/app/api/bloomberg/market-stats/route.ts',
  'Next.js Bloomberg dashboard endpoint returning aggregated market statistics across niches (avg DPS, viral hits, top performers, total views) computed from prediction_runs.',
  ['api-handler', 'bloomberg', 'analytics', 'aggregation', 'supabase'],
  'moderate');

fileNode('src/app/api/bloomberg/marketplace/installed/route.ts',
  'Returns the list of marketplace packs installed for the current user or agency, used by the Bloomberg marketplace UI.',
  ['api-handler', 'bloomberg', 'marketplace', 'supabase'],
  'moderate');

fileNode('src/app/api/bloomberg/marketplace/recommended/route.ts',
  'Returns recommended marketplace packs for the current user based on niche and usage, used by the Bloomberg marketplace UI.',
  ['api-handler', 'bloomberg', 'marketplace', 'recommendation'],
  'moderate');

fileNode('src/app/api/bloomberg/marketplace/route.ts',
  'Bloomberg marketplace listing endpoint returning all available packs and modules with metadata for browsing.',
  ['api-handler', 'bloomberg', 'marketplace', 'listing'],
  'simple');

fileNode('src/app/api/bloomberg/patterns/route.ts',
  'Pattern discovery endpoint for the Bloomberg dashboard: scans prediction_runs to surface emerging viral patterns, velocity, and statistical signals across niches.',
  ['api-handler', 'bloomberg', 'analytics', 'pattern-detection', 'statistics'],
  'complex');

fileNode('src/app/api/bloomberg/watchlist/route.ts',
  'Bloomberg watchlist CRUD endpoint (GET, POST, DELETE) managing user-tracked niches or creators in the dashboard.',
  ['api-handler', 'bloomberg', 'watchlist', 'crud'],
  'complex');

fileNode('src/app/api/bloomberg/weather/route.ts',
  'Computes a market-weather sentiment for the Bloomberg dashboard (multiplier, status, description, sentiment label) from DPS distribution stats.',
  ['api-handler', 'bloomberg', 'sentiment', 'analytics'],
  'moderate');

fileNode('src/app/api/brain-direct/route.ts',
  'Lightweight direct brain endpoint that forwards the prompt to a single LLM without orchestration; used as a fast path or fallback.',
  ['api-handler', 'brain', 'llm', 'direct'],
  'simple');

fileNode('src/app/api/brain-direct/route.ts.backup',
  'Backup snapshot of the brain-direct route handler (149 lines). Not loaded at runtime; kept for rollback reference.',
  ['backup', 'brain', 'archive'],
  'simple');

fileNode('src/app/api/brain-emergency/route.ts',
  'Emergency brain endpoint with embedded fallback logic for when the main orchestrator is unavailable; large single-handler implementation.',
  ['api-handler', 'brain', 'fallback', 'emergency'],
  'complex');

fileNode('src/app/api/brain-fallback/route.ts',
  'Brain fallback endpoint returning a canned or degraded response when upstream LLM providers fail.',
  ['api-handler', 'brain', 'fallback'],
  'moderate');

fileNode('src/app/api/brain-simple/route.ts',
  'Minimal brain endpoint exposing a single-shot LLM call with no orchestration, used for smoke testing.',
  ['api-handler', 'brain', 'llm', 'simple'],
  'moderate');

fileNode('src/app/api/brain-test/route.ts',
  'Brain test harness endpoint that exercises the brain pipeline with synthetic prompts and returns diagnostic info.',
  ['api-handler', 'brain', 'test', 'diagnostics'],
  'complex');

fileNode('src/app/api/brain/history/route.ts',
  'Returns the authenticated user history of brain (Jarvis) conversations for sidebar listing in the brain UI.',
  ['api-handler', 'brain', 'history', 'supabase'],
  'moderate');

fileNode('src/app/api/brain/route.ts',
  'Primary brain (Jarvis) chat endpoint that delegates to the Jarvis orchestrator and returns or streams the assistant response.',
  ['api-handler', 'brain', 'jarvis', 'orchestrator'],
  'complex');

fileNode('src/app/api/brief-acknowledge/[briefId]/route.ts',
  'Public HTML endpoint hit from email links to acknowledge a content brief; validates the HMAC-signed token and emits a platform event.',
  ['api-handler', 'brief', 'email', 'acknowledge', 'hmac'],
  'moderate');

fileNode('src/app/api/brief-performance/route.ts',
  'GET/POST endpoint for content-brief performance metrics; agency-scoped via auth utils, persists actuals and emits events.',
  ['api-handler', 'brief', 'performance', 'agency', 'supabase'],
  'complex');

fileNode('src/app/api/brief-status/route.ts',
  'GET/POST endpoint for content-brief status updates (sent, seen, in-progress, done); agency-scoped and event-emitting.',
  ['api-handler', 'brief', 'status', 'agency', 'supabase'],
  'complex');

fileNode('src/app/api/bugs/sla/summary/route.ts',
  'Lightweight read-only endpoint summarising bug-tracker SLA compliance (open count by severity, breaches).',
  ['api-handler', 'bugs', 'sla', 'summary'],
  'simple');

fileNode('src/app/api/bulk-download/calculate-dps/route.ts',
  'POST endpoint that calculates Dynamic Percentile Score (DPS v2) for a downloaded video against its cohort and returns interpretation context.',
  ['api-handler', 'bulk-download', 'dps', 'cohort'],
  'complex');

fileNode('src/app/api/bulk-download/predict/route.ts',
  'POST endpoint running the VPS prediction pipeline v2 on a downloaded video and persisting results; GET returns previous predictions.',
  ['api-handler', 'bulk-download', 'prediction', 'vps'],
  'complex');

fileNode('src/app/api/bulk-download/test-all/route.ts',
  'Bulk test runner that fires batched VPS predictions over all items in a test run and tracks progress.',
  ['api-handler', 'bulk-download', 'test', 'batch'],
  'complex');

fileNode('src/app/api/bulk-download/update-item/route.ts',
  'Small POST endpoint to update mutable fields on a bulk-download item (status, notes, label).',
  ['api-handler', 'bulk-download', 'update'],
  'simple');

fileNode('src/app/api/bulk-download/route.ts',
  'Top-level bulk-download orchestration endpoint: enqueues jobs, drives the async processDownloadJob worker, and serves status and listing via GET.',
  ['api-handler', 'bulk-download', 'orchestrator', 'jobs'],
  'complex');

fileNode('src/app/api/calibration/configs/route.ts',
  'GET/POST endpoint for signal calibration configs (D6 calibration profile persistence): loads and saves per-user calibration to Supabase.',
  ['api-handler', 'calibration', 'profile', 'supabase'],
  'complex');

// === Function nodes ===
fnNode('src/app/api/bloomberg/market-stats/route.ts', 'GET', 12, 173,
  'Aggregates prediction_runs into market-wide stats (avg DPS, top performers, viral hit count, total views) for the Bloomberg overview tile.',
  ['api-handler', 'aggregation', 'bloomberg'], 'complex');

fnNode('src/app/api/bloomberg/marketplace/installed/route.ts', 'GET', 12, 72,
  'Returns the list of marketplace packs the current user has installed.',
  ['api-handler', 'marketplace', 'bloomberg'], 'moderate');

fnNode('src/app/api/bloomberg/marketplace/recommended/route.ts', 'GET', 12, 63,
  'Returns recommended marketplace packs ranked for the current user.',
  ['api-handler', 'marketplace', 'recommendation'], 'moderate');

fnNode('src/app/api/bloomberg/marketplace/route.ts', 'GET', 12, 55,
  'Returns the catalog of all marketplace packs available in the Bloomberg dashboard.',
  ['api-handler', 'marketplace', 'listing'], 'simple');

fnNode('src/app/api/bloomberg/patterns/route.ts', 'GET', 43, 311,
  'Scans prediction_runs to detect emerging viral patterns, computes velocity and statistical significance per niche, and returns ranked patterns.',
  ['api-handler', 'pattern-detection', 'analytics'], 'complex');

fnNode('src/app/api/bloomberg/watchlist/route.ts', 'GET', 30, 123,
  'Returns the current user watchlist entries with associated metrics for the Bloomberg dashboard.',
  ['api-handler', 'watchlist'], 'complex');
fnNode('src/app/api/bloomberg/watchlist/route.ts', 'POST', 126, 171,
  'Adds a new entry to the watchlist (niche or creator) for the current user.',
  ['api-handler', 'watchlist', 'mutation'], 'moderate');
fnNode('src/app/api/bloomberg/watchlist/route.ts', 'DELETE', 174, 205,
  'Removes a watchlist entry for the current user.',
  ['api-handler', 'watchlist', 'mutation'], 'moderate');

fnNode('src/app/api/bloomberg/weather/route.ts', 'GET', 12, 112,
  'Computes a market-weather snapshot (multiplier, status, sentiment) from recent prediction_runs distribution stats.',
  ['api-handler', 'sentiment'], 'complex');
fnNode('src/app/api/bloomberg/weather/route.ts', 'getDescription', 131, 144,
  'Returns a human-readable market-weather description from DPS aggregate inputs.',
  ['utility', 'formatting'], 'simple');

fnNode('src/app/api/brain-direct/route.ts', 'POST', 6, 51,
  'Forwards the request prompt directly to a single LLM provider without orchestration; intended as a fast path.',
  ['api-handler', 'llm'], 'moderate');

fnNode('src/app/api/brain-emergency/route.ts', 'POST', 6, 278,
  'Emergency brain handler with inline fallback logic, multi-provider fanout, and a degraded response path when upstream brains are unavailable.',
  ['api-handler', 'brain', 'fallback'], 'complex');
fnNode('src/app/api/brain-emergency/route.ts', 'GET', 280, 285,
  'Health-check style GET for the emergency brain endpoint.',
  ['api-handler', 'healthcheck'], 'simple');

fnNode('src/app/api/brain-fallback/route.ts', 'POST', 7, 59,
  'Returns a canned or degraded brain response when primary providers fail.',
  ['api-handler', 'fallback'], 'moderate');

fnNode('src/app/api/brain-simple/route.ts', 'POST', 6, 56,
  'Single-shot LLM call with minimal orchestration for smoke testing the brain plumbing.',
  ['api-handler', 'llm'], 'moderate');

fnNode('src/app/api/brain-test/route.ts', 'POST', 6, 192,
  'Test harness POST that exercises the brain pipeline with synthetic prompts and returns diagnostic timing and branch info.',
  ['api-handler', 'test', 'diagnostics'], 'complex');
fnNode('src/app/api/brain-test/route.ts', 'GET', 194, 199,
  'Returns brain-test endpoint metadata and health status.',
  ['api-handler', 'healthcheck'], 'simple');

fnNode('src/app/api/brain/history/route.ts', 'GET', 19, 52,
  'Returns the authenticated user past brain (Jarvis) conversation history from Supabase.',
  ['api-handler', 'history'], 'moderate');

fnNode('src/app/api/brain/route.ts', 'POST', 19, 153,
  'Main brain handler: validates the request, delegates to the Jarvis orchestrator, and returns or streams the assistant response.',
  ['api-handler', 'jarvis', 'orchestrator'], 'complex');

fnNode('src/app/api/brief-acknowledge/[briefId]/route.ts', 'htmlResponse', 9, 20,
  'Helper that wraps a plain message in an HTML page for the email-link acknowledge UX.',
  ['utility', 'html'], 'simple');
fnNode('src/app/api/brief-acknowledge/[briefId]/route.ts', 'GET', 22, 112,
  'Public acknowledge endpoint: validates the HMAC-signed briefId token, marks the brief acknowledged, and emits a platform event.',
  ['api-handler', 'acknowledge', 'hmac'], 'complex');

fnNode('src/app/api/brief-performance/route.ts', 'resolveContextForPerformanceGet', 25, 52,
  'Resolves authenticated user and agency context for the brief-performance GET handler.',
  ['utility', 'auth', 'agency'], 'moderate');
fnNode('src/app/api/brief-performance/route.ts', 'GET', 58, 162,
  'Returns brief performance metrics (impressions, opens, completions) for the current agency-scoped briefs.',
  ['api-handler', 'performance', 'agency'], 'complex');
fnNode('src/app/api/brief-performance/route.ts', 'POST', 164, 264,
  'Persists actual performance numbers against a brief and emits a platform event for downstream listeners.',
  ['api-handler', 'performance', 'mutation'], 'complex');

fnNode('src/app/api/brief-status/route.ts', 'resolveContextForStatusGet', 21, 48,
  'Resolves authenticated user and agency context for the brief-status GET handler.',
  ['utility', 'auth', 'agency'], 'moderate');
fnNode('src/app/api/brief-status/route.ts', 'GET', 53, 136,
  'Returns the current status of agency-scoped briefs (sent, seen, in-progress, done) with timestamps.',
  ['api-handler', 'status', 'agency'], 'complex');
fnNode('src/app/api/brief-status/route.ts', 'POST', 138, 238,
  'Updates the status of a brief, enforces the agency gate, and emits a platform event.',
  ['api-handler', 'status', 'mutation'], 'complex');

fnNode('src/app/api/bugs/sla/summary/route.ts', 'GET', 12, 41,
  'Returns a count summary of open bugs by severity and any SLA breaches.',
  ['api-handler', 'sla'], 'moderate');

fnNode('src/app/api/bulk-download/calculate-dps/route.ts', 'fetchCohort', 44, 71,
  'Fetches the cohort of prior videos for the given niche used as the DPS baseline.',
  ['utility', 'cohort', 'supabase'], 'moderate');
fnNode('src/app/api/bulk-download/calculate-dps/route.ts', 'POST', 76, 243,
  'Calculates DPS v2 for the supplied video metrics against its cohort and persists and returns the score plus interpretation.',
  ['api-handler', 'dps', 'cohort'], 'complex');
fnNode('src/app/api/bulk-download/calculate-dps/route.ts', 'getInterpretation', 248, 280,
  'Produces a human-readable interpretation string describing how the actual DPS compares to the predicted range.',
  ['utility', 'interpretation'], 'moderate');

fnNode('src/app/api/bulk-download/predict/route.ts', 'POST', 40, 232,
  'Runs the VPS prediction pipeline v2 on a downloaded video, persists the prediction_run, and returns scores plus tier.',
  ['api-handler', 'prediction', 'vps'], 'complex');
fnNode('src/app/api/bulk-download/predict/route.ts', 'GET', 248, 313,
  'Returns previously computed VPS predictions for the supplied bulk-download item ids.',
  ['api-handler', 'prediction', 'read'], 'complex');

fnNode('src/app/api/bulk-download/test-all/route.ts', 'POST', 28, 97,
  'Starts a bulk test run by enqueuing VPS predictions over all items in the supplied test run.',
  ['api-handler', 'test', 'batch'], 'complex');
fnNode('src/app/api/bulk-download/test-all/route.ts', 'GET', 102, 164,
  'Returns aggregate progress and per-item results for an in-flight bulk test run.',
  ['api-handler', 'test', 'progress'], 'complex');
fnNode('src/app/api/bulk-download/test-all/route.ts', 'runBatchPredictions', 169, 290,
  'Background worker that iterates test-run items, invokes VPS prediction per item, and persists results with progress updates.',
  ['worker', 'batch', 'prediction'], 'complex');

fnNode('src/app/api/bulk-download/update-item/route.ts', 'POST', 13, 45,
  'Updates mutable fields (status, label, notes) on a bulk-download item row.',
  ['api-handler', 'mutation'], 'moderate');

fnNode('src/app/api/bulk-download/route.ts', 'POST', 40, 138,
  'Enqueues a bulk-download job from supplied URLs or criteria and kicks off the async processDownloadJob worker.',
  ['api-handler', 'jobs', 'mutation'], 'complex');
fnNode('src/app/api/bulk-download/route.ts', 'GET', 143, 281,
  'Returns the status, progress, and result listing for bulk-download jobs belonging to the caller.',
  ['api-handler', 'jobs', 'read'], 'complex');
fnNode('src/app/api/bulk-download/route.ts', 'processDownloadJob', 287, 447,
  'Async worker that drives a bulk-download job end-to-end: downloads TikToks, runs the immediate analyzer, computes DPS, persists items, updates progress.',
  ['worker', 'jobs', 'tiktok', 'dps'], 'complex');

fnNode('src/app/api/calibration/configs/route.ts', 'GET', 12, 40,
  'Loads the current user signal calibration configs from Supabase and returns them.',
  ['api-handler', 'calibration', 'read'], 'moderate');
fnNode('src/app/api/calibration/configs/route.ts', 'POST', 45, 82,
  'Persists the supplied calibration configs to Supabase for the current user.',
  ['api-handler', 'calibration', 'mutation'], 'moderate');
fnNode('src/app/api/calibration/configs/route.ts', 'loadCalibrationFromDB', 84, 117,
  'Helper that fetches and shapes the active calibration profile row for the current user from Supabase.',
  ['utility', 'calibration', 'supabase'], 'moderate');
fnNode('src/app/api/calibration/configs/route.ts', 'saveCalibrationToDB', 119, 141,
  'Helper that upserts the calibration profile row into Supabase for the current user.',
  ['utility', 'calibration', 'supabase'], 'moderate');

// === Edges: contains (file -> function) ===
const containsPairs = [
  ['src/app/api/bloomberg/market-stats/route.ts', ['GET']],
  ['src/app/api/bloomberg/marketplace/installed/route.ts', ['GET']],
  ['src/app/api/bloomberg/marketplace/recommended/route.ts', ['GET']],
  ['src/app/api/bloomberg/marketplace/route.ts', ['GET']],
  ['src/app/api/bloomberg/patterns/route.ts', ['GET']],
  ['src/app/api/bloomberg/watchlist/route.ts', ['GET', 'POST', 'DELETE']],
  ['src/app/api/bloomberg/weather/route.ts', ['GET', 'getDescription']],
  ['src/app/api/brain-direct/route.ts', ['POST']],
  ['src/app/api/brain-emergency/route.ts', ['POST', 'GET']],
  ['src/app/api/brain-fallback/route.ts', ['POST']],
  ['src/app/api/brain-simple/route.ts', ['POST']],
  ['src/app/api/brain-test/route.ts', ['POST', 'GET']],
  ['src/app/api/brain/history/route.ts', ['GET']],
  ['src/app/api/brain/route.ts', ['POST']],
  ['src/app/api/brief-acknowledge/[briefId]/route.ts', ['htmlResponse', 'GET']],
  ['src/app/api/brief-performance/route.ts', ['resolveContextForPerformanceGet', 'GET', 'POST']],
  ['src/app/api/brief-status/route.ts', ['resolveContextForStatusGet', 'GET', 'POST']],
  ['src/app/api/bugs/sla/summary/route.ts', ['GET']],
  ['src/app/api/bulk-download/calculate-dps/route.ts', ['fetchCohort', 'POST', 'getInterpretation']],
  ['src/app/api/bulk-download/predict/route.ts', ['POST', 'GET']],
  ['src/app/api/bulk-download/test-all/route.ts', ['POST', 'GET', 'runBatchPredictions']],
  ['src/app/api/bulk-download/update-item/route.ts', ['POST']],
  ['src/app/api/bulk-download/route.ts', ['POST', 'GET', 'processDownloadJob']],
  ['src/app/api/calibration/configs/route.ts', ['GET', 'POST', 'loadCalibrationFromDB', 'saveCalibrationToDB']]
];
for (const [p, fns] of containsPairs) {
  for (const fn of fns) {
    edge('file:' + p, 'function:' + p + ':' + fn, 'contains', 1.0);
  }
}

// === Edges: exports (file -> exported function) ===
const exportPairs = [
  ['src/app/api/bloomberg/market-stats/route.ts', ['GET']],
  ['src/app/api/bloomberg/marketplace/installed/route.ts', ['GET']],
  ['src/app/api/bloomberg/marketplace/recommended/route.ts', ['GET']],
  ['src/app/api/bloomberg/marketplace/route.ts', ['GET']],
  ['src/app/api/bloomberg/patterns/route.ts', ['GET']],
  ['src/app/api/bloomberg/watchlist/route.ts', ['GET', 'POST', 'DELETE']],
  ['src/app/api/bloomberg/weather/route.ts', ['GET']],
  ['src/app/api/brain-direct/route.ts', ['POST']],
  ['src/app/api/brain-emergency/route.ts', ['POST', 'GET']],
  ['src/app/api/brain-fallback/route.ts', ['POST']],
  ['src/app/api/brain-simple/route.ts', ['POST']],
  ['src/app/api/brain-test/route.ts', ['POST', 'GET']],
  ['src/app/api/brain/history/route.ts', ['GET']],
  ['src/app/api/brain/route.ts', ['POST']],
  ['src/app/api/brief-acknowledge/[briefId]/route.ts', ['GET']],
  ['src/app/api/brief-performance/route.ts', ['GET', 'POST']],
  ['src/app/api/brief-status/route.ts', ['GET', 'POST']],
  ['src/app/api/bugs/sla/summary/route.ts', ['GET']],
  ['src/app/api/bulk-download/calculate-dps/route.ts', ['POST']],
  ['src/app/api/bulk-download/predict/route.ts', ['POST', 'GET']],
  ['src/app/api/bulk-download/test-all/route.ts', ['POST', 'GET']],
  ['src/app/api/bulk-download/update-item/route.ts', ['POST']],
  ['src/app/api/bulk-download/route.ts', ['POST', 'GET']],
  ['src/app/api/calibration/configs/route.ts', ['GET', 'POST']]
];
for (const [p, fns] of exportPairs) {
  for (const fn of fns) {
    edge('file:' + p, 'function:' + p + ':' + fn, 'exports', 0.8);
  }
}

// === Edges: imports (from importMap verbatim) ===
for (const [src, targets] of Object.entries(imports)) {
  for (const t of targets) {
    edge('file:' + src, 'file:' + t, 'imports', 0.7);
  }
}

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-77.json', JSON.stringify(out, null, 2));

const byType = {};
for (const n of nodes) byType[n.type] = (byType[n.type] || 0) + 1;
const byEdge = {};
for (const e of edges) byEdge[e.type] = (byEdge[e.type] || 0) + 1;
console.log('nodes total:', nodes.length, 'by type:', byType);
console.log('edges total:', edges.length, 'by type:', byEdge);

// Self-check on imports
let importExpected = 0;
for (const [_, v] of Object.entries(imports)) importExpected += v.length;
console.log('imports expected:', importExpected, 'imports emitted:', byEdge.imports);
if (importExpected !== byEdge.imports) {
  console.error('MISMATCH on imports edges!');
  process.exit(1);
}

// Validate no duplicate node ids, no self-edges, all edge endpoints reference a known node id
const ids = new Set();
for (const n of nodes) {
  if (ids.has(n.id)) { console.error('DUPLICATE node id:', n.id); process.exit(1); }
  ids.add(n.id);
}
// We allow edges that point to known file nodes outside our batch (cross-batch imports);
// per spec, importMap targets are verified project-internal paths.
for (const e of edges) {
  if (e.source === e.target) { console.error('SELF EDGE', e); process.exit(1); }
}
console.log('VALIDATION OK');
