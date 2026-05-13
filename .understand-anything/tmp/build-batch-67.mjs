import fs from 'fs';

const batches = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/batches.json', 'utf8'));
const b = batches[67];
const ext = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-67.json', 'utf8'));

const byPath = {};
for (const r of ext.results) byPath[r.path] = r;

const fileMeta = {
  'src/app/api/admin/integration/dryrun_process/route.ts': {
    summary: 'Admin integration dry-run endpoint that seeds mock process_events for a synthetic session, then computes a step-by-step funnel with drop-off counts.',
    tags: ['api-handler','dry-run','admin','funnel','integration-test'],
  },
  'src/app/api/admin/integration/dryrun_public_api/route.ts': {
    summary: 'Admin dry-run handler that returns a placeholder public-API contract surface used by integration smoke checks.',
    tags: ['api-handler','dry-run','admin','integration-test'],
  },
  'src/app/api/admin/integration/dryrun_quality_reasons/route.ts': {
    summary: 'Admin dry-run that exercises the anti-gaming quality reasoner over a sample payload and returns the produced rejection reasons.',
    tags: ['api-handler','dry-run','admin','quality','anti-gaming'],
  },
  'src/app/api/admin/integration/dryrun_quality/route.ts': {
    summary: 'Admin dry-run that returns a minimal quality-gate proof for integration smoke testing.',
    tags: ['api-handler','dry-run','admin','quality'],
  },
  'src/app/api/admin/integration/dryrun_readiness/route.ts': {
    summary: 'Admin dry-run that probes environment and object storage and reports a readiness proof for the integration harness.',
    tags: ['api-handler','dry-run','admin','readiness','environment'],
  },
  'src/app/api/admin/integration/dryrun_recipes/route.ts': {
    summary: 'Admin dry-run that invokes the recipe-compute service on a fixed input and returns the computed result for smoke verification.',
    tags: ['api-handler','dry-run','admin','recipes'],
  },
  'src/app/api/admin/integration/dryrun_replay_81225/route.ts': {
    summary: 'Admin dry-run that replays the canonical 8/12/25 fixture through the unified prediction engine and returns the resulting prediction proof.',
    tags: ['api-handler','dry-run','admin','replay','prediction'],
  },
  'src/app/api/admin/integration/dryrun_safety/route.ts': {
    summary: 'Admin dry-run that returns a static safety-guardrail report used by integration smoke checks.',
    tags: ['api-handler','dry-run','admin','safety'],
  },
  'src/app/api/admin/integration/dryrun_secrets/route.ts': {
    summary: 'Admin dry-run that exercises the secret vault and key rotation helpers and returns a redacted proof of the rotation flow.',
    tags: ['api-handler','dry-run','admin','secrets','security'],
  },
  'src/app/api/admin/integration/dryrun_security/route.ts': {
    summary: 'Admin dry-run that reports which security-relevant environment variables are configured for the integration smoke run.',
    tags: ['api-handler','dry-run','admin','security','environment'],
  },
  'src/app/api/admin/integration/dryrun_shadow/route.ts': {
    summary: 'Admin dry-run that returns the shadow-mode configuration and feature-flag state for integration validation.',
    tags: ['api-handler','dry-run','admin','shadow-mode','feature-flag'],
  },
  'src/app/api/admin/integration/dryrun_simulator/route.ts': {
    summary: 'Admin dry-run that runs the integration simulator harness on a stock fixture and returns the simulated output.',
    tags: ['api-handler','dry-run','admin','simulator'],
  },
  'src/app/api/admin/integration/dryrun_telemetry_plugin/route.ts': {
    summary: 'Admin dry-run that ensures the telemetry_plugin_events table exists, writes a synthetic plugin event, and returns recent rows for verification.',
    tags: ['api-handler','dry-run','admin','telemetry','plugin'],
  },
  'src/app/api/admin/integration/dryrun_telemetry/route.ts': {
    summary: 'Admin dry-run that bootstraps the telemetry_events table, exercises the framework mapping guide, and returns a telemetry proof payload.',
    tags: ['api-handler','dry-run','admin','telemetry','framework'],
  },
  'src/app/api/admin/integration/dryrun_templates/route.ts': {
    summary: 'Admin dry-run that lists template artifacts from object storage and returns a proof listing for the integration harness.',
    tags: ['api-handler','dry-run','admin','templates','storage'],
  },
  'src/app/api/admin/integration/dryrun_transcripts/route.ts': {
    summary: 'Admin dry-run that writes a synthetic transcript through the transcripts store and reads it back as integration proof.',
    tags: ['api-handler','dry-run','admin','transcripts'],
  },
  'src/app/api/admin/integration/dryrun_trends/route.ts': {
    summary: 'Admin dry-run that ensures the trends storage table and seeds and returns a small batch of synthetic trend rows for downstream tests.',
    tags: ['api-handler','dry-run','admin','trends'],
  },
  'src/app/api/admin/integration/dryrun_validation_48h/route.ts': {
    summary: 'Admin dry-run that emits a 48-hour validation proof envelope describing how prediction labels would be reconciled with ground truth.',
    tags: ['api-handler','dry-run','admin','validation'],
  },
  'src/app/api/admin/integration/dryrun_validation_ui/route.ts': {
    summary: 'Admin dry-run that retrieves the latest validation UI snapshot from object storage for smoke verification.',
    tags: ['api-handler','dry-run','admin','validation','ui'],
  },
  'src/app/api/admin/integration/dryrun/route.ts': {
    summary: 'Master admin dry-run that synthesizes baselines, incubation labels, and AUROC/Precision@K/ECE metrics, then writes a deterministic proof JSON for the integration suite.',
    tags: ['api-handler','dry-run','admin','metrics','proof'],
  },
  'src/app/api/admin/integration/inspect_ingestion_window/route.ts': {
    summary: 'Admin debug endpoint that inspects the active ingestion window and returns counts and bounds for diagnosing ingestion gaps.',
    tags: ['api-handler','admin','ingestion','debug'],
  },
  'src/app/api/admin/integration/preflight/route.ts': {
    summary: 'Admin preflight check that confirms required environment variables are present before running the integration harness.',
    tags: ['api-handler','admin','preflight','environment'],
  },
  'src/app/api/admin/integration/proof/latest/download/route.ts': {
    summary: 'Admin handler that resolves the latest dry-run proof file on disk and streams it back as a downloadable JSON attachment.',
    tags: ['api-handler','admin','proof','download'],
  },
  'src/app/api/admin/integration/proof/latest/route.ts': {
    summary: 'Admin handler that locates and returns the most recent integration dry-run proof JSON for inline display.',
    tags: ['api-handler','admin','proof'],
  },
  'src/app/api/admin/integration/readiness_report/route.ts': {
    summary: 'Admin readiness aggregator that pings every dry-run sub-endpoint and consolidates their outcomes into a single readiness report.',
    tags: ['api-handler','admin','readiness','aggregator','proof'],
  },
};

function complexityFor(lines) {
  if (lines < 50) return 'simple';
  if (lines <= 200) return 'moderate';
  return 'complex';
}

const nodes = [];
const edges = [];

for (const f of b.files) {
  const r = byPath[f.path];
  const lines = r ? r.totalLines : f.sizeLines;
  const meta = fileMeta[f.path];
  const name = f.path.split('/').pop();
  nodes.push({
    id: 'file:' + f.path,
    type: 'file',
    name,
    filePath: f.path,
    summary: meta.summary,
    tags: meta.tags,
    complexity: complexityFor(lines),
  });
}

const helperFns = {
  'src/app/api/admin/integration/dryrun_telemetry_plugin/route.ts': [{
    name: 'ensure',
    summary: 'Idempotently creates the telemetry_plugin_events table via raw SQL so the dry-run can insert without prior migrations.',
    tags: ['utility','schema-init','idempotent','telemetry'],
  }],
  'src/app/api/admin/integration/dryrun_telemetry/route.ts': [{
    name: 'ensure',
    summary: 'Idempotently provisions the telemetry_events table used by the dry-run when running against a fresh database.',
    tags: ['utility','schema-init','idempotent','telemetry'],
  }],
  'src/app/api/admin/integration/dryrun_trends/route.ts': [{
    name: 'ensureSql',
    summary: 'Creates the trends storage table if missing via a direct SQL call so seed inserts have a target.',
    tags: ['utility','schema-init','idempotent','trends'],
  }],
  'src/app/api/admin/integration/proof/latest/download/route.ts': [{
    name: 'resolveLatest',
    summary: 'Scans the proof storage directory for the most recent dryrun_proof_*.json file and returns its absolute path.',
    tags: ['utility','filesystem','proof'],
  }],
  'src/app/api/admin/integration/proof/latest/route.ts': [{
    name: 'findLatestProof',
    summary: 'Locates the newest dryrun_proof_*.json artifact in storage and returns its path and parsed contents.',
    tags: ['utility','filesystem','proof'],
  }],
};

for (const f of b.files) {
  const r = byPath[f.path];
  if (!r) continue;
  for (const fn of r.functions || []) {
    if (fn.name === 'GET') {
      const id = 'function:' + f.path + ':GET';
      const span = fn.endLine - fn.startLine + 1;
      nodes.push({
        id,
        type: 'function',
        name: 'GET',
        filePath: f.path,
        lineRange: [fn.startLine, fn.endLine],
        summary: 'Next.js App Router GET handler that serves the route dry-run or integration-proof response.',
        tags: ['api-handler','route-handler','http-get','next-app-router'],
        complexity: span >= 50 ? 'moderate' : 'simple',
      });
      edges.push({ source: 'file:' + f.path, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
      edges.push({ source: 'file:' + f.path, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }
  const helpers = helperFns[f.path] || [];
  for (const h of helpers) {
    const fn = (r.functions || []).find(x => x.name === h.name);
    if (!fn) continue;
    const id = 'function:' + f.path + ':' + h.name;
    nodes.push({
      id,
      type: 'function',
      name: h.name,
      filePath: f.path,
      lineRange: [fn.startLine, fn.endLine],
      summary: h.summary,
      tags: h.tags,
      complexity: 'simple',
    });
    edges.push({ source: 'file:' + f.path, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
  }
}

let importEdgeCount = 0;
for (const f of b.files) {
  const imps = b.importMap[f.path] || [];
  for (const target of imps) {
    edges.push({
      source: 'file:' + f.path,
      target: 'file:' + target,
      type: 'imports',
      direction: 'forward',
      weight: 0.7,
    });
    importEdgeCount++;
  }
}

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-67.json', JSON.stringify(out, null, 2));

const fileCount = nodes.filter(n => n.type === 'file').length;
const fnCount = nodes.filter(n => n.type === 'function').length;
const containsCount = edges.filter(e => e.type === 'contains').length;
const exportsCount = edges.filter(e => e.type === 'exports').length;
console.log('Wrote batch-67.json');
console.log('Nodes:', nodes.length, '| file:', fileCount, 'function:', fnCount);
console.log('Edges:', edges.length, '| contains:', containsCount, 'exports:', exportsCount, 'imports:', importEdgeCount);
