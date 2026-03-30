# Phase 3: Information Architecture
## Chairman's Hub - Data Sources & API Requirements

**Date:** February 4, 2026
**Purpose:** Map what data feeds each health area, define thresholds, and identify gaps

---

## Executive Summary

The Trendzo codebase has **80+ database tables** and **14+ system health APIs** already built. The Chairman's Hub can leverage most of this existing infrastructure. This document maps what exists, what needs to be created, and how to generate plain English summaries.

---

## Health Area 1: SYSTEM HEALTH

### Purpose
"Is anything broken? Are services up/down?"

### Data Sources (EXISTING)

| Source | Type | What It Provides |
|--------|------|------------------|
| `/api/system-health` | API | Pages healthy/warning/error, components active/total, avg latency |
| `/api/system/health` | API | 12 module statuses (scraper, patternAnalyzer, etc.), error rates, DLQ counts |
| `system_metrics` | Table | Time-series metrics for monitoring |
| `operations_alerts` | Table | Active and historical alerts |
| `operations_log` | Table | High-level operations events |
| Redis | Cache | Real-time health status per module |

### Plain English Generation

```
IF all modules status = 'healthy' AND error_rate < 1%:
  "All systems operational"

IF any module status = 'degraded' OR error_rate > 1%:
  "[Module Name] is responding slowly"

IF any module status = 'down':
  "[Module Name] is DOWN - investigating"

IF pages_error > 0:
  "[X] admin pages have errors"
```

### Thresholds

| Condition | Status | Color |
|-----------|--------|-------|
| All modules healthy, error rate < 1% | Healthy | 🟢 Green |
| Any module degraded OR error rate 1-5% | Warning | 🟡 Yellow |
| Any module down OR error rate > 5% | Critical | 🔴 Red |

### Gaps to Fill

1. **Error logging** - `/api/system-health/errors` returns mock data. Need to connect to real error logging (Sentry, LogRocket, or custom).
2. **Uptime monitoring** - No external uptime monitoring integration. Consider: UptimeRobot, Pingdom, or BetterStack.

---

## Health Area 2: AI PERFORMANCE

### Purpose
"Is the prediction engine working accurately?"

### Data Sources (EXISTING)

| Source | Type | What It Provides |
|--------|------|------------------|
| `/api/system-health/accuracy` | API | Predicted vs actual DPS, avgAccuracy, component scores |
| `/api/validation/metrics` | API | Current accuracy vs target, accuracy by niche, trends |
| `prediction_runs` | Table | Canonical prediction executions with status, DPS, confidence |
| `run_component_results` | Table | Component-level execution results, cache hits |
| `component_reliability` | Table | Accuracy stats per component, performance by niche |
| `prediction_accuracy` | Table | Validated predictions vs actuals |
| `kai_drift_metrics` | Table | Component drift over time |

### Plain English Generation

```
IF avg_accuracy >= 75%:
  "Predictions performing normally (X% accuracy)"

IF avg_accuracy 60-74%:
  "Accuracy below target - may need recalibration"

IF avg_accuracy < 60%:
  "ALERT: Prediction accuracy critically low (X%)"

IF drift_detected = true:
  "Model drift detected in [component] - review recommended"
```

### Thresholds

| Condition | Status | Color |
|-----------|--------|-------|
| Accuracy >= 75%, no drift | Healthy | 🟢 Green |
| Accuracy 60-74% OR minor drift | Warning | 🟡 Yellow |
| Accuracy < 60% OR significant drift | Critical | 🔴 Red |

### Gaps to Fill

1. **Real-time accuracy** - Need automated validation pipeline that compares predictions to actuals after 7 days
2. **Drift detection** - `kai_drift_metrics` exists but may not be actively populated

---

## Health Area 3: REVENUE

### Purpose
"Are we making money? What are the trends?"

### Data Sources (EXISTING)

| Source | Type | What It Provides |
|--------|------|------------------|
| `transactions` | Table | Mini-app purchases, platform share (20%) |
| `earnings_ledger` | Table | All earnings by source type |
| `payouts` | Table | Payout amounts processed |
| `src/lib/monitoring/business-metrics.ts` | Module | `calculateRevenueMetrics()` function |
| `src/lib/monitoring/analytics-reporting.ts` | Module | Revenue KPIs, trends, forecasting |
| `daily_metrics` | Table | Aggregated daily metrics |

### Plain English Generation

```
IF revenue_change > 0:
  "Revenue trending up this week (+X%)"

IF revenue_change between -5% and 0:
  "Revenue stable this week"

IF revenue_change < -5% for 3+ days:
  "Revenue down X% - unusual pattern worth investigating"

IF revenue_this_period > revenue_last_period:
  "You've earned $X this [week/month], up from $Y"
```

### Thresholds

| Condition | Status | Color |
|-----------|--------|-------|
| Revenue growing or stable (±5%) | Healthy | 🟢 Green |
| Revenue down 5-15% | Warning | 🟡 Yellow |
| Revenue down > 15% | Critical | 🔴 Red |

### Gaps to Fill

1. **No `/api/revenue/*` routes** - Revenue metrics exist in modules but no API endpoints
2. **Billing tables incomplete** - `billing_customer`, `billing_subscriptions` referenced but not migrated
3. **Stripe integration partial** - Webhook signature verification commented out
4. **No revenue dashboard UI** - Analytics exist but no dedicated view

### API to Create

```typescript
// NEW: /api/chairman/revenue
GET /api/chairman/revenue
Returns:
{
  current_period: { revenue: number, period: 'day' | 'week' | 'month' },
  previous_period: { revenue: number },
  change_percent: number,
  trend: 'up' | 'stable' | 'down',
  plain_english: "Revenue trending up this week (+12%)"
}
```

---

## Health Area 4: USER ACTIVITY

### Purpose
"Are creators, agencies active and engaged?"

### Data Sources (EXISTING)

| Source | Type | What It Provides |
|--------|------|------------------|
| `profiles` | Table | All users with roles, last_login_at |
| `creators` | Table | Creator accounts, last_activity_at, stats |
| `agencies` | Table | Agency accounts, is_active status |
| `agency_members` | Table | Team members per agency |
| `usage_quotas` | Table | Videos analyzed, API calls per agency |
| `activity_feed` | Table | Denormalized activity feed |
| `audit_log` | Table | All user actions |
| `src/lib/monitoring/business-metrics.ts` | Module | DAU/WAU/MAU, session metrics |

### Plain English Generation

```
IF active_creators >= previous_week:
  "X active creators, engagement stable"

IF active_creators < previous_week * 0.8:
  "Creator logins down X% this week"

IF new_signups > 0:
  "X new creators joined this [week/month]"

IF agency_usage.quota_exceeded:
  "[Agency Name] exceeded their quota this period"
```

### Thresholds

| Condition | Status | Color |
|-----------|--------|-------|
| Activity stable or growing | Healthy | 🟢 Green |
| Activity down 10-20% | Warning | 🟡 Yellow |
| Activity down > 20% | Critical | 🔴 Red |

### Gaps to Fill

1. **No user activity API** - Need to aggregate from multiple tables
2. **DAU/WAU/MAU not actively tracked** - Module exists but may not be connected

### API to Create

```typescript
// NEW: /api/chairman/users
GET /api/chairman/users
Returns:
{
  creators: { active: number, total: number, change_percent: number },
  agencies: { active: number, total: number },
  new_signups_this_week: number,
  plain_english: "147 active creators, engagement stable"
}
```

---

## Health Area 5: APPROVALS QUEUE

### Purpose
"What items need my approval?"

### Data Sources (EXISTING)

| Source | Type | What It Provides |
|--------|------|------------------|
| `payouts` | Table | Pending payouts (status = 'pending') |
| `creators` | Table | Pending verification (verification_status = 'pending') |
| `agencies` | Table | Pending agencies (if approval workflow exists) |
| `mini_apps` | Table | Pending app approvals (approval_status = 'pending') |
| `campaign_participations` | Table | Pending campaign approvals |
| `feature_toggles` | Table | Feature flags (for feature toggle approvals) |

### Plain English Generation

```
IF pending_count = 0:
  "No pending approvals"

IF pending_count > 0:
  "X items need your approval"
  - "2 payout requests ($X total)"
  - "3 agency applications"
  - "1 feature toggle request"
```

### Thresholds

| Condition | Status | Color |
|-----------|--------|-------|
| 0 pending items | Clear | 🟢 Green |
| 1-5 pending items | Attention | 🟡 Yellow |
| 6+ pending items OR items > 48h old | Urgent | 🔴 Red |

### Gaps to Fill

1. **No unified approval queue API** - Each entity has separate status tracking
2. **No approval age tracking** - Need to track how long items have been pending
3. **Feature toggle approval workflow** - Table exists but no approval workflow

### API to Create

```typescript
// NEW: /api/chairman/approvals
GET /api/chairman/approvals
Returns:
{
  total_pending: number,
  by_type: {
    payouts: { count: number, total_amount: number, oldest_days: number },
    creators: { count: number, oldest_days: number },
    agencies: { count: number, oldest_days: number },
    features: { count: number }
  },
  plain_english: "5 items need your approval"
}
```

---

## Health Area 6: DATA PIPELINE

### Purpose
"Is scraping, training data, ingestion working?"

### Data Sources (EXISTING)

| Source | Type | What It Provides |
|--------|------|------------------|
| `/api/system/ingest/summary` | API | Records processed in last 24h |
| `/api/training/stats` | API | Training data stats, samples by tier, readiness |
| `scraping_jobs` | Table | Scraping job status, progress |
| `scraping_runs` | Table | Individual scraping runs |
| `scraping_metrics` | Table | Scraping performance |
| `training_jobs` | Table | Training pipeline jobs |
| `training_data` | Table | Training samples, quality scores |
| `bulk_download_jobs` | Table | Bulk download status |
| `feature_health` | Table | Feature extraction quality, coverage, drift |

### Plain English Generation

```
IF all jobs healthy AND processed_24h > threshold:
  "Training data collection healthy"

IF scraping paused OR failed:
  "Scraping paused - [reason]"

IF training_job failed:
  "Training job failed - review needed"

IF feature_coverage < 80%:
  "Feature extraction coverage low (X%)"
```

### Thresholds

| Condition | Status | Color |
|-----------|--------|-------|
| All pipelines running, >1000 records/24h | Healthy | 🟢 Green |
| Pipeline slow OR records < 500/24h | Warning | 🟡 Yellow |
| Pipeline stopped OR jobs failing | Critical | 🔴 Red |

### Gaps to Fill

1. **Scraping status API** - Jobs table exists but no summary API
2. **Training pipeline status API** - Similar gap

### API to Create

```typescript
// NEW: /api/chairman/pipeline
GET /api/chairman/pipeline
Returns:
{
  scraping: { status: string, jobs_active: number, videos_24h: number },
  training: { status: string, samples_ready: number, last_job: Date },
  ingestion: { records_24h: number, errors_24h: number },
  plain_english: "Training data collection healthy"
}
```

---

## NEW: Strategic Prompts Integration

### Purpose
Daily prompts for value creation, moat building, and industry news

### Data Sources (NEW - NEED TO BUILD)

| Source | Type | What It Provides |
|--------|------|------------------|
| Internal prompts DB | Table | Rotating value/moat prompts |
| News API | External | AI/marketing news (last 24h) |

### Implementation Options

**For Rotating Prompts:**
- Create `strategic_prompts` table with categories: 'value', 'moat', 'improvement'
- Serve one random prompt per category per day
- Track which prompts have been shown (avoid repeats)

**For News Integration:**
- Option 1: **NewsAPI.org** - $449/mo for commercial use, good coverage
- Option 2: **Bing News Search API** - $7/1000 calls, Microsoft Azure
- Option 3: **Google News RSS** - Free but less structured
- Option 4: **Perplexity API** - AI-summarized news, good for tech topics

### Recommended Approach

```typescript
// NEW: /api/chairman/prompts
GET /api/chairman/prompts
Returns:
{
  daily_prompt: {
    category: 'value' | 'moat' | 'improvement',
    text: "What's one feature that could 10x creator retention?",
    dismissable: true
  },
  news: [
    {
      category: 'ai',
      headline: "OpenAI releases new API features",
      source: "TechCrunch",
      url: "...",
      published_at: "2h ago"
    },
    {
      category: 'marketing',
      headline: "TikTok algorithm update affects reach",
      source: "Social Media Today",
      url: "...",
      published_at: "5h ago"
    }
  ]
}
```

### Budget Estimate for News

| Option | Cost | Recommendation |
|--------|------|----------------|
| NewsAPI.org | $449/mo | Overkill for 1 user |
| Bing News API | ~$50/mo (7000 calls) | Good balance |
| Perplexity API | ~$20/mo | Best for AI-summarized |
| Google RSS + scraping | Free | Manual but free |

---

## NEW: SMS Alert Integration

### Purpose
Critical alerts sent to chairman's phone

### Implementation Options

| Service | Cost | Ease |
|---------|------|------|
| **Twilio** | $0.0079/SMS | Industry standard, easy setup |
| **AWS SNS** | $0.00645/SMS | Cheaper, more complex |
| **Vonage** | $0.0077/SMS | Similar to Twilio |
| **Plivo** | $0.0050/SMS | Cheapest, less features |

### Recommended: Twilio

**Why:** Most documentation, easiest setup, reliable delivery

**Implementation:**

```typescript
// NEW: /api/chairman/alerts/sms
POST /api/chairman/alerts/sms
Body: {
  type: 'system_down' | 'error_rate' | 'revenue_drop',
  message: "TRENDZO ALERT: Payment service is DOWN",
  severity: 'critical'
}

// Triggers
// 1. System module goes DOWN
// 2. Error rate exceeds threshold (configurable)
// 3. (Future) Revenue drops > X%
```

**Environment Variables Needed:**
```
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
CHAIRMAN_PHONE_NUMBER=+1987654321
```

### Alert Configuration Table

```sql
-- NEW: chairman_alert_config
CREATE TABLE chairman_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'system_down', 'error_rate', 'revenue_drop'
  enabled BOOLEAN DEFAULT true,
  threshold NUMERIC, -- e.g., error_rate > 5
  cooldown_minutes INT DEFAULT 30, -- don't spam
  channels TEXT[] DEFAULT ARRAY['sms', 'email', 'in_app'],
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Summary: What Exists vs. What to Build

### ✅ EXISTS (Ready to Use)

| Component | Source |
|-----------|--------|
| System health monitoring | `/api/system-health`, `/api/system/health` |
| Component reliability | `component_reliability` table |
| Prediction accuracy | `/api/system-health/accuracy`, `/api/validation/metrics` |
| User profiles & roles | `profiles`, `creators`, `agencies` tables |
| Payout tracking | `payouts`, `earnings_ledger` tables |
| Training pipeline stats | `/api/training/stats` |
| Activity & audit logs | `activity_feed`, `audit_log` tables |
| Approval status fields | In `creators`, `mini_apps`, `campaign_participations` |

### 🔨 NEEDS TO BE BUILT

| Component | Priority | Effort |
|-----------|----------|--------|
| `/api/chairman/status` (unified health) | HIGH | Medium |
| `/api/chairman/revenue` | HIGH | Medium |
| `/api/chairman/users` | HIGH | Low |
| `/api/chairman/approvals` | HIGH | Low |
| `/api/chairman/pipeline` | MEDIUM | Low |
| `/api/chairman/prompts` | MEDIUM | Medium |
| SMS integration (Twilio) | HIGH | Low |
| News API integration | LOW | Medium |
| `chairman_alert_config` table | HIGH | Low |
| Error logging connection | MEDIUM | Medium |

### API Architecture

```
/api/chairman/
├── status          # Unified health across all 6 areas
├── revenue         # Revenue metrics + plain English
├── users           # User activity metrics
├── approvals       # Unified approval queue
├── pipeline        # Data pipeline status
├── prompts         # Strategic prompts + news
└── alerts/
    ├── config      # Alert configuration
    └── sms         # Trigger SMS alert
```

---

## Phase 3 Complete

This Information Architecture provides:

1. **Complete mapping** of what data feeds each health area
2. **Plain English templates** for generating human-readable summaries
3. **Threshold definitions** for green/yellow/red status
4. **Gap analysis** showing what exists vs. needs building
5. **New API specifications** for the Chairman's Hub
6. **SMS/News integration** recommendations with costs

**Next:** Phase 4 - Design Synthesis (wireframes + component layout)
