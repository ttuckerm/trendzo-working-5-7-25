const fs = require('fs');
const r = require('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-37.json');
const importMap = require('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-analyzer-input-37.json').batchImportData;

const fileMeta = {
  'scripts/tag-moat9.js': {
    summary: 'Tagging helper for the moat9 phase: runs the moat9 dry-run distribution in a checked-out repo and prints status.',
    tags: ['script','utility','tagging','moat9'],
    complexity: 'simple'
  },
  'scripts/test-ab-testing.js': {
    summary: 'Integration test harness exercising the A/B testing system: variant creation, traffic split, exposure logging and statistical evaluation.',
    tags: ['test','ab-testing','script','integration'],
    complexity: 'complex'
  },
  'scripts/test-accuracy-dashboard.ts': {
    summary: 'End-to-end test of the prediction accuracy dashboard. Generates predictions via the hybrid predictor, hashes them, and verifies accuracy calculations.',
    tags: ['test','accuracy','prediction','dashboard','script'],
    complexity: 'complex'
  },
  'scripts/test-admin-lab-permissions.ts': {
    summary: 'Verifies admin lab permission gates by exercising the role-based access checks for restricted admin lab routes.',
    tags: ['test','admin','permissions','script'],
    complexity: 'moderate'
  },
  'scripts/test-admin-predict-api.ts': {
    summary: 'Exercises the admin predict API end-to-end using the hybrid predictor and prediction-hash service.',
    tags: ['test','admin','prediction','api','script'],
    complexity: 'moderate'
  },
  'scripts/test-admin-resolve.ts': {
    summary: 'Smoke test for the admin resolution endpoint that confirms request routing and basic response shape.',
    tags: ['test','admin','script','smoke-test'],
    complexity: 'simple'
  },
  'scripts/test-adversarial.ts': {
    summary: 'Adversarial brief evaluation harness: runs Critic and Synthesizer LLM stages against niche thresholds to stress-test brief generation.',
    tags: ['test','adversarial','llm','brief','script'],
    complexity: 'complex'
  },
  'scripts/test-advisor-service.js': {
    summary: 'Quick smoke test for the advisor service that issues a sample call and prints the response.',
    tags: ['test','advisor','script','smoke-test'],
    complexity: 'simple'
  },
  'scripts/test-algorithm-explain-api.ts': {
    summary: 'Tests the algorithm explanation API by issuing requests and asserting the explanation payload structure.',
    tags: ['test','algorithm','explain','api','script'],
    complexity: 'moderate'
  },
  'scripts/test-analyzer.js': {
    summary: 'Top-level script that drives the analyzer pipeline against a sample input to verify end-to-end behaviour.',
    tags: ['test','analyzer','script','integration'],
    complexity: 'simple'
  },
  'scripts/test-apify-correct-scraper.ts': {
    summary: 'Validates that the canonical Apify TikTok scraper actor is reachable and returns the expected schema.',
    tags: ['test','apify','scraper','script'],
    complexity: 'simple'
  },
  'scripts/test-apify-direct.ts': {
    summary: 'Direct Apify API smoke test that bypasses internal wrappers to confirm the underlying integration works.',
    tags: ['test','apify','script','integration'],
    complexity: 'moderate'
  },
  'scripts/test-apify-integration.js': {
    summary: 'Integration test for the Apify-based TikTok scraping flow: validates input, run lifecycle, and result shape.',
    tags: ['test','apify','integration','script'],
    complexity: 'moderate'
  },
  'scripts/test-apify-real.js': {
    summary: 'Live Apify integration test that actually invokes the scraper actor and inspects real returned items.',
    tags: ['test','apify','live','integration','script'],
    complexity: 'moderate'
  },
  'scripts/test-apify-simple.js': {
    summary: 'Lightweight Apify integration test plus a helper to fabricate sample TikTok payloads for offline testing.',
    tags: ['test','apify','script','sample-data'],
    complexity: 'moderate'
  },
  'scripts/test-complete-admin-flow.ts': {
    summary: 'End-to-end admin flow test that runs a hybrid prediction, hashes results, and walks through the admin review path.',
    tags: ['test','admin','flow','prediction','script'],
    complexity: 'complex'
  },
  'scripts/test-complete-viral-prediction-system.js': {
    summary: 'Full-system smoke test for the viral prediction stack. Exercises every major component and prints a system check report.',
    tags: ['test','viral-prediction','system-test','script'],
    complexity: 'complex'
  },
  'scripts/test-component-22-realistic.ts': {
    summary: 'Exercises component 22 (competitor benchmarking) using realistic input thresholds to validate live behaviour.',
    tags: ['test','component-22','benchmark','script'],
    complexity: 'moderate'
  },
  'scripts/test-component-22.ts': {
    summary: 'Unit-style test of the competitor-benchmark component (component 22) against canned inputs.',
    tags: ['test','component-22','benchmark','script'],
    complexity: 'moderate'
  },
  'scripts/test-comprehensive-framework.js': {
    summary: 'Comprehensive test framework runner that simulates suites, API integration, accuracy validation, performance, and load tests with a final summary report.',
    tags: ['test','framework','simulation','script','load-test'],
    complexity: 'complex'
  },
  'scripts/test-crash.py': {
    summary: 'Python crash-reproduction script that logs progress through a sequence designed to trigger or rule out a known crash.',
    tags: ['test','crash','python','script','debug'],
    complexity: 'simple'
  },
  'scripts/test-creator-baseline-real.ts': {
    summary: 'Integration test for the real creator-baseline component using live data sources.',
    tags: ['test','creator-baseline','script','integration'],
    complexity: 'moderate'
  },
  'scripts/test-creator-personalization.ts': {
    summary: 'Tests the creator personalization path through the creator-baseline component, verifying per-creator adjustments.',
    tags: ['test','creator-personalization','script','baseline'],
    complexity: 'moderate'
  },
  'scripts/test-database-integration.ts': {
    summary: 'Database integration test exercising ffmpeg-service persistence paths and verifying related Supabase rows.',
    tags: ['test','database','integration','ffmpeg','script'],
    complexity: 'complex'
  },
  'scripts/test-dna-detective.js': {
    summary: 'Tests the DNA Detective viral-pattern endpoint via HTTP requests and validates response structure.',
    tags: ['test','dna-detective','script','http'],
    complexity: 'moderate'
  }
};

const fnSummaries = {
  'scripts/tag-moat9.js:readStatus': { s: 'Reads the moat9 distribution status file and parses key counters for reporting.', t: ['utility','status','io'] },
  'scripts/tag-moat9.js:main': { s: 'Entry point for the tag-moat9 script: ensures the repo, runs the dry-run distribution, and prints status.', t: ['entry-point','cli','tagging'] },
  'scripts/test-ab-testing.js:testABTestingSystem': { s: 'Exhaustive A/B testing system test that walks through variant creation, assignment, exposure and significance evaluation.', t: ['test','ab-testing','integration'] },
  'scripts/test-accuracy-dashboard.ts:testAccuracyDashboard': { s: 'Runs the hybrid predictor over sample inputs, hashes predictions, and asserts dashboard accuracy outputs match expectations.', t: ['test','prediction','accuracy'] },
  'scripts/test-admin-lab-permissions.ts:testAdminLabPermissions': { s: 'Walks every admin lab route with seeded users to confirm role-based access enforcement.', t: ['test','permissions','admin'] },
  'scripts/test-admin-predict-api.ts:testAdminPredictAPI': { s: 'Drives the admin predict API end-to-end and verifies the prediction-hash audit trail.', t: ['test','api','prediction'] },
  'scripts/test-adversarial.ts:getNicheThresholds': { s: 'Returns adversarial threshold values per niche used to grade Critic/Synthesizer outputs.', t: ['utility','adversarial','threshold'] },
  'scripts/test-adversarial.ts:runCritic': { s: 'Runs the Critic LLM stage over a brief and returns structured critique data scored against niche thresholds.', t: ['llm','critic','adversarial'] },
  'scripts/test-adversarial.ts:runSynthesizer': { s: 'Runs the Synthesizer LLM stage to reconcile the brief with the Critic output for a target niche.', t: ['llm','synthesizer','adversarial'] },
  'scripts/test-adversarial.ts:main': { s: 'Entry point for the adversarial test harness: orchestrates Critic and Synthesizer runs and reports results.', t: ['entry-point','cli','adversarial'] },
  'scripts/test-advisor-service.js:testAdvisorService': { s: 'Exercises the advisor service with a sample payload and prints structured advisor output.', t: ['test','advisor','smoke-test'] },
  'scripts/test-algorithm-explain-api.ts:testAlgorithmExplainAPI': { s: 'Hits the algorithm explanation API with representative inputs and asserts payload structure and content.', t: ['test','api','algorithm-explain'] },
  'scripts/test-apify-correct-scraper.ts:main': { s: 'Entry point that triggers the canonical Apify TikTok scraper actor and verifies returned records.', t: ['entry-point','apify','scraper'] },
  'scripts/test-apify-direct.ts:main': { s: 'Direct Apify HTTP smoke test entry point that exercises actor invocation without internal wrappers.', t: ['entry-point','apify','smoke-test'] },
  'scripts/test-apify-integration.js:testApifyIntegration': { s: 'Drives the Apify-based TikTok scraping flow end-to-end and validates result shape.', t: ['test','apify','integration'] },
  'scripts/test-apify-real.js:testRealApifyIntegration': { s: 'Live Apify integration test that runs a real actor invocation against TikTok and inspects items.', t: ['test','apify','live'] },
  'scripts/test-apify-simple.js:testSimpleApify': { s: 'Lightweight Apify integration test that runs a single actor call and validates result fields.', t: ['test','apify','lightweight'] },
  'scripts/test-apify-simple.js:createSampleData': { s: 'Fabricates representative TikTok sample data so the rest of the test suite can run offline.', t: ['test','sample-data','apify'] },
  'scripts/test-complete-admin-flow.ts:testCompleteAdminFlow': { s: 'Full admin flow test combining prediction generation, hashing and admin review walkthrough.', t: ['test','admin','flow'] },
  'scripts/test-complete-viral-prediction-system.js:testCompleteViralPredictionSystem': { s: 'Drives every major viral-prediction component sequentially and aggregates pass/fail counts.', t: ['test','system-test','viral-prediction'] },
  'scripts/test-complete-viral-prediction-system.js:testComponent': { s: 'Helper that pings a single component endpoint and records its availability and basic response.', t: ['test','helper','health-check'] },
  'scripts/test-complete-viral-prediction-system.js:quickSystemCheck': { s: 'Performs a fast health probe over the viral prediction system and prints a short report.', t: ['test','health-check','system'] },
  'scripts/test-component-22-realistic.ts:testWithRealisticThreshold': { s: 'Runs the competitor-benchmark component (component 22) with realistic threshold inputs and asserts output ranges.', t: ['test','component-22','benchmark'] },
  'scripts/test-component-22.ts:testComponent22': { s: 'Calls the competitor-benchmark component with canned inputs and validates returned structure.', t: ['test','component-22','benchmark'] },
  'scripts/test-comprehensive-framework.js:testFrameworkCore': { s: 'Exercises the framework core test path including initialization and discovery.', t: ['test','framework','core'] },
  'scripts/test-comprehensive-framework.js:testTestSuiteCollection': { s: 'Validates how the framework collects and registers test suites.', t: ['test','framework','collection'] },
  'scripts/test-comprehensive-framework.js:testAPIIntegration': { s: 'Simulates API-integration scenarios and checks error handling and validation paths.', t: ['test','framework','api'] },
  'scripts/test-comprehensive-framework.js:testPerformanceBenchmarking': { s: 'Runs simulated performance benchmarks (load, stress, resource tracking) through the framework.', t: ['test','performance','benchmark'] },
  'scripts/test-comprehensive-framework.js:testAccuracyValidation': { s: 'Simulates accuracy and confidence validation flows over canned datasets.', t: ['test','accuracy','validation'] },
  'scripts/test-comprehensive-framework.js:testLoadTesting': { s: 'Simulates concurrent-load, throughput, stress and recovery testing through the framework.', t: ['test','load-test','framework'] },
  'scripts/test-comprehensive-framework.js:simulateTestExecution': { s: 'Helper that produces a deterministic simulated test execution result for a given test case.', t: ['simulation','helper','test'] },
  'scripts/test-comprehensive-framework.js:validateTestResult': { s: 'Compares a simulated result against an expected outcome and returns a pass/fail diagnosis.', t: ['validation','helper','test'] },
  'scripts/test-comprehensive-framework.js:simulateComprehensiveTest': { s: 'Drives a simulated comprehensive run across multiple suites and aggregates counters.', t: ['simulation','test','framework'] },
  'scripts/test-comprehensive-framework.js:simulateAPICall': { s: 'Simulates an external API call with deterministic timing and response shape.', t: ['simulation','helper','api'] },
  'scripts/test-comprehensive-framework.js:simulateLoadBenchmark': { s: 'Simulates a load benchmark, producing throughput and latency numbers for downstream assertions.', t: ['simulation','load','benchmark'] },
  'scripts/test-comprehensive-framework.js:simulateAccuracyTest': { s: 'Runs an accuracy simulation against a labelled dataset and returns accuracy/precision figures.', t: ['simulation','accuracy','test'] },
  'scripts/test-comprehensive-framework.js:simulateCrossPlatformValidation': { s: 'Simulates cross-platform validation across TikTok, Instagram, and YouTube datasets.', t: ['simulation','cross-platform','validation'] },
  'scripts/test-comprehensive-framework.js:simulateConfidenceScoring': { s: 'Simulates confidence scoring and returns a stable distribution for validation logic.', t: ['simulation','confidence','scoring'] },
  'scripts/test-comprehensive-framework.js:simulateConcurrentLoad': { s: 'Simulates a concurrent load run with configurable users and duration to validate scaling expectations.', t: ['simulation','load','concurrency'] },
  'scripts/test-comprehensive-framework.js:printTestSummary': { s: 'Aggregates results across all simulated suites and prints a human-readable summary table.', t: ['utility','reporting','summary'] },
  'scripts/test-comprehensive-framework.js:runTestSuite': { s: 'Top-level driver that runs the full simulated suite and exits with a status code.', t: ['entry-point','cli','framework'] },
  'scripts/test-database-integration.ts:testDatabaseIntegration': { s: 'Exercises database integration paths around ffmpeg-service writes and validates downstream Supabase rows.', t: ['test','database','integration'] },
  'scripts/test-dna-detective.js:makeRequest': { s: 'Promise-based HTTP helper that issues JSON requests to the DNA Detective endpoints and parses responses.', t: ['utility','http','helper'] },
  'scripts/test-dna-detective.js:testDNADetective': { s: 'Runs the DNA Detective viral-pattern flow over sample inputs and asserts response structure.', t: ['test','dna-detective','viral'] }
};

const nodes = [];
const edges = [];

for (const f of r.results) {
  const meta = fileMeta[f.path];
  if (!meta) { console.error('MISSING file meta:', f.path); process.exit(1); }
  nodes.push({
    id: 'file:' + f.path,
    type: 'file',
    name: f.path.split('/').pop(),
    filePath: f.path,
    summary: meta.summary,
    tags: meta.tags,
    complexity: meta.complexity
  });

  const sigFns = (f.functions || []).filter(fn => ((fn.endLine || 0) - (fn.startLine || 0)) >= 10);
  for (const fn of sigFns) {
    const key = f.path + ':' + fn.name;
    const fm = fnSummaries[key];
    if (!fm) { console.error('MISSING fn meta:', key); process.exit(1); }
    const len = fn.endLine - fn.startLine;
    const complexity = len >= 100 ? 'complex' : (len >= 30 ? 'moderate' : 'simple');
    nodes.push({
      id: 'function:' + key,
      type: 'function',
      name: fn.name,
      filePath: f.path,
      lineRange: [fn.startLine, fn.endLine],
      summary: fm.s,
      tags: fm.t,
      complexity
    });
    edges.push({ source: 'file:' + f.path, target: 'function:' + key, type: 'contains', direction: 'forward', weight: 1.0 });
  }
}

let expectedImports = 0;
for (const filePath of Object.keys(importMap)) {
  for (const target of importMap[filePath]) {
    edges.push({ source: 'file:' + filePath, target: 'file:' + target, type: 'imports', direction: 'forward', weight: 0.7 });
    expectedImports++;
  }
}

const ids = new Set();
for (const n of nodes) {
  if (ids.has(n.id)) { console.error('DUPLICATE id:', n.id); process.exit(1); }
  ids.add(n.id);
}
for (const e of edges) {
  if (e.source === e.target) { console.error('SELF EDGE:', e.source); process.exit(1); }
}

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-37.json', JSON.stringify(out, null, 2));

const byType = {};
for (const n of nodes) byType[n.type] = (byType[n.type] || 0) + 1;
const edgeByType = {};
for (const e of edges) edgeByType[e.type] = (edgeByType[e.type] || 0) + 1;

console.log('nodes total:', nodes.length, 'by type:', JSON.stringify(byType));
console.log('edges total:', edges.length, 'by type:', JSON.stringify(edgeByType));
console.log('expected imports:', expectedImports, 'emitted imports:', edges.filter(e => e.type === 'imports').length);
console.log('WROTE batch-37.json');
