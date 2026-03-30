# Template System - Contract & Schema

## Overview

Templates are the core "technology within the technology" - they encode viral patterns into reusable, data-driven structures that guide content creation and enable AI-powered viral prediction.

## Canonical Template Schema

### Core Template Object

```yaml
template:
  # Identity & Metadata
  id: string                    # Unique identifier (tpl_hot_001)
  name: string                  # Human-readable name (max 60 chars)
  family: string                # Template family grouping
  description: string           # Detailed explanation (max 500 chars)
  version: string               # Template version (semantic versioning)
  created_at: datetime          # ISO timestamp
  updated_at: datetime          # ISO timestamp
  status: enum                  # HOT | COOLING | NEW | ARCHIVED
  
  # Classification & Targeting
  tags: array<string>           # Searchable keywords
  category: enum                # authority | story | tutorial | entertainment | trending
  niche: string                 # Target content niche
  platform_support: array      # [tiktok, instagram, youtube, all]
  audience_type: enum           # gen_z | millennial | gen_x | broad
  content_type: enum            # educational | comedy | lifestyle | business
  
  # Structure & Guidance
  guidance:
    duration_range: object      # {min_seconds: 15, max_seconds: 60, optimal: 30}
    hook_target_sec: number     # Optimal hook duration (typically 1.2-3.0)
    beat_slots: array           # Structured content segments
    visual_requirements: array  # Required visual elements
    audio_requirements: object  # Audio sync and timing needs
    text_overlay_pattern: string # On-screen text guidelines
  
  # Performance Metrics
  scores:
    success_rate: number        # Historical success rate (0-1)
    confidence_interval: object # {lower: 0.82, upper: 0.94}
    trend_delta_7d: number      # 7-day performance change (-1 to 1)
    trend_delta_30d: number     # 30-day performance change
    uses_count: number          # Times template has been used
    examples_count: number      # Number of successful examples
    last_viral_date: datetime   # Most recent viral success
  
  # AI Detection & Matching
  detection:
    viral_dna_signature: object # Extracted viral elements fingerprint
    visual_patterns: array      # Computer vision identifiers
    audio_patterns: array       # Audio analysis signatures
    text_patterns: array        # NLP pattern recognition
    timing_signatures: array    # Beat and transition patterns
    dsl_rules: array           # Domain-specific matching rules
    token_pairs: array         # Semantic token combinations
    mapping_confidence: number  # Template matching reliability
  
  # Content Generation
  generation:
    hook_patterns: array        # Hook generation templates
    caption_formulas: array     # Caption generation rules
    hashtag_strategies: array   # Hashtag optimization patterns
    shotlist_blueprints: array  # Visual sequence guides
    prompt_seeds: array         # AI generation starting points
    variation_rules: array      # A/B testing variation logic
  
  # Policy & Safety
  policy:
    brand_safe: boolean         # Safe for brand advertising
    content_rating: enum        # general | teen | mature
    anti_gaming_flags: array    # Gaming prevention measures
    safety_notes: string        # Manual safety considerations
    compliance_tags: array      # Regulatory compliance markers
  
  # Business & Operations  
  costs:
    analyze_credits: number     # Credits for analysis operations
    generate_credits: number    # Credits for content generation
    validate_credits: number    # Credits for validation testing
    optimization_credits: number # Credits for optimization runs
  
  # System Analytics
  analytics:
    discovery_source: string    # How template was discovered
    last_trained_at: datetime   # ML model training timestamp
    last_validated_at: datetime # Last validation run
    prediction_accuracy: number # Historical prediction accuracy
    drift_detected: boolean     # Algorithm drift indicator
    quality_score: number       # Overall template quality (0-1)
  
  # UI Variants (Multi-Surface Rendering)
  ui_variants:
    card: object               # Gallery card rendering
    detail: object             # Full detail view rendering  
    studio: object             # Studio editor integration
    analysis: object           # Analysis results rendering
```

## Complete Example: Split-Screen Tutorial Template

```yaml
template:
  # Identity & Metadata
  id: "tpl_hot_splitscreen_001"
  name: "Split-Screen How-To Turbo"
  family: "educational_splits"
  description: "High-engagement split-screen tutorial format with rapid cuts and on-screen text callouts. Optimized for skill demonstration and step-by-step learning."
  version: "2.1.0"
  created_at: "2024-12-15T08:30:00Z"
  updated_at: "2025-01-28T14:22:00Z"
  status: "HOT"
  
  # Classification & Targeting  
  tags: ["split-screen", "tutorial", "how-to", "educational", "step-by-step"]
  category: "tutorial"
  niche: "lifestyle_skills"
  platform_support: ["tiktok", "instagram", "youtube"]
  audience_type: "gen_z"
  content_type: "educational"
  
  # Structure & Guidance
  guidance:
    duration_range: {min_seconds: 20, max_seconds: 45, optimal: 32}
    hook_target_sec: 1.8
    beat_slots:
      - {name: "hook", duration_sec: 1.8, purpose: "Problem statement with split preview"}
      - {name: "setup", duration_sec: 3.2, purpose: "Materials and preparation"}
      - {name: "step1", duration_sec: 8.0, purpose: "First major step demonstration"}
      - {name: "step2", duration_sec: 7.5, purpose: "Second step with comparison"}
      - {name: "step3", duration_sec: 6.0, purpose: "Final step and reveal"}
      - {name: "cta", duration_sec: 2.5, purpose: "Call to action and engagement"}
      - {name: "payoff", duration_sec: 3.0, purpose: "Before/after comparison"}
    visual_requirements: 
      - "Split-screen layout (50/50 or 60/40)"
      - "Clear before/after states"
      - "On-screen text for key steps" 
      - "Hand/tool visibility for actions"
    audio_requirements:
      sync_critical: true
      beat_alignment: ["hook", "step1", "step3", "payoff"]
      trending_compatibility: ["upbeat", "motivational", "trending_educational"]
    text_overlay_pattern: "Step numbers + action verbs + outcome descriptions"
  
  # Performance Metrics
  scores:
    success_rate: 0.921
    confidence_interval: {lower: 0.897, upper: 0.943}
    trend_delta_7d: 0.12
    trend_delta_30d: 0.08
    uses_count: 1247
    examples_count: 89
    last_viral_date: "2025-01-26T19:45:00Z"
  
  # AI Detection & Matching
  detection:
    viral_dna_signature: 
      visual_entropy: 0.847
      transition_velocity: 1.23
      text_density: 0.65
      split_ratio_consistency: 0.91
    visual_patterns:
      - {type: "split_screen_detection", confidence: 0.94}
      - {type: "hand_gesture_tracking", confidence: 0.87}
      - {type: "before_after_comparison", confidence: 0.92}
    audio_patterns:
      - {type: "beat_sync_educational", confidence: 0.89}
      - {type: "voiceover_pacing", confidence: 0.76}
    text_patterns:
      - {type: "step_numbering", regex: "Step [0-9]+", confidence: 0.95}
      - {type: "action_verbs", tokens: ["mix", "add", "blend", "apply"], confidence: 0.82}
    timing_signatures:
      - {beat: "hook", optimal_duration: [1.5, 2.0], variance_tolerance: 0.3}
      - {beat: "payoff", optimal_duration: [2.5, 3.5], variance_tolerance: 0.5}
    dsl_rules:
      - "REQUIRE split_screen_layout AND step_progression"
      - "PREFER trending_audio WITH educational_category"  
      - "VALIDATE hook_duration BETWEEN 1.2 AND 2.5"
    mapping_confidence: 0.923
  
  # Content Generation
  generation:
    hook_patterns:
      - "Want to learn [SKILL] in under [TIME]? Here's how:"
      - "The [WRONG WAY] vs the [RIGHT WAY] to [ACTION]"
      - "POV: You finally figured out [PROBLEM]"
    caption_formulas:
      - "[HOOK_QUESTION] + [STEP_COUNT] simple steps + [OUTCOME_PROMISE]"
      - "Tutorial: [SKILL] + Before/After + Save this!"
    hashtag_strategies:
      - {primary: ["#tutorial", "#howto", "#[SKILL]"], secondary: ["#splitscreen", "#beforeafter"], trending: 2-3}
    shotlist_blueprints:
      - {shot: "wide_setup", duration: "2-3sec", composition: "tools_materials_visible"}
      - {shot: "close_hands", duration: "4-6sec", composition: "action_clear_visible"}
      - {shot: "split_comparison", duration: "3-4sec", composition: "before_after_aligned"}
    prompt_seeds:
      - "Generate step-by-step tutorial showing transformation from beginner to expert level"
      - "Create educational content that simplifies complex process into clear visual steps"
    variation_rules:
      - {type: "audio_swap", test_param: "trending_vs_generic", success_metric: "completion_rate"}
      - {type: "hook_length", test_param: "1.5sec_vs_2.5sec", success_metric: "retention"}
  
  # Policy & Safety
  policy:
    brand_safe: true
    content_rating: "general"
    anti_gaming_flags: ["no_false_difficulty", "no_fake_mistakes", "authentic_learning"]
    safety_notes: "Ensure all demonstrated techniques are safe and appropriate for general audience"
    compliance_tags: ["educational_content", "skill_sharing", "brand_friendly"]
  
  # Business & Operations
  costs:
    analyze_credits: 3
    generate_credits: 8
    validate_credits: 5
    optimization_credits: 12
  
  # System Analytics
  analytics:
    discovery_source: "viral_pattern_extraction_tiktok_2024_12"
    last_trained_at: "2025-01-20T03:15:00Z"
    last_validated_at: "2025-01-27T16:30:00Z"
    prediction_accuracy: 0.889
    drift_detected: false
    quality_score: 0.934
  
  # UI Variants
  ui_variants:
    card:
      thumbnail: "/templates/splitscreen_001/card_thumb.jpg"
      overlay_text: "92% Success Rate"
      status_badge: "HOT"
      quick_stats: ["Split-screen", "20-45s", "Educational"]
    detail:
      hero_video: "/templates/splitscreen_001/demo_compilation.mp4"
      structure_diagram: true
      timing_visualization: true
      example_gallery: 6
    studio:
      preview_mode: "split_screen_simulator"
      guidance_overlay: true
      beat_timeline: true
      sync_helpers: ["audio_markers", "text_timing"]
    analysis:
      score_breakdown: ["visual_clarity", "pacing", "educational_value"]
      improvement_categories: ["hook_strength", "step_clarity", "payoff_impact"]
      benchmark_comparison: "educational_templates"
```

## Template Validation Rules

### Structural Validation
```yaml
validation_rules:
  required_fields: [id, name, status, guidance.duration_range, scores.success_rate]
  field_constraints:
    name: {max_length: 60, min_length: 5, no_profanity: true}
    description: {max_length: 500, min_length: 20}
    success_rate: {min: 0.0, max: 1.0}
    uses_count: {min: 0, integer_only: true}
  enum_validations:
    status: [HOT, COOLING, NEW, ARCHIVED]
    category: [authority, story, tutorial, entertainment, trending]
    platform_support: [tiktok, instagram, youtube, all]
```

### Business Logic Validation
```yaml
business_rules:
  status_determination:
    HOT: {success_rate: ">0.8", trend_delta_7d: ">0.05", uses_count: ">50"}
    COOLING: {success_rate: ">0.6", trend_delta_7d: "<-0.05", uses_count: ">100"}  
    NEW: {uses_count: "<30", created_within_days: 14}
    ARCHIVED: {success_rate: "<0.5", no_uses_30d: true}
  credit_cost_limits:
    analyze_credits: {min: 1, max: 10}
    generate_credits: {min: 3, max: 25}
    validate_credits: {min: 2, max: 15}
```

### Quality Gates
```yaml
quality_requirements:
  minimum_confidence: 0.75
  required_examples: 3
  mandatory_beats: ["hook", "payoff"]  
  safety_compliance: true
  performance_threshold: {success_rate: 0.6, uses_count: 10}
```

---

*This template contract serves as the single source of truth for all template operations, from discovery and generation to analysis and optimization.*