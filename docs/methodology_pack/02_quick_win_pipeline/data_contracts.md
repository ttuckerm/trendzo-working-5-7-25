# Quick Win Pipeline - Data Contracts

## Overview

This document defines the complete data structures, API contracts, and data flow specifications for the Quick Win Pipeline. Each stage has clearly defined input/output contracts ensuring seamless data flow through the 15-minute viral content creation process.

## Core Data Structures

### Pipeline Session
```yaml
pipeline_session:
  session_id: string (UUID)
  user_id: string
  created_at: ISO datetime
  updated_at: ISO datetime
  status: "active" | "completed" | "abandoned" | "expired"
  current_stage: number (1-8)
  completion_percentage: number (0-100)
  
  user_profile:
    niche: string
    platform_preference: "tiktok" | "instagram" | "youtube" | "all"
    experience_level: "beginner" | "intermediate" | "advanced"
    content_goals: array<string>
    
  session_metadata:
    ip_address: string (hashed)
    user_agent: string
    referrer: string
    utm_source: string (optional)
    
  completion_metrics:
    time_spent_seconds: number
    stages_completed: array<number>
    abandoned_at_stage: number (optional)
    user_satisfaction_score: number (optional, 1-5)
```

### Draft Object (Persistent State)
```yaml
content_draft:
  draft_id: string (UUID)
  session_id: string
  user_id: string
  template_id: string
  created_at: ISO datetime
  updated_at: ISO datetime
  version: number
  status: "in_progress" | "completed" | "published" | "archived"
  
  content_specification:
    title: string
    description: string
    target_platform: "tiktok" | "instagram" | "youtube"
    target_audience: object
    content_theme: string
    
  viral_analysis:
    current_viral_score: number (0-100)
    confidence_level: number (0-1)
    improvement_potential: number (0-100)
    last_analyzed_at: ISO datetime
    
  stage_data: object # Stage-specific data stored here
  
  metadata:
    total_time_spent: number
    revision_count: number
    credits_consumed: number
    export_formats: array<string>
```

## Stage-by-Stage Data Contracts

### Stage 1: Template Selection

#### Input Data
```yaml
stage1_input:
  session_id: string
  user_preferences:
    niche: string (optional)
    platform: string (optional)
    content_goal: string (optional)
  starter_pack_enabled: boolean
  
  filter_criteria:
    time_range: "7d" | "30d" | "90d"
    success_rate_threshold: number (0-1)
    template_status: array<"HOT" | "COOLING" | "NEW">
    platform_filter: array<string>
```

#### Output Data
```yaml
stage1_output:
  session_id: string
  selected_template:
    template_id: string
    template_name: string
    success_rate: number (0-1)
    viral_probability: number (0-1)
    platform_optimized: array<string>
    
  template_details:
    structure: object
    guidance: object
    examples: array<object>
    requirements: object
    
  starter_recommendations:
    - template_id: string
      recommendation_reason: string
      confidence_score: number (0-1)
      
  stage_completion:
    completed_at: ISO datetime
    time_spent_seconds: number
    user_interaction_count: number
```

### Stage 2: Hook Generation

#### Input Data
```yaml
stage2_input:
  session_id: string
  template_id: string
  content_theme: string
  platform: string
  target_audience: object
  
  generation_parameters:
    hook_count: number (default: 5)
    creativity_level: "conservative" | "balanced" | "creative"
    tone_preference: "professional" | "casual" | "humorous" | "inspirational"
    max_hook_length_seconds: number (default: 3.0)
```

#### Output Data
```yaml
stage2_output:
  session_id: string
  generated_hooks:
    - hook_id: string
      hook_text: string
      hook_strength_score: number (0-100)
      estimated_retention: number (0-1)
      viral_potential: number (0-1)
      delivery_guidance: string
      timing_seconds: number
      
  selected_hook:
    hook_id: string
    user_modifications: string (optional)
    final_hook_text: string
    confidence_score: number (0-1)
    
  generation_metadata:
    ai_model_version: string
    generation_time_ms: number
    alternative_count: number
    user_satisfaction: number (1-5, optional)
```

### Stage 3: Beat Structure

#### Input Data
```yaml
stage3_input:
  session_id: string
  template_id: string
  selected_hook: object
  content_themes: array<string>
  target_duration_seconds: number
  
  beat_requirements:
    beat_count: number
    timing_flexibility: "strict" | "flexible"
    transition_style: "quick_cuts" | "smooth" | "dynamic"
```

#### Output Data
```yaml
stage3_output:
  session_id: string
  beat_structure:
    total_duration_seconds: number
    beats:
      - beat_id: string
        beat_type: "hook" | "build" | "climax" | "payoff" | "cta"
        start_time_seconds: number
        duration_seconds: number
        content_description: string
        visual_requirements: array<string>
        pacing_intensity: number (1-10)
        
  timing_optimization:
    platform_optimized: boolean
    retention_curve: array<number>
    engagement_peaks: array<number>
    optimization_score: number (0-100)
    
  user_adjustments:
    manual_timing_changes: array<object>
    content_modifications: array<object>
    approval_status: boolean
```

### Stage 4: Audio Selection

#### Input Data
```yaml
stage4_input:
  session_id: string
  beat_structure: object
  content_theme: string
  platform: string
  
  audio_preferences:
    genre_preference: string (optional)
    energy_level: "low" | "medium" | "high"
    trending_preference: boolean
    custom_audio_allowed: boolean
```

#### Output Data
```yaml
stage4_output:
  session_id: string
  audio_options:
    - audio_id: string
      audio_title: string
      artist: string
      duration_seconds: number
      viral_trend_score: number (0-100)
      platform_popularity: object
      beat_alignment_score: number (0-100)
      preview_url: string
      
  selected_audio:
    audio_id: string
    audio_metadata: object
    sync_points: array<{beat_id: string, audio_timestamp: number}>
    
  sync_analysis:
    overall_sync_score: number (0-100)
    critical_sync_points: array<object>
    timing_adjustments: array<object>
    sync_confidence: number (0-1)
```

### Stage 5: Content Preview

#### Input Data
```yaml
stage5_input:
  session_id: string
  complete_specification:
    template_id: string
    hook: object
    beat_structure: object
    audio_selection: object
    
  preview_options:
    preview_quality: "low" | "medium" | "high"
    include_annotations: boolean
    show_timing_markers: boolean
```

#### Output Data
```yaml
stage5_output:
  session_id: string
  preview_generation:
    preview_url: string
    storyboard_frames: array<string>
    preview_duration_seconds: number
    generation_time_ms: number
    
  content_validation:
    structural_compliance: boolean
    timing_accuracy: number (0-1)
    visual_clarity_score: number (0-100)
    audio_sync_quality: number (0-100)
    
  user_feedback:
    approval_status: boolean
    requested_changes: array<string>
    regeneration_count: number
```

### Stage 6: Viral Analysis & Optimization

#### Input Data
```yaml
stage6_input:
  session_id: string
  complete_content_spec: object
  user_approval: boolean
  
  analysis_parameters:
    analysis_depth: "quick" | "standard" | "comprehensive"
    include_competitive_analysis: boolean
    generate_improvements: boolean
```

#### Output Data
```yaml
stage6_output:
  session_id: string
  viral_analysis:
    overall_viral_score: number (0-100)
    confidence_interval: {lower: number, upper: number}
    viral_probability: number (0-1)
    
  component_analysis:
    hook_effectiveness: number (0-100)
    structure_optimization: number (0-100)
    audio_alignment: number (0-100)
    platform_compatibility: number (0-100)
    trend_alignment: number (0-100)
    
  optimization_suggestions:
    - suggestion_id: string
      category: "hook" | "timing" | "structure" | "audio"
      suggestion_text: string
      impact_estimate: number (viral score points)
      implementation_difficulty: "easy" | "medium" | "hard"
      auto_applicable: boolean
      
  applied_optimizations:
    - suggestion_id: string
      applied_at: ISO datetime
      result_viral_score: number (0-100)
      score_improvement: number
```

### Stage 7: Publishing Strategy

#### Input Data
```yaml
stage7_input:
  session_id: string
  optimized_content: object
  target_platforms: array<string>
  
  publishing_preferences:
    timing_preference: "immediate" | "optimal" | "scheduled"
    audience_targeting: object
    hashtag_preferences: array<string>
    caption_style: "minimal" | "descriptive" | "engaging"
```

#### Output Data
```yaml
stage7_output:
  session_id: string
  publishing_schedule:
    optimal_times:
      - platform: string
        recommended_time: ISO datetime
        expected_reach: number
        confidence_score: number (0-1)
        
  content_packages:
    - platform: string
      video_specifications: object
      caption: string
      hashtags: array<string>
      thumbnail: string (optional)
      description: string
      
  performance_predictions:
    - platform: string
      predicted_views_24h: number
      predicted_engagement_rate: number
      viral_probability: number (0-1)
      
  export_options:
    - format: string
      resolution: string
      file_size_mb: number
      download_url: string
```

### Stage 8: Prediction Setup & Tracking

#### Input Data
```yaml
stage8_input:
  session_id: string
  publishing_strategy: object
  content_specifications: object
  
  tracking_preferences:
    monitoring_duration_days: number
    alert_thresholds: object
    success_criteria: object
```

#### Output Data
```yaml
stage8_output:
  session_id: string
  tracking_configuration:
    tracking_id: string
    monitoring_start_time: ISO datetime
    monitoring_end_time: ISO datetime
    
  success_metrics:
    - metric_name: string
      target_value: number
      measurement_frequency: "hourly" | "daily"
      alert_threshold: number
      
  prediction_baseline:
    viral_score: number (0-100)
    confidence_level: number (0-1)
    performance_benchmarks: object
    competitive_analysis: object
    
  completion_summary:
    total_time_spent: number
    credits_consumed: number
    user_satisfaction: number (1-5, optional)
    completion_timestamp: ISO datetime
    next_steps: array<string>
```

## Cross-Stage Data Flow

### State Persistence
```yaml
pipeline_state:
  current_data:
    active_session: pipeline_session
    working_draft: content_draft
    stage_progress: array<object>
    
  historical_data:
    previous_sessions: array<pipeline_session>
    draft_versions: array<content_draft>
    performance_outcomes: array<object>
    
  cached_data:
    template_cache: object (TTL: 1 hour)
    audio_cache: object (TTL: 24 hours)
    analysis_cache: object (TTL: 6 hours)
```

### Data Validation Rules
```yaml
validation_rules:
  required_fields:
    session_id: "Must be valid UUID"
    user_id: "Must be authenticated user"
    template_id: "Must exist in template database"
    
  business_rules:
    viral_score: "Must be between 0 and 100"
    confidence_level: "Must be between 0 and 1"
    time_spent: "Must be positive number"
    
  referential_integrity:
    template_references: "Template must exist and be active"
    audio_references: "Audio must be available and licensed"
    user_references: "User must have sufficient credits"
```

## API Error Handling

### Standard Error Response
```yaml
error_response:
  error:
    code: string
    message: string
    details: object (optional)
    stage: number (optional)
    recoverable: boolean
    
  recovery_suggestions:
    - action: string
      description: string
      auto_applicable: boolean
      
  metadata:
    request_id: string
    timestamp: ISO datetime
    error_id: string
```

### Stage-Specific Error Codes
```yaml
error_codes:
  stage1:
    - "TEMPLATE_NOT_FOUND": "Selected template no longer available"
    - "INSUFFICIENT_TEMPLATES": "Not enough templates match criteria"
    
  stage2:
    - "HOOK_GENERATION_FAILED": "AI hook generation service unavailable"
    - "THEME_TOO_BROAD": "Content theme requires more specificity"
    
  stage3:
    - "TIMING_CONFLICT": "Beat timing exceeds platform duration limits"
    - "STRUCTURE_INVALID": "Beat structure doesn't match template requirements"
    
  stage4:
    - "AUDIO_UNAVAILABLE": "Selected audio no longer available for use"
    - "SYNC_IMPOSSIBLE": "Audio cannot sync with beat structure"
    
  stage5:
    - "PREVIEW_GENERATION_FAILED": "Preview generation service error"
    - "CONTENT_TOO_COMPLEX": "Content specification too complex for preview"
    
  stage6:
    - "ANALYSIS_TIMEOUT": "Viral analysis took too long to complete"
    - "INSUFFICIENT_DATA": "Not enough data for accurate viral prediction"
    
  stage7:
    - "PLATFORM_API_ERROR": "Publishing platform API unavailable"
    - "CONTENT_POLICY_VIOLATION": "Content violates platform policies"
    
  stage8:
    - "TRACKING_SETUP_FAILED": "Unable to configure performance tracking"
    - "PREDICTION_UNSTABLE": "Viral prediction confidence too low"
```

## Credit Consumption Tracking

### Credit Usage Structure
```yaml
credit_consumption:
  session_id: string
  user_id: string
  total_credits_consumed: number
  
  stage_breakdown:
    - stage: number
      operation: string
      credits_used: number
      timestamp: ISO datetime
      
  optimization_costs:
    - optimization_type: string
      credits_used: number
      impact_achieved: number
      
  final_costs:
    base_pipeline_cost: number (8 credits)
    analysis_cost: number (3-5 credits)
    optimization_cost: number (2-8 credits)
    premium_features_cost: number (optional)
```

---

*These data contracts ensure consistent, reliable data flow through the entire Quick Win Pipeline, enabling seamless integration between stages and robust error handling throughout the 15-minute viral content creation process.*