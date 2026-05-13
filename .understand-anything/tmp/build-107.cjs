const fs = require('fs');
const batches = require('C:/Projects/CleanCopy/.understand-anything/tmp/batches.json');
const b = batches[107];
const importMap = b.importMap;

const nodes = [];
const edges = [];

function fileNode(p, summary, tags, complexity, languageNotes) {
  const name = p.split('/').pop();
  const n = { id: 'file:' + p, type: 'file', name, filePath: p, summary, tags, complexity };
  if (languageNotes) n.languageNotes = languageNotes;
  nodes.push(n);
}
function fnNode(filePath, name, start, end, summary, tags, complexity) {
  nodes.push({ id: 'function:' + filePath + ':' + name, type: 'function', name, filePath, lineRange: [start, end], summary, tags, complexity });
  edges.push({ source: 'file:' + filePath, target: 'function:' + filePath + ':' + name, type: 'contains', direction: 'forward', weight: 1.0 });
  edges.push({ source: 'file:' + filePath, target: 'function:' + filePath + ':' + name, type: 'exports', direction: 'forward', weight: 0.8 });
}
function importEdges(src, targets) {
  for (const t of targets) {
    edges.push({ source: 'file:' + src, target: 'file:' + t, type: 'imports', direction: 'forward', weight: 0.7 });
  }
}

// 1. ModelManagement.tsx
fileNode('src/components/admin/dashboard/ModelManagement.tsx',
  'Admin dashboard panel for managing ML model training, evaluation, and promotion across versioned XGBoost virality predictors.',
  ['component', 'admin-dashboard', 'ml-ops', 'model-management', 'react'], 'complex');
fnNode('src/components/admin/dashboard/ModelManagement.tsx', 'ModelManagement', 116, 801,
  'Top-level React panel that lists model versions, kicks off training and eval runs, and surfaces promotion controls for the operations team.',
  ['component', 'model-management', 'admin', 'react'], 'complex');

// 2. OperationsPanel.tsx
fileNode('src/components/admin/dashboard/OperationsPanel.tsx',
  'Operations console showing active background tasks and historical runs with rerun controls for individual steps and subtasks.',
  ['component', 'admin-dashboard', 'operations', 'task-runner', 'react'], 'complex');
fnNode('src/components/admin/dashboard/OperationsPanel.tsx', 'OperationsPanel', 130, 428,
  'Container component that fetches active and historical tasks, renders rows, and orchestrates rerun actions.',
  ['component', 'task-runner', 'admin', 'react'], 'complex');
fnNode('src/components/admin/dashboard/OperationsPanel.tsx', 'ActiveTaskRow', 432, 471,
  'Row component rendering live status and progress for an active operations task.',
  ['component', 'task-row', 'status'], 'simple');
fnNode('src/components/admin/dashboard/OperationsPanel.tsx', 'HistoryTaskRow', 475, 599,
  'Expandable row rendering a historical task with subtask drill-down and rerun controls.',
  ['component', 'task-row', 'rerun', 'history'], 'moderate');

// 3. PlanningActionItemsPanel.tsx
fileNode('src/components/admin/dashboard/PlanningActionItemsPanel.tsx',
  'Compact planning panel showing actionable items, their checkbox states, and toggle handlers for upcoming admin work.',
  ['component', 'admin-dashboard', 'planning', 'checklist', 'react'], 'moderate');
fnNode('src/components/admin/dashboard/PlanningActionItemsPanel.tsx', 'PlanningActionItemsPanel', 37, 118,
  'Panel that lists planning action items with progress summary and per-item toggles.',
  ['component', 'planning', 'checklist'], 'moderate');
fnNode('src/components/admin/dashboard/PlanningActionItemsPanel.tsx', 'ActionItemRow', 120, 173,
  'Single row component for an action item with status badge and toggle handler.',
  ['component', 'row', 'toggle'], 'moderate');

// 4. PlatformHealthPanel.tsx
fileNode('src/components/admin/dashboard/PlatformHealthPanel.tsx',
  'Platform health panel rendering alert summary cards, alert tabs (active, history, snoozed), and individual alert action workflows.',
  ['component', 'admin-dashboard', 'alerts', 'health-monitoring', 'react'], 'complex');
fnNode('src/components/admin/dashboard/PlatformHealthPanel.tsx', 'payloadPreview', 85, 124,
  'Utility that formats an alert payload object as a short preview string for table cells.',
  ['utility', 'formatting', 'alert'], 'simple');
fnNode('src/components/admin/dashboard/PlatformHealthPanel.tsx', 'PlatformHealthPanel', 128, 462,
  'Container component that fetches platform alerts, manages tab state, and dispatches alert action handlers.',
  ['component', 'alerts', 'admin', 'react'], 'complex');
fnNode('src/components/admin/dashboard/PlatformHealthPanel.tsx', 'SummaryCard', 466, 491,
  'Small summary card for an alert category with loading state.',
  ['component', 'card', 'summary'], 'simple');
fnNode('src/components/admin/dashboard/PlatformHealthPanel.tsx', 'TabButton', 493, 523,
  'Tab button with selection state and badge count.',
  ['component', 'tab', 'button'], 'simple');
fnNode('src/components/admin/dashboard/PlatformHealthPanel.tsx', 'EmptyState', 525, 551,
  'Empty-state placeholder shown when no alerts match the current tab.',
  ['component', 'empty-state'], 'simple');
fnNode('src/components/admin/dashboard/PlatformHealthPanel.tsx', 'AlertCard', 553, 699,
  'Card rendering a single alert with action buttons, snooze, investigate, and busy/history states.',
  ['component', 'card', 'alert', 'actions'], 'complex');
importEdges('src/components/admin/dashboard/PlatformHealthPanel.tsx', importMap['src/components/admin/dashboard/PlatformHealthPanel.tsx']);

// 5. QuickAction.tsx
fileNode('src/components/admin/dashboard/QuickAction.tsx',
  'Reusable quick-action button components rendered as cards or rows for admin dashboard navigation.',
  ['component', 'admin-dashboard', 'quick-action', 'navigation', 'react'], 'moderate');
fnNode('src/components/admin/dashboard/QuickAction.tsx', 'QuickAction', 37, 93,
  'Card-shaped quick-action component with icon, label, optional badge, and external-link support.',
  ['component', 'quick-action', 'card'], 'moderate');
fnNode('src/components/admin/dashboard/QuickAction.tsx', 'QuickActionRow', 96, 124,
  'Compact row variant of the quick-action component for dense navigation lists.',
  ['component', 'quick-action', 'row'], 'simple');
importEdges('src/components/admin/dashboard/QuickAction.tsx', importMap['src/components/admin/dashboard/QuickAction.tsx']);

// 6. ScheduledActionsPanel.tsx
fileNode('src/components/admin/dashboard/ScheduledActionsPanel.tsx',
  'Panel listing scheduled platform actions with rescheduling, cancellation, and expand-to-detail controls.',
  ['component', 'admin-dashboard', 'scheduling', 'automation', 'react'], 'complex');
fnNode('src/components/admin/dashboard/ScheduledActionsPanel.tsx', 'ScheduledActionsPanel', 41, 198,
  'Container component that fetches scheduled actions and handles cancel and reschedule mutations.',
  ['component', 'scheduling', 'admin', 'react'], 'complex');
fnNode('src/components/admin/dashboard/ScheduledActionsPanel.tsx', 'ActionRow', 200, 316,
  'Expandable row for a scheduled action with controls for cancellation and rescheduling.',
  ['component', 'row', 'scheduling'], 'complex');

// 7. StatCard.tsx
fileNode('src/components/admin/dashboard/StatCard.tsx',
  'Reusable statistic card components (full and mini) for surfacing KPIs with optional trend indicators.',
  ['component', 'admin-dashboard', 'stat-card', 'metrics', 'react'], 'moderate');
fnNode('src/components/admin/dashboard/StatCard.tsx', 'StatCard', 39, 87,
  'Full-size statistic card with title, value, subtitle, icon, trend, and color theming.',
  ['component', 'card', 'stat'], 'moderate');
fnNode('src/components/admin/dashboard/StatCard.tsx', 'StatCardMini', 90, 113,
  'Mini variant of the statistic card for dense grids.',
  ['component', 'card', 'stat'], 'simple');
importEdges('src/components/admin/dashboard/StatCard.tsx', importMap['src/components/admin/dashboard/StatCard.tsx']);

// 8. TrainerExperiments.tsx
fileNode('src/components/admin/dashboard/TrainerExperiments.tsx',
  'Experiment tracking dashboard for training runs showing per-experiment configuration, status, and metric comparisons.',
  ['component', 'admin-dashboard', 'ml-training', 'experiments', 'react'], 'complex');
fnNode('src/components/admin/dashboard/TrainerExperiments.tsx', 'TrainerExperiments', 76, 671,
  'Top-level component that fetches training experiments and renders the experiment grid with filtering and comparison.',
  ['component', 'ml-training', 'experiments', 'admin'], 'complex');

// 9. UltraplanPanel.tsx
fileNode('src/components/admin/dashboard/UltraplanPanel.tsx',
  'Panel for the Ultraplan automated planning workflow showing live sessions, decision controls, and per-cap budget configuration.',
  ['component', 'admin-dashboard', 'ultraplan', 'automation', 'react'], 'complex');
fnNode('src/components/admin/dashboard/UltraplanPanel.tsx', 'UltraplanPanel', 87, 350,
  'Container component that fetches Ultraplan sessions and renders cap controls and session rows.',
  ['component', 'ultraplan', 'admin', 'react'], 'complex');
fnNode('src/components/admin/dashboard/UltraplanPanel.tsx', 'CapRow', 352, 387,
  'Slider row for adjusting one of the Ultraplan operational caps with min/max/step constraints.',
  ['component', 'cap', 'slider', 'config'], 'simple');
fnNode('src/components/admin/dashboard/UltraplanPanel.tsx', 'SessionRow', 389, 532,
  'Expandable row for an Ultraplan session with decision controls and live timing.',
  ['component', 'session', 'row', 'decision'], 'complex');

// 10. AIContentGenerator.tsx
fileNode('src/components/admin/marketing-studio/AIContentGenerator.tsx',
  'Marketing-studio panel that bundles competitor analysis, success-story, and feature-showcase generators with a tabbed UI.',
  ['component', 'marketing-studio', 'ai-content', 'admin', 'react'], 'complex');
fnNode('src/components/admin/marketing-studio/AIContentGenerator.tsx', 'CompetitorAnalysis', 21, 236,
  'Generator subcomponent that ingests competitor URLs and surfaces an AI-powered analysis result.',
  ['component', 'competitor-analysis', 'ai'], 'complex');
fnNode('src/components/admin/marketing-studio/AIContentGenerator.tsx', 'SuccessStoryGenerator', 242, 404,
  'Generator subcomponent that drafts success stories from a structured customer prompt.',
  ['component', 'success-story', 'ai'], 'complex');
fnNode('src/components/admin/marketing-studio/AIContentGenerator.tsx', 'FeatureShowcaseGenerator', 410, 558,
  'Generator subcomponent that produces feature showcase copy for marketing pages.',
  ['component', 'feature-showcase', 'ai'], 'complex');
fnNode('src/components/admin/marketing-studio/AIContentGenerator.tsx', 'AIContentGenerationPanel', 561, 585,
  'Wrapper panel that tabs between the three AI content generators.',
  ['component', 'panel', 'tabs'], 'simple');
importEdges('src/components/admin/marketing-studio/AIContentGenerator.tsx', importMap['src/components/admin/marketing-studio/AIContentGenerator.tsx']);

// 11. EnhancedCopyViralWinnerButton-simple.tsx
fileNode('src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton-simple.tsx',
  'Lightweight variant of the Copy Viral Winner marketing button that triggers viral template cloning without the full analytics integration.',
  ['component', 'marketing-studio', 'viral-template', 'admin', 'react'], 'moderate');
fnNode('src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton-simple.tsx', 'EnhancedCopyViralWinnerButtonSimple', 20, 189,
  'Simplified button component that copies the current viral winner template and notifies on success.',
  ['component', 'viral-template', 'copy'], 'moderate');
importEdges('src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton-simple.tsx', importMap['src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton-simple.tsx']);

// 12. EnhancedCopyViralWinnerButton.tsx
fileNode('src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton.tsx',
  'Full-featured Copy Viral Winner button with viral video analysis integration, progress steps, and template export.',
  ['component', 'marketing-studio', 'viral-analysis', 'admin', 'react'], 'complex');
fnNode('src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton.tsx', 'EnhancedCopyViralWinnerButton', 25, 405,
  'Button component that analyzes a viral video, surfaces multi-step progress, and creates a reusable template on completion.',
  ['component', 'viral-analysis', 'template'], 'complex');
importEdges('src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton.tsx', importMap['src/components/admin/marketing-studio/EnhancedCopyViralWinnerButton.tsx']);

// 13. EnhancedFeatureShowcaseGenerator.tsx
fileNode('src/components/admin/marketing-studio/EnhancedFeatureShowcaseGenerator.tsx',
  'Marketing-studio component for generating feature showcase content via the feature-showcase service with progress and preview UI.',
  ['component', 'marketing-studio', 'feature-showcase', 'ai', 'react'], 'complex');
fnNode('src/components/admin/marketing-studio/EnhancedFeatureShowcaseGenerator.tsx', 'EnhancedFeatureShowcaseGenerator', 31, 683,
  'Generator that drives the feature-showcase service to produce structured marketing copy with progress steps and a preview tab.',
  ['component', 'feature-showcase', 'ai'], 'complex');
importEdges('src/components/admin/marketing-studio/EnhancedFeatureShowcaseGenerator.tsx', importMap['src/components/admin/marketing-studio/EnhancedFeatureShowcaseGenerator.tsx']);

// 14. EnhancedMagicButtonPanel.tsx
fileNode('src/components/admin/marketing-studio/EnhancedMagicButtonPanel.tsx',
  'Composite panel that gathers the Enhanced Copy, Optimize, and Magic Buttons into a single tabbed marketing-studio workspace.',
  ['component', 'marketing-studio', 'panel', 'admin', 'react'], 'moderate');
fnNode('src/components/admin/marketing-studio/EnhancedMagicButtonPanel.tsx', 'EnhancedMagicButtonPanel', 18, 188,
  'Panel that arranges the marketing magic-button components into tabs and forwards template-creation callbacks.',
  ['component', 'panel', 'tabs'], 'moderate');
importEdges('src/components/admin/marketing-studio/EnhancedMagicButtonPanel.tsx', importMap['src/components/admin/marketing-studio/EnhancedMagicButtonPanel.tsx']);

// 15. EnhancedOptimizeForViralButton.tsx
fileNode('src/components/admin/marketing-studio/EnhancedOptimizeForViralButton.tsx',
  'Marketing-studio button that runs the viral optimization service against a draft script and surfaces multi-step improvements.',
  ['component', 'marketing-studio', 'viral-optimization', 'admin', 'react'], 'complex');
fnNode('src/components/admin/marketing-studio/EnhancedOptimizeForViralButton.tsx', 'EnhancedOptimizeForViralButton', 26, 586,
  'Button that triggers the viral optimization service, streams progress steps, and renders before/after comparisons.',
  ['component', 'viral-optimization', 'ai'], 'complex');
importEdges('src/components/admin/marketing-studio/EnhancedOptimizeForViralButton.tsx', importMap['src/components/admin/marketing-studio/EnhancedOptimizeForViralButton.tsx']);

// 16. EnhancedSuccessStoryGenerator.tsx
fileNode('src/components/admin/marketing-studio/EnhancedSuccessStoryGenerator.tsx',
  'Marketing-studio component for generating customer success stories via the success-story service with collapsible sections and progress UI.',
  ['component', 'marketing-studio', 'success-story', 'ai', 'react'], 'complex');
fnNode('src/components/admin/marketing-studio/EnhancedSuccessStoryGenerator.tsx', 'EnhancedSuccessStoryGenerator', 35, 672,
  'Generator that drives the success-story service to produce narrative copy with progress steps and tabbed preview.',
  ['component', 'success-story', 'ai'], 'complex');
importEdges('src/components/admin/marketing-studio/EnhancedSuccessStoryGenerator.tsx', importMap['src/components/admin/marketing-studio/EnhancedSuccessStoryGenerator.tsx']);

// 17. MagicButtons.tsx
fileNode('src/components/admin/marketing-studio/MagicButtons.tsx',
  'Library of presentational magic-button components (Copy Viral Winner, Optimize, Platform Optimize, Trendzo Marketing, Quick Action) used across the marketing studio.',
  ['component', 'marketing-studio', 'buttons', 'library', 'react'], 'complex');
fnNode('src/components/admin/marketing-studio/MagicButtons.tsx', 'CopyViralWinnerButton', 21, 106,
  'Presentational Copy Viral Winner button with gradient styling and external onClick handling.',
  ['component', 'button', 'viral'], 'moderate');
fnNode('src/components/admin/marketing-studio/MagicButtons.tsx', 'OptimizeForViralButton', 108, 189,
  'Presentational Optimize for Viral button with gradient styling.',
  ['component', 'button', 'optimize'], 'moderate');
fnNode('src/components/admin/marketing-studio/MagicButtons.tsx', 'PlatformOptimizeButton', 191, 253,
  'Presentational Platform Optimize button targeting platform-specific tuning.',
  ['component', 'button', 'platform'], 'moderate');
fnNode('src/components/admin/marketing-studio/MagicButtons.tsx', 'TrendzoMarketingButton', 255, 332,
  'Presentational Trendzo Marketing CTA button used in marketing surfaces.',
  ['component', 'button', 'marketing'], 'moderate');
fnNode('src/components/admin/marketing-studio/MagicButtons.tsx', 'QuickActionCard', 347, 398,
  'Quick-action card with gradient header, title, description, and icon.',
  ['component', 'card', 'quick-action'], 'moderate');
fnNode('src/components/admin/marketing-studio/MagicButtons.tsx', 'MagicButtonGroup', 335, 344,
  'Layout group that arranges the four magic buttons inline.',
  ['component', 'layout', 'group'], 'simple');
importEdges('src/components/admin/marketing-studio/MagicButtons.tsx', importMap['src/components/admin/marketing-studio/MagicButtons.tsx']);

// 18. ABTestInterface.tsx
fileNode('src/components/admin/viral-recipe-book/ABTestInterface.tsx',
  'A/B test configuration interface for viral recipe variants with event tracking, banner messaging, and multi-tab analytics.',
  ['component', 'viral-recipe-book', 'ab-testing', 'admin', 'react'], 'complex');
fnNode('src/components/admin/viral-recipe-book/ABTestInterface.tsx', 'ABTestInterface', 80, 747,
  'Main A/B test UI that sets up variants, fires AB events, listens to the banner bus, and renders results.',
  ['component', 'ab-testing', 'admin'], 'complex');
importEdges('src/components/admin/viral-recipe-book/ABTestInterface.tsx', importMap['src/components/admin/viral-recipe-book/ABTestInterface.tsx']);

// 19. AURATemplateCard.tsx
fileNode('src/components/admin/viral-recipe-book/AURATemplateCard.tsx',
  'AURA viral template card with hover effects, view/copy/generate actions, and CSS-module styling.',
  ['component', 'viral-recipe-book', 'template-card', 'admin', 'react'], 'moderate');
fnNode('src/components/admin/viral-recipe-book/AURATemplateCard.tsx', 'AURATemplateCard', 36, 173,
  'Single AURA template card with action handlers and click-to-open behavior.',
  ['component', 'card', 'template'], 'moderate');
importEdges('src/components/admin/viral-recipe-book/AURATemplateCard.tsx', importMap['src/components/admin/viral-recipe-book/AURATemplateCard.tsx']);

// 20. DraftsAnalyzer.tsx
fileNode('src/components/admin/viral-recipe-book/DraftsAnalyzer.tsx',
  'Draft analysis interface that scores marketing drafts, surfaces banner-bus warnings, and renders multi-tab recommendations.',
  ['component', 'viral-recipe-book', 'drafts-analysis', 'admin', 'react'], 'complex');
fnNode('src/components/admin/viral-recipe-book/DraftsAnalyzer.tsx', 'DraftsAnalyzer', 85, 645,
  'Top-level drafts analyzer that orchestrates scoring, renders progress, and reports completion via callback.',
  ['component', 'drafts-analysis', 'admin'], 'complex');
importEdges('src/components/admin/viral-recipe-book/DraftsAnalyzer.tsx', importMap['src/components/admin/viral-recipe-book/DraftsAnalyzer.tsx']);

// 21. InceptionMarketing.tsx
fileNode('src/components/admin/viral-recipe-book/InceptionMarketing.tsx',
  'Inception-style marketing content generator that layers concepts to produce multi-stage viral campaigns.',
  ['component', 'viral-recipe-book', 'inception-marketing', 'admin', 'react'], 'complex');
fnNode('src/components/admin/viral-recipe-book/InceptionMarketing.tsx', 'InceptionMarketing', 71, 728,
  'Component that layers nested marketing prompts, renders progress, and emits a final generated content payload.',
  ['component', 'inception-marketing', 'admin'], 'complex');
importEdges('src/components/admin/viral-recipe-book/InceptionMarketing.tsx', importMap['src/components/admin/viral-recipe-book/InceptionMarketing.tsx']);

// 22. OptimizationEngine.tsx
fileNode('src/components/admin/viral-recipe-book/OptimizationEngine.tsx',
  'Viral optimization engine UI with slider-controlled parameters that tunes the recipe pipeline for a selected video.',
  ['component', 'viral-recipe-book', 'optimization', 'admin', 'react'], 'complex');
fnNode('src/components/admin/viral-recipe-book/OptimizationEngine.tsx', 'OptimizationEngine', 84, 699,
  'Top-level optimizer that exposes tuning sliders, runs the pipeline, and notifies on completion.',
  ['component', 'optimization', 'admin'], 'complex');
importEdges('src/components/admin/viral-recipe-book/OptimizationEngine.tsx', importMap['src/components/admin/viral-recipe-book/OptimizationEngine.tsx']);

// 23. PredictionDashboard.tsx
fileNode('src/components/admin/viral-recipe-book/PredictionDashboard.tsx',
  'Prediction dashboard for the viral recipe book showing model output, validation triggers, and quality indicators.',
  ['component', 'viral-recipe-book', 'prediction-dashboard', 'admin', 'react'], 'complex');
fnNode('src/components/admin/viral-recipe-book/PredictionDashboard.tsx', 'PredictionDashboard', 66, 517,
  'Dashboard that renders prediction results and lets admins kick off validation runs.',
  ['component', 'prediction-dashboard', 'admin'], 'complex');
importEdges('src/components/admin/viral-recipe-book/PredictionDashboard.tsx', importMap['src/components/admin/viral-recipe-book/PredictionDashboard.tsx']);

// 24. TemplateGallery.tsx
fileNode('src/components/admin/viral-recipe-book/TemplateGallery.tsx',
  'Template gallery wiring the templates-discovery hook to AURA cards with modal capsule overlays and starter-set integration.',
  ['component', 'viral-recipe-book', 'template-gallery', 'admin', 'react'], 'complex');
fnNode('src/components/admin/viral-recipe-book/TemplateGallery.tsx', 'TemplateGallery', 177, 328,
  'Gallery component that pulls templates from the discovery store and renders selectable cards with starter-set filtering.',
  ['component', 'template-gallery', 'admin'], 'complex');
importEdges('src/components/admin/viral-recipe-book/TemplateGallery.tsx', importMap['src/components/admin/viral-recipe-book/TemplateGallery.tsx']);

// 25. TemplateModalCapsule.tsx
fileNode('src/components/admin/viral-recipe-book/TemplateModalCapsule.tsx',
  'Modal capsule overlay for viewing a single viral template via the morphing-dialog component, driven by the template capsule store.',
  ['component', 'viral-recipe-book', 'template-modal', 'admin', 'react'], 'moderate');
fnNode('src/components/admin/viral-recipe-book/TemplateModalCapsule.tsx', 'TemplateModalCapsule', 32, 147,
  'Modal capsule that opens against the template capsule store and renders a morphing dialog with tabs.',
  ['component', 'modal', 'template'], 'moderate');
importEdges('src/components/admin/viral-recipe-book/TemplateModalCapsule.tsx', importMap['src/components/admin/viral-recipe-book/TemplateModalCapsule.tsx']);

// Self-check
const importEdgeCount = edges.filter(e => e.type === 'imports').length;
console.log('nodes:', nodes.length, 'edges:', edges.length, 'imports:', importEdgeCount);

fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-107.json', JSON.stringify({ nodes, edges }, null, 2));
console.log('written');
