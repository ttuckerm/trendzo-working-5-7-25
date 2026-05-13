import fs from 'fs';

const extract = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-extract-results-113.json','utf8'));
const input   = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/ua-file-analyzer-input-113.json','utf8'));

const fileMeta = {
  'src/components/control-center/StatusDot.tsx': {
    summary: 'Status indicator UI primitives (StatusDot and StatusBadge) used across the Control Center to render health/status pills bound to shared control-center constants and types.',
    tags: ['component','ui','status-indicator','control-center'],
    complexity: 'moderate',
    functions: {
      StatusDot:   { summary: 'Renders a small animated status dot with optional pulse and label using shared status constants.', tags: ['component','ui','status-indicator'] },
      StatusBadge: { summary: 'Renders a colored badge pill for a given status using control-center constants and types.', tags: ['component','ui','badge'] }
    }
  },
  'src/components/creator/CreatorAttributionModal.tsx': {
    summary: 'Modal that lets a creator attribute a template to the original platform creator, with per-platform attribution templates (comment, story, post, DM) and scheduled posting.',
    tags: ['component','modal','creator-attribution','social-platforms'],
    complexity: 'complex',
    functions: {
      CreatorAttributionModal: { summary: 'Default-exported modal component for selecting an attribution type and customizing or scheduling an attribution message per platform.', tags: ['component','modal','creator-attribution'] }
    }
  },
  'src/components/dashboard/Achievements.tsx': {
    summary: 'Dashboard widget that renders a list of user achievements and badges with progress indicators.',
    tags: ['component','dashboard','achievements','ui'],
    complexity: 'moderate',
    functions: {
      Achievements: { summary: 'Renders the achievements panel showing earned badges and progress toward unearned ones.', tags: ['component','dashboard','achievements'] }
    }
  },
  'src/components/dashboard/DashboardCharts.tsx': {
    summary: 'Lightweight chart wrapper used on the dashboard to render aggregate metrics.',
    tags: ['component','dashboard','charts','visualization'],
    complexity: 'moderate',
    functions: {
      DashboardCharts: { summary: 'Renders a set of dashboard charts using the project chart library.', tags: ['component','dashboard','charts'] }
    }
  },
  'src/components/dashboard/DashboardHeader.tsx': {
    summary: 'Top header bar for the dashboard with title, notifications hook-in, and confetti trigger.',
    tags: ['component','dashboard','header','ui'],
    complexity: 'simple',
    functions: {
      DashboardHeader: { summary: 'Renders the dashboard header and wires up notifications and confetti hooks for ambient feedback.', tags: ['component','dashboard','header'] }
    }
  },
  'src/components/dashboard/EnhancedDashboard.tsx': {
    summary: 'Large flagship dashboard view aggregating metrics, recent templates, activity feed, and sound analytics tabs with expandable sections and animated transitions.',
    tags: ['component','dashboard','analytics','aggregator'],
    complexity: 'complex',
    functions: {
      EnhancedDashboard: { summary: 'Top-level dashboard component rendering primary and secondary metrics, recent templates, activity feed, and sound analytics inside animated tabs.', tags: ['component','dashboard','aggregator'] }
    }
  },
  'src/components/dashboard/FloatingActionButton.tsx': {
    summary: 'Floating action button for the dashboard that fires a confetti notification on click.',
    tags: ['component','dashboard','fab','ui'],
    complexity: 'simple',
    functions: {
      FloatingActionButton: { summary: 'Renders a floating circular action button that triggers confetti and a notification.', tags: ['component','dashboard','fab'] }
    }
  },
  'src/components/dashboard/ImpactScore.tsx': {
    summary: 'Visualizes the user impact score with breakdown rings and progress segments on the dashboard.',
    tags: ['component','dashboard','score','visualization'],
    complexity: 'moderate',
    functions: {
      ImpactScore: { summary: 'Renders the dashboard impact-score widget with animated segments and total score.', tags: ['component','dashboard','score'] }
    }
  },
  'src/components/dashboard/NotificationProvider.tsx': {
    summary: 'React context provider and useNotification hook supplying toast and notification state to dashboard widgets.',
    tags: ['component','context','notification','provider'],
    complexity: 'moderate',
    functions: {
      useNotification:      { summary: 'Hook that reads NotificationContext and exposes the notification API to consumers.', tags: ['hook','context','notification'] },
      NotificationProvider: { summary: 'Context provider that holds notification state and exposes show and hide actions to children.', tags: ['component','context','provider'] }
    }
  },
  'src/components/dashboard/ProgressJourney.tsx': {
    summary: 'Dashboard timeline showing the user progress journey and milestones, with notification and confetti integration when milestones complete.',
    tags: ['component','dashboard','progress','timeline'],
    complexity: 'moderate',
    functions: {
      ProgressJourney: { summary: 'Renders a milestone timeline of the user progress journey and celebrates completed steps.', tags: ['component','dashboard','progress'] }
    }
  },
  'src/components/dashboard/QuickActions.tsx': {
    summary: 'Grid of quick action cards on the dashboard wired up to the notification provider.',
    tags: ['component','dashboard','quick-actions','ui'],
    complexity: 'moderate',
    functions: {
      QuickActions: { summary: 'Renders the dashboard Quick Actions grid and fires notifications on action invocation.', tags: ['component','dashboard','quick-actions'] }
    }
  },
  'src/components/dashboard/QuickStartVideo.tsx': {
    summary: 'Onboarding quick-start video tile with metric circles, progress indicators, and confetti feedback when users complete steps.',
    tags: ['component','dashboard','onboarding','video'],
    complexity: 'complex',
    functions: {
      QuickStartVideo: { summary: 'Renders the quick-start video card with metric breakdown and onboarding milestones.', tags: ['component','dashboard','onboarding'] },
      MetricCircle:    { summary: 'Internal helper rendering a single animated metric circle for the quick-start tile.', tags: ['component','ui','metric'] }
    }
  },
  'src/components/dashboard/SoundAnalyticsDashboard.tsx': {
    summary: 'Default-exported dashboard view for sound analytics with tabbed cards summarizing trending sounds.',
    tags: ['component','dashboard','analytics','sound'],
    complexity: 'moderate',
    functions: {
      SoundAnalyticsDashboard: { summary: 'Renders the sound analytics dashboard with tabs for different sound metric breakdowns.', tags: ['component','dashboard','sound-analytics'] }
    }
  },
  'src/components/dashboard/SoundCategoryDashboard.tsx': {
    summary: 'Large sound category analytics dashboard with pie, bar, and line charts plus trending categories and a time-series view powered by Recharts.',
    tags: ['component','dashboard','analytics','sound','charts'],
    complexity: 'complex',
    functions: {
      SoundCategoryDashboard: { summary: 'Default-exported analytics dashboard that fetches category distribution, trending, and time-series data and renders interactive Recharts visualizations.', tags: ['component','dashboard','analytics','charts'] },
      PieChartLabel:          { summary: 'Custom Recharts pie-slice label renderer that positions percentage text inside each slice.', tags: ['component','charts','recharts','label'] },
      CustomTooltip:          { summary: 'Custom Recharts tooltip renderer for the sound-category chart with branded styling.', tags: ['component','charts','recharts','tooltip'] }
    }
  },
  'src/components/dashboard/Starfield.tsx': {
    summary: 'Ambient animated starfield background used as decorative canvas behind dashboard hero sections.',
    tags: ['component','ui','background','animation'],
    complexity: 'moderate',
    functions: {
      Starfield: { summary: 'Renders an animated canvas starfield using requestAnimationFrame.', tags: ['component','ui','animation'] }
    }
  },
  'src/components/dashboard/StatCard.tsx': {
    summary: 'Reusable stat card used across the dashboard to display a single metric, trend, and contextual icon.',
    tags: ['component','dashboard','stat-card','ui'],
    complexity: 'moderate',
    functions: {
      StatCard: { summary: 'Default-exported dashboard stat card rendering a metric value, trend indicator, and decorative icon.', tags: ['component','dashboard','stat-card'] }
    }
  },
  'src/components/dashboard/TrendPredictionNotifications.tsx': {
    summary: 'Notifications panel listing predicted trends (including expert-verified) with mock data fallback in development and live fetch in production.',
    tags: ['component','dashboard','notifications','trend-prediction'],
    complexity: 'complex',
    functions: {
      TrendPredictionNotifications: { summary: 'Fetches and renders the trend-prediction notification feed with mock fallback in development.', tags: ['component','dashboard','notifications'] },
      getMockNotifications:         { summary: 'Returns a mocked TrendPredictionNotification array for local development.', tags: ['mock','fixture','notifications'] }
    }
  },
  'src/components/dashboard/UpgradePlanAlert.tsx': {
    summary: 'Dashboard alert card prompting the user to upgrade their plan, with CTA buttons and dismiss state.',
    tags: ['component','dashboard','upgrade','alert'],
    complexity: 'moderate',
    functions: {
      UpgradePlanAlert: { summary: 'Renders the upgrade-plan alert card on the dashboard with primary and secondary CTAs.', tags: ['component','dashboard','upgrade-cta'] }
    }
  },
  'src/components/debug/ErrorBoundary.tsx': {
    summary: 'Enhanced React class-based error boundary with infinite-loop detection, custom fallback, reset-key support, and optional home button.',
    tags: ['component','error-boundary','debug','resilience'],
    complexity: 'complex',
    classes: {
      ErrorBoundary: { summary: 'React class component that catches child render errors, tracks error frequency to detect potential infinite loops, and renders a fallback UI with retry and home actions.', tags: ['component','error-boundary','resilience'] }
    }
  },
  'src/components/debug/RenderCounter.tsx': {
    summary: 'Developer-only widget that overlays render counts on a component to diagnose excessive re-renders.',
    tags: ['component','debug','dev-tool','performance'],
    complexity: 'moderate',
    functions: {
      RenderCounter: { summary: 'Tracks and displays render count for a wrapped component to help diagnose re-render issues in development.', tags: ['component','debug','dev-tool'] }
    }
  },
  'src/components/development/StagewiseToolbarWrapper.tsx': {
    summary: 'Thin client-only wrapper that renders the Stagewise dev toolbar when in development.',
    tags: ['component','dev-tool','wrapper','development'],
    complexity: 'simple',
    functions: {
      StagewiseToolbarWrapper: { summary: 'Default-exported wrapper component that conditionally mounts the Stagewise toolbar in development environments.', tags: ['component','dev-tool','wrapper'] }
    }
  },
  'src/components/dock/Dock.tsx': {
    summary: 'macOS-style dock UI bound to the windowStore for switching and restoring open in-app windows.',
    tags: ['component','dock','ui','window-management'],
    complexity: 'moderate',
    functions: {
      Dock: { summary: 'Renders the floating window-management dock backed by the windowStore.', tags: ['component','dock','window-management'] }
    }
  },
  'src/components/editor/BeatSyncController.tsx': {
    summary: 'Controller widget for the template editor that triggers beat detection and exposes sync and clear controls through useBeatSyncAnimation and AudioContext.',
    tags: ['component','editor','beat-sync','audio'],
    complexity: 'complex',
    functions: {
      BeatSyncController: { summary: 'Editor-side controller that drives beat-detection sync points, surfaces sync status, and exposes regenerate and clear controls to the user.', tags: ['component','editor','beat-sync'] }
    }
  },
  'src/components/editor/BeatSyncTester.tsx': {
    summary: 'Developer-facing test harness for beat sync that wires BeatSyncController, AudioContext, EditorContext, and the simple beat detector together.',
    tags: ['component','editor','beat-sync','test-harness'],
    complexity: 'complex',
    functions: {
      BeatSyncTester: { summary: 'Test and diagnostic component combining BeatSyncController with simple beat detection to verify sync behavior in the editor.', tags: ['component','editor','test-harness'] }
    }
  },
  'src/components/editor/EditorContainer.tsx': {
    summary: 'Top-level container for the template editor that wires EditorToolbar, TemplateCanvas, EditorSidebar, and EditorTimeline together and handles loading and error states.',
    tags: ['component','editor','container','layout'],
    complexity: 'complex',
    functions: {
      EditorContainer: { summary: 'Main editor container that loads templates from EditorContext, manages loading, error, and onboarding state, and composes the editor sub-components.', tags: ['component','editor','container'] }
    }
  }
};

function basename(p){ return p.split('/').pop(); }

const nodes = [];
const edges = [];

for (const f of extract.results) {
  const meta = fileMeta[f.path];
  if (!meta) { console.error('NO META for', f.path); process.exit(1); }
  const fileId = 'file:' + f.path;
  nodes.push({
    id: fileId,
    type: 'file',
    name: basename(f.path),
    filePath: f.path,
    summary: meta.summary,
    tags: meta.tags,
    complexity: meta.complexity
  });

  for (const fn of (f.functions || [])) {
    const lines = fn.endLine - fn.startLine + 1;
    const exported = (f.exports || []).some(x => x.name === fn.name);
    if (lines < 10 && !exported) continue;
    const fnMeta = (meta.functions && meta.functions[fn.name]);
    if (!fnMeta) { console.error('NO FN META for', f.path, fn.name); process.exit(1); }
    const id = 'function:' + f.path + ':' + fn.name;
    nodes.push({
      id,
      type: 'function',
      name: fn.name,
      filePath: f.path,
      lineRange: [fn.startLine, fn.endLine],
      summary: fnMeta.summary,
      tags: fnMeta.tags,
      complexity: lines > 150 ? 'complex' : (lines > 40 ? 'moderate' : 'simple')
    });
    edges.push({ source: fileId, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    if (exported) {
      edges.push({ source: fileId, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }

  for (const cl of (f.classes || [])) {
    const lines = cl.endLine - cl.startLine + 1;
    const methodCount = (cl.methods || []).length;
    const exported = (f.exports || []).some(x => x.name === cl.name);
    if (methodCount < 2 && lines < 20 && !exported) continue;
    const clMeta = (meta.classes && meta.classes[cl.name]);
    if (!clMeta) { console.error('NO CL META for', f.path, cl.name); process.exit(1); }
    const id = 'class:' + f.path + ':' + cl.name;
    nodes.push({
      id,
      type: 'class',
      name: cl.name,
      filePath: f.path,
      lineRange: [cl.startLine, cl.endLine],
      summary: clMeta.summary,
      tags: clMeta.tags,
      complexity: lines > 150 ? 'complex' : (lines > 40 ? 'moderate' : 'simple')
    });
    edges.push({ source: fileId, target: id, type: 'contains', direction: 'forward', weight: 1.0 });
    if (exported) {
      edges.push({ source: fileId, target: id, type: 'exports', direction: 'forward', weight: 0.8 });
    }
  }

  const imports = input.batchImportData[f.path] || [];
  for (const tgt of imports) {
    edges.push({
      source: fileId,
      target: 'file:' + tgt,
      type: 'imports',
      direction: 'forward',
      weight: 0.7
    });
  }
}

let expectedImports = 0;
for (const f of extract.results) {
  expectedImports += (input.batchImportData[f.path] || []).length;
}
const actualImports = edges.filter(e => e.type === 'imports').length;
console.log('Expected imports:', expectedImports, 'Actual:', actualImports);
if (expectedImports !== actualImports) { console.error('IMPORT COUNT MISMATCH'); process.exit(1); }

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-113.json', JSON.stringify(out, null, 2));

const byType = {};
for (const n of nodes) byType[n.type] = (byType[n.type]||0) + 1;
const byEtype = {};
for (const e of edges) byEtype[e.type] = (byEtype[e.type]||0) + 1;

console.log('Nodes total:', nodes.length, '|', JSON.stringify(byType));
console.log('Edges total:', edges.length, '|', JSON.stringify(byEtype));
