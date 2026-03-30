# Glossary

## Core Concepts

### Viral Prediction System

**Template**: A reusable pattern for creating viral videos, containing structure, hooks, timing, and success probability data.

**Template Status**: Classification of template performance:
- **HOT**: Currently trending templates with >80% success rate and positive 7-day delta
- **COOLING**: Previously successful templates showing declining performance (-5% to -25% 7-day delta)  
- **NEW**: Recently discovered templates with <30 uses, unproven success rates

**Viral Score**: AI-calculated probability (0-100%) that content will achieve viral metrics based on template adherence and optimization factors.

**Success Rate (SR)**: Historical percentage of videos using this template that achieved viral threshold (>100K views in 48hrs for TikTok).

### Quick Win Pipeline

**Quick Win**: Accelerated workflow from template selection to scheduled publishing in <15 minutes, optimized for high-probability viral outcomes.

**Hooks**: Opening 1-3 seconds of content designed to maximize viewer retention and trigger algorithmic promotion.

**Beats**: Structured content segments (Hook → Build → Payoff → CTA) with specific timing and transition requirements.

**Audio Sync**: Alignment of content beats with trending audio tracks to maximize algorithmic visibility.

## Technical Architecture

### BMAD Loop
**Build → Measure → Analyze → Decide**: Core methodology for iterative improvement of viral prediction accuracy.

**Discovery System**: Real-time analysis engine that identifies emerging viral patterns from platform APIs and user-generated content.

**Template Evolution Engine**: ML system that updates template success rates, generates variants, and retires ineffective patterns.

**Validation System**: A/B testing framework that measures prediction accuracy against actual viral performance.

### Data & Analytics

**Viral DNA**: Decomposed elements of viral content (visual patterns, audio cues, timing, text overlays) used for template matching.

**Gene Tagger**: AI system that extracts and categorizes viral elements from successful content for template generation.

**Feature Decomposer**: Analysis tool that breaks down videos into measurable components for prediction modeling.

**Drift Detection**: System monitoring for changes in platform algorithms or user behavior that affect template performance.

## User Experience

### Surfaces
- **Card**: Compact template preview in gallery view
- **Detail**: Full template specification with examples and guidance
- **Studio**: Interactive editor for applying templates to user content
- **Analysis**: Results view showing viral score, fixes, and optimization recommendations

### Actors & Personas

**Creator**: Primary user creating viral content using platform tools and templates.

**Admin**: Platform operator managing templates, reviewing analytics, and optimizing system performance.

**Viewer**: End consumer of created content (tracked for engagement metrics but not direct platform user).

## Platform Integration

**Apify Scrapers**: Automated data collection from TikTok, Instagram, YouTube for trend discovery.

**Credit System**: Usage-based pricing model where analysis, generation, and validation operations consume credits.

**RLS (Row Level Security)**: Database access control ensuring users only see their own content and authorized shared templates.

## Quality & Performance

**SLO (Service Level Objective)**: Performance targets for system response times and availability.

**Preflight**: Automated testing system validating all workflows before deployment.

**A/B Testing**: Controlled experiments comparing template variants or system features.

**Telemetry**: Event tracking system measuring user behavior, system performance, and viral prediction accuracy.

## Compliance & Security

**PII (Personally Identifiable Information)**: User data requiring special handling and protection measures.

**Brand Safety**: Content filtering to ensure templates don't promote harmful, misleading, or inappropriate material.

**Anti-Gaming**: Measures preventing manipulation of viral scores or template success rates.

---

## Abbreviations

- **AC**: Acceptance Criteria
- **API**: Application Programming Interface  
- **CTA**: Call To Action
- **ETL**: Extract, Transform, Load
- **KPI**: Key Performance Indicator
- **ML**: Machine Learning
- **NPS**: Net Promoter Score
- **POC**: Proof of Concept
- **QA**: Quality Assurance
- **RLS**: Row Level Security
- **SLA**: Service Level Agreement
- **SLO**: Service Level Objective
- **SR**: Success Rate
- **UX**: User Experience
- **VOC**: Voice of Customer

---

*This glossary serves as a living document and will be updated as system evolves.*