# Component Test IDs - Complete Reference

## Testing Strategy

All interactive UI components include `data-testid` attributes for reliable test automation. Test IDs follow a hierarchical naming convention: `{surface}_{component}_{element}_{variant?}`

## Admin Viral Recipe Book Components

### Global Navigation & Layout
```yaml
layout:
  header: "admin-header"
  navigation: "admin-nav"
  breadcrumb: "admin-breadcrumb"
  content_area: "admin-content"
  sidebar: "admin-sidebar"
  footer: "admin-footer"

floating_elements:
  ai_brain_trigger: "floating-brain-trigger"
  help_overlay: "help-overlay"
  notification_toast: "notification-toast"
```

### Tab System (All 8 Tabs)
```yaml
tabs_root:
  container: "tabs-container"
  list: "tabs-list" 
  trigger_templates: "tab-trigger-templates"
  trigger_analyzer: "tab-trigger-analyzer"
  trigger_dashboard: "tab-trigger-dashboard"
  trigger_scripts: "tab-trigger-scripts"
  trigger_optimize: "tab-trigger-optimize"
  trigger_abtesting: "tab-trigger-abtesting"
  trigger_inception: "tab-trigger-inception"
  trigger_validation: "tab-trigger-validation"
```

### Tab 1: Templates
```yaml
templates_tab:
  # Header & KPIs
  kpi_chips: "kpi-chips"
  kpi_accuracy: "kpi-accuracy"
  kpi_templates: "kpi-templates"
  kpi_freshness: "kpi-freshness"
  
  # Discovery Readiness
  readiness_pill: "discovery-readiness-pill"
  readiness_panel: "discovery-readiness-panel"
  
  # Filters & Controls
  filters_bar: "filters-bar"
  time_filter: "time-filter"
  platform_filter: "platform-filter"
  niche_filter: "niche-filter"
  btn_refresh: "btn-refresh"
  starter_chip: "starter-chip"
  starter_helper: "starter-helper"
  
  # Template Lists
  hot_list: "hot-list"
  cooling_list: "cooling-list"
  new_list: "new-list"
  
  # Template Cards (dynamic IDs)
  template_card: "tpl-card-{id}"        # e.g., "tpl-card-hot_01"
  template_name: "tpl-name-{id}"
  template_stats: "tpl-stats-{id}"
  template_actions: "tpl-actions-{id}"
  
  # Operations Buttons (Readiness Panel)
  ops_btn_qa_seed: "ops-btn-qa-seed"
  ops_btn_recompute: "ops-btn-recompute"
  ops_btn_warm_examples: "ops-btn-warm-examples"
```

### Tab 2: Analyzer  
```yaml
analyzer_tab:
  # Upload Interface
  dropzone: "analyze-dropzone"
  url_input: "url-input"
  file_browse: "file-browse"
  upload_progress: "upload-progress"
  
  # Analysis Results
  results_container: "analyze-results"
  viral_score: "viral-score"
  confidence_indicator: "confidence-indicator"
  template_matches: "template-matches"
  suggestions_list: "suggestions-list"
  
  # Batch Processing
  file_list: "file-list"
  file_status: "file-{id}-status"       # e.g., "file-abc123-status"
  file_progress: "file-{id}-progress"
  file_result: "file-{id}-result"
  
  # Actions
  btn_analyze: "btn-analyze"
  btn_export_results: "btn-export-results"
  btn_copy_suggestions: "btn-copy-suggestions"
```

### Tab 3: Dashboard
```yaml
dashboard_tab:
  # Charts & Visualizations
  chart_discovery: "chart-discovery"
  chart_decay: "chart-decay" 
  chart_performance: "chart-performance"
  metrics_grid: "metrics-grid"
  
  # System Health
  health_indicator: "health-indicator"
  system_alerts: "system-alerts"
  service_status: "service-status"
  
  # Time Controls
  time_selector: "time-selector"
  date_range_picker: "date-range-picker"
  refresh_interval: "refresh-interval"
```

### Tab 4: Scripts
```yaml
scripts_tab:
  # Pattern Library
  script_patterns: "script-patterns"
  patterns_list: "patterns-list"
  pattern_item: "pattern-{id}"          # e.g., "pattern-hook_strong_01"
  
  # Script Analysis
  script_input: "script-input"
  analyze_script: "analyze-script"
  script_results: "script-results"
  suggestions_output: "suggestions-output"
  
  # Generation
  generate_variations: "generate-variations"
  variation_count: "variation-count"
  variations_output: "variations-output"
```

### Tab 5: Optimize
```yaml
optimize_tab:
  # Optimization Controls
  optimize_target: "optimize-target"
  optimization_type: "optimization-type"
  opt_schedule: "opt-schedule"
  
  # Entities & Templates
  opt_entities: "opt-entities"
  template_selector: "template-selector"
  entity_list: "entity-list"
  
  # Results
  optimization_results: "optimization-results"
  performance_improvements: "performance-improvements"
  before_after_comparison: "before-after-comparison"
```

### Tab 6: A/B Testing
```yaml
abtesting_tab:
  # Test Setup
  ab_start: "ab-start"
  test_name: "test-name"
  variant_a: "variant-a"
  variant_b: "variant-b"
  test_duration: "test-duration"
  
  # Test Management
  ab_table: "ab-table"
  test_row: "test-{id}"                 # e.g., "test-split_hook_001"
  test_status: "test-{id}-status"
  test_results: "test-{id}-results"
  
  # Actions
  btn_start_test: "btn-start-test"
  btn_stop_test: "btn-stop-test"
  btn_declare_winner: "btn-declare-winner"
```

### Tab 7: Inception
```yaml
inception_tab:
  # Campaign Generation
  campaign_input: "campaign-input"
  niche_selector: "niche-selector"
  tone_selector: "tone-selector"
  generate_campaign: "generate-campaign"
  
  # Content Queue
  inception_queue: "inception-queue"
  campaign_item: "campaign-{id}"        # e.g., "campaign-lifestyle_001"
  campaign_preview: "campaign-{id}-preview"
  
  # Actions
  btn_approve_campaign: "btn-approve-campaign"
  btn_edit_campaign: "btn-edit-campaign"
  btn_generate_more: "btn-generate-more"
```

### Tab 8: Validation
```yaml
validation_tab:
  # Validation Setup
  validation_type: "validation-type"
  test_count: "test-count"
  confidence_threshold: "confidence-threshold"
  
  # Results & Calibration  
  validate_calibration: "validate-calibration"
  accuracy_chart: "accuracy-chart"
  calibration_results: "calibration-results"
  
  # Historical Data
  validation_history: "validation-history"
  run_item: "run-{id}"                  # e.g., "run-val_20250102_001"
  run_accuracy: "run-{id}-accuracy"
```

## Quick Win Pipeline Components

### Pipeline Navigation
```yaml
quickwin_pipeline:
  progress_bar: "pipeline-progress"
  stage_indicator: "stage-{number}"     # e.g., "stage-1", "stage-2"
  stage_title: "stage-title"
  back_button: "btn-back"
  next_button: "btn-next"
  skip_button: "btn-skip"
```

### Stage 1: Template Selection
```yaml
template_selection:
  starter_templates: "starter-templates"
  template_gallery: "template-gallery"
  template_card: "qw-tpl-{id}"          # e.g., "qw-tpl-hot_01"
  template_details: "template-details"
  select_template: "select-template"
```

### Stage 2: Hook Generation
```yaml
hook_generation:
  hook_input: "hook-input"
  generate_hooks: "generate-hooks"
  hook_list: "hook-list"
  hook_option: "hook-{index}"           # e.g., "hook-1", "hook-2"
  hook_score: "hook-{index}-score"
  select_hook: "select-hook-{index}"
```

### Stage 3: Beat Structure
```yaml
beat_structure:
  beat_timeline: "beat-timeline"
  beat_segment: "beat-{type}"           # e.g., "beat-hook", "beat-build"
  beat_content: "beat-{type}-content"
  beat_duration: "beat-{type}-duration"
  timing_controls: "timing-controls"
```

### Stage 4: Audio Selection
```yaml
audio_selection:
  trending_audio: "trending-audio"
  audio_option: "audio-{id}"            # e.g., "audio-trending_001"
  audio_preview: "audio-{id}-preview"
  sync_timeline: "sync-timeline"
  select_audio: "select-audio-{id}"
```

### Stage 5: Content Preview
```yaml
content_preview:
  preview_container: "preview-container"
  storyboard: "storyboard"
  preview_controls: "preview-controls"
  regenerate_preview: "regenerate-preview"
```

### Stage 6: Viral Analysis
```yaml
viral_analysis:
  analysis_score: "analysis-score"
  score_breakdown: "score-breakdown"
  improvement_suggestions: "improvement-suggestions"
  apply_fixes: "apply-fixes"
  fix_item: "fix-{index}"               # e.g., "fix-1", "fix-2"
```

### Stage 7: Publishing Strategy  
```yaml
publishing_strategy:
  schedule_selector: "schedule-selector"
  optimal_times: "optimal-times"
  platform_specs: "platform-specs"
  caption_generator: "caption-generator"
  hashtag_suggestions: "hashtag-suggestions"
```

### Stage 8: Prediction Setup
```yaml
prediction_setup:
  performance_forecast: "performance-forecast"
  tracking_setup: "tracking-setup"
  success_metrics: "success-metrics"
  complete_pipeline: "complete-pipeline"
```

## Common UI Patterns

### Loading States
```yaml
loading:
  spinner: "loading-spinner"
  skeleton: "loading-skeleton"
  progress: "loading-progress"
  message: "loading-message"
```

### Error States
```yaml
error:
  container: "error-container"
  message: "error-message"
  retry_button: "btn-retry"
  support_link: "link-support"
```

### Modal & Overlays
```yaml
modal:
  backdrop: "modal-backdrop"
  container: "modal-container"
  header: "modal-header"
  body: "modal-body"
  footer: "modal-footer"
  close_button: "modal-close"
```

### Form Controls
```yaml
form:
  input: "input-{name}"                 # e.g., "input-email"
  select: "select-{name}"               # e.g., "select-platform"
  checkbox: "checkbox-{name}"
  radio: "radio-{name}-{value}"
  button: "btn-{action}"                # e.g., "btn-submit", "btn-cancel"
  validation_error: "error-{name}"      # e.g., "error-email"
```

## Test Automation Guidelines

### Playwright Test Selectors
```typescript
// Preferred: Use data-testid
await page.locator('[data-testid="btn-analyze"]').click()

// Fallback: Use role + name
await page.locator('role=button[name="Analyze Content"]').click()

// Avoid: CSS selectors (brittle)
await page.locator('.analyze-button').click() // Don't do this
```

### Dynamic ID Patterns
```typescript
// Template cards with dynamic IDs
const templateId = 'hot_01'
await page.locator(`[data-testid="tpl-card-${templateId}"]`).click()

// File processing with generated IDs  
const fileId = 'abc123'
await page.waitForSelector(`[data-testid="file-${fileId}-result"]`)
```

### Accessibility Testing
```typescript
// Check for proper labeling
const button = page.locator('[data-testid="btn-analyze"]')
expect(await button.getAttribute('aria-label')).toBeTruthy()

// Verify keyboard navigation
await button.focus()
await page.keyboard.press('Enter')
```

---

*Test IDs are stable across releases and should never change without coordinated updates to test suites. New components must include appropriate test IDs before deployment.*