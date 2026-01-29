# Admin Viral Recipe Book - Tabs Overview

## Interface Summary

The Admin Viral Recipe Book is the central command center for viral content prediction and template management. It provides 8 specialized tabs for different aspects of the viral prediction workflow.

## Tab Structure

| Tab # | Name | Purpose | Primary KPIs | Key User Stories |
|-------|------|---------|--------------|------------------|
| 1 | **Templates** | Browse, filter, and select viral templates | Active templates, Success rates, Uses/30d | As an admin, I want to see trending templates so I can understand what's working |
| 2 | **Analyzer** | Upload and analyze content for viral potential | Analysis count, Avg viral score, Fix recommendations | As an admin, I want to analyze uploaded content to identify viral potential and improvements |
| 3 | **Dashboard** | Monitor system performance and prediction accuracy | System accuracy, Validation runs, Discovery freshness | As an admin, I want to monitor system health to ensure reliable predictions |
| 4 | **Scripts** | Manage script intelligence and pattern recognition | Script patterns, Recognition accuracy, Library size | As an admin, I want to manage script patterns to improve content understanding |
| 5 | **Optimize** | Run optimization algorithms on templates and content | Optimization runs, Performance lift, Success rate improvements | As an admin, I want to optimize templates to maximize viral potential |
| 6 | **A/B Test** | Configure and monitor template variant experiments | Active experiments, Confidence levels, Winner identification | As an admin, I want to A/B test template variations to identify best performers |
| 7 | **Inception** | Generate marketing campaigns and viral concepts | Campaign generation, Concept quality, Market fit scores | As an admin, I want to generate campaign concepts to inspire content creation |
| 8 | **Validation** | Run prediction validation and calibration tests | Validation accuracy, Calibration scores, Prediction drift | As an admin, I want to validate predictions to maintain system accuracy |

## Navigation & State Management

### Tab Persistence
- Active tab state persists in URL (`?tab=templates`)
- Deep linking supported for all tabs
- Browser back/forward navigation works correctly

### Cross-Tab Data Flow
- Template selection in **Templates** tab flows to **Analyzer** for testing
- **Dashboard** metrics influence **Optimize** scheduling
- **A/B Test** results update **Templates** success rates
- **Validation** results calibrate **Dashboard** accuracy displays

## Common UI Patterns

### Header Section (All Tabs)
- Page title with icon
- Real-time KPI chips (System Accuracy, Active Templates, Discovery Freshness)
- Discovery Readiness indicator with quick fix actions
- Demo Fill button for QA testing

### Filter Bar (Where Applicable)
- Time window selector (7d, 30d, 90d)
- Platform filter (TikTok, Instagram, YouTube, All)
- Niche filter (text input with autocomplete)
- Refresh button for manual data reload
- Starter Pack toggle (when enabled)

### Loading & Error States
- Skeleton loading for data-heavy components
- Error messages with retry actions
- Empty state guidance for new users

### Accessibility Standards
- All interactive elements have `data-testid` attributes
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus management across tab transitions

## Integration Points

### Discovery System
- All tabs consume `/api/discovery/metrics` for real-time freshness
- Template data refreshed from `/api/templates` with filtering
- System readiness checked via `/api/discovery/readiness`

### Operations Center Links
- Quick access to Engine Room for deep diagnostics
- Pipeline actions (QA Seed, Recompute, Warm Examples)
- Alert escalation for system issues

### Floating AI Brain
- Context-aware help system available on all tabs
- Provides guidance based on current user workflow
- Learning prompts for advanced features

---

## Tab Loading Priority

1. **Templates** (Primary entry point)
2. **Dashboard** (System health monitoring)
3. **Analyzer** (Core workflow)
4. **Validation** (Quality assurance)
5. **Scripts** (Advanced configuration)
6. **Optimize** (Performance tuning)
7. **A/B Test** (Experimentation)
8. **Inception** (Creative generation)

This priority order ensures critical system functions load first while advanced features remain accessible but don't block core workflows.

---

*For detailed specifications of each tab, see individual tab documentation files.*