import fs from 'fs';

const r = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-5.json', 'utf8'));
const input = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-analyzer-input-5.json', 'utf8'));
const importMap = input.batchImportData;
const map = Object.fromEntries(r.results.map((x) => [x.path, x]));

const nodes = [];
const edges = [];

function pick(path) { return map[path]; }
function complexity(lines) { if (lines < 50) return 'simple'; if (lines <= 200) return 'moderate'; return 'complex'; }

// 1. dashboard-fix/page.tsx
{
  const p = 'dashboard-fix/page.tsx';
  const f = pick(p);
  nodes.push({
    id: 'file:' + p,
    type: 'file',
    name: 'page.tsx',
    filePath: p,
    summary: 'Standalone Next.js dashboard view (App Router client component) rendering tabbed stats (templates, views, viral, audience) with mock data, intended as a fixed/replacement layout for the main dashboard.',
    tags: ['component', 'dashboard', 'next-app-router', 'client-component'],
    complexity: complexity(f.nonEmptyLines || f.totalLines)
  });
  nodes.push({
    id: 'function:' + p + ':DashboardViewPage',
    type: 'function',
    name: 'DashboardViewPage',
    filePath: p,
    lineRange: [17, 254],
    summary: 'Default-exported page component that holds the active tab state and renders the dashboard overview, templates, viral, and audience tabs with stat cards.',
    tags: ['component', 'page', 'react', 'client-component'],
    complexity: 'complex'
  });
  edges.push({ source: 'file:' + p, target: 'function:' + p + ':DashboardViewPage', type: 'contains', direction: 'forward', weight: 1.0 });
  edges.push({ source: 'file:' + p, target: 'function:' + p + ':DashboardViewPage', type: 'exports', direction: 'forward', weight: 0.8 });
  for (const tgt of importMap[p]) {
    edges.push({ source: 'file:' + p, target: 'file:' + tgt, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

// 2. SQL data files
function emitSqlFile(p, summary, tags) {
  const f = pick(p);
  nodes.push({
    id: 'file:' + p,
    type: 'table',
    name: p.split('/').pop(),
    filePath: p,
    summary,
    tags,
    complexity: complexity(f.nonEmptyLines || f.totalLines)
  });
  for (const d of (f.definitions || [])) {
    if (d.kind === 'table') {
      const tid = 'table:' + p + ':' + d.name;
      const fieldList = (d.fields || []).slice(0, 10).join(', ') + ((d.fields || []).length > 10 ? '...' : '');
      nodes.push({
        id: tid,
        type: 'table',
        name: d.name,
        filePath: p,
        summary: 'Defines the ' + d.name + ' table with ' + (d.fields?.length || 0) + ' columns: ' + fieldList + '.',
        tags: ['database', 'schema-definition', 'table'],
        complexity: 'simple'
      });
      edges.push({ source: 'file:' + p, target: tid, type: 'migrates', direction: 'forward', weight: 0.7 });
    } else if (d.kind === 'view') {
      const tid = 'table:' + p + ':' + d.name;
      nodes.push({
        id: tid,
        type: 'table',
        name: d.name,
        filePath: p,
        summary: 'SQL view ' + d.name + ' derived from underlying pipeline tables.',
        tags: ['database', 'view', 'derived'],
        complexity: 'simple'
      });
      edges.push({ source: 'file:' + p, target: tid, type: 'migrates', direction: 'forward', weight: 0.7 });
    }
  }
}

emitSqlFile('database/add_metadata_column_migration.sql',
  'Migration that adds a metadata JSONB column to prediction_validation and creates a GIN index over it.',
  ['database', 'migration', 'jsonb']);

emitSqlFile('database/algorithm_optimizations_table.sql',
  'Defines the algorithm_optimizations table that records weight optimization runs (current/optimized weights, accuracies, improvement percentage, deployment status) plus supporting indexes.',
  ['database', 'schema-definition', 'training-pipeline']);

emitSqlFile('database/pipeline_ops.sql',
  'Pipeline operations schema: 14 tables and a view backing module/DAG management, run/log history, scheduler logs, scraping jobs, engagement windows, alerts, and ops changelog.',
  ['database', 'schema-definition', 'pipeline-ops', 'observability']);

emitSqlFile('database/prediction_validation_table.sql',
  'Defines the prediction_validation table comparing predicted vs actual viral scores/views/probabilities with platform and confidence metadata, plus indexes for status/accuracy/video lookups.',
  ['database', 'schema-definition', 'prediction-validation']);

// 3. alertmanager.yml
{
  const p = 'docker/alertmanager/alertmanager.yml';
  const f = pick(p);
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'alertmanager.yml',
    filePath: p,
    summary: 'Alertmanager configuration defining global SMTP settings, routing tree, inhibition rules, receivers (Slack, PagerDuty, email, webhook), and time-interval mutes for Trendzo monitoring alerts.',
    tags: ['configuration', 'monitoring', 'alerting', 'observability'],
    complexity: complexity(f.nonEmptyLines || f.totalLines)
  });
}

// 4. env.template
{
  const p = 'docker/environment/env.template';
  const f = pick(p);
  nodes.push({
    id: 'file:' + p,
    type: 'config',
    name: 'env.template',
    filePath: p,
    summary: 'Environment-variable template enumerating every variable (DB, Redis, AI providers, monitoring secrets, deployment toggles) required to bring up a Trendzo Docker deployment.',
    tags: ['configuration', 'deployment', 'env-template', 'secrets'],
    complexity: complexity(f.nonEmptyLines || f.totalLines)
  });
}

// 5. validate-env.js
{
  const p = 'docker/environment/validate-env.js';
  const f = pick(p);
  nodes.push({
    id: 'file:' + p,
    type: 'file',
    name: 'validate-env.js',
    filePath: p,
    summary: 'Node CLI script that loads .env files and validates every required environment variable (presence, type, pattern, AI provider availability) before deploying Trendzo to production.',
    tags: ['script', 'validation', 'deployment', 'env-template'],
    complexity: complexity(f.nonEmptyLines || f.totalLines)
  });
  const fnDefs = [
    ['validateEnvVar', 68, 112, 'Validates a single env variable against its config: required flag, pattern, numeric/boolean coercion, with colored success/error logging.'],
    ['validateAIServices', 117, 135, 'Asserts at least one AI provider env var (OpenAI/Anthropic/Google AI/Replicate/HuggingFace) is configured and warns when none are present.'],
    ['loadEnvFile', 140, 160, 'Reads a .env-style file from disk and returns a key/value object, ignoring blank lines and comments.'],
    ['validateEnvironment', 165, 235, 'Top-level entry point that loads env files, iterates the required-var catalog, validates AI services, and prints a final pass/fail summary.']
  ];
  for (const [n, s, e, sum] of fnDefs) {
    if ((e - s + 1) >= 10) {
      const id = 'function:' + p + ':' + n;
      nodes.push({
        id, type: 'function', name: n, filePath: p, lineRange: [s, e],
        summary: sum, tags: ['validation', 'script', 'deployment'],
        complexity: (e - s + 1) > 50 ? 'moderate' : 'simple'
      });
      edges.push({ source: 'file:' + p, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    }
  }
}

// 6. grafana dashboard JSON
{
  const p = 'docker/grafana/dashboards/trendzo-application.json';
  const f = pick(p);
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'trendzo-application.json',
    filePath: p,
    summary: 'Grafana dashboard JSON model for the Trendzo application: panels, templating, annotations, and time controls visualizing app metrics scraped by Prometheus.',
    tags: ['configuration', 'monitoring', 'dashboard', 'grafana'],
    complexity: complexity(f.nonEmptyLines || f.totalLines)
  });
}

// 7. dashboards.yml
{
  const p = 'docker/grafana/provisioning/dashboards/dashboards.yml';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'dashboards.yml',
    filePath: p,
    summary: 'Grafana dashboard provisioning config that auto-loads JSON dashboards from the mounted dashboards folder on startup.',
    tags: ['configuration', 'grafana', 'provisioning'],
    complexity: 'simple'
  });
  edges.push({
    source: 'config:' + p,
    target: 'config:docker/grafana/dashboards/trendzo-application.json',
    type: 'configures', direction: 'forward', weight: 0.6
  });
}

// 8. datasources.yml
{
  const p = 'docker/grafana/provisioning/datasources/datasources.yml';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'datasources.yml',
    filePath: p,
    summary: 'Grafana datasource provisioning declaring Prometheus, Loki, and other backends so Grafana wires them up automatically on startup.',
    tags: ['configuration', 'grafana', 'datasources', 'provisioning'],
    complexity: 'simple'
  });
}

// 9. loki.yml
{
  const p = 'docker/loki/loki.yml';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'loki.yml',
    filePath: p,
    summary: 'Loki log aggregator config: server, storage schema, query limits, compactor, ruler, and table manager settings used inside the monitoring stack.',
    tags: ['configuration', 'monitoring', 'logging', 'loki'],
    complexity: 'moderate'
  });
}

// 10. trendzo.conf (nginx)
{
  const p = 'docker/nginx/conf.d/trendzo.conf';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'trendzo.conf',
    filePath: p,
    summary: 'Site-level nginx config for Trendzo: upstream blocks, server vhosts, TLS, gzip, proxy headers, and route-specific timeouts for the Next.js app.',
    tags: ['configuration', 'reverse-proxy', 'nginx', 'deployment'],
    complexity: 'moderate'
  });
}

// 11. nginx.conf
{
  const p = 'docker/nginx/nginx.conf';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'nginx.conf',
    filePath: p,
    summary: 'Top-level nginx config (events, http core, logging, gzip, security headers, worker tuning) that includes the per-site configs under conf.d.',
    tags: ['configuration', 'reverse-proxy', 'nginx', 'security'],
    complexity: 'moderate'
  });
  edges.push({
    source: 'config:' + p,
    target: 'config:docker/nginx/conf.d/trendzo.conf',
    type: 'depends_on', direction: 'forward', weight: 0.6
  });
}

// 12. prometheus.yml
{
  const p = 'docker/prometheus/prometheus.yml';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'prometheus.yml',
    filePath: p,
    summary: 'Prometheus config defining global scrape settings, alerting rule files, and scrape_configs for every monitoring target in the stack.',
    tags: ['configuration', 'monitoring', 'prometheus', 'metrics'],
    complexity: 'moderate'
  });
}

// 13. promtail.yml
{
  const p = 'docker/promtail/promtail.yml';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'promtail.yml',
    filePath: p,
    summary: 'Promtail agent config: server, positions, clients, and scrape_configs that ship container/application logs into Loki.',
    tags: ['configuration', 'monitoring', 'logging', 'promtail'],
    complexity: 'moderate'
  });
  edges.push({
    source: 'config:' + p,
    target: 'config:docker/loki/loki.yml',
    type: 'depends_on', direction: 'forward', weight: 0.6
  });
}

// 14. docker-security.conf
{
  const p = 'docker/security/docker-security.conf';
  nodes.push({
    id: 'config:' + p,
    type: 'config',
    name: 'docker-security.conf',
    filePath: p,
    summary: 'Docker daemon / runtime security hardening settings (seccomp, AppArmor, ulimits, network policies) applied to the Trendzo stack.',
    tags: ['configuration', 'security', 'docker', 'hardening'],
    complexity: 'simple'
  });
}

// 15. generate-certs.ps1
{
  const p = 'docker/ssl/generate-certs.ps1';
  nodes.push({
    id: 'file:' + p,
    type: 'file',
    name: 'generate-certs.ps1',
    filePath: p,
    summary: 'PowerShell helper that generates a self-signed TLS certificate chain for local Trendzo deployments on Windows.',
    tags: ['script', 'security', 'tls', 'powershell'],
    complexity: 'moderate'
  });
}

// 16. generate-certs.sh
{
  const p = 'docker/ssl/generate-certs.sh';
  nodes.push({
    id: 'file:' + p,
    type: 'file',
    name: 'generate-certs.sh',
    filePath: p,
    summary: 'Bash helper that generates a self-signed TLS certificate chain for local Trendzo deployments on Linux/macOS.',
    tags: ['script', 'security', 'tls', 'shell'],
    complexity: 'moderate'
  });
}

// 17. monitoring-stack.yml — docker-compose
{
  const p = 'docker/monitoring-stack.yml';
  nodes.push({
    id: 'service:' + p,
    type: 'service',
    name: 'monitoring-stack.yml',
    filePath: p,
    summary: 'docker-compose stack that brings up the full Trendzo observability platform (Prometheus, Grafana, Alertmanager, Loki, Promtail, Jaeger, exporters, blackbox, VictoriaMetrics, dashboard).',
    tags: ['infrastructure', 'orchestration', 'monitoring', 'docker-compose'],
    complexity: 'complex',
    languageNotes: 'docker-compose v3 manifest using named networks and volumes.'
  });
  const composeServices = [
    ['prometheus', 'Prometheus metrics server scraping all stack targets and evaluating alert rules.'],
    ['grafana', 'Grafana visualization layer with provisioned datasources and dashboards.'],
    ['alertmanager', 'Alertmanager routing/silencing/deduplicating alerts to Slack, PagerDuty, and email.'],
    ['node-exporter', 'Prometheus node_exporter for host-level CPU/memory/disk/network metrics.'],
    ['cadvisor', 'cAdvisor exporting per-container resource usage to Prometheus.'],
    ['loki', 'Loki log aggregator receiving log streams from Promtail.'],
    ['promtail', 'Promtail agent shipping container and host logs into Loki.'],
    ['redis-monitoring', 'Dedicated Redis instance backing the monitoring stack state.'],
    ['redis-exporter', 'Redis exporter publishing Redis metrics to Prometheus.'],
    ['jaeger', 'Jaeger all-in-one collector and UI for distributed tracing.'],
    ['blackbox-exporter', 'Prometheus blackbox_exporter probing HTTP/TCP/ICMP endpoints for synthetic monitoring.'],
    ['victoriametrics', 'VictoriaMetrics long-term metrics store used as a remote_write sink for Prometheus.'],
    ['webhook-relay', 'Internal webhook relay forwarding Alertmanager notifications to external endpoints.'],
    ['monitoring-dashboard', 'Internal status dashboard service rendering health/status of the monitoring stack.']
  ];
  for (const [name, sum] of composeServices) {
    const id = 'service:' + p + ':' + name;
    nodes.push({
      id, type: 'service', name, filePath: p,
      summary: sum, tags: ['monitoring', 'docker-compose', 'service'], complexity: 'simple'
    });
    edges.push({ source: 'service:' + p, target: id, type: 'deploys', direction: 'forward', weight: 0.7 });
  }
  edges.push({ source: 'service:' + p + ':prometheus', target: 'config:docker/prometheus/prometheus.yml', type: 'depends_on', direction: 'forward', weight: 0.6 });
  edges.push({ source: 'service:' + p + ':alertmanager', target: 'config:docker/alertmanager/alertmanager.yml', type: 'depends_on', direction: 'forward', weight: 0.6 });
  edges.push({ source: 'service:' + p + ':loki', target: 'config:docker/loki/loki.yml', type: 'depends_on', direction: 'forward', weight: 0.6 });
  edges.push({ source: 'service:' + p + ':promtail', target: 'config:docker/promtail/promtail.yml', type: 'depends_on', direction: 'forward', weight: 0.6 });
  edges.push({ source: 'service:' + p + ':grafana', target: 'config:docker/grafana/provisioning/dashboards/dashboards.yml', type: 'depends_on', direction: 'forward', weight: 0.6 });
  edges.push({ source: 'service:' + p + ':grafana', target: 'config:docker/grafana/provisioning/datasources/datasources.yml', type: 'depends_on', direction: 'forward', weight: 0.6 });
}

// 18-22. SF_*.md
const docMeta = [
  ['SF_AB_Test.md', 'Mermaid workflow diagram describing the A/B-test flow: UI POSTs to /api/ab/start, polls /api/ab/:id, and renders the winner.'],
  ['SF_Analyzer.md', 'Mermaid workflow diagram for the draft analyzer flow: /api/drafts/analyze extracts features, scores the draft, and returns recommendations.'],
  ['SF_Dashboard.md', 'Mermaid workflow diagram for the discovery dashboard: /api/discovery/rollups feeds the discovery and decay charts.'],
  ['SF_Inception.md', 'Mermaid workflow diagram for the inception screen: GET /api/templates/discovery renders the inception queue.'],
  ['SF_Optimize.md', 'Mermaid workflow diagram for the optimize flow: POST /api/optimize/schedule and GET /api/optimize/entities feed the opt-entities view.']
];
for (const [name, sum] of docMeta) {
  const p = 'docs/assurance/viral-recipe-book_preflight/workflows/' + name;
  nodes.push({
    id: 'document:' + p,
    type: 'document',
    name,
    filePath: p,
    summary: sum,
    tags: ['documentation', 'workflow', 'mermaid'],
    complexity: 'simple'
  });
}

// Sanity check
let expectedImports = 0;
for (const k of Object.keys(importMap)) expectedImports += (importMap[k] || []).length;
const actualImports = edges.filter((e) => e.type === 'imports').length;
console.log('expected imports:', expectedImports, 'actual imports:', actualImports);
console.log('node count:', nodes.length, 'edge count:', edges.length);

// dedup id check
const ids = new Set();
let dupes = 0;
for (const n of nodes) { if (ids.has(n.id)) { dupes++; console.log('DUP', n.id); } ids.add(n.id); }
console.log('duplicates:', dupes);

// self-edge check
let selfs = 0;
for (const e of edges) if (e.source === e.target) selfs++;
console.log('self edges:', selfs);

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-5.json', JSON.stringify(out, null, 2));
console.log('written batch-5.json');
