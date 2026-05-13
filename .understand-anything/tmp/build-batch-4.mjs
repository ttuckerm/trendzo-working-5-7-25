import fs from 'fs';

const outPath = 'C:/Projects/CleanCopy/.understand-anything/intermediate/batch-4.json';
const out = { nodes: [], edges: [] };

// === CODE FILES ===
// 1. apify/hot-feed-scanner.js
out.nodes.push({ id: 'file:apify/hot-feed-scanner.js', type: 'file', name: 'hot-feed-scanner.js', filePath: 'apify/hot-feed-scanner.js', summary: 'Apify actor entrypoint that scans a TikTok hot feed and writes results to the dataset, parameterised via CLI flags.', tags: ['entry-point', 'apify-actor', 'scraper', 'script'], complexity: 'simple' });
out.nodes.push({ id: 'function:apify/hot-feed-scanner.js:main', type: 'function', name: 'main', filePath: 'apify/hot-feed-scanner.js', lineRange: [12, 46], summary: 'Main async entrypoint that parses CLI arguments and triggers the Apify TikTok hot-feed scan.', tags: ['entry-point', 'async', 'apify'], complexity: 'simple' });

// 2. apify/video-detail-enricher.js (only main fn is 9 lines, below threshold and not exported -> skip function node)
out.nodes.push({ id: 'file:apify/video-detail-enricher.js', type: 'file', name: 'video-detail-enricher.js', filePath: 'apify/video-detail-enricher.js', summary: 'Small Apify enricher actor that hydrates video records with detail-page metadata.', tags: ['apify-actor', 'enricher', 'script'], complexity: 'simple' });

// 3. apify/README.md
out.nodes.push({ id: 'document:apify/README.md', type: 'document', name: 'README.md', filePath: 'apify/README.md', summary: 'Documents the Apify actor scripts (hot-feed-scanner, video-detail-enricher) including usage and parameters.', tags: ['documentation', 'apify', 'scraper'], complexity: 'simple' });

// 4. autoresearch/configs/baseline.json
out.nodes.push({ id: 'config:autoresearch/configs/baseline.json', type: 'config', name: 'baseline.json', filePath: 'autoresearch/configs/baseline.json', summary: 'Baseline parameter configuration (weights, thresholds, niche/account factors) snapshotted as the v5 starting point for the autoresearch sandbox optimizer.', tags: ['configuration', 'autoresearch', 'baseline', 'tuning'], complexity: 'moderate' });

// 5. autoresearch/configs/best.json
out.nodes.push({ id: 'config:autoresearch/configs/best.json', type: 'config', name: 'best.json', filePath: 'autoresearch/configs/best.json', summary: 'Best-known parameter configuration produced by the optimizer, candidate for promotion to the live pipeline.', tags: ['configuration', 'autoresearch', 'candidate', 'tuning'], complexity: 'moderate' });

// 6. autoresearch/notes/feasibility-audit.md
out.nodes.push({ id: 'document:autoresearch/notes/feasibility-audit.md', type: 'document', name: 'feasibility-audit.md', filePath: 'autoresearch/notes/feasibility-audit.md', summary: 'Feasibility audit for the autoresearch sandbox describing data availability, replay fidelity gaps, and acceptance criteria.', tags: ['documentation', 'autoresearch', 'audit', 'feasibility'], complexity: 'moderate' });

// 7. autoresearch/results/.gitkeep
out.nodes.push({ id: 'file:autoresearch/results/.gitkeep', type: 'file', name: '.gitkeep', filePath: 'autoresearch/results/.gitkeep', summary: 'Placeholder file used to keep the autoresearch/results directory in version control.', tags: ['placeholder', 'gitkeep', 'version-control'], complexity: 'simple' });

// 8. autoresearch/results/baseline-check.json
out.nodes.push({ id: 'config:autoresearch/results/baseline-check.json', type: 'config', name: 'baseline-check.json', filePath: 'autoresearch/results/baseline-check.json', summary: 'Output JSON from the baseline-check script capturing pre-condition validation and baseline Spearman metrics.', tags: ['configuration', 'autoresearch', 'results', 'baseline'], complexity: 'simple' });

// 9. autoresearch/results/optimization-summary.json
out.nodes.push({ id: 'config:autoresearch/results/optimization-summary.json', type: 'config', name: 'optimization-summary.json', filePath: 'autoresearch/results/optimization-summary.json', summary: 'Structured optimizer output summarising winning configurations, deltas vs baseline, and acceptance status.', tags: ['configuration', 'autoresearch', 'results', 'optimizer'], complexity: 'moderate' });

// 10. autoresearch/results/baseline-report.md
out.nodes.push({ id: 'document:autoresearch/results/baseline-report.md', type: 'document', name: 'baseline-report.md', filePath: 'autoresearch/results/baseline-report.md', summary: 'Human-readable baseline report explaining Spearman, fidelity, and pre-condition results before any tuning.', tags: ['documentation', 'autoresearch', 'baseline', 'report'], complexity: 'moderate' });

// 11. autoresearch/results/bulk-download-parity-audit.md
out.nodes.push({ id: 'document:autoresearch/results/bulk-download-parity-audit.md', type: 'document', name: 'bulk-download-parity-audit.md', filePath: 'autoresearch/results/bulk-download-parity-audit.md', summary: 'Audit of replay parity between bulk-downloaded snapshot data and the production pipeline, documenting discrepancies and fidelity.', tags: ['documentation', 'autoresearch', 'audit', 'parity'], complexity: 'complex' });

// 12. autoresearch/results/optimization-report.md
out.nodes.push({ id: 'document:autoresearch/results/optimization-report.md', type: 'document', name: 'optimization-report.md', filePath: 'autoresearch/results/optimization-report.md', summary: 'Narrative report on the weight-optimization run including methodology, top candidates, and promotion recommendation.', tags: ['documentation', 'autoresearch', 'optimizer', 'report'], complexity: 'moderate' });

// 13. autoresearch/results/promotion-plan.md
out.nodes.push({ id: 'document:autoresearch/results/promotion-plan.md', type: 'document', name: 'promotion-plan.md', filePath: 'autoresearch/results/promotion-plan.md', summary: 'Step-by-step plan describing how to promote a candidate config from sandbox to production with safety gates.', tags: ['documentation', 'autoresearch', 'promotion', 'plan'], complexity: 'complex' });

// 14. autoresearch/sandbox/baseline-check.ts
out.nodes.push({ id: 'file:autoresearch/sandbox/baseline-check.ts', type: 'file', name: 'baseline-check.ts', filePath: 'autoresearch/sandbox/baseline-check.ts', summary: 'CLI entry-point that replays a snapshot with the baseline config, runs Spearman pre-conditions, and writes a baseline report.', tags: ['entry-point', 'autoresearch', 'evaluation', 'baseline'], complexity: 'moderate' });
out.nodes.push({ id: 'function:autoresearch/sandbox/baseline-check.ts:main', type: 'function', name: 'main', filePath: 'autoresearch/sandbox/baseline-check.ts', lineRange: [24, 194], summary: 'Loads the snapshot and baseline config, replays runs, evaluates Spearman/fidelity, and emits baseline JSON+markdown reports.', tags: ['entry-point', 'autoresearch', 'evaluation'], complexity: 'complex' });

// 15. autoresearch/sandbox/eval-spearman.ts
out.nodes.push({ id: 'file:autoresearch/sandbox/eval-spearman.ts', type: 'file', name: 'eval-spearman.ts', filePath: 'autoresearch/sandbox/eval-spearman.ts', summary: 'Statistical evaluation utilities: Spearman rank correlation, p-values, fidelity checks, and bootstrap confidence intervals for the autoresearch sandbox.', tags: ['utility', 'statistics', 'spearman', 'evaluation'], complexity: 'complex', languageNotes: 'Hand-rolled implementations of rank correlation, incomplete beta, and lgamma — no third-party stats deps.' });

const evalFns = [
  ['validatePreConditions', 28, 67, 'Validates that input data meets pre-conditions (variance, sample size) required for a meaningful Spearman evaluation.'],
  ['validateFidelity', 69, 91, 'Validates replay fidelity by comparing reconstructed vs original predicted scores for a fidelity-check subset.'],
  ['rankArray', 95, 113, 'Returns mid-rank ranks for the input array, handling ties via the average-rank method.'],
  ['spearmanRho', 115, 137, 'Computes Spearman rank correlation between two numeric arrays using mid-ranks.'],
  ['spearmanPValue', 143, 152, 'Approximates a two-sided p-value for a Spearman rho via a t-distribution transform.'],
  ['betaIncomplete', 155, 172, 'Regularised incomplete beta function used by the p-value approximation.'],
  ['betaCF', 174, 208, 'Continued-fraction helper for the incomplete beta function.'],
  ['lgamma', 210, 223, 'Logarithm of the gamma function used by the beta helpers.'],
  ['bootstrapSpearmanCI', 238, 266, 'Generates a bootstrap 95% confidence interval for the Spearman rho estimate.'],
  ['evaluate', 270, 333, 'Top-level evaluation: runs pre-conditions, computes Spearman/p-value/MAE/bootstrap CI, and returns a structured result.'],
  ['computeFidelityMetrics', 338, 362, 'Computes fidelity metrics (mean absolute error, max delta) between replayed and original predictions.'],
];
for (const [n, s, e, sum] of evalFns) {
  out.nodes.push({ id: 'function:autoresearch/sandbox/eval-spearman.ts:' + n, type: 'function', name: n, filePath: 'autoresearch/sandbox/eval-spearman.ts', lineRange: [s, e], summary: sum, tags: ['statistics', 'utility', 'evaluation'], complexity: (e - s + 1) >= 40 ? 'moderate' : 'simple' });
}

// 16. autoresearch/sandbox/loader.ts
out.nodes.push({ id: 'file:autoresearch/sandbox/loader.ts', type: 'file', name: 'loader.ts', filePath: 'autoresearch/sandbox/loader.ts', summary: 'Loads exported snapshot data and parameter configs from disk, stripping metadata so the optimizer sees pure parameters.', tags: ['utility', 'io', 'loader', 'autoresearch'], complexity: 'moderate' });
out.nodes.push({ id: 'function:autoresearch/sandbox/loader.ts:loadSnapshot', type: 'function', name: 'loadSnapshot', filePath: 'autoresearch/sandbox/loader.ts', lineRange: [17, 54], summary: 'Reads a snapshot JSON file from disk and parses it into the ExportedSnapshot shape used by the sandbox.', tags: ['io', 'loader', 'autoresearch'], complexity: 'simple' });
out.nodes.push({ id: 'function:autoresearch/sandbox/loader.ts:loadConfig', type: 'function', name: 'loadConfig', filePath: 'autoresearch/sandbox/loader.ts', lineRange: [60, 72], summary: 'Reads a parameter config JSON file and strips metadata keys before returning the optimizer-ready config.', tags: ['io', 'loader', 'config'], complexity: 'simple' });
out.nodes.push({ id: 'function:autoresearch/sandbox/loader.ts:stripMetaKeys', type: 'function', name: 'stripMetaKeys', filePath: 'autoresearch/sandbox/loader.ts', lineRange: [74, 85], summary: 'Removes _meta and similar bookkeeping keys from a parameter config object.', tags: ['utility', 'config'], complexity: 'simple' });

// 17. autoresearch/sandbox/optimize-weights.ts
out.nodes.push({ id: 'file:autoresearch/sandbox/optimize-weights.ts', type: 'file', name: 'optimize-weights.ts', filePath: 'autoresearch/sandbox/optimize-weights.ts', summary: 'Main optimizer: perturbs parameter configs, runs k-fold replay+Spearman eval, applies acceptance gating, and persists the best candidate.', tags: ['entry-point', 'optimizer', 'autoresearch', 'evaluation'], complexity: 'complex' });
const owFns = [
  ['createRNG', 42, 71, 'Creates a deterministic PRNG used to make optimizer perturbations reproducible.'],
  ['createFolds', 91, 107, 'Splits the snapshot into K folds for cross-validated evaluation.'],
  ['kFoldEval', 112, 131, 'Runs evaluation across all folds and aggregates per-fold Spearman scores.'],
  ['quickEval', 135, 172, 'Fast single-pass evaluation used during the optimizer inner loop.'],
  ['quickBootstrapCI', 176, 206, 'Lightweight bootstrap CI used inside the optimizer for early-stopping decisions.'],
  ['perturbConfig', 231, 305, 'Generates a candidate config by perturbing weights, thresholds, and factors with bounded random noise.'],
  ['checkAcceptanceKFold', 319, 383, 'Decides whether a candidate config passes the k-fold acceptance criteria (Spearman delta, stability, fidelity).'],
  ['main', 417, 644, 'Optimizer entrypoint: loads snapshot+config, runs the perturbation/evaluation loop with logging, and persists the best candidate plus reports.'],
];
for (const [n, s, e, sum] of owFns) {
  out.nodes.push({ id: 'function:autoresearch/sandbox/optimize-weights.ts:' + n, type: 'function', name: n, filePath: 'autoresearch/sandbox/optimize-weights.ts', lineRange: [s, e], summary: sum, tags: ['optimizer', 'autoresearch'], complexity: (e - s + 1) >= 200 ? 'complex' : ((e - s + 1) >= 40 ? 'moderate' : 'simple') });
}

// 18. autoresearch/sandbox/replay-aggregation.ts
out.nodes.push({ id: 'file:autoresearch/sandbox/replay-aggregation.ts', type: 'file', name: 'replay-aggregation.ts', filePath: 'autoresearch/sandbox/replay-aggregation.ts', summary: 'Replays component-result aggregation under a candidate parameter config to produce predicted scores for evaluation.', tags: ['replay', 'aggregation', 'autoresearch', 'evaluation'], complexity: 'complex' });
out.nodes.push({ id: 'function:autoresearch/sandbox/replay-aggregation.ts:replayRun', type: 'function', name: 'replayRun', filePath: 'autoresearch/sandbox/replay-aggregation.ts', lineRange: [88, 263], summary: 'Replays a single exported prediction run with a candidate config, recomputing weighted scores and calibration adjustments.', tags: ['replay', 'aggregation', 'autoresearch'], complexity: 'complex' });
out.nodes.push({ id: 'function:autoresearch/sandbox/replay-aggregation.ts:replayAll', type: 'function', name: 'replayAll', filePath: 'autoresearch/sandbox/replay-aggregation.ts', lineRange: [268, 292], summary: 'Iterates a snapshot and replays every run, returning predicted vs actual arrays for downstream evaluation.', tags: ['replay', 'batch', 'autoresearch'], complexity: 'moderate' });
out.nodes.push({ id: 'function:autoresearch/sandbox/replay-aggregation.ts:resolveAccountFactor', type: 'function', name: 'resolveAccountFactor', filePath: 'autoresearch/sandbox/replay-aggregation.ts', lineRange: [296, 329], summary: 'Resolves the configured account-size multiplier for a run, with fallbacks for missing or unknown sizes.', tags: ['utility', 'calibration', 'autoresearch'], complexity: 'simple' });

// 19. autoresearch/sandbox/types.ts
out.nodes.push({ id: 'file:autoresearch/sandbox/types.ts', type: 'file', name: 'types.ts', filePath: 'autoresearch/sandbox/types.ts', summary: 'Shared TypeScript types for exported snapshots, parameter configs, and evaluation results in the autoresearch sandbox.', tags: ['type-definition', 'types', 'autoresearch'], complexity: 'moderate' });

// 20. autoresearch/sandbox/README.md
out.nodes.push({ id: 'document:autoresearch/sandbox/README.md', type: 'document', name: 'README.md', filePath: 'autoresearch/sandbox/README.md', summary: 'Sandbox usage guide explaining how to run baseline-check, optimize-weights, and interpret outputs.', tags: ['documentation', 'autoresearch', 'sandbox', 'usage'], complexity: 'simple' });

// 21. autoresearch/export-snapshot.ts
out.nodes.push({ id: 'file:autoresearch/export-snapshot.ts', type: 'file', name: 'export-snapshot.ts', filePath: 'autoresearch/export-snapshot.ts', summary: 'CLI script that exports prediction_runs and run_component_results from Supabase into a JSON snapshot for offline replay.', tags: ['entry-point', 'export', 'snapshot', 'autoresearch', 'supabase'], complexity: 'complex' });
out.nodes.push({ id: 'function:autoresearch/export-snapshot.ts:main', type: 'function', name: 'main', filePath: 'autoresearch/export-snapshot.ts', lineRange: [130, 365], summary: 'Reads prediction_runs and run_component_results from Supabase, joins them, and writes a versioned JSON snapshot to disk.', tags: ['entry-point', 'export', 'supabase', 'snapshot'], complexity: 'complex' });

// 22. autoresearch/README.md
out.nodes.push({ id: 'document:autoresearch/README.md', type: 'document', name: 'README.md', filePath: 'autoresearch/README.md', summary: 'Top-level autoresearch README covering snapshot export, sandbox workflow, and config promotion path.', tags: ['documentation', 'autoresearch', 'entry-point', 'overview'], complexity: 'simple' });

// 23-25 config JSONs
out.nodes.push({ id: 'config:config/niche-keywords.json', type: 'config', name: 'niche-keywords.json', filePath: 'config/niche-keywords.json', summary: 'Per-niche keyword dictionary used by niche-classification and ingestion components.', tags: ['configuration', 'niche', 'keywords', 'classification'], complexity: 'complex' });
out.nodes.push({ id: 'config:config/objectives.matrix.json', type: 'config', name: 'objectives.matrix.json', filePath: 'config/objectives.matrix.json', summary: 'Objective matrix mapping creator objectives to prediction-pipeline weights and acceptance thresholds.', tags: ['configuration', 'objectives', 'matrix', 'tuning'], complexity: 'moderate' });
out.nodes.push({ id: 'config:config/objectives.ops.json', type: 'config', name: 'objectives.ops.json', filePath: 'config/objectives.ops.json', summary: 'Operational objective overrides applied at runtime on top of the objectives matrix.', tags: ['configuration', 'objectives', 'runtime', 'ops'], complexity: 'simple' });

// ====== EDGES ======
const imports = {
  'autoresearch/sandbox/baseline-check.ts': ['autoresearch/sandbox/loader.ts', 'autoresearch/sandbox/replay-aggregation.ts'],
  'autoresearch/sandbox/eval-spearman.ts': ['autoresearch/sandbox/types.ts'],
  'autoresearch/sandbox/loader.ts': ['autoresearch/sandbox/types.ts'],
  'autoresearch/sandbox/optimize-weights.ts': ['autoresearch/sandbox/eval-spearman.ts', 'autoresearch/sandbox/loader.ts', 'autoresearch/sandbox/replay-aggregation.ts', 'autoresearch/sandbox/types.ts'],
  'autoresearch/sandbox/replay-aggregation.ts': ['autoresearch/sandbox/types.ts'],
};
for (const [src, arr] of Object.entries(imports)) {
  for (const t of arr) {
    out.edges.push({ source: 'file:' + src, target: 'file:' + t, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

function addContains(file, fn) { out.edges.push({ source: 'file:' + file, target: 'function:' + file + ':' + fn, type: 'contains', direction: 'forward', weight: 1.0 }); }
function addExport(file, fn) { out.edges.push({ source: 'file:' + file, target: 'function:' + file + ':' + fn, type: 'exports', direction: 'forward', weight: 0.8 }); }

addContains('apify/hot-feed-scanner.js', 'main');
addContains('autoresearch/sandbox/baseline-check.ts', 'main');
for (const [n] of evalFns) addContains('autoresearch/sandbox/eval-spearman.ts', n);
for (const n of ['validatePreConditions', 'validateFidelity', 'spearmanRho', 'evaluate', 'computeFidelityMetrics']) addExport('autoresearch/sandbox/eval-spearman.ts', n);
for (const n of ['loadSnapshot', 'loadConfig', 'stripMetaKeys']) addContains('autoresearch/sandbox/loader.ts', n);
for (const n of ['loadSnapshot', 'loadConfig']) addExport('autoresearch/sandbox/loader.ts', n);
for (const [n] of owFns) addContains('autoresearch/sandbox/optimize-weights.ts', n);
for (const n of ['replayRun', 'replayAll', 'resolveAccountFactor']) addContains('autoresearch/sandbox/replay-aggregation.ts', n);
for (const n of ['replayRun', 'replayAll']) addExport('autoresearch/sandbox/replay-aggregation.ts', n);
addContains('autoresearch/export-snapshot.ts', 'main');

// documents
out.edges.push({ source: 'document:apify/README.md', target: 'file:apify/hot-feed-scanner.js', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:apify/README.md', target: 'file:apify/video-detail-enricher.js', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/README.md', target: 'file:autoresearch/export-snapshot.ts', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/sandbox/README.md', target: 'file:autoresearch/sandbox/baseline-check.ts', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/sandbox/README.md', target: 'file:autoresearch/sandbox/optimize-weights.ts', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/notes/feasibility-audit.md', target: 'file:autoresearch/export-snapshot.ts', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/results/baseline-report.md', target: 'file:autoresearch/sandbox/baseline-check.ts', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/results/optimization-report.md', target: 'file:autoresearch/sandbox/optimize-weights.ts', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/results/promotion-plan.md', target: 'config:autoresearch/configs/best.json', type: 'documents', direction: 'forward', weight: 0.5 });
out.edges.push({ source: 'document:autoresearch/results/bulk-download-parity-audit.md', target: 'file:autoresearch/sandbox/replay-aggregation.ts', type: 'documents', direction: 'forward', weight: 0.5 });

// configures
out.edges.push({ source: 'config:autoresearch/configs/baseline.json', target: 'file:autoresearch/sandbox/baseline-check.ts', type: 'configures', direction: 'forward', weight: 0.6 });
out.edges.push({ source: 'config:autoresearch/configs/baseline.json', target: 'file:autoresearch/sandbox/optimize-weights.ts', type: 'configures', direction: 'forward', weight: 0.6 });
out.edges.push({ source: 'config:autoresearch/configs/best.json', target: 'file:autoresearch/sandbox/optimize-weights.ts', type: 'configures', direction: 'forward', weight: 0.6 });
out.edges.push({ source: 'config:autoresearch/results/baseline-check.json', target: 'file:autoresearch/sandbox/baseline-check.ts', type: 'configures', direction: 'forward', weight: 0.6 });
out.edges.push({ source: 'config:autoresearch/results/optimization-summary.json', target: 'file:autoresearch/sandbox/optimize-weights.ts', type: 'configures', direction: 'forward', weight: 0.6 });

fs.writeFileSync(outPath, JSON.stringify(out, null, 2));

const byType = {}; for (const n of out.nodes) byType[n.type] = (byType[n.type] || 0) + 1;
const edgeByType = {}; for (const e of out.edges) edgeByType[e.type] = (edgeByType[e.type] || 0) + 1;
const importSum = Object.values(imports).reduce((a, b) => a + b.length, 0);

console.log('nodes:', out.nodes.length);
console.log('edges:', out.edges.length);
console.log('byType:', JSON.stringify(byType));
console.log('edgeByType:', JSON.stringify(edgeByType));
console.log('importSum:', importSum, 'importEdges:', edgeByType.imports);

// Validate: no duplicate node ids, no self edges, all edge endpoints exist
const ids = new Set();
const dup = [];
for (const n of out.nodes) { if (ids.has(n.id)) dup.push(n.id); ids.add(n.id); }
console.log('duplicate nodes:', dup.length);
const missing = [];
for (const e of out.edges) {
  if (e.source === e.target) console.log('SELF EDGE', e);
  if (!ids.has(e.source) && !e.source.startsWith('file:') && !e.source.startsWith('config:') && !e.source.startsWith('document:')) missing.push(e.source);
}
const internalEdges = out.edges.filter(e => !ids.has(e.source) || !ids.has(e.target));
const internalMissing = internalEdges.filter(e => {
  // imports edges may point cross-batch; allow if endpoint id has 'file:' prefix
  if (e.type === 'imports') return false;
  return !ids.has(e.source) || !ids.has(e.target);
});
console.log('edges referencing nodes outside batch (non-import):', internalMissing.length);
if (internalMissing.length) console.log(internalMissing.slice(0, 5));
