import fs from 'fs';

const batches = JSON.parse(fs.readFileSync('C:/Projects/CleanCopy/.understand-anything/tmp/batches.json', 'utf8'));
const entry = batches[111];
const importMap = entry.importMap;

const nodes = [];
const edges = [];

const fileNodes = [
  {
    id: 'file:src/components/audiovisual/WaveformVisualizer.tsx',
    type: 'file',
    name: 'WaveformVisualizer.tsx',
    filePath: 'src/components/audiovisual/WaveformVisualizer.tsx',
    summary: 'Canvas-based waveform visualizer for TikTok sound previews; draws audio amplitude bars with playback progress indicator and click-to-seek via AudioVisualContext.',
    tags: ['component', 'visualization', 'audio', 'canvas-rendering'],
    complexity: 'complex'
  },
  {
    id: 'document:src/components/audiovisual/README.md',
    type: 'document',
    name: 'README.md',
    filePath: 'src/components/audiovisual/README.md',
    summary: 'Documents the Audio-Visual Experience Framework components (AudioVisualSynchronizer, WaveformVisualizer, etc.) with usage examples and integration patterns.',
    tags: ['documentation', 'audio', 'component-guide'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/audio/AudioButton.tsx',
    type: 'file',
    name: 'AudioButton.tsx',
    filePath: 'src/components/audio/AudioButton.tsx',
    summary: 'Reusable audio play/pause button component with optional waveform progress, multiple size/variant presets and integration with the global AudioContext.',
    tags: ['component', 'audio', 'ui-control'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/EditorSoundPanel.tsx',
    type: 'file',
    name: 'EditorSoundPanel.tsx',
    filePath: 'src/components/audio/EditorSoundPanel.tsx',
    summary: 'Template editor side panel for browsing, selecting, trimming and adjusting volume of sounds attached to a template via useTemplateSound and AudioContext.',
    tags: ['component', 'editor', 'audio', 'template'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/FullPlayer.tsx',
    type: 'file',
    name: 'FullPlayer.tsx',
    filePath: 'src/components/audio/FullPlayer.tsx',
    summary: 'Expanded global audio player UI with playback controls, queue list, tabs for collections and detailed sound metadata; consumes AudioContext and useSoundCollection.',
    tags: ['component', 'audio', 'player', 'ui'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/GlobalAudioPlayer.tsx',
    type: 'file',
    name: 'GlobalAudioPlayer.tsx',
    filePath: 'src/components/audio/GlobalAudioPlayer.tsx',
    summary: 'Standalone persistent global audio player widget rendering compact controls, draggable position and seek slider; manages its own HTMLAudioElement and state.',
    tags: ['component', 'audio', 'player', 'global-ui'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/InlinePlayer.tsx',
    type: 'file',
    name: 'InlinePlayer.tsx',
    filePath: 'src/components/audio/InlinePlayer.tsx',
    summary: 'Compact inline play/pause control bound to a single sound via useSound, with optional title/artist display for use inside cards and lists.',
    tags: ['component', 'audio', 'inline-player'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/audio/MiniPlayer.tsx',
    type: 'file',
    name: 'MiniPlayer.tsx',
    filePath: 'src/components/audio/MiniPlayer.tsx',
    summary: 'Compact bottom-bar mini player that exposes play/pause, prev/next, mute and volume controls wired to the global AudioContext.',
    tags: ['component', 'audio', 'player', 'mini'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/audio/SoundAnalyticsCard.tsx',
    type: 'file',
    name: 'SoundAnalyticsCard.tsx',
    filePath: 'src/components/audio/SoundAnalyticsCard.tsx',
    summary: 'Card that displays detailed analytics for a single TikTok sound (usage, growth, engagement) with an embedded InlinePlayer and trend badges.',
    tags: ['component', 'analytics', 'audio', 'card'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/SoundBrowser.tsx',
    type: 'file',
    name: 'SoundBrowser.tsx',
    filePath: 'src/components/audio/SoundBrowser.tsx',
    summary: 'Tabbed browser UI for discovering trending, recommended and personal sounds with search, filters and a SoundCard grid; preview playback through AudioContext.',
    tags: ['component', 'audio', 'browser', 'discovery'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/SoundBrowserModal.tsx',
    type: 'file',
    name: 'SoundBrowserModal.tsx',
    filePath: 'src/components/audio/SoundBrowserModal.tsx',
    summary: 'Dialog-based sound picker that lets users search and preview sounds via InlinePlayer and confirm a selection back to the caller.',
    tags: ['component', 'audio', 'modal', 'picker'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/SoundButton.tsx',
    type: 'file',
    name: 'SoundButton.tsx',
    filePath: 'src/components/audio/SoundButton.tsx',
    summary: 'Play/pause toggle button for a single Sound entity using the useSound hook, with optional duration and waveform progress display.',
    tags: ['component', 'audio', 'ui-control'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/SoundCard.tsx',
    type: 'file',
    name: 'SoundCard.tsx',
    filePath: 'src/components/audio/SoundCard.tsx',
    summary: 'Card surface for a TikTok sound with cover art, metadata, play toggle and select action; integrates with the global AudioContext for preview.',
    tags: ['component', 'audio', 'card'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/audio/SoundSelector.tsx',
    type: 'file',
    name: 'SoundSelector.tsx',
    filePath: 'src/components/audio/SoundSelector.tsx',
    summary: 'Field-style sound selector that shows the currently chosen sound and opens SoundBrowserModal to pick a new one, with an InlinePlayer preview.',
    tags: ['component', 'audio', 'selector'],
    complexity: 'moderate'
  },
  {
    id: 'document:src/components/audio/README.md',
    type: 'document',
    name: 'README.md',
    filePath: 'src/components/audio/README.md',
    summary: 'Documents the Global Audio Controller subsystem describing AudioContext, GlobalAudioPlayer, MiniPlayer and FullPlayer integration.',
    tags: ['documentation', 'audio', 'architecture'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/auth/ProtectedRoute.tsx',
    type: 'file',
    name: 'ProtectedRoute.tsx',
    filePath: 'src/components/auth/ProtectedRoute.tsx',
    summary: 'Client-side guard component that redirects unauthenticated users to /login (or another configured route) using the Supabase auth context.',
    tags: ['component', 'auth', 'route-guard'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/backgrounds/InteractiveGridPattern.tsx',
    type: 'file',
    name: 'InteractiveGridPattern.tsx',
    filePath: 'src/components/backgrounds/InteractiveGridPattern.tsx',
    summary: 'SVG grid background that highlights individual cells on hover for use as a decorative interactive backdrop.',
    tags: ['component', 'background', 'visualization'],
    complexity: 'simple'
  },
  {
    id: 'file:src/components/canvas/Canvas.tsx',
    type: 'file',
    name: 'Canvas.tsx',
    filePath: 'src/components/canvas/Canvas.tsx',
    summary: 'Minimal CanvasRoot wrapper that renders the workspace canvas grid container used by the desktop-style template UI.',
    tags: ['component', 'canvas', 'layout'],
    complexity: 'simple'
  },
  {
    id: 'file:src/components/canvas/CanvasOverlay.tsx',
    type: 'file',
    name: 'CanvasOverlay.tsx',
    filePath: 'src/components/canvas/CanvasOverlay.tsx',
    summary: 'Top-level canvas workspace orchestrating the top bar, right tool strip, window manager and TemplateMiniUI provider; wires URL state, sound feedback and debug stress controls.',
    tags: ['component', 'canvas', 'workspace', 'orchestrator'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/canvas/CanvasPortal.tsx',
    type: 'file',
    name: 'CanvasPortal.tsx',
    filePath: 'src/components/canvas/CanvasPortal.tsx',
    summary: 'React portal helper that renders canvas overlays into a dedicated DOM container outside the normal layout tree.',
    tags: ['component', 'canvas', 'portal'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/cards/TrendzoCard.tsx',
    type: 'file',
    name: 'TrendzoCard.tsx',
    filePath: 'src/components/cards/TrendzoCard.tsx',
    summary: 'Large multi-variant Trendzo card component rendering creator scorecards, niche labels, score colors and quick action menus across the dashboard.',
    tags: ['component', 'card', 'dashboard', 'trendzo'],
    complexity: 'complex'
  },
  {
    id: 'file:src/components/clay/ActionConfirmationCard.tsx',
    type: 'file',
    name: 'ActionConfirmationCard.tsx',
    filePath: 'src/components/clay/ActionConfirmationCard.tsx',
    summary: 'Clay-themed confirmation card prompting the operator to approve or reject a proposed agent action with summary fields and Confirm/Cancel buttons.',
    tags: ['component', 'clay', 'confirmation', 'agent'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/clay/AgencyScorecardCard.tsx',
    type: 'file',
    name: 'AgencyScorecardCard.tsx',
    filePath: 'src/components/clay/AgencyScorecardCard.tsx',
    summary: 'Clay-themed scorecard summarizing an agency KPIs (briefs, posts, performance) for display inside the assistant chat surface.',
    tags: ['component', 'clay', 'scorecard', 'agency'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/clay/CalendarSnippetCard.tsx',
    type: 'file',
    name: 'CalendarSnippetCard.tsx',
    filePath: 'src/components/clay/CalendarSnippetCard.tsx',
    summary: 'Clay-themed compact card showing upcoming content calendar items (date, title, platform) for the chat-driven planner.',
    tags: ['component', 'clay', 'calendar', 'snippet'],
    complexity: 'moderate'
  },
  {
    id: 'file:src/components/clay/ContentBriefCard.tsx',
    type: 'file',
    name: 'ContentBriefCard.tsx',
    filePath: 'src/components/clay/ContentBriefCard.tsx',
    summary: 'Clay-themed content brief card displaying brief metadata, predicted VPS color-coded status and action buttons surfaced inside agent chat.',
    tags: ['component', 'clay', 'brief', 'agent'],
    complexity: 'complex'
  }
];

nodes.push(...fileNodes);

const fnNodes = [
  { id: 'function:src/components/audiovisual/WaveformVisualizer.tsx:WaveformVisualizer', name: 'WaveformVisualizer', filePath: 'src/components/audiovisual/WaveformVisualizer.tsx', lineRange: [34, 254], summary: 'React component that renders an interactive HTML5 canvas waveform synced with AudioVisualContext playback state.', tags: ['component', 'visualization', 'canvas-rendering'], complexity: 'complex' },
  { id: 'function:src/components/audiovisual/WaveformVisualizer.tsx:sampleAudioData', name: 'sampleAudioData', filePath: 'src/components/audiovisual/WaveformVisualizer.tsx', lineRange: [257, 284], summary: 'Helper that downsamples an audio buffer into a fixed-length amplitude array for waveform rendering.', tags: ['utility', 'audio', 'sampling'], complexity: 'simple' },
  { id: 'function:src/components/audio/AudioButton.tsx:AudioButton', name: 'AudioButton', filePath: 'src/components/audio/AudioButton.tsx', lineRange: [29, 308], summary: 'Audio play/pause button component variant logic wired to the shared AudioContext.', tags: ['component', 'audio', 'ui-control'], complexity: 'complex' },
  { id: 'function:src/components/audio/EditorSoundPanel.tsx:EditorSoundPanel', name: 'EditorSoundPanel', filePath: 'src/components/audio/EditorSoundPanel.tsx', lineRange: [37, 379], summary: 'Editor side panel that aggregates sound selection, trim sliders, volume and preview tabs for a template.', tags: ['component', 'editor', 'audio'], complexity: 'complex' },
  { id: 'function:src/components/audio/FullPlayer.tsx:FullPlayer', name: 'FullPlayer', filePath: 'src/components/audio/FullPlayer.tsx', lineRange: [29, 429], summary: 'Expanded global audio player UI with controls, tabs, queue and collection integration.', tags: ['component', 'audio', 'player'], complexity: 'complex' },
  { id: 'function:src/components/audio/GlobalAudioPlayer.tsx:GlobalAudioPlayer', name: 'GlobalAudioPlayer', filePath: 'src/components/audio/GlobalAudioPlayer.tsx', lineRange: [34, 320], summary: 'Self-contained global audio player widget managing its own audio element and UI state.', tags: ['component', 'audio', 'global-ui'], complexity: 'complex' },
  { id: 'function:src/components/audio/InlinePlayer.tsx:InlinePlayer', name: 'InlinePlayer', filePath: 'src/components/audio/InlinePlayer.tsx', lineRange: [29, 141], summary: 'Compact inline player bound to a single sound via useSound for use inside cards.', tags: ['component', 'audio', 'inline-player'], complexity: 'moderate' },
  { id: 'function:src/components/audio/MiniPlayer.tsx:MiniPlayer', name: 'MiniPlayer', filePath: 'src/components/audio/MiniPlayer.tsx', lineRange: [22, 170], summary: 'Mini bottom-bar audio player exposing core transport controls and volume slider.', tags: ['component', 'audio', 'mini-player'], complexity: 'moderate' },
  { id: 'function:src/components/audio/SoundAnalyticsCard.tsx:SoundAnalyticsCard', name: 'SoundAnalyticsCard', filePath: 'src/components/audio/SoundAnalyticsCard.tsx', lineRange: [41, 212], summary: 'Card displaying detailed analytics and trend indicators for a single sound.', tags: ['component', 'analytics', 'audio'], complexity: 'complex' },
  { id: 'function:src/components/audio/SoundBrowser.tsx:SoundBrowser', name: 'SoundBrowser', filePath: 'src/components/audio/SoundBrowser.tsx', lineRange: [19, 300], summary: 'Tabbed sound discovery surface with search, filter and grid of SoundCard items.', tags: ['component', 'audio', 'browser', 'exported'], complexity: 'complex' },
  { id: 'function:src/components/audio/SoundBrowserModal.tsx:SoundBrowserModal', name: 'SoundBrowserModal', filePath: 'src/components/audio/SoundBrowserModal.tsx', lineRange: [32, 298], summary: 'Modal dialog wrapper around a sound browser that returns the chosen sound to the caller.', tags: ['component', 'audio', 'modal'], complexity: 'complex' },
  { id: 'function:src/components/audio/SoundButton.tsx:SoundButton', name: 'SoundButton', filePath: 'src/components/audio/SoundButton.tsx', lineRange: [32, 207], summary: 'Single-sound play toggle button using the useSound hook with optional progress visualization.', tags: ['component', 'audio', 'ui-control'], complexity: 'complex' },
  { id: 'function:src/components/audio/SoundCard.tsx:SoundCard', name: 'SoundCard', filePath: 'src/components/audio/SoundCard.tsx', lineRange: [20, 215], summary: 'Card UI for a TikTok sound with metadata, cover art and play/select actions.', tags: ['component', 'audio', 'card'], complexity: 'complex' },
  { id: 'function:src/components/audio/SoundSelector.tsx:SoundSelector', name: 'SoundSelector', filePath: 'src/components/audio/SoundSelector.tsx', lineRange: [32, 118], summary: 'Field selector that displays current sound and opens SoundBrowserModal for changes.', tags: ['component', 'audio', 'selector'], complexity: 'moderate' },
  { id: 'function:src/components/auth/ProtectedRoute.tsx:ProtectedRoute', name: 'ProtectedRoute', filePath: 'src/components/auth/ProtectedRoute.tsx', lineRange: [12, 20], summary: 'Default export wrapper that lazily renders ProtectedRouteInner only on the client.', tags: ['component', 'auth', 'route-guard', 'exported'], complexity: 'simple' },
  { id: 'function:src/components/auth/ProtectedRoute.tsx:ProtectedRouteInner', name: 'ProtectedRouteInner', filePath: 'src/components/auth/ProtectedRoute.tsx', lineRange: [22, 124], summary: 'Client component that checks the Supabase auth context and redirects unauthenticated users.', tags: ['component', 'auth', 'route-guard'], complexity: 'complex' },
  { id: 'function:src/components/backgrounds/InteractiveGridPattern.tsx:InteractiveGridPattern', name: 'InteractiveGridPattern', filePath: 'src/components/backgrounds/InteractiveGridPattern.tsx', lineRange: [18, 65], summary: 'SVG grid background component that highlights individual cells on mouse hover.', tags: ['component', 'background', 'svg'], complexity: 'simple' },
  { id: 'function:src/components/canvas/Canvas.tsx:CanvasRoot', name: 'CanvasRoot', filePath: 'src/components/canvas/Canvas.tsx', lineRange: [5, 14], summary: 'CanvasRoot wrapper element that hosts the canvas overlay grid container.', tags: ['component', 'canvas', 'exported'], complexity: 'simple' },
  { id: 'function:src/components/canvas/CanvasOverlay.tsx:TopBar', name: 'TopBar', filePath: 'src/components/canvas/CanvasOverlay.tsx', lineRange: [34, 117], summary: 'Top navigation bar within the canvas overlay with tabs and global actions.', tags: ['component', 'canvas', 'navigation'], complexity: 'moderate' },
  { id: 'function:src/components/canvas/CanvasOverlay.tsx:RightToolStrip', name: 'RightToolStrip', filePath: 'src/components/canvas/CanvasOverlay.tsx', lineRange: [119, 164], summary: 'Right-side toolbar with quick action buttons on the canvas workspace.', tags: ['component', 'canvas', 'toolbar'], complexity: 'moderate' },
  { id: 'function:src/components/canvas/CanvasOverlay.tsx:WindowsArea', name: 'WindowsArea', filePath: 'src/components/canvas/CanvasOverlay.tsx', lineRange: [166, 204], summary: 'Renders the floating desktop-style windows tracked by the window store.', tags: ['component', 'canvas', 'window-manager'], complexity: 'moderate' },
  { id: 'function:src/components/canvas/CanvasOverlay.tsx:DebugStress', name: 'DebugStress', filePath: 'src/components/canvas/CanvasOverlay.tsx', lineRange: [206, 239], summary: 'Debug-only stress test controls used to spawn many windows for performance testing.', tags: ['component', 'canvas', 'debug'], complexity: 'moderate' },
  { id: 'function:src/components/canvas/CanvasOverlay.tsx:CanvasOverlayInner', name: 'CanvasOverlayInner', filePath: 'src/components/canvas/CanvasOverlay.tsx', lineRange: [241, 385], summary: 'Inner overlay component that wires TemplateMiniUIProvider, URL state, sound feedback and assembles the workspace.', tags: ['component', 'canvas', 'orchestrator', 'exported'], complexity: 'complex' },
  { id: 'function:src/components/canvas/CanvasOverlay.tsx:CanvasOverlay', name: 'CanvasOverlay', filePath: 'src/components/canvas/CanvasOverlay.tsx', lineRange: [387, 400], summary: 'Default export thin wrapper around CanvasOverlayInner with provider setup.', tags: ['component', 'canvas', 'exported'], complexity: 'simple' },
  { id: 'function:src/components/canvas/CanvasPortal.tsx:CanvasPortal', name: 'CanvasPortal', filePath: 'src/components/canvas/CanvasPortal.tsx', lineRange: [14, 79], summary: 'Renders children into a dedicated canvas portal DOM container outside the normal layout flow.', tags: ['component', 'canvas', 'portal', 'exported'], complexity: 'moderate' },
  { id: 'function:src/components/cards/TrendzoCard.tsx:TrendzoCard', name: 'TrendzoCard', filePath: 'src/components/cards/TrendzoCard.tsx', lineRange: [311, 728], summary: 'Large multi-variant card component rendering Trendzo scorecards, niches, scores and quick actions.', tags: ['component', 'card', 'dashboard', 'exported'], complexity: 'complex' },
  { id: 'function:src/components/clay/ActionConfirmationCard.tsx:ActionConfirmationCard', name: 'ActionConfirmationCard', filePath: 'src/components/clay/ActionConfirmationCard.tsx', lineRange: [14, 143], summary: 'Card asking the operator to confirm or reject a proposed agent action.', tags: ['component', 'clay', 'agent', 'exported'], complexity: 'moderate' },
  { id: 'function:src/components/clay/AgencyScorecardCard.tsx:AgencyScorecardCard', name: 'AgencyScorecardCard', filePath: 'src/components/clay/AgencyScorecardCard.tsx', lineRange: [29, 178], summary: 'Scorecard card showing agency KPIs (briefs, posts, performance) inside chat.', tags: ['component', 'clay', 'agency', 'exported'], complexity: 'moderate' },
  { id: 'function:src/components/clay/CalendarSnippetCard.tsx:CalendarSnippetCard', name: 'CalendarSnippetCard', filePath: 'src/components/clay/CalendarSnippetCard.tsx', lineRange: [13, 135], summary: 'Compact upcoming content calendar snippet card for chat.', tags: ['component', 'clay', 'calendar', 'exported'], complexity: 'moderate' },
  { id: 'function:src/components/clay/ContentBriefCard.tsx:ContentBriefCard', name: 'ContentBriefCard', filePath: 'src/components/clay/ContentBriefCard.tsx', lineRange: [26, 265], summary: 'Content brief card showing metadata, predicted VPS color-coded status and actions.', tags: ['component', 'clay', 'brief', 'exported'], complexity: 'complex' }
];

for (const fn of fnNodes) {
  nodes.push({ ...fn, type: 'function' });
  edges.push({ source: 'file:' + fn.filePath, target: fn.id, type: 'contains', direction: 'forward', weight: 1.0 });
}

const exportedFns = [
  'function:src/components/audio/SoundBrowser.tsx:SoundBrowser',
  'function:src/components/auth/ProtectedRoute.tsx:ProtectedRoute',
  'function:src/components/backgrounds/InteractiveGridPattern.tsx:InteractiveGridPattern',
  'function:src/components/canvas/Canvas.tsx:CanvasRoot',
  'function:src/components/canvas/CanvasOverlay.tsx:CanvasOverlayInner',
  'function:src/components/canvas/CanvasOverlay.tsx:CanvasOverlay',
  'function:src/components/canvas/CanvasPortal.tsx:CanvasPortal',
  'function:src/components/cards/TrendzoCard.tsx:TrendzoCard',
  'function:src/components/clay/ActionConfirmationCard.tsx:ActionConfirmationCard',
  'function:src/components/clay/AgencyScorecardCard.tsx:AgencyScorecardCard',
  'function:src/components/clay/CalendarSnippetCard.tsx:CalendarSnippetCard',
  'function:src/components/clay/ContentBriefCard.tsx:ContentBriefCard'
];
for (const fnId of exportedFns) {
  const filePath = fnId.split(':')[1];
  edges.push({ source: 'file:' + filePath, target: fnId, type: 'exports', direction: 'forward', weight: 0.8 });
}

let importEdgeCount = 0;
for (const [filePath, targets] of Object.entries(importMap)) {
  const sourcePrefix = filePath.endsWith('.md') ? 'document:' : 'file:';
  for (const t of targets) {
    edges.push({ source: sourcePrefix + filePath, target: 'file:' + t, type: 'imports', direction: 'forward', weight: 0.7 });
    importEdgeCount++;
  }
}

edges.push({ source: 'document:src/components/audiovisual/README.md', target: 'file:src/components/audiovisual/WaveformVisualizer.tsx', type: 'documents', direction: 'forward', weight: 0.5 });
edges.push({ source: 'document:src/components/audio/README.md', target: 'file:src/components/audio/GlobalAudioPlayer.tsx', type: 'documents', direction: 'forward', weight: 0.5 });
edges.push({ source: 'document:src/components/audio/README.md', target: 'file:src/components/audio/MiniPlayer.tsx', type: 'documents', direction: 'forward', weight: 0.5 });
edges.push({ source: 'document:src/components/audio/README.md', target: 'file:src/components/audio/FullPlayer.tsx', type: 'documents', direction: 'forward', weight: 0.5 });

const out = { nodes, edges };
fs.writeFileSync('C:/Projects/CleanCopy/.understand-anything/intermediate/batch-111.json', JSON.stringify(out, null, 2));

const counts = nodes.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {});
console.log('Node counts:', JSON.stringify(counts));
console.log('Total nodes:', nodes.length);
console.log('Total edges:', edges.length);
console.log('Import edges:', importEdgeCount, '(expected 112)');
