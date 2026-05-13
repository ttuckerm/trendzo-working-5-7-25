import fs from 'node:fs';

const r = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-44.json', 'utf8'));

const nodes = [];
const edges = [];

const fileSummaries = {
  'scripts/deploy-hashtag-timing-framework-bmad.sql': {
    summary: 'Deployment script for the BMAD hashtag and timing intelligence framework, creating 6 tables tracking hashtag performance per niche, video hashtag analysis, posting-time research benchmarks, and creator timing profiles.',
    tags: ['database','migration','schema-definition','hashtag-intelligence','bmad-framework'],
    complexity: 'complex'
  },
  'scripts/deploy-operational-framework-bmad.sql': {
    summary: 'Deployment script for the BMAD operational viral-prediction framework with 9 tables covering data ingestion, engagement features, heuristic scores, heating detection, adaptive predictions, cohort analysis, drift monitoring, and workflow orchestration.',
    tags: ['database','migration','bmad-framework','prediction-pipeline','operational'],
    complexity: 'complex'
  },
  'scripts/deploy-postgres-compatible.sql': {
    summary: 'Postgres-compatible deployment dropping and recreating 15 core tables (alerts, viral gallery, recipes, DNA sequences, template generators, script intelligence, evolution engines) for the prediction platform.',
    tags: ['database','migration','schema-definition','deployment','postgres'],
    complexity: 'complex'
  },
  'scripts/deploy-postgres-fixed.sql': {
    summary: 'Bugfix variant of the postgres-compatible deployment recreating the same 15 core tables with corrected types and constraints for the prediction platform.',
    tags: ['database','migration','schema-definition','deployment','bugfix'],
    complexity: 'complex'
  },
  'scripts/deploy-viral-prediction-database.sql': {
    summary: 'Master viral-prediction database deployment creating 21 tables spanning predictions, script intelligence, DNA sequences, optimization queues, omniscient knowledge graph, A/B tests, and system metrics.',
    tags: ['database','migration','schema-definition','prediction-pipeline','knowledge-graph'],
    complexity: 'complex'
  },
  'scripts/fix-rls.sql': {
    summary: 'Small SQL patch disabling Row Level Security on selected tables to unblock service-role access during development.',
    tags: ['database','rls','security','patch'],
    complexity: 'simple'
  },
  'scripts/fix-system-alerts-table.sql': {
    summary: 'Hotfix that adds 2 missing indexes to the system_alerts table to repair a failed prior migration.',
    tags: ['database','patch','index','system-alerts'],
    complexity: 'simple'
  },
  'scripts/generated-core-tables.sql': {
    summary: 'Auto-generated DDL creating 12 core tables (viral DNA, template generators, recipe book, prediction validation, evolution engines, gene taggers) used by the prediction platform.',
    tags: ['database','migration','schema-definition','generated','core-tables'],
    complexity: 'moderate'
  },
  'scripts/initialize-hook-frameworks-fixed.sql': {
    summary: 'Seed script (fixed variant) inserting the canonical set of hook-framework rows into hook_frameworks so the predictor recognises curiosity, contradiction, and other hook styles.',
    tags: ['database','seed','hook-frameworks','data-seed','fix'],
    complexity: 'moderate'
  },
  'scripts/initialize-hook-frameworks-simple.sql': {
    summary: 'Simplified seed script inserting baseline hook-framework rows without optional metadata columns.',
    tags: ['database','seed','hook-frameworks','data-seed'],
    complexity: 'moderate'
  },
  'scripts/initialize-hook-frameworks.sql': {
    summary: 'Original seed script populating hook_frameworks with the full set of hook styles and their metadata used by the prediction pipeline.',
    tags: ['database','seed','hook-frameworks','data-seed'],
    complexity: 'moderate'
  },
  'scripts/manual-database-setup.sql': {
    summary: 'Manual one-shot database setup creating 13 prediction tables (viral predictions, script DNA, omniscient knowledge graph, optimization, A/B tests, system metrics) for fresh installs.',
    tags: ['database','migration','schema-definition','manual-setup','bootstrap'],
    complexity: 'complex'
  },
  'scripts/missing-tables.sql': {
    summary: 'Adds 5 tables (predictions, hook_detections, ai_brain_analysis, engagement_velocity, framework_scores) that earlier migrations had not yet created.',
    tags: ['database','migration','schema-definition','patch'],
    complexity: 'moderate'
  },
  'scripts/populate-real-data.sql': {
    summary: 'Seeds viral_video_gallery and video_framework_mapping with real reference videos and their framework associations for gallery dogfooding.',
    tags: ['database','seed','data-seed','viral-gallery'],
    complexity: 'moderate'
  },
  'scripts/populate-viral-gallery-fixed.sql': {
    summary: 'Fixed-variant insert-only script populating the viral video gallery and framework mappings, replacing earlier rows with corrected data.',
    tags: ['database','seed','viral-gallery','fix'],
    complexity: 'moderate'
  },
  'scripts/populate-viral-gallery-safe.sql': {
    summary: 'Idempotent insert script populating the viral video gallery using ON CONFLICT clauses so it can be re-run safely.',
    tags: ['database','seed','viral-gallery','idempotent'],
    complexity: 'moderate'
  },
  'scripts/populate-viral-gallery.sql': {
    summary: 'Original insert script seeding the viral video gallery with curated example videos and framework metadata.',
    tags: ['database','seed','viral-gallery','data-seed'],
    complexity: 'moderate'
  },
  'scripts/reload-schema.sql': {
    summary: "Tiny helper that issues NOTIFY pgrst, 'reload schema' to force PostgREST/Supabase to pick up new tables without a restart.",
    tags: ['database','operational','postgrest','reload'],
    complexity: 'simple'
  },
  'scripts/remaining-tables.sql': {
    summary: 'Adds the last 3 tables (prediction_accuracy, script_patterns, recipe_book_daily) needed to complete the prediction-platform schema.',
    tags: ['database','migration','schema-definition','patch'],
    complexity: 'simple'
  },
  'scripts/script-intelligence-schema.sql': {
    summary: 'Full schema definition for the script-intelligence subsystem with 9 tables covering script memory, evolution chains, DNA, fusion, optimization, pattern memory, predictive generation, and zeitgeist tracking.',
    tags: ['database','schema-definition','script-intelligence','prediction-pipeline'],
    complexity: 'complex'
  },
  'scripts/seed-mvp-data.sql': {
    summary: 'Seeds an MVP demo dataset into core tables so a freshly initialised database has realistic videos, hooks, and predictions to display.',
    tags: ['database','seed','data-seed','mvp'],
    complexity: 'moderate'
  },
  'scripts/seed-viral-templates.sql': {
    summary: 'Lightweight seed inserting a starter set of viral_templates rows so the template-recommendation flow has data on day one.',
    tags: ['database','seed','viral-templates','data-seed'],
    complexity: 'simple'
  },
  'scripts/setup-supabase-god-mode.sql': {
    summary: 'Comprehensive Supabase bootstrap creating 27 tables for videos, engagement, hook frameworks, viral templates, content series, psychological engagement, cultural timing, creator authority, marketing, and analytics — the all-in-one schema for a fresh project.',
    tags: ['database','migration','schema-definition','bootstrap','supabase'],
    complexity: 'complex'
  },
  'scripts/setup-viral-prediction-database.sql': {
    summary: 'Companion bootstrap to setup-supabase-god-mode that provisions 27 tables centred on viral prediction (videos, hooks, templates, series, marketing, optimization history, viral winners).',
    tags: ['database','migration','schema-definition','bootstrap','viral-prediction'],
    complexity: 'complex'
  },
  'scripts/value-template-editor-schema.sql': {
    summary: 'Schema for the Value Template Editor feature with 5 tables covering the viral gallery, framework mappings, editor sessions, workspace configurations, and a framework-protection audit log.',
    tags: ['database','schema-definition','template-editor','workspace'],
    complexity: 'complex'
  }
};

function complexityFor(f) {
  const n = f.nonEmptyLines;
  if (n < 50) return 'simple';
  if (n <= 200) return 'moderate';
  return 'complex';
}

for (const f of r.results) {
  const p = f.path;
  const meta = fileSummaries[p] || {
    summary: 'SQL data/migration script under scripts/.',
    tags: ['database','sql','migration'],
    complexity: complexityFor(f)
  };

  nodes.push({
    id: 'table:' + p,
    type: 'table',
    name: p.split('/').pop(),
    filePath: p,
    summary: meta.summary,
    tags: meta.tags,
    complexity: meta.complexity
  });

  const tables = (f.definitions || []).filter(d => d.kind === 'table');
  for (const t of tables) {
    const subId = 'table:' + p + ':' + t.name;
    const fieldList = (t.fields || []).slice(0, 4).join(', ');
    const more = t.fields && t.fields.length > 4 ? ', ...' : '';
    const summary = 'Table ' + t.name + ' defined in ' + p.split('/').pop() +
      (fieldList ? ' (key columns: ' + fieldList + more + ').' : '.');
    nodes.push({
      id: subId,
      type: 'table',
      name: t.name,
      filePath: p,
      lineRange: [t.startLine, t.endLine],
      summary,
      tags: ['database','table','schema-definition'],
      complexity: 'simple'
    });
    edges.push({
      source: 'table:' + p,
      target: subId,
      type: 'contains',
      direction: 'forward',
      weight: 1.0
    });
  }
}

// Self-check: every SQL file has empty importMap → 0 imports edges
const importEdges = edges.filter(e => e.type === 'imports').length;
if (importEdges !== 0) {
  console.error('IMPORT EDGE COUNT MISMATCH:', importEdges);
  process.exit(2);
}

const out = { nodes, edges };
fs.writeFileSync(
  'C:/Projects/CleanCopy/.understand-anything/intermediate/batch-44.json',
  JSON.stringify(out, null, 2)
);

const byType = {};
for (const n of nodes) byType[n.type] = (byType[n.type] || 0) + 1;
const edgesByType = {};
for (const e of edges) edgesByType[e.type] = (edgesByType[e.type] || 0) + 1;
console.log('nodes:', nodes.length, 'byType:', JSON.stringify(byType));
console.log('edges:', edges.length, 'byType:', JSON.stringify(edgesByType));
console.log('wrote batch-44.json');
