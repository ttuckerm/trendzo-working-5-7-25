# Internal Services API Catalog

## Core Service Architecture

The Trendzo platform is built on a microservices architecture with clear separation between viral prediction, content analysis, user management, and operations.

## Authentication & Authorization

### Auth Service
**Base URL**: `/api/auth`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/login` | POST | User authentication | `{email, password}` | `{token, user, expires}` |
| `/refresh` | POST | Token refresh | `{refresh_token}` | `{token, expires}` |
| `/logout` | POST | Session termination | `{token}` | `{success}` |
| `/verify` | GET | Token validation | Headers: `Authorization` | `{valid, user, permissions}` |

## Template Management

### Templates Service
**Base URL**: `/api/templates`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/` | GET | List templates | Query: `range, platform, niche, status` | `{templates[], metadata}` |
| `/{id}` | GET | Template details | Path: `template_id` | `{template, examples, analytics}` |
| `/{id}/analyze` | POST | Analyze against template | `{content_url OR file}` | `{score, matches, suggestions}` |
| `/{id}/variants` | GET | Template variations | Query: `type, limit` | `{variants[], generation_rules}` |
| `/search` | POST | Search templates | `{query, filters, sort}` | `{results[], facets, pagination}` |
| `/trending` | GET | Trending templates | Query: `window, platform` | `{hot[], cooling[], new[]}` |

### Template Evolution
**Base URL**: `/api/templates/evolution`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/generate` | POST | Create new template | `{source_videos[], pattern_name}` | `{template_draft, confidence}` |
| `/optimize` | POST | Optimize existing template | `{template_id, optimization_type}` | `{optimized_template, improvements}` |
| `/retire` | POST | Archive low-performing template | `{template_id, reason}` | `{archived, replacement_suggestions}` |
| `/patterns` | GET | Viral pattern analysis | Query: `date_range, platform` | `{emerging_patterns[], declining_patterns[]}` |

## Content Analysis

### Analysis Engine
**Base URL**: `/api/analyze`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/video` | POST | Analyze video content | `{video_file OR url, template_id?}` | `{viral_score, breakdown, suggestions}` |
| `/batch` | POST | Batch analysis | `{videos[], template_ids?}` | `{results[], summary, failed[]}` |
| `/text` | POST | Analyze script/caption | `{text, platform, niche}` | `{engagement_score, improvements}` |
| `/audio` | POST | Audio trend analysis | `{audio_file OR audio_id}` | `{trending_score, sync_opportunities}` |

### Feature Extraction
**Base URL**: `/api/features`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/extract` | POST | Extract viral features | `{video_url OR file}` | `{visual[], audio[], text[], timing[]}` |
| `/compare` | POST | Compare feature sets | `{features_a, features_b}` | `{similarity, differences, recommendations}` |
| `/dna` | POST | Generate viral DNA signature | `{video_features}` | `{dna_signature, confidence, components}` |

## Quick Win Pipeline

### Quick Win Service
**Base URL**: `/api/quickwin`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/start` | POST | Initialize pipeline | `{user_id, niche?, goal?}` | `{session_id, starter_templates[]}` |
| `/hooks/generate` | POST | Generate hooks | `{session_id, template_id, theme}` | `{hooks[], scores[]}` |
| `/beats/structure` | POST | Structure content beats | `{session_id, hook, content_themes[]}` | `{beat_structure, timing}` |
| `/audio/recommend` | GET | Recommend trending audio | Query: `session_id, beat_requirements` | `{audio_options[], sync_data}` |
| `/preview/generate` | POST | Generate content preview | `{session_id, finalized_structure}` | `{preview_url, storyboard}` |
| `/score` | POST | Calculate viral score | `{session_id, content_spec}` | `{viral_score, confidence, factors}` |
| `/optimize` | POST | Apply AI optimizations | `{session_id, fixes_to_apply[]}` | `{optimized_content, new_score}` |
| `/schedule` | POST | Generate publishing schedule | `{session_id, preferences}` | `{optimal_times[], platform_specs}` |

### Draft Management  
**Base URL**: `/api/drafts`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/` | GET | List user drafts | Query: `status, template_id, created_after` | `{drafts[], pagination}` |
| `/{id}` | GET | Draft details | Path: `draft_id` | `{draft, version_history, analytics}` |
| `/{id}` | PUT | Update draft | `{draft_updates}` | `{updated_draft, validation_results}` |
| `/{id}/analyze` | POST | Re-analyze draft | Path: `draft_id` | `{updated_score, new_suggestions}` |
| `/{id}/export` | POST | Export for publishing | `{platform, format_options}` | `{export_package, download_url}` |

## Discovery & Intelligence

### Discovery Service
**Base URL**: `/api/discovery`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/metrics` | GET | System discovery metrics | None | `{system, templates, discovery}` |
| `/readiness` | GET | Discovery system health | None | `{ready, scores, reasons[]}` |
| `/scan` | POST | Scan for new patterns | `{platforms[], date_range}` | `{scan_id, estimated_completion}` |
| `/results/{scan_id}` | GET | Scan results | Path: `scan_id` | `{patterns[], templates[], confidence}` |
| `/qa-seed` | POST | Populate test data | Headers: `x-user-id` | `{audit_id, items_created}` |

### Script Intelligence
**Base URL**: `/api/scripts`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/patterns` | GET | Script pattern library | Query: `category, performance_tier` | `{patterns[], usage_stats}` |
| `/analyze` | POST | Analyze script content | `{script_text, context}` | `{pattern_matches[], suggestions}` |
| `/generate` | POST | Generate script variations | `{base_script, variation_type, count}` | `{variations[], confidence_scores[]}` |

## Operations & Admin

### Admin Service
**Base URL**: `/api/admin`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/users` | GET | User management | Query: `filter, sort, page` | `{users[], total, pagination}` |
| `/users/{id}/credits` | POST | Manage user credits | `{credit_amount, reason, type}` | `{new_balance, transaction_id}` |
| `/system/health` | GET | System health check | None | `{services[], overall_health, alerts[]}` |
| `/pipeline/actions/recompute-discovery` | POST | Trigger discovery recompute | Headers: `x-user-id` | `{audit_id, status}` |
| `/pipeline/actions/warm-examples` | POST | Warm template examples | Headers: `x-user-id` | `{audit_id, warmed_count}` |

### Analytics Service
**Base URL**: `/api/analytics`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/usage` | GET | Platform usage metrics | Query: `date_range, granularity` | `{metrics, trends, comparisons}` |
| `/performance` | GET | Template performance analytics | Query: `template_ids[], window` | `{performance_data, benchmarks}` |
| `/predictions` | GET | Prediction accuracy tracking | Query: `date_range, confidence_threshold` | `{accuracy_metrics, drift_analysis}` |

## External Integration Management

### Integration Service
**Base URL**: `/api/integrations`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/zapier/test` | POST | Test Zapier integration | `{webhook_url, test_data}` | `{delivered, response_code, latency}` |
| `/make/test` | POST | Test Make.com integration | `{webhook_url, test_data}` | `{delivered, response_code, latency}` |
| `/platforms/connect` | POST | Connect social platform | `{platform, credentials}` | `{connected, permissions[], expires}` |
| `/export/schedule` | POST | Schedule content export | `{content_id, platform, timing}` | `{scheduled, job_id, estimated_delivery}` |

## Validation & Testing

### Validation Service
**Base URL**: `/api/validation`

| Endpoint | Method | Purpose | Request | Response |
|----------|---------|---------|---------|----------|
| `/run` | POST | Execute validation run | `{template_ids[], test_count, validation_type}` | `{run_id, estimated_duration}` |
| `/results/{run_id}` | GET | Validation results | Path: `run_id` | `{results[], accuracy, calibration}` |
| `/calibrate` | POST | Calibrate prediction model | `{actual_results[], predicted_results[]}` | `{calibration_factor, accuracy_improvement}` |
| `/summary` | GET | Validation summary | Query: `date_range` | `{runs[], avg_accuracy, trends}` |

## Error Handling & Status Codes

### Standard Response Format
```yaml
success_response:
  data: object | array
  metadata:
    timestamp: ISO datetime
    request_id: string
    processing_time_ms: number

error_response:
  error:
    code: string
    message: string
    details: object | null
  metadata:
    timestamp: ISO datetime
    request_id: string
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Rate Limited (too many requests)
- **500**: Internal Server Error
- **503**: Service Unavailable (maintenance mode)

## Rate Limiting & Quotas

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Service-Specific Limits
| Service | Free Tier | Paid Tier | Admin |
|---------|-----------|-----------|-------|
| Templates | 100/hour | 1000/hour | Unlimited |
| Analysis | 10/hour | 100/hour | 500/hour |
| Quick Win | 5/day | 50/day | 200/day |
| Discovery | Read-only | Read-only | Full access |

---

*All endpoints require authentication unless explicitly marked as public. Use Bearer token authentication in Authorization header.*