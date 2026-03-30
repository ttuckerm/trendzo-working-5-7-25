# Template Mini-UI v1 — Live Signal-Binding + Preview

## Overview

The Template Mini-UI is a live, reactive interface for viral content creation with real-time signal binding, AI-powered optimization, and comprehensive performance tracking. It provides a streamlined workflow with keyboard shortcuts, accessibility features, and calibrated viral prediction.

## Features

- **Live Signal-Binding**: Real-time updates via Supabase channels with 100ms debouncing
- **Preview Kernel**: 7-target rendering system with cancel tokens and performance tracking
- **Right-Rail Panels**: Contextual UI with keyboard shortcuts (D/S/O/B/I/V)
- **AI Optimization**: One-click fixes for hashtags, hooks, and content optimization
- **A/B Testing**: Variant creation, switching, and performance tracking
- **Calibrated Prediction**: ECE-based accuracy metrics with raw vs calibrated probabilities
- **Accessibility**: WCAG compliant with focus management and screen reader support

## Mount Point

```tsx
<TemplateMiniUI 
  templateId={string} 
  platform={"tiktok"|"instagram"|"youtube"|string} 
  userId?={string} 
/>
```

## Feature Flag

Behind `NEXT_PUBLIC_FEATURE_TEMPLATE_MINI_UI=true` environment variable.

## Architecture

### Signal Bridge (`signalBridge.ts`)
- **Channel**: `template:{templateId}`
- **Events**: `slot_update`, `suggestion_update`, `validation_hint`
- **Debouncing**: 100ms for all signal types
- **Store Integration**: Optimistic updates to per-instance Zustand store

### Preview Kernel (`previewKernel.ts`)
- **Targets**: All 7 template slots (hook, onScreenText, captions, hashtags, shotList, thumbnailBrief, first3sCue)
- **Cancel Tokens**: Prevents race conditions during rapid updates
- **Skeleton Loading**: Shows after 250ms for long operations
- **Performance Hooks**: Tracks render times and emits telemetry

### Store (`store.ts`)
- **Per-Instance**: Isolated Zustand stores per template
- **Undo/Redo**: Full history tracking with descriptions
- **Dirty State**: Tracks unsaved changes
- **Type Safety**: Full TypeScript support for all 7 slot types

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `D` | Open Dashboard panel |
| `S` | Open Scripts panel |
| `O` | Open Optimize panel |
| `B` | Open A/B Test panel |
| `I` | Open Inception panel |
| `V` | Open Validate panel |
| `E` | Toggle Reader ↔ Editor mode |
| `Esc` | Close current panel / go back |

## Right-Rail Panels

### Dashboard Panel
- **Summary**: Performance metrics, viral score, estimated reach
- **CTA**: "Open Full Dashboard" → viral-recipe-book dashboard
- **Metrics**: Real-time engagement tracking

### Scripts Panel  
- **Summary**: AI script generation status and templates
- **CTA**: "Generate Draft Script" (respects token meter)
- **Integration**: Calls existing `/api/templates/generate-script`

### Optimize Panel
- **Summary**: Content optimization opportunities and score
- **CTA**: "Apply 1-Click Fix" (runs fixes pipeline)
- **Features**: Platform-specific suggestions, auto-fix telemetry

### A/B Test Panel
- **Summary**: Active variants, performance comparison
- **CTA**: "Create Variant" + variant management
- **Integration**: `recordAbEvent()` for all variant actions

### Inception Panel
- **Summary**: AI content generation status and ideas
- **CTA**: "Generate AI Content" (respects token meter)
- **Output**: Hook variations, content angles, platform adaptations

### Validate Panel
- **Summary**: Content validation + viral prediction
- **CTA**: "Run Prediction" with calibration surfacing
- **Features**: ECE chip, raw vs calibrated probabilities

## Signal Types

### SlotUpdateSignal
```typescript
{
  templateId: string;
  slot: TemplateSlotName;
  value: string | string[];
  ts: number;
  source?: string;
}
```

### SuggestionUpdateSignal  
```typescript
{
  templateId: string;
  slot: TemplateSlotName;
  suggestion: string | string[];
  confidence: number;
  source: string;
  ts: number;
}
```

### ValidationHintSignal
```typescript
{
  templateId: string;
  hint_type: "warning" | "error" | "info";
  message: string;
  slot?: TemplateSlotName;
  suggestion?: string;
  ts: number;
}
```

## Fixes Pipeline (`fixes.ts`)

### trimHashtagsToPlatformLimit()
- **TikTok**: 3 hashtags max
- **Instagram**: 5 hashtags max  
- **YouTube**: 15 hashtags max
- **Telemetry**: Logs fix application and token usage

### seedFirst3sCue()
- **Platform-specific**: Optimized cue patterns per platform
- **Contextual**: Uses existing hook for relevance
- **AI-powered**: Template-based generation with fallbacks

### optimizeHashtags()
- **Quality Filter**: Removes low-performing patterns
- **Performance Data**: Mock integration (production would use real data)
- **Batch Processing**: Handles multiple optimizations

## Calibration Surfacing

### ECE Chip Display
- **Green**: ECE ≤ 0.03 (Excellent)
- **Amber**: ECE ≤ 0.05 (Good)  
- **Red**: ECE > 0.05 (Needs Improvement)

### Prediction API Integration
```typescript
// Call with cohort key
POST /api/viral-prediction/fast
{
  templateId: string;
  platform: string;
  slots: TemplateSlotsState;
  cohortKey: string; // platform as cohort
  userId?: string;
}

// Response includes both probabilities
{
  raw_probability: number;
  calibrated_probability: number;
  confidence_interval: [number, number];
  cohort_key: string;
  model_version: string;
}
```

## Performance Targets

### Preview Kernel
- **Slot Edit P95**: ≤ 150ms (tested via Playwright)
- **Full Refresh P95**: ≤ 500ms (tested via Playwright)
- **Skeleton Threshold**: 250ms
- **Cancel Token**: Immediate interruption support

### Testing
```bash
# Run performance tests
npm run test:e2e -- tests/e2e/preview-perf.spec.ts

# Run accessibility tests  
npm run test -- __tests__/miniui.a11y.test.tsx
```

## Deep Links

### Hash Navigation
- `#reader` - Default reader mode
- `#editor` - Editor mode
- `#dashboard` - Dashboard panel
- `#scripts` - Scripts panel  
- `#optimize` - Optimize panel
- `#abtest` - A/B Test panel
- `#inception` - Inception panel
- `#validate` - Validate panel

### Full-Page Integration
- Dashboard: `/membership/viral-recipe-book?tab=dashboard&templateId={id}`
- Scripts: `/membership/viral-recipe-book?tab=scripts&templateId={id}`
- Optimize: `/membership/viral-recipe-book?tab=optimization&templateId={id}`
- A/B: `/membership/viral-recipe-book?tab=abtesting&templateId={id}`
- Inception: `/membership/viral-recipe-book?tab=inception&templateId={id}`
- Validate: `/membership/viral-recipe-book?tab=validation&templateId={id}`

## Telemetry Events

### Core Events
- `open` - Component mount
- `variant` - A/B test actions
- `apply_fix` - Optimization fixes
- `preview_started` - Render initiation
- `preview_completed` - Render completion with metrics
- `validation_completed` - Prediction results

### Token Usage
- `token_usage` - LLM API consumption tracking
- Wrapped in token meter with soft/hard caps
- Per-operation accounting (preview, script generation, inception)

## Accessibility Features

### Focus Management
- **Focus Trap**: Right-rail panels prevent focus escape
- **Keyboard Navigation**: Full keyboard operation support
- **Screen Reader**: Proper ARIA labels and live regions

### WCAG Compliance
- **Color Contrast**: Meets AA standards
- **Keyboard Only**: Complete functionality without mouse
- **Screen Reader**: Full semantic markup and announcements
- **Focus Indicators**: Clear visual focus states

## Error Handling

### Network Failures
- Graceful degradation for Supabase connection issues
- Retry logic for failed API calls
- User feedback for connectivity problems

### Performance Issues
- Cancel tokens prevent hanging renders
- Skeleton loading for long operations
- Memory management for extended use

## Development

### File Structure
```
src/components/templateMiniUI/
├── TemplateMiniUI.tsx          # Main component
├── signalBridge.ts             # Supabase signal handling
├── previewKernel.ts            # Render engine
├── store.ts                    # Zustand per-instance store
├── fixes.ts                    # Optimization pipeline
├── validation.ts               # Content validation
├── events.ts                   # Telemetry events
├── tokenMeter.ts               # LLM usage tracking
├── miniRouter.ts               # Hash-based routing
├── panels/                     # Right-rail components
│   ├── DashboardPanel.tsx
│   ├── ScriptsPanel.tsx  
│   ├── OptimizePanel.tsx
│   ├── ABTestPanel.tsx
│   ├── InceptionPanel.tsx
│   └── EnhancedValidatePanel.tsx
└── __tests__/                  # Test suites
    ├── miniui.a11y.test.tsx    # Accessibility tests
    └── ...                     # Additional test files
```

### Integration Points
- **Supabase**: Real-time channels and auth
- **Token Meter**: LLM usage tracking and limits  
- **Viral Prediction API**: Fast prediction with calibration
- **Template API**: Script generation and variant management
- **Telemetry API**: Event tracking and analytics

## Production Deployment

### Environment Variables
```bash
NEXT_PUBLIC_FEATURE_TEMPLATE_MINI_UI=true  # Enable feature
```

### Performance Monitoring
- P95 metrics tracked via telemetry
- Real-time performance dashboard
- Alert thresholds for performance degradation

### Scaling Considerations
- Per-instance stores prevent global state bleed
- Supabase channel limits (consider connection pooling)
- Token meter caps prevent API abuse
