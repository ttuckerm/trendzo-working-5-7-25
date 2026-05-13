import fs from 'fs';
const b = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/batches.json','utf8'));
const batch = b[79];
const r = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-79.json','utf8'));

const files = batch.files;
const imp = batch.importMap;

const nodes = [];
const edges = [];

function fileNode(path, summary, tags, complexity, languageNotes) {
  const name = path.split('/').pop();
  const n = {
    id: 'file:' + path,
    type: 'file',
    name,
    filePath: path,
    summary,
    tags,
    complexity,
  };
  if (languageNotes) n.languageNotes = languageNotes;
  return n;
}
function fnNode(path, name, startLine, endLine, summary, tags, complexity) {
  return {
    id: 'function:' + path + ':' + name,
    type: 'function',
    name,
    filePath: path,
    lineRange: [startLine, endLine],
    summary,
    tags,
    complexity,
  };
}

const fileInfo = {
  'src/app/api/clay/action/route.ts': {
    summary: 'Clay component action executor: resolves user/agency context, gates write proposals via dual-confirm hash check, dispatches to handleComponentAction, and emits agent.action telemetry.',
    tags: ['api-handler', 'clay', 'agent', 'action-dispatch', 'authorization'],
    complexity: 'complex',
    fns: [
      { n: 'resolveContext', s: 22, e: 56, sum: 'Resolves the operating user and agency, preferring real Supabase auth and falling back to NEXT_PUBLIC_ADMIN_EMAIL owner lookup when the dev auth bypass is on.', tags: ['auth', 'agency-resolution', 'utility'], cx: 'moderate' },
      { n: 'POST', s: 58, e: 190, sum: 'Next.js POST handler that executes a Clay component action: validates the proposal hash, calls the handler, and emits success/error events.', tags: ['api-handler', 'post', 'action-execution'], cx: 'complex' },
    ],
  },
  'src/app/api/clay/classify/route.ts': {
    summary: 'Clay intent classifier endpoint: maps a free-text user message to a known Clay component using the intent classifier and component registry.',
    tags: ['api-handler', 'clay', 'intent-classification'],
    complexity: 'moderate',
    fns: [{ n: 'POST', s: 17, e: 58, sum: 'Next.js POST handler that classifies an incoming intent string into a Clay component id.', tags: ['api-handler', 'post', 'classification'], cx: 'moderate' }],
  },
  'src/app/api/clay/component-data/route.ts': {
    summary: 'Clay component data fetcher endpoint: returns the data payload required to render a given Clay component for the current agency.',
    tags: ['api-handler', 'clay', 'data-fetch'],
    complexity: 'moderate',
    fns: [{ n: 'POST', s: 12, e: 65, sum: 'Next.js POST handler that resolves agency context and fetches the component-specific data payload.', tags: ['api-handler', 'post', 'data-fetch'], cx: 'moderate' }],
  },
  'src/app/api/coach/apply/route.ts': {
    summary: 'Coach apply endpoint: records that a coach-suggested edit has been applied to a variant in the experiments store.',
    tags: ['api-handler', 'coach', 'experiment'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 9, e: 36, sum: 'Applies a coach suggestion to an experiment variant via the coach apply service.', tags: ['api-handler', 'post', 'apply'], cx: 'moderate' }],
  },
  'src/app/api/coach/examples/route.ts': {
    summary: 'Returns canned example prompts/snippets used by the coach UI to seed user input.',
    tags: ['api-handler', 'coach', 'examples'],
    complexity: 'simple',
    fns: [{ n: 'GET', s: 8, e: 23, sum: 'Returns a list of canned coach example prompts.', tags: ['api-handler', 'get', 'examples'], cx: 'simple' }],
  },
  'src/app/api/coach/generate_variants/route.ts': {
    summary: 'Coach variant generator endpoint: produces alternate phrasings or edits for a given input snippet.',
    tags: ['api-handler', 'coach', 'variant-generation'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 14, e: 24, sum: 'Generates coach variant suggestions for an input snippet.', tags: ['api-handler', 'post', 'variants'], cx: 'simple' }],
  },
  'src/app/api/coach/suggest_edits/route.ts': {
    summary: 'Coach edit-suggestion endpoint that scores tokens against a framework mapping guide and proposes targeted edits.',
    tags: ['api-handler', 'coach', 'edit-suggestions', 'framework'],
    complexity: 'moderate',
    fns: [{ n: 'POST', s: 20, e: 83, sum: 'Returns scored edit suggestions for an input transcript using the framework mapping guide.', tags: ['api-handler', 'post', 'suggest-edits'], cx: 'moderate' }],
  },
  'src/app/api/coach/suggest/route.ts': {
    summary: 'Coach suggestion endpoint: GET fetches existing suggestions for an experiment, POST asks the coach service to generate new ones.',
    tags: ['api-handler', 'coach', 'suggestions'],
    complexity: 'simple',
    fns: [
      { n: 'GET', s: 8, e: 20, sum: 'Fetches existing coach suggestions for an experiment.', tags: ['api-handler', 'get', 'suggestions'], cx: 'simple' },
      { n: 'POST', s: 22, e: 42, sum: 'Generates new coach suggestions for a given prompt or experiment.', tags: ['api-handler', 'post', 'suggestions'], cx: 'moderate' },
    ],
  },
  'src/app/api/commerce/event/route.ts': {
    summary: 'Commerce telemetry event endpoint: ingests storefront events (view, add-to-cart, etc.) with telemetry-key auth and stores them via the commerce ensure helper.',
    tags: ['api-handler', 'commerce', 'telemetry', 'event-ingestion'],
    complexity: 'moderate',
    fns: [{ n: 'POST', s: 13, e: 36, sum: 'Ingests a commerce telemetry event after validating the telemetry key.', tags: ['api-handler', 'post', 'ingestion'], cx: 'moderate' }],
  },
  'src/app/api/commerce/order/route.ts': {
    summary: 'Commerce order endpoint: ingests order/purchase events with telemetry-key authentication.',
    tags: ['api-handler', 'commerce', 'order', 'ingestion'],
    complexity: 'moderate',
    fns: [{ n: 'POST', s: 13, e: 38, sum: 'Ingests a commerce order event after validating the telemetry key.', tags: ['api-handler', 'post', 'order'], cx: 'moderate' }],
  },
  'src/app/api/commerce/pixel/route.ts': {
    summary: 'Commerce pixel endpoint: serves or records pixel beacons used for in-browser commerce tracking.',
    tags: ['api-handler', 'commerce', 'pixel', 'telemetry'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 9, e: 32, sum: 'Handles a commerce pixel beacon request gated by the telemetry key.', tags: ['api-handler', 'post', 'pixel'], cx: 'moderate' }],
  },
  'src/app/api/commerce/webhook/shopify/route.ts': {
    summary: 'Shopify webhook receiver: validates the telemetry secret and forwards events into the commerce pipeline.',
    tags: ['api-handler', 'commerce', 'webhook', 'shopify'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 9, e: 34, sum: 'Receives a Shopify webhook payload and ingests it into the commerce pipeline.', tags: ['api-handler', 'post', 'webhook'], cx: 'moderate' }],
  },
  'src/app/api/commerce/webhook/tiktok_shop/route.ts': {
    summary: 'TikTok Shop webhook receiver: validates the telemetry secret and forwards events into the commerce pipeline.',
    tags: ['api-handler', 'commerce', 'webhook', 'tiktok-shop'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 9, e: 34, sum: 'Receives a TikTok Shop webhook payload and ingests it into the commerce pipeline.', tags: ['api-handler', 'post', 'webhook'], cx: 'moderate' }],
  },
  'src/app/api/content-calendar/accept/route.ts': {
    summary: 'Accepts a content-calendar suggestion: marks the calendar item as accepted, persists creator decisions, and triggers downstream pattern tracking.',
    tags: ['api-handler', 'content-calendar', 'accept'],
    complexity: 'moderate',
    fns: [{ n: 'POST', s: 25, e: 164, sum: 'Marks a content-calendar suggestion as accepted and persists creator decision metadata.', tags: ['api-handler', 'post', 'content-calendar', 'accept'], cx: 'complex' }],
  },
  'src/app/api/content-calendar/performance/route.ts': {
    summary: 'Returns content-calendar performance analytics: rollup of accepted vs declined items, predicted vs actual VPS, and per-pattern conversion.',
    tags: ['api-handler', 'content-calendar', 'analytics', 'performance'],
    complexity: 'moderate',
    fns: [{ n: 'GET', s: 22, e: 173, sum: 'Aggregates calendar performance metrics across recent suggestions and returns the rollup.', tags: ['api-handler', 'get', 'analytics'], cx: 'complex' }],
  },
  'src/app/api/content-calendar/route.ts': {
    summary: 'Primary content-calendar feed endpoint: returns upcoming suggestion slots for the creator, blended with pattern metrics and creator context.',
    tags: ['api-handler', 'content-calendar', 'feed', 'creator'],
    complexity: 'complex',
    fns: [{ n: 'GET', s: 35, e: 244, sum: 'Builds and returns the personalized content-calendar feed for the current creator.', tags: ['api-handler', 'get', 'feed'], cx: 'complex' }],
  },
  'src/app/api/creator-attribution/route.ts': {
    summary: 'Creator attribution API: action-dispatched POST/GET endpoint that registers creators, creates attribution links, executes attribution events, and serves analytics dashboards.',
    tags: ['api-handler', 'creator-attribution', 'analytics', 'dashboard'],
    complexity: 'complex',
    fns: [
      { n: 'POST', s: 15, e: 49, sum: 'Routes POST actions to the appropriate creator-attribution handler (register, create, execute, track).', tags: ['api-handler', 'post', 'dispatch'], cx: 'moderate' },
      { n: 'GET', s: 52, e: 76, sum: 'Routes GET actions to creator-attribution analytics or dashboard handlers.', tags: ['api-handler', 'get', 'dispatch'], cx: 'moderate' },
      { n: 'handleRegisterCreator', s: 81, e: 131, sum: 'Registers a new creator for attribution tracking via the creator attribution service.', tags: ['handler', 'creator', 'registration'], cx: 'moderate' },
      { n: 'handleCreateAttribution', s: 136, e: 188, sum: 'Creates a new attribution record linking a creator to an audience or campaign.', tags: ['handler', 'attribution', 'create'], cx: 'moderate' },
      { n: 'handleExecuteAttribution', s: 193, e: 232, sum: 'Executes an attribution event for a creator, applying the configured attribution model.', tags: ['handler', 'attribution', 'execute'], cx: 'moderate' },
      { n: 'handleTrackResponse', s: 237, e: 271, sum: 'Records a response/engagement event against an existing attribution.', tags: ['handler', 'attribution', 'tracking'], cx: 'moderate' },
      { n: 'handleGetAnalytics', s: 276, e: 312, sum: 'Returns aggregate attribution analytics for a creator or campaign.', tags: ['handler', 'analytics', 'attribution'], cx: 'moderate' },
      { n: 'handleGetDashboard', s: 317, e: 398, sum: 'Builds the creator attribution dashboard payload with breakdowns and performance rollups.', tags: ['handler', 'dashboard', 'attribution'], cx: 'complex' },
    ],
  },
  'src/app/api/creator-workflow/discover/route.ts': {
    summary: 'Creator-workflow discover endpoint: invokes the discover server action to fetch trending niches/topics for a creator.',
    tags: ['api-handler', 'creator-workflow', 'discover'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 11, e: 44, sum: 'Invokes the discover server action and returns the discovery result.', tags: ['api-handler', 'post', 'discover'], cx: 'moderate' }],
  },
  'src/app/api/creator-workflow/goals/route.ts': {
    summary: 'Returns the predefined list of creator-workflow goals selectable in onboarding.',
    tags: ['api-handler', 'creator-workflow', 'goals', 'enum'],
    complexity: 'simple',
    fns: [{ n: 'GET', s: 10, e: 25, sum: 'Returns the static list of creator-workflow goals.', tags: ['api-handler', 'get', 'goals'], cx: 'simple' }],
  },
  'src/app/api/creator-workflow/predict/route.ts': {
    summary: 'Creator-workflow predict endpoint: delegates to the predict server action to compute the workflow prediction.',
    tags: ['api-handler', 'creator-workflow', 'predict'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 11, e: 44, sum: 'Invokes the predict server action and returns the prediction result.', tags: ['api-handler', 'post', 'predict'], cx: 'moderate' }],
  },
  'src/app/api/creator-workflow/select-goal/route.ts': {
    summary: 'Persists the creator-selected workflow goal via the select-goal server action.',
    tags: ['api-handler', 'creator-workflow', 'select-goal'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 11, e: 39, sum: 'Saves the creator chosen workflow goal.', tags: ['api-handler', 'post', 'select-goal'], cx: 'moderate' }],
  },
  'src/app/api/creator-workflow/suggest/route.ts': {
    summary: 'Creator-workflow suggest endpoint: invokes the suggest server action to produce next-step recommendations.',
    tags: ['api-handler', 'creator-workflow', 'suggest'],
    complexity: 'simple',
    fns: [{ n: 'POST', s: 11, e: 44, sum: 'Invokes the suggest server action and returns recommended next steps.', tags: ['api-handler', 'post', 'suggest'], cx: 'moderate' }],
  },
  'src/app/api/creator-workflows/[id]/steps/[phase]/route.ts': {
    summary: 'Per-phase step CRUD for a creator workflow: GET returns the phase state, PUT updates the step payload.',
    tags: ['api-handler', 'creator-workflows', 'phase', 'crud'],
    complexity: 'moderate',
    fns: [
      { n: 'getDevUserId', s: 18, e: 28, sum: 'Dev fallback resolver that returns the admin user id when auth is disabled.', tags: ['auth', 'dev-bypass', 'utility'], cx: 'simple' },
      { n: 'GET', s: 31, e: 88, sum: 'Returns the saved step state for a given workflow phase.', tags: ['api-handler', 'get', 'phase'], cx: 'moderate' },
      { n: 'PUT', s: 91, e: 179, sum: 'Persists updates to a workflow phase step payload after agency/ownership checks.', tags: ['api-handler', 'put', 'phase', 'update'], cx: 'moderate' },
    ],
  },
  'src/app/api/creator-workflows/[id]/route.ts': {
    summary: 'Creator workflow record API: GET fetches a workflow, PATCH updates metadata, DELETE removes it (with auth/ownership gating).',
    tags: ['api-handler', 'creator-workflows', 'crud'],
    complexity: 'moderate',
    fns: [
      { n: 'getDevUserId', s: 18, e: 28, sum: 'Dev fallback resolver that returns the admin user id when auth is disabled.', tags: ['auth', 'dev-bypass', 'utility'], cx: 'simple' },
      { n: 'GET', s: 31, e: 76, sum: 'Returns a specific creator workflow record after ownership check.', tags: ['api-handler', 'get', 'workflow'], cx: 'moderate' },
      { n: 'PATCH', s: 79, e: 133, sum: 'Updates metadata fields on a creator workflow record.', tags: ['api-handler', 'patch', 'workflow'], cx: 'moderate' },
      { n: 'DELETE', s: 136, e: 178, sum: 'Deletes a creator workflow record after ownership check.', tags: ['api-handler', 'delete', 'workflow'], cx: 'moderate' },
    ],
  },
  'src/app/api/creator-workflows/recent/route.ts': {
    summary: 'Returns the most recently edited creator workflows for the current user with a human-friendly last-edited label.',
    tags: ['api-handler', 'creator-workflows', 'recent', 'listing'],
    complexity: 'moderate',
    fns: [
      { n: 'getDevUserId', s: 18, e: 28, sum: 'Dev fallback resolver that returns the admin user id when auth is disabled.', tags: ['auth', 'dev-bypass', 'utility'], cx: 'simple' },
      { n: 'GET', s: 31, e: 80, sum: "Returns the user's most recently edited workflows with formatted labels.", tags: ['api-handler', 'get', 'recent'], cx: 'moderate' },
      { n: 'getLastEditedLabel', s: 83, e: 98, sum: 'Formats a recent timestamp into a human-friendly last-edited label.', tags: ['utility', 'formatting'], cx: 'simple' },
    ],
  },
};

// Build file + function nodes
for (const f of files) {
  const info = fileInfo[f.path];
  nodes.push(fileNode(f.path, info.summary, info.tags, info.complexity));
  const rec = r.results.find(x => x.path === f.path);
  const exportNames = new Set((rec.exports || []).map(e => e.name));
  for (const fn of info.fns) {
    const len = fn.e - fn.s + 1;
    const isExported = exportNames.has(fn.n);
    // Significance filter: len>=10 OR exported
    if (len >= 10 || isExported) {
      nodes.push(fnNode(f.path, fn.n, fn.s, fn.e, fn.sum, fn.tags, fn.cx));
      edges.push({ source: 'file:' + f.path, target: 'function:' + f.path + ':' + fn.n, type: 'contains', direction: 'forward', weight: 1.0 });
      if (isExported) {
        edges.push({ source: 'file:' + f.path, target: 'function:' + f.path + ':' + fn.n, type: 'exports', direction: 'forward', weight: 0.8 });
      }
    }
  }
}

// Build imports edges (1:1 verbatim)
for (const f of files) {
  const imports = imp[f.path] || [];
  for (const target of imports) {
    edges.push({ source: 'file:' + f.path, target: 'file:' + target, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

// Self-check
const importEdges = edges.filter(e => e.type === 'imports').length;
console.log('imports edges:', importEdges, 'expected: 56');
console.log('nodes total:', nodes.length, 'edges total:', edges.length);
console.log('file nodes:', nodes.filter(n => n.type === 'file').length);
console.log('function nodes:', nodes.filter(n => n.type === 'function').length);

// Validate: no duplicate ids, no self-loops
const ids = new Set();
let dup = 0;
for (const n of nodes) {
  if (ids.has(n.id)) { dup++; console.error('DUP', n.id); }
  ids.add(n.id);
}
let selfLoop = 0;
for (const e of edges) {
  if (e.source === e.target) { selfLoop++; console.error('SELF', e); }
}
console.log('duplicates:', dup, 'self-loops:', selfLoop);

fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-79.json', JSON.stringify({ nodes, edges }, null, 2));
console.log('Wrote batch-79.json');
