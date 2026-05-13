import fs from 'node:fs';

const r = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-108.json','utf8'));
const inp = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-analyzer-input-108.json','utf8'));
const importMap = inp.batchImportData;

const nodes = [];
const edges = [];

function complexity(lines){
  if(lines < 50) return 'simple';
  if(lines <= 200) return 'moderate';
  return 'complex';
}

const meta = {
  'src/components/admin/viral-recipe-book/TemplateViewer.tsx': {
    summary: 'Admin viewer for a viral recipe-book template, rendering structured prompts, examples, and metadata across tabbed sections.',
    tags: ['component','admin','viral-recipe','template-viewer','ui']
  },
  'src/components/admin/viral-recipe-book/ValidationSystem.tsx': {
    summary: 'Admin validation workflow for AURA viral templates with progress tracking, toast feedback, and rubric scoring controls.',
    tags: ['component','admin','validation','viral-recipe','workflow']
  },
  'src/components/admin/viral-recipe-book/AURATemplateCard.module.css': {
    summary: 'Scoped CSS Module styling the AURATemplateCard with custom gradients, hover states, and rarity tier visuals.',
    tags: ['css-module','styling','viral-recipe','admin','ui']
  },
  'src/components/admin/AdminHeader.tsx': {
    summary: 'Top header for the admin shell showing breadcrumbs, user menu, and impersonation indicator.',
    tags: ['component','admin','layout','header','navigation']
  },
  'src/components/admin/AdminSidebar.tsx': {
    summary: 'Composite admin sidebar that combines the IconSidebar (sections) and SectionSidebar (pages) for two-column navigation.',
    tags: ['component','admin','layout','sidebar','navigation']
  },
  'src/components/admin/AiBrainHistory.tsx': {
    summary: 'Renders historical conversation entries and run logs for the admin AI Brain interface.',
    tags: ['component','admin','ai-brain','history','ui']
  },
  'src/components/admin/AiBrainInterface.tsx': {
    summary: 'Main chat-style interface for the admin AI Brain assistant, wiring input, history, and visualizer panes.',
    tags: ['component','admin','ai-brain','chat','interface']
  },
  'src/components/admin/AiBrainVisualizer.tsx': {
    summary: 'Visualization panel that renders the AI Brain reasoning graph / activity stream alongside its chat surface.',
    tags: ['component','admin','ai-brain','visualization','ui']
  },
  'src/components/admin/BrainQuickAccess.tsx': {
    summary: 'Small quick-access launcher button that opens the floating brain chat from anywhere in the admin shell.',
    tags: ['component','admin','ai-brain','quick-access','ui']
  },
  'src/components/admin/ConversionFunnelVisualization.tsx': {
    summary: 'Large analytics surface visualizing the conversion funnel with stage charts, drop-off analysis, cohort retention, and optimization recommendations.',
    tags: ['component','admin','analytics','funnel','dashboard']
  },
  'src/components/admin/DataIngestionDashboard.tsx': {
    summary: 'Admin dashboard for monitoring data ingestion pipelines, job status, and source health metrics.',
    tags: ['component','admin','dashboard','ingestion','monitoring']
  },
  'src/components/admin/DebugDrawer.tsx': {
    summary: 'Slide-in drawer surfacing debug information, request logs, and dev-only tools inside the admin shell.',
    tags: ['component','admin','debug','drawer','dev-tools']
  },
  'src/components/admin/ETLJobStatus.tsx': {
    summary: 'Detailed status view for ETL jobs showing run history, duration, errors, and retry controls.',
    tags: ['component','admin','etl','job-status','monitoring']
  },
  'src/components/admin/FloatingBrainChat.tsx': {
    summary: 'Floating chat panel that hosts the AI Brain conversation overlaid on top of admin pages.',
    tags: ['component','admin','ai-brain','chat','floating']
  },
  'src/components/admin/FloatingBrainTrigger.tsx': {
    summary: 'Trivial floating button used to toggle visibility of the FloatingBrainChat panel.',
    tags: ['component','admin','ai-brain','trigger','ui']
  },
  'src/components/admin/GlobalSearch.tsx': {
    summary: 'Command-palette style global search across admin entities with keyboard shortcuts and a reusable hook.',
    tags: ['component','admin','search','command-palette','hook']
  },
  'src/components/admin/IconSidebar.tsx': {
    summary: 'Narrow icon-only navigation rail rendering the top-level admin sections from navigation-config.',
    tags: ['component','admin','sidebar','navigation','icons']
  },
  'src/components/admin/ImpersonationBanner.tsx': {
    summary: 'Top-of-screen banner shown when an admin is impersonating another user, with an exit-impersonation action.',
    tags: ['component','admin','impersonation','banner','security']
  },
  'src/components/admin/index.ts': {
    summary: 'Barrel module re-exporting the public admin component surface (sidebars, header, banner, navigation helpers).',
    tags: ['barrel','entry-point','admin','exports','module-index']
  },
  'src/components/admin/navigation-config.ts': {
    summary: 'Single source of truth for the admin navigation tree: defines sections, pages, role gates, and breadcrumb/section/page lookup helpers.',
    tags: ['config','admin','navigation','role-based','utility']
  },
  'src/components/admin/NotificationsDropdown.tsx': {
    summary: 'Admin notifications dropdown with toast renderer and a useNotifications hook for subscribing to notification state.',
    tags: ['component','admin','notifications','dropdown','hook']
  },
  'src/components/admin/RealtimeAnalyticsDashboard.tsx': {
    summary: 'Realtime analytics dashboard with metric cards, conversion funnel, attribution, viral predictions, and engagement timeline.',
    tags: ['component','admin','dashboard','realtime','analytics']
  },
  'src/components/admin/ScriptIntelligenceDashboard.tsx': {
    summary: 'Heavyweight dashboard for the Script Intelligence subsystem: scoring, comparisons, recommendations, and trend charts.',
    tags: ['component','admin','dashboard','script-intelligence','analytics']
  },
  'src/components/admin/SectionSidebar.tsx': {
    summary: 'Secondary sidebar that lists the pages within the currently active admin section, honoring role-based visibility.',
    tags: ['component','admin','sidebar','navigation','section']
  },
  'src/components/admin/SimilarTemplateCard.tsx': {
    summary: 'Compact card displaying a similar viral template with score, thumbnail, and quick-open action.',
    tags: ['component','admin','viral-recipe','template-card','ui']
  },
};

for (const x of r.results) {
  const m = meta[x.path] || { summary: 'Admin component file.', tags: ['component','admin','ui','tsx','react'] };
  nodes.push({
    id: 'file:' + x.path,
    type: 'file',
    name: x.path.split('/').pop(),
    filePath: x.path,
    summary: m.summary,
    tags: m.tags,
    complexity: complexity(x.nonEmptyLines || x.totalLines)
  });
}

const fnMeta = {
  'src/components/admin/ConversionFunnelVisualization.tsx': {
    ConversionFunnelVisualization: { s: 'Top-level dashboard component composing every funnel sub-chart, filters, and optimization panel.', t: ['component','dashboard','funnel','analytics','admin'] },
    FunnelVisualizationChart: { s: 'Renders the multi-stage funnel bar/area chart with optional period comparison overlay.', t: ['component','chart','funnel','visualization','admin'] },
    DropOffAnalysis: { s: 'Breaks down user drop-off rates between funnel stages.', t: ['component','analytics','drop-off','funnel','admin'] },
    StagePerformanceTrends: { s: 'Trend lines for performance metrics per funnel stage over time.', t: ['component','analytics','trends','funnel','admin'] },
    PlatformSegmentChart: { s: 'Segmented funnel comparison sliced by acquisition platform.', t: ['component','chart','segmentation','funnel','admin'] },
    InsightsList: { s: 'Renders a list of generated funnel insights with severity styling.', t: ['component','insights','funnel','admin','ui'] },
    OptimizationDashboard: { s: 'Optimization sub-dashboard with plan, recommendations, and impact analysis for the funnel.', t: ['component','optimization','funnel','dashboard','admin'] },
    AlertsList: { s: 'List of alert-level insights filtered out of the broader insights stream.', t: ['component','alerts','funnel','admin','ui'] },
    BenchmarkComparison: { s: 'Compares funnel metrics against benchmark targets, highlighting variance.', t: ['component','benchmark','funnel','analytics','admin'] }
  },
  'src/components/admin/GlobalSearch.tsx': {
    GlobalSearch: { s: 'Renders the global command-palette overlay with hotkey-driven search across admin entities.', t: ['component','search','command-palette','admin','overlay'] },
    useGlobalSearch: { s: 'Hook exposing open/close + query state for the global search overlay.', t: ['hook','search','admin','state','ui'] }
  },
  'src/components/admin/navigation-config.ts': {
    getSection: { s: 'Lookup helper returning a navigation section by id.', t: ['utility','navigation','lookup','admin','config'] },
    getCurrentSection: { s: 'Resolves which admin navigation section matches the given pathname.', t: ['utility','navigation','routing','admin','config'] },
    getCurrentPage: { s: 'Resolves which page within a section matches the given pathname.', t: ['utility','navigation','routing','admin','config'] },
    getBreadcrumbs: { s: 'Builds the breadcrumb trail for the given admin pathname.', t: ['utility','navigation','breadcrumbs','admin','config'] },
    filterNavigationByRole: { s: 'Filters the navigation tree down to entries the given user role is allowed to see.', t: ['utility','navigation','rbac','admin','config'] }
  },
  'src/components/admin/NotificationsDropdown.tsx': {
    NotificationsDropdown: { s: 'Header dropdown showing unread admin notifications with mark-as-read and clear actions.', t: ['component','notifications','admin','dropdown','ui'] },
    NotificationToast: { s: 'Toast-style renderer for a single notification, used when the dropdown is closed.', t: ['component','notifications','toast','admin','ui'] },
    useNotifications: { s: 'Hook returning live notification list, unread count, and mutation helpers.', t: ['hook','notifications','admin','state','realtime'] }
  },
  'src/components/admin/RealtimeAnalyticsDashboard.tsx': {
    RealtimeAnalyticsDashboard: { s: 'Top-level realtime analytics dashboard composing metric cards, charts, and prediction widgets.', t: ['component','dashboard','analytics','realtime','admin'] },
    MetricCard: { s: 'Reusable metric tile rendering title, value, trend indicator, and an icon.', t: ['component','metric','card','ui','admin'] },
    ConversionFunnelChart: { s: 'Compact funnel chart used inside the realtime dashboard.', t: ['component','chart','funnel','realtime','admin'] },
    AttributionChart: { s: 'Renders attribution channels and their contribution percentages.', t: ['component','chart','attribution','analytics','admin'] },
    ViralPredictionInsights: { s: 'Surfaces top viral predictions returned by the prediction pipeline.', t: ['component','viral','prediction','insights','admin'] },
    TrendingTemplatesList: { s: 'List of trending templates ranked by realtime engagement metrics.', t: ['component','templates','trending','analytics','admin'] },
    PlatformPerformanceChart: { s: 'Per-platform performance chart for the realtime dashboard.', t: ['component','chart','platform','realtime','admin'] },
    EngagementTimelineChart: { s: 'Time-series engagement chart across the rolling realtime window.', t: ['component','chart','engagement','timeline','admin'] }
  }
};

const defaultSummaries = {
  AdminHeader: 'Top header for the admin shell with breadcrumbs and user menu.',
  AdminSidebar: 'Composite sidebar combining icon rail and section pages.',
  AiBrainHistory: 'Renders chat / run history for the AI Brain assistant.',
  AiBrainInterface: 'Main interactive interface for the AI Brain assistant.',
  AiBrainVisualizer: 'Visualizer pane for AI Brain reasoning / activity.',
  BrainQuickAccess: 'Quick-access launcher button for the floating brain chat.',
  DataIngestionDashboard: 'Dashboard component for monitoring data ingestion sources.',
  DebugDrawer: 'Slide-in debug drawer with logs and dev tools.',
  ETLJobStatus: 'Status panel for an ETL job including run history and errors.',
  FloatingBrainChat: 'Floating overlay chat panel for the AI Brain.',
  FloatingBrainTrigger: 'Floating button toggling the FloatingBrainChat panel.',
  IconSidebar: 'Icon-only rail of top-level admin navigation sections.',
  ImpersonationBanner: 'Banner shown while an admin is impersonating another user.',
  ScriptIntelligenceDashboard: 'Dashboard for the Script Intelligence subsystem with scoring and trends.',
  SectionSidebar: 'Secondary sidebar listing pages within the active admin section.',
  SimilarTemplateCard: 'Card displaying a similar viral template with a similarity score.',
  TemplateViewer: 'Admin viewer for a viral recipe template across structured tabs.',
  ValidationSystem: 'Admin validation workflow component for AURA templates.'
};

function isExported(file, fname) {
  return (file.exports || []).some(e => e.name === fname);
}

for (const x of r.results) {
  const filePath = x.path;
  const fns = x.functions || [];
  for (const f of fns) {
    const lines = f.endLine - f.startLine + 1;
    const exported = isExported(x, f.name);
    if (lines < 10 && !exported) continue;
    const fm = (fnMeta[filePath] || {})[f.name];
    let summary, tags;
    if (fm) { summary = fm.s; tags = fm.t; }
    else {
      summary = defaultSummaries[f.name] || ('React component / function exported from ' + filePath.split('/').pop() + '.');
      tags = ['component','admin','react','tsx','ui'];
    }
    nodes.push({
      id: 'function:' + filePath + ':' + f.name,
      type: 'function',
      name: f.name,
      filePath: filePath,
      lineRange: [f.startLine, f.endLine],
      summary: summary,
      tags: tags,
      complexity: lines < 30 ? 'simple' : (lines < 150 ? 'moderate' : 'complex')
    });
    edges.push({ source: 'file:' + filePath, target: 'function:' + filePath + ':' + f.name, type: 'contains', direction: 'forward', weight: 1.0 });
    if (exported) {
      edges.push({ source: 'file:' + filePath, target: 'function:' + filePath + ':' + f.name, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }
}

for (const file of inp.batchFiles) {
  const arr = importMap[file.path] || [];
  for (const target of arr) {
    edges.push({ source: 'file:' + file.path, target: 'file:' + target, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-108.json', JSON.stringify(out, null, 2));

console.log('Nodes:', nodes.length);
console.log('  file nodes:', nodes.filter(n => n.type === 'file').length);
console.log('  function nodes:', nodes.filter(n => n.type === 'function').length);
console.log('Edges:', edges.length);
console.log('  imports:', edges.filter(e => e.type === 'imports').length);
console.log('  contains:', edges.filter(e => e.type === 'contains').length);
console.log('  exports:', edges.filter(e => e.type === 'exports').length);
