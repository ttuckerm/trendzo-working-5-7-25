import fs from 'node:fs';

const im = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-analyzer-input-53.json','utf8')).batchImportData;

const nodes = [];
const edges = [];

function fileNode(path, type, name, summary, tags, complexity, languageNotes) {
  const node = { id: type + ':' + path, type, name, filePath: path, summary, tags, complexity };
  if (languageNotes) node.languageNotes = languageNotes;
  nodes.push(node);
}

function fnNode(path, fnName, lineRange, summary, tags, complexity) {
  nodes.push({
    id: 'function:' + path + ':' + fnName,
    type: 'function',
    name: fnName,
    filePath: path,
    lineRange,
    summary, tags, complexity
  });
  edges.push({ source: 'file:' + path, target: 'function:' + path + ':' + fnName, type: 'contains', direction: 'forward', weight: 1.0 });
}

function fnNodeExported(path, fnName, lineRange, summary, tags, complexity) {
  fnNode(path, fnName, lineRange, summary, tags, complexity);
  edges.push({ source: 'file:' + path, target: 'function:' + path + ':' + fnName, type: 'exports', direction: 'forward', weight: 0.8 });
}

// === Test files (all simple) ===
fileNode('src/__tests__/unit/validation.store.test.ts', 'file', 'validation.store.test.ts',
  'Unit test for the validation store module, exercising state setters and selectors.',
  ['test', 'unit-test', 'validation'], 'simple');
fileNode('src/__tests__/unit/virality.contract.test.ts', 'file', 'virality.contract.test.ts',
  'Unit test asserting the virality contract module enforces required score ranges and field shapes.',
  ['test', 'unit-test', 'virality', 'contract'], 'simple');
fileNode('src/__tests__/unit/vit-schema.test.ts', 'file', 'vit-schema.test.ts',
  'Unit test validating the shared VIT (Viral Intelligence Template) schema parses correctly.',
  ['test', 'unit-test', 'schema', 'validation'], 'simple');
fileNode('src/__tests__/unit/workflow.store.test.ts', 'file', 'workflow.store.test.ts',
  'Unit test covering workflow store transitions and persisted-state guarantees.',
  ['test', 'unit-test', 'workflow', 'state'], 'simple');
fileNode('src/__tests__/ingest.api.test.ts', 'file', 'ingest.api.test.ts',
  'API contract test for the ingest upsert endpoint covering its happy path.',
  ['test', 'api-test', 'ingest'], 'simple');
fileNode('src/__tests__/ingest.idempotent.test.ts', 'file', 'ingest.idempotent.test.ts',
  'Verifies that the ingest upsert endpoint is idempotent across repeated calls with the same payload.',
  ['test', 'api-test', 'ingest', 'idempotency'], 'simple');
fileNode('src/__tests__/ingest.obj1.test.ts', 'file', 'ingest.obj1.test.ts',
  'Schema validation test for the VIT object-one (obj1) ingestion shape.',
  ['test', 'schema', 'ingest', 'validation'], 'simple');
fileNode('src/__tests__/setupJest.ts', 'file', 'setupJest.ts',
  'Jest global setup file configuring test environment hooks before suites execute.',
  ['test', 'setup', 'jest', 'configuration'], 'simple');
fileNode('src/__tests__/templates.aggregate.test.ts', 'file', 'templates.aggregate.test.ts',
  'Unit test for the templates aggregation pipeline producing rolled-up template stats.',
  ['test', 'unit-test', 'templates', 'aggregation'], 'simple');
fileNode('src/__tests__/templates.extract.test.ts', 'file', 'templates.extract.test.ts',
  'Unit test for the template-extraction step producing template features from raw inputs.',
  ['test', 'unit-test', 'templates', 'extraction'], 'simple');
fileNode('src/__tests__/vit.compute.test.js', 'file', 'vit.compute.test.js',
  'Unit test (JS) for the VIT compute helper producing the viral intelligence score.',
  ['test', 'unit-test', 'vit', 'compute'], 'simple');

// === README docs ===
fileNode('src/__tests__/README.md', 'document', 'README.md',
  'Test suite README documenting how to run and structure tests inside src/__tests__.',
  ['documentation', 'tests', 'developer-guide'], 'moderate');

// === recipeBook ===
fileNode('src/api/recipeBook.ts', 'file', 'recipeBook.ts',
  'Recipe Book / template recommendation API combining content-based and collaborative filtering with seasonal boosts, diversification, and final scoring.',
  ['api-handler', 'recommendation', 'templates', 'service'], 'complex',
  'Large single-file recommender combining multiple ranking signals with an in-memory cache layer.');
fnNode('src/api/recipeBook.ts', 'extractMainGenes', [64,80],
  'Extracts the dominant style genes from a centroid vector by picking the top-magnitude dimensions.',
  ['utility', 'feature-extraction'], 'simple');
fnNode('src/api/recipeBook.ts', 'calculateTemplateSimiliarity', [103,116],
  'Computes a similarity score between two templates using their centroid vectors.',
  ['utility', 'similarity', 'recommendation'], 'simple');
fnNode('src/api/recipeBook.ts', 'applyContentBasedFiltering', [121,156],
  'Re-ranks templates by user/context affinity using content-based signals such as niche, genes, and history.',
  ['recommendation', 'content-based', 'filtering'], 'moderate');
fnNode('src/api/recipeBook.ts', 'applyCollaborativeFiltering', [161,201],
  'Re-ranks templates using collaborative-filtering signals derived from cohorts of similar creators.',
  ['recommendation', 'collaborative-filtering', 'filtering'], 'moderate');
fnNode('src/api/recipeBook.ts', 'applySeasonalTrendingBoosts', [206,245],
  'Applies seasonal and trending multipliers to template scores based on time-of-year and recent traction.',
  ['recommendation', 'trending', 'seasonality'], 'moderate');
fnNode('src/api/recipeBook.ts', 'applyDiversification', [250,272],
  'Reduces near-duplicate templates in the output list to keep the recommendation slate diverse.',
  ['recommendation', 'diversification', 'filtering'], 'simple');
fnNode('src/api/recipeBook.ts', 'fetchTemplates', [277,373],
  'Loads candidate templates from storage with status/niche/limit filtering, then enriches them with context features.',
  ['service', 'data-access', 'templates'], 'complex');
fnNode('src/api/recipeBook.ts', 'calculateTemplateComplexity', [378,392],
  'Estimates a complexity score for a template from its centroid distribution.',
  ['utility', 'scoring'], 'simple');
fnNode('src/api/recipeBook.ts', 'calculateFinalScore', [397,415],
  'Combines status priority and ranking factors into a single final score used to order template results.',
  ['scoring', 'recommendation'], 'simple');

// === (auth) pages ===
fileNode('src/app/(auth)/login/page.tsx', 'file', 'page.tsx',
  'Login page handling email/password sign-in against Supabase with redirect-after-login support.',
  ['component', 'page', 'auth', 'login'], 'moderate');
fnNodeExported('src/app/(auth)/login/page.tsx', 'LoginPage', [9,133],
  'React client component implementing the login form, error display, and post-login redirect.',
  ['component', 'page', 'auth'], 'moderate');

fileNode('src/app/(auth)/onboarding/page.tsx', 'file', 'page.tsx',
  'Onboarding wizard collecting agency profile and skill selections before initial sign-in completes.',
  ['component', 'page', 'auth', 'onboarding'], 'complex');
fnNodeExported('src/app/(auth)/onboarding/page.tsx', 'OnboardingPage', [34,386],
  'Multi-step onboarding component that captures agency identity, niches, and skills, then persists them to Supabase.',
  ['component', 'page', 'onboarding', 'wizard'], 'complex');

fileNode('src/app/(auth)/signup/page.tsx', 'file', 'page.tsx',
  'Signup page handling new-user email/password registration via Supabase auth.',
  ['component', 'page', 'auth', 'signup'], 'moderate');
fnNodeExported('src/app/(auth)/signup/page.tsx', 'SignupPage', [8,181],
  'React client component implementing the signup form, password validation, and Supabase signup call.',
  ['component', 'page', 'auth', 'signup'], 'moderate');

// === (dev) assessment-test ===
fileNode('src/app/(dev)/assessment-test/page.tsx', 'file', 'page.tsx',
  'Internal developer page to manually exercise the assessment scoring engine and inspect intermediate row outputs.',
  ['component', 'page', 'dev-tool', 'assessment'], 'complex');
fnNodeExported('src/app/(dev)/assessment-test/page.tsx', 'AssessmentTestPage', [78,304],
  'Developer harness page rendering inputs for assessment questions and showing computed score breakdowns.',
  ['component', 'page', 'dev-tool', 'assessment'], 'complex');

// === freedom-agent ===
fileNode('src/app/(public)/free/freedom-agent/[sessionId]/page.tsx', 'file', 'page.tsx',
  'Public Freedom Agent chat page for a specific session, rendering a streaming chat UI and lightweight markdown.',
  ['component', 'page', 'chat', 'public'], 'complex');
fnNodeExported('src/app/(public)/free/freedom-agent/[sessionId]/page.tsx', 'FreedomAgentChat', [129,495],
  'Client chat component for the Freedom Agent session: streams messages, persists history, and renders markdown.',
  ['component', 'page', 'chat'], 'complex');
fnNode('src/app/(public)/free/freedom-agent/[sessionId]/page.tsx', 'renderMarkdown', [40,123],
  'Hand-rolled lightweight markdown renderer turning agent message text into React nodes with lists and inline formatting.',
  ['utility', 'rendering', 'markdown'], 'moderate');

fileNode('src/app/(public)/free/freedom-agent/page.tsx', 'file', 'page.tsx',
  'Public Freedom Agent entry page that picks up email/source from URL params and routes into a session.',
  ['component', 'page', 'public', 'entry-point'], 'moderate');
fnNodeExported('src/app/(public)/free/freedom-agent/page.tsx', 'FreedomAgentEntry', [8,172],
  'Entry component that captures lead inputs and creates or resumes a Freedom Agent chat session.',
  ['component', 'page', 'entry-point'], 'moderate');

// === freedom-os ===
fileNode('src/app/(public)/free/freedom-os/plan/[planId]/not-found.tsx', 'file', 'not-found.tsx',
  'Next.js 404 page rendered when a saved Freedom OS plan id cannot be found.',
  ['component', 'page', 'not-found', 'error-page'], 'simple');

fileNode('src/app/(public)/free/freedom-os/plan/[planId]/page.tsx', 'file', 'page.tsx',
  'Server component that loads a saved Freedom OS plan by id from Supabase and renders the results view.',
  ['component', 'page', 'plan', 'server-component'], 'complex');
fnNodeExported('src/app/(public)/free/freedom-os/plan/[planId]/page.tsx', 'SavedPlanPage', [62,206],
  'Server component rendering a previously generated Freedom OS plan with sharable layout.',
  ['component', 'page', 'plan'], 'moderate');
fnNode('src/app/(public)/free/freedom-os/plan/[planId]/page.tsx', 'getPlan', [16,60],
  'Loads a single Freedom OS plan record from Supabase by id with strict shape validation.',
  ['data-access', 'supabase'], 'moderate');

fileNode('src/app/(public)/free/freedom-os/FreedomOSTool.tsx', 'file', 'FreedomOSTool.tsx',
  'Main Freedom OS client tool: collects financial inputs, computes a freedom plan, and shows the result with paywall integration.',
  ['component', 'tool', 'freedom-os', 'form'], 'complex');
fnNodeExported('src/app/(public)/free/freedom-os/FreedomOSTool.tsx', 'FreedomOSTool', [72,494],
  'Top-level Freedom OS tool component handling form state, multiplier control, paywall, and plan submission.',
  ['component', 'tool', 'freedom-os'], 'complex');

fileNode('src/app/(public)/free/freedom-os/page.tsx', 'file', 'page.tsx',
  'Public Freedom OS landing page that handles Stripe-paid session resolution and renders the tool.',
  ['component', 'page', 'public', 'paywall'], 'moderate');
fnNodeExported('src/app/(public)/free/freedom-os/page.tsx', 'FreedomOSPage', [32,70],
  'Server page component that resolves Stripe session paid status and forwards into the Freedom OS tool.',
  ['component', 'page', 'paywall'], 'moderate');
fnNode('src/app/(public)/free/freedom-os/page.tsx', 'waitForPaid', [15,30],
  'Polls Stripe session verification until the checkout is marked paid or the timeout elapses.',
  ['utility', 'stripe', 'polling'], 'simple');

fileNode('src/app/(public)/free/freedom-os/PlanResultsView.tsx', 'file', 'PlanResultsView.tsx',
  'Renders the computed Freedom OS plan results: freedom number, rationale, 90-day sprint, and shareable summary.',
  ['component', 'tool', 'freedom-os', 'results-view'], 'complex');
fnNodeExported('src/app/(public)/free/freedom-os/PlanResultsView.tsx', 'PlanResultsView', [79,300],
  'Presents the final Freedom OS plan to the user with section cards, copy-to-clipboard summary, and saved plan link.',
  ['component', 'results-view', 'freedom-os'], 'complex');
fnNode('src/app/(public)/free/freedom-os/PlanResultsView.tsx', 'formatSummary', [50,73],
  'Builds a plain-text plan summary suitable for copying or sharing from the Freedom OS outputs.',
  ['utility', 'formatting', 'summary'], 'simple');

// === css ===
fileNode('src/app/(public)/free/freedom-os/hamster-loader.css', 'file', 'hamster-loader.css',
  'CSS animation defining the hamster-wheel loader used in the Freedom OS waiting/processing state.',
  ['style', 'animation', 'loader', 'css'], 'moderate');

// === Import edges (1:1 from importMap) ===
let importEdgeCount = 0;
for (const [src, targets] of Object.entries(im)) {
  for (const t of targets) {
    edges.push({ source: 'file:' + src, target: 'file:' + t, type: 'imports', direction: 'forward', weight: 0.7 });
    importEdgeCount++;
  }
}

// === tested_by edges (production -> test) ===
const testedByMap = {
  'src/__tests__/unit/validation.store.test.ts': 'src/lib/validation/store.ts',
  'src/__tests__/unit/virality.contract.test.ts': 'src/lib/virality/contract.ts',
  'src/__tests__/unit/vit-schema.test.ts': 'packages/shared/src/index.ts',
  'src/__tests__/ingest.api.test.ts': 'src/app/api/ingest/upsert/route.ts',
  'src/__tests__/ingest.idempotent.test.ts': 'src/app/api/ingest/upsert/route.ts',
  'src/__tests__/ingest.obj1.test.ts': 'src/lib/schemas/vit.ts',
  'src/__tests__/templates.aggregate.test.ts': 'src/lib/templates/aggregate.ts',
  'src/__tests__/templates.extract.test.ts': 'src/lib/templates/extract.ts',
  'src/__tests__/vit.compute.test.js': 'src/lib/vit/compute.ts',
};
for (const [test, prod] of Object.entries(testedByMap)) {
  edges.push({ source: 'file:' + prod, target: 'file:' + test, type: 'tested_by', direction: 'forward', weight: 0.5 });
}

// documents edge: README documents the test setup file (concrete in-batch target)
edges.push({ source: 'document:src/__tests__/README.md', target: 'file:src/__tests__/setupJest.ts', type: 'documents', direction: 'forward', weight: 0.5 });

const output = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-53.json', JSON.stringify(output, null, 2));

const typeCounts = {};
for (const n of nodes) typeCounts[n.type] = (typeCounts[n.type]||0) + 1;
const edgeTypeCounts = {};
for (const e of edges) edgeTypeCounts[e.type] = (edgeTypeCounts[e.type]||0) + 1;
console.log('NODES:', nodes.length, JSON.stringify(typeCounts));
console.log('EDGES:', edges.length, JSON.stringify(edgeTypeCounts));
console.log('Import edges emitted:', importEdgeCount, '(expected 20)');
