# FEAT-071 — Unified Creator Workflow (6-Step System)

**Version**: 1.0
**Status**: Draft
**Owner**: Product Team
**Created**: 2025-10-22
**Objective(s)**: OBJ-01 through OBJ-05

---

## 1) Purpose & Objective

### Objectives Served
- **OBJ-01**: Build and engage following and grow audience
- **OBJ-02**: Increase engagement to boost likes, comments, or shares
- **OBJ-03**: Drive web traffic and get more visitors
- **OBJ-04**: Generate leads and collect potential customers
- **OBJ-05**: Increase brand awareness or build recognition

### Job-to-be-Done
As a **TikTok creator**, I want to **create viral content that achieves my specific business goal** (followers, engagement, traffic, leads, or awareness) by **following a proven, data-backed process** so that I **don't waste time on content that won't perform**.

### What This Feature Delivers
A unified, single-page workflow that guides creators from goal selection through content creation, prediction, and publishing using:
- **61 proven framework templates**
- **9 Attributes viral scoring system**
- **DPS-powered viral benchmarking**
- **Multi-LLM prediction engine (GPT-4 + Claude + Gemini)**
- **Real viral video examples from scraped database**

### Non-Goals
- ❌ Video recording/editing (partner with Captions, Descript)
- ❌ Multi-platform scheduling (TikTok only for MVP)
- ❌ Analytics dashboard (post-publish tracking is future FEAT-072)
- ❌ Template UI system (separate, future implementation)
- ❌ Team collaboration features

---

## 2) User Stories & Edge Cases

### Primary User Story
**As a creator**, I can:
1. Select my business goal (1 of 5 objectives)
2. See 10 viral videos achieving that goal in my niche
3. Choose a proven framework template to follow
4. Fill in 9 content fields (auto-suggested by AI)
5. Get a viral prediction score (0-100) with exact fixes
6. Export my script to recording tools

**So that** I create content with 70%+ viral success rate (vs. industry 5-10%).

### Edge Cases

#### Empty States
- **User has no niche selected**: Show all niches, prompt to filter
- **No viral videos in selected niche**: Show adjacent niches + option to expand search
- **Prediction API timeout**: Show cached prediction, flag as "approximate"
- **No frameworks match user's goal**: Fall back to 9 Attributes generic template

#### Error States
- **FEAT-001 Scraper offline**: Load from cached viral videos (last 30 days)
- **FEAT-070 Prediction fails**: Show last successful prediction + warning banner
- **User's script < 10 words**: Block prediction, show "script too short" error
- **Rate limit hit (OpenAI/Anthropic)**: Queue prediction, notify user (ETA: 2 min)

#### Partial Success
- **Only 3 viral videos found** (need 10): Show 3 + message "limited examples in niche"
- **Framework confidence < 60%**: Show framework + disclaimer "experimental match"
- **Prediction score exactly 70**: Show "borderline viral - small tweaks recommended"

#### Retries & Idempotency
- **Prediction request retry**: Use `auditId` to deduplicate (return cached if exists)
- **Framework classification retry**: Cache result for 24h, reuse on retry
- **Viral video fetch retry**: Exponential backoff (1s, 2s, 4s), max 3 attempts

#### Quotas & Limits
- **Free tier**: 5 predictions/day, 20 framework views/day
- **Pro tier**: 50 predictions/day, unlimited framework views
- **Enterprise**: Unlimited

---

## 3) UI Contract (States + TestIDs)

### Screens/Routes
- **Primary route**: `/creator-workflow` (single-page app)
- **Sub-routes** (fragment navigation):
  - `#step-1-goal`
  - `#step-2-discover`
  - `#step-3-design`
  - `#step-4-predict`

### States

#### Global Workflow State
- `idle` → User lands, sees goal picker
- `goal_selected` → Goal chosen, discovering viral videos
- `discovering` → Fetching viral videos (FEAT-001 + FEAT-002)
- `discovery_ready` → 10 videos displayed
- `discovery_error` → Show error + retry button
- `designing` → User filling 9 fields
- `design_ready` → All required fields filled
- `predicting` → Calling FEAT-070 prediction API
- `prediction_ready` → Score displayed with recommendations
- `prediction_error` → Show error + retry button

#### Per-Step States
**Step 1 (Goal Selection)**
- Empty: 5 goal cards visible
- Loading: N/A (instant)
- Ready: Goal selected, button enabled
- Error: N/A

**Step 2 (Discover)**
- Empty: "No viral videos found in [niche]"
- Loading: Skeleton cards (10 placeholders)
- Ready: 10 video cards with DPS scores
- Error: "Failed to load videos. [Retry]"
- Partial: "Only 3 videos found. [Expand search]"

**Step 3 (Design)**
- Empty: 9 blank fields
- Loading: AI suggestions populating fields
- Ready: All 9 fields auto-filled (user can edit)
- Error: "AI suggestions failed. [Retry] or [Fill manually]"

**Step 4 (Predict)**
- Empty: N/A
- Loading: "Analyzing your script... (15-30s)"
- Ready: Score displayed (Green/Yellow/Red)
- Error: "Prediction failed. [Retry]"

### TestIDs

#### Navigation
- `Creator-Workflow-Header`
- `Progress-Bar` (shows 1/4, 2/4, 3/4, 4/4)
- `Btn-Back` (navigate to previous step)
- `Btn-Next` (navigate to next step, disabled if requirements not met)

#### Step 1: Goal Selection
- `Goal-Card-Followers` (OBJ-01)
- `Goal-Card-Engagement` (OBJ-02)
- `Goal-Card-Traffic` (OBJ-03)
- `Goal-Card-Leads` (OBJ-04)
- `Goal-Card-Awareness` (OBJ-05)
- `Goal-Selected-Badge` (shows selected goal)

#### Step 2: Discover
- `Discover-Grid`
- `Video-Card-{video_id}` (10 cards)
- `Video-DPS-Score-{video_id}`
- `Video-Hook-{video_id}`
- `Video-Views-{video_id}`
- `Btn-Watch-Video-{video_id}`
- `Filter-Niche-Dropdown`
- `Filter-Platform-Dropdown`
- `Btn-Expand-Search`

#### Step 3: Design
- `Design-Form`
- `Field-Topic`
- `Field-Angle`
- `Field-Hook-Spoken`
- `Field-Hook-Text`
- `Field-Hook-Visual`
- `Field-Story-Structure`
- `Field-Visual-Format`
- `Field-Key-Visuals`
- `Field-Audio`
- `Btn-AI-Suggest` (auto-fill all fields)
- `Framework-Badge` (shows matched framework name)
- `Framework-Success-Rate` (e.g., "91% success rate")

#### Step 4: Predict
- `Prediction-Score-Circle` (displays 0-100)
- `Prediction-Status-Badge` (Green/Yellow/Red)
- `Prediction-Projected-Views`
- `Prediction-Projected-Engagement`
- `Whats-Working-Section`
- `Whats-Working-Item-{index}`
- `Suggested-Improvements-Section`
- `Suggested-Improvement-{index}`
- `Btn-Apply-Fix-{index}` (one-click fix)
- `Recommended-Hooks-Section`
- `Recommended-Hook-{index}`
- `Btn-Copy-Script`
- `Btn-Export-To-Teleprompter`

#### Shared Components
- `Toast-Success`
- `Toast-Error`
- `Toast-Info`
- `Toast-Loading`
- `Banner-AuditId` (displays auditId for debugging)
- `Modal-Video-Player` (plays viral video examples)

### Accessibility
- **Labels**: All form fields have `aria-label` or associated `<label>`
- **Focus order**: Tab navigation follows visual flow (goal → discover → design → predict)
- **Keyboard shortcuts**:
  - `Enter` on goal card = select goal
  - `Arrow keys` = navigate between video cards
  - `Cmd+Enter` = submit prediction
- **Screen reader**: All states announced via `aria-live="polite"` regions
- **Color contrast**: WCAG AA compliant (4.5:1 for text)

---

## 4) Contracts (Spec-as-Code)

### Server Actions

#### `actSelectGoal(goalId: string) -> {success: boolean, goalData: Goal}`
**Purpose**: Record user's selected objective
**Inputs**:
```typescript
{
  goalId: "OBJ-01" | "OBJ-02" | "OBJ-03" | "OBJ-04" | "OBJ-05"
}
```
**Outputs**:
```typescript
{
  success: true,
  goalData: {
    id: "OBJ-01",
    name: "Build engaged following",
    description: "Grow audience and increase follower count",
    kpi: "follower_growth_rate",
    target: 0.15, // 15% monthly growth
    auditId: "aud_sel_goal_abc123"
  }
}
```
**Error Cases**:
- Invalid goalId → `{success: false, error: "Invalid goal"}`

---

#### `actDiscoverViralVideos(goalId: string, niche: string, limit: number) -> {videos: Video[], auditId: string}`
**Purpose**: Fetch viral videos matching goal + niche using FEAT-001 + FEAT-002
**Inputs**:
```typescript
{
  goalId: "OBJ-01",
  niche: "personal-finance",
  limit: 10
}
```
**Outputs**:
```typescript
{
  success: true,
  videos: [
    {
      video_id: "tiktok_7123456789",
      dps_score: 82,
      views: 3200000,
      likes: 187900,
      hook: "I've been doing taxes wrong for 10 years...",
      framework_id: "fw_mistake_prevention",
      framework_name: "Mistake Prevention",
      platform: "tiktok",
      url: "https://tiktok.com/@user/video/7123456789",
      thumbnail: "https://...",
      creator: "@financeguru"
    },
    // ... 9 more videos
  ],
  auditId: "aud_discover_xyz789"
}
```
**Error Cases**:
- No videos found → `{success: true, videos: [], message: "No viral videos in niche"}`
- Scraper offline → `{success: false, error: "Scraper unavailable", cached: true, videos: [...]}`

---

#### `actSuggestContent(goalId: string, viralExamples: Video[], userNiche: string) -> {suggestions: NineFields, auditId: string}`
**Purpose**: Use FEAT-060 Knowledge Extraction to auto-fill 9 content fields
**Inputs**:
```typescript
{
  goalId: "OBJ-01",
  viralExamples: [...], // Array of 3-5 selected viral videos
  userNiche: "personal-finance"
}
```
**Outputs**:
```typescript
{
  success: true,
  suggestions: {
    topic: "Common tax filing mistakes costing you money",
    angle: "Expert reveals the #1 mistake",
    hook_spoken: "I've been doing taxes wrong for 10 years...",
    hook_text: "Are YOU making this tax mistake?",
    hook_visual: "Show tax form with red X over common error",
    story_structure: "Problem → Agitation → Solution",
    visual_format: "Talking head with B-roll overlays",
    key_visuals: ["Tax form close-up", "Calculator showing savings", "Expert pointing at mistake"],
    audio: "Upbeat motivational (trending: 'Level Up' by...)"
  },
  framework_matched: {
    id: "fw_mistake_prevention",
    name: "Mistake Prevention",
    success_rate: 0.91,
    confidence: 0.87
  },
  auditId: "aud_suggest_def456"
}
```
**Error Cases**:
- LLM timeout → `{success: false, error: "AI suggestion timeout", retry: true}`
- No framework match → Fall back to generic 9 Attributes template

---

#### `actPredictViral(script: NineFields, goalId: string, niche: string) -> {prediction: Prediction, auditId: string}`
**Purpose**: Call FEAT-070 Pre-Content Prediction API
**Inputs**:
```typescript
{
  script: {
    topic: "...",
    angle: "...",
    hook_spoken: "...",
    hook_text: "...",
    hook_visual: "...",
    story_structure: "...",
    visual_format: "...",
    key_visuals: [...],
    audio: "..."
  },
  goalId: "OBJ-01",
  niche: "personal-finance"
}
```
**Outputs**:
```typescript
{
  success: true,
  prediction: {
    dps_score: 78,
    status: "green", // green (≥70), yellow (60-69), red (<60)
    projected_views: {
      min: 500000,
      max: 1500000,
      avg: 850000
    },
    projected_engagement_rate: 0.12, // 12%
    share_potential: "high",
    nine_attributes_breakdown: {
      tam_resonance: 0.85,
      sharability: 0.92,
      hook_strength: 0.88,
      format_innovation: 0.75,
      value_density: 0.80,
      pacing_rhythm: 0.78,
      curiosity_gaps: 0.83,
      emotional_journey: 0.90,
      payoff_satisfaction: 0.82
    },
    whats_working: [
      "Strong hook pattern detected (matches 'question hook')",
      "Curiosity gap creates engagement",
      "Clear value proposition"
    ],
    suggested_improvements: [
      {
        issue: "Hook timing could be tighter",
        fix: "Move 'I've been doing taxes wrong' to first 2 seconds (currently 4s)",
        impact: "+5-8 DPS points",
        one_click_fix: true
      },
      {
        issue: "Missing emotional trigger in opening",
        fix: "Add fear-based trigger: 'This mistake cost me $5,000'",
        impact: "+3-5 DPS points",
        one_click_fix: false
      }
    ],
    recommended_hooks: [
      "POV: You finally discovered the tax loophole...",
      "This is your sign to stop overpaying the IRS",
      "No one talks about this tax secret but..."
    ]
  },
  auditId: "aud_predict_ghi789"
}
```
**Error Cases**:
- Prediction API down → `{success: false, error: "Prediction unavailable", cached_score: 72, stale: true}`
- Script too short → `{success: false, error: "Script must be at least 10 words"}`
- Rate limit → `{success: false, error: "Rate limit exceeded", retry_after: 120}` (seconds)

---

### HTTP APIs

#### GET `/api/creator-workflow/goals`
**Purpose**: Fetch 5 available objectives
**Response** (200):
```json
{
  "goals": [
    {"id": "OBJ-01", "name": "Build engaged following", "icon": "👥"},
    {"id": "OBJ-02", "name": "Boost engagement", "icon": "⚡"},
    {"id": "OBJ-03", "name": "Drive traffic", "icon": "🌐"},
    {"id": "OBJ-04", "name": "Generate leads", "icon": "📧"},
    {"id": "OBJ-05", "name": "Build awareness", "icon": "🏆"}
  ]
}
```

---

#### POST `/api/creator-workflow/discover`
**Purpose**: Trigger viral video discovery
**Request**:
```json
{
  "goalId": "OBJ-01",
  "niche": "personal-finance",
  "limit": 10
}
```
**Response** (200):
```json
{
  "videos": [...], // See actDiscoverViralVideos output
  "auditId": "aud_discover_xyz789"
}
```
**Response** (503) - Scraper Offline:
```json
{
  "error": "Scraper unavailable",
  "cached": true,
  "videos": [...], // Stale data from last 30 days
  "cache_age_hours": 12
}
```

---

#### POST `/api/creator-workflow/suggest`
**Purpose**: Get AI-powered content suggestions
**Request**:
```json
{
  "goalId": "OBJ-01",
  "viralExamples": ["video_id_1", "video_id_2", "video_id_3"],
  "userNiche": "personal-finance"
}
```
**Response** (200):
```json
{
  "suggestions": {...}, // See actSuggestContent output
  "framework_matched": {...},
  "auditId": "aud_suggest_def456"
}
```
**Response** (408) - Timeout:
```json
{
  "error": "AI suggestion timeout",
  "retry": true,
  "partial_suggestions": {
    "topic": "Common tax mistakes",
    "angle": null,
    // ... incomplete
  }
}
```

---

#### POST `/api/creator-workflow/predict`
**Purpose**: Get viral prediction score
**Request**:
```json
{
  "script": {
    "topic": "...",
    "angle": "...",
    // ... all 9 fields
  },
  "goalId": "OBJ-01",
  "niche": "personal-finance"
}
```
**Response** (200):
```json
{
  "prediction": {...}, // See actPredictViral output
  "auditId": "aud_predict_ghi789"
}
```
**Response** (429) - Rate Limit:
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 120,
  "limit": "5 predictions/day (free tier)",
  "upgrade_url": "/pricing"
}
```

---

### Events (JSON Schemas)

#### EVT.CreatorWorkflow.GoalSelected v1
**Producer**: `actSelectGoal`
**Consumers**: Analytics service, Recommendation engine
**Payload**:
```json
{
  "event": "EVT.CreatorWorkflow.GoalSelected",
  "version": 1,
  "auditId": "aud_sel_goal_abc123",
  "timestamp": "2025-10-22T14:32:10Z",
  "userId": "user_xyz",
  "data": {
    "goalId": "OBJ-01",
    "goalName": "Build engaged following",
    "source": "creator-workflow-ui"
  }
}
```

---

#### EVT.CreatorWorkflow.DiscoveryComplete v1
**Producer**: `actDiscoverViralVideos`
**Consumers**: Analytics service
**Payload**:
```json
{
  "event": "EVT.CreatorWorkflow.DiscoveryComplete",
  "version": 1,
  "auditId": "aud_discover_xyz789",
  "timestamp": "2025-10-22T14:33:45Z",
  "userId": "user_xyz",
  "data": {
    "goalId": "OBJ-01",
    "niche": "personal-finance",
    "videos_found": 10,
    "avg_dps_score": 78.5,
    "latency_ms": 1243
  }
}
```

---

#### EVT.CreatorWorkflow.PredictionGenerated v1
**Producer**: `actPredictViral`
**Consumers**: Analytics service, ML training pipeline
**Payload**:
```json
{
  "event": "EVT.CreatorWorkflow.PredictionGenerated",
  "version": 1,
  "auditId": "aud_predict_ghi789",
  "timestamp": "2025-10-22T14:38:20Z",
  "userId": "user_xyz",
  "data": {
    "goalId": "OBJ-01",
    "niche": "personal-finance",
    "predicted_dps": 78,
    "status": "green",
    "script_word_count": 127,
    "framework_used": "fw_mistake_prevention",
    "latency_ms": 18453
  }
}
```

---

## 5) Data Model & Events

### New Tables

#### `creator_workflows` (user session state)
```sql
CREATE TABLE creator_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  goal_id VARCHAR(10) NOT NULL, -- OBJ-01 through OBJ-05
  niche VARCHAR(100),
  status VARCHAR(50) NOT NULL, -- 'goal_selected', 'discovering', 'designing', 'predicting', 'complete'

  -- Step 2: Discover
  discovered_videos JSONB, -- Array of video_id's

  -- Step 3: Design
  script_draft JSONB, -- 9 fields (topic, angle, hooks, etc.)
  framework_id UUID REFERENCES frameworks(id),
  framework_confidence NUMERIC(3,2),

  -- Step 4: Predict
  prediction_result JSONB, -- Full prediction object
  predicted_dps NUMERIC(10,2),

  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_id VARCHAR(255) NOT NULL UNIQUE, -- For tracing

  -- Privacy & Retention
  pii_flags JSONB DEFAULT '{}', -- Empty for now, user-generated scripts may contain PII
  retention_days INT DEFAULT 90 -- Auto-delete after 90 days
);

CREATE INDEX idx_workflows_user ON creator_workflows(user_id);
CREATE INDEX idx_workflows_status ON creator_workflows(status);
CREATE INDEX idx_workflows_audit ON creator_workflows(audit_id);
```

**PII Flags**: User-generated scripts may contain personal info (names, locations). Flag for review before analytics.

**Exportability**: Users can export their workflow history via `/api/user/export` (GDPR compliance).

---

#### `workflow_events` (audit trail)
```sql
CREATE TABLE workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES creator_workflows(id),
  event_type VARCHAR(100) NOT NULL, -- 'goal_selected', 'discovery_complete', 'prediction_generated'
  event_data JSONB NOT NULL,
  audit_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_workflow ON workflow_events(workflow_id);
CREATE INDEX idx_events_type ON workflow_events(event_type);
```

---

### Events Emitted
- `EVT.CreatorWorkflow.GoalSelected` (when user picks objective)
- `EVT.CreatorWorkflow.DiscoveryComplete` (when viral videos loaded)
- `EVT.CreatorWorkflow.SuggestionGenerated` (when AI fills 9 fields)
- `EVT.CreatorWorkflow.PredictionGenerated` (when score calculated)
- `EVT.CreatorWorkflow.ScriptExported` (when user copies/exports)

---

### Events Consumed
- `EVT.Video.Scraped` (from FEAT-001, to populate discovery)
- `EVT.DPS.Calculated` (from FEAT-002, to filter viral videos)
- `EVT.Knowledge.Extracted` (from FEAT-060, to power suggestions)

---

## 6) Acceptance Checks (Visible)

### DOM Checks
**Step 1: Goal Selection**
- [ ] `Goal-Card-Followers` present with click handler
- [ ] Clicking goal card updates `Goal-Selected-Badge`
- [ ] `Btn-Next` enabled after goal selected

**Step 2: Discover**
- [ ] 10 `Video-Card-{video_id}` elements rendered
- [ ] Each card shows `Video-DPS-Score-{video_id}` (value ≥ 70)
- [ ] `Btn-Watch-Video-{video_id}` opens modal video player

**Step 3: Design**
- [ ] All 9 field TestIDs present: `Field-Topic` through `Field-Audio`
- [ ] `Btn-AI-Suggest` triggers auto-fill (all fields populated within 10s)
- [ ] `Framework-Badge` shows framework name
- [ ] `Framework-Success-Rate` shows percentage (e.g., "91%")

**Step 4: Predict**
- [ ] `Prediction-Score-Circle` displays numeric score (0-100)
- [ ] `Prediction-Status-Badge` shows correct color (green/yellow/red)
- [ ] `Whats-Working-Section` contains ≥ 1 item
- [ ] `Suggested-Improvements-Section` contains ≥ 1 item with `Btn-Apply-Fix-{index}`
- [ ] `Btn-Copy-Script` copies full script to clipboard

---

### API Checks

**POST `/api/creator-workflow/discover`**
```javascript
// Sample request
const response = await fetch('/api/creator-workflow/discover', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    goalId: 'OBJ-01',
    niche: 'personal-finance',
    limit: 10
  })
});

// Expected response
{
  success: true,
  videos: [
    {video_id: 'tiktok_7123456789', dps_score: 82, views: 3200000, ...},
    // ... 9 more
  ],
  auditId: 'aud_discover_xyz789'
}

// Acceptance criteria:
// ✅ Status code 200
// ✅ videos.length === 10
// ✅ All videos have dps_score ≥ 70
// ✅ auditId present and unique
// ✅ Response time < 3s (p95)
```

**POST `/api/creator-workflow/predict`**
```javascript
// Sample request
const response = await fetch('/api/creator-workflow/predict', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    script: {
      topic: 'Common tax mistakes',
      angle: 'Expert reveals #1 mistake',
      hook_spoken: 'I\'ve been doing taxes wrong...',
      // ... all 9 fields
    },
    goalId: 'OBJ-01',
    niche: 'personal-finance'
  })
});

// Expected response
{
  success: true,
  prediction: {
    dps_score: 78,
    status: 'green',
    projected_views: {min: 500000, max: 1500000, avg: 850000},
    whats_working: [...],
    suggested_improvements: [...]
  },
  auditId: 'aud_predict_ghi789'
}

// Acceptance criteria:
// ✅ Status code 200
// ✅ dps_score is numeric (0-100)
// ✅ status is 'green', 'yellow', or 'red'
// ✅ whats_working.length ≥ 1
// ✅ suggested_improvements.length ≥ 0
// ✅ auditId present
// ✅ Response time < 30s (p95)
```

---

### Event Checks
**EVT.CreatorWorkflow.PredictionGenerated**
```javascript
// After prediction generated, verify event emitted
const event = await getEventByAuditId('aud_predict_ghi789');

// Expected event
{
  event: 'EVT.CreatorWorkflow.PredictionGenerated',
  version: 1,
  auditId: 'aud_predict_ghi789',
  timestamp: '2025-10-22T14:38:20Z',
  userId: 'user_xyz',
  data: {
    goalId: 'OBJ-01',
    predicted_dps: 78,
    status: 'green',
    // ...
  }
}

// Acceptance criteria:
// ✅ Event exists with matching auditId
// ✅ Event emitted within 1s of prediction response
// ✅ userId matches authenticated user
// ✅ data.predicted_dps matches API response
```

---

## 7) Permissions / RBAC & Audit

### Roles
| Role | Can Access Workflow | Can View Predictions | Can Export Scripts | Rate Limit |
|------|:------------------:|:-------------------:|:-----------------:|:----------:|
| **Guest** | ❌ | ❌ | ❌ | N/A |
| **Free User** | ✅ | ✅ | ✅ | 5/day |
| **Pro User** | ✅ | ✅ | ✅ | 50/day |
| **Enterprise** | ✅ | ✅ | ✅ | Unlimited |

### Audit Fields Captured
Every action logs:
- `auditId` (unique per action, for tracing)
- `userId` (authenticated user)
- `timestamp` (ISO 8601)
- `action` (e.g., 'goal_selected', 'prediction_generated')
- `resource` (e.g., 'creator_workflow', 'prediction_api')
- `ip_address` (for security)
- `user_agent` (browser/device info)

**Stored in**: `workflow_events` table + centralized audit log service

---

## 8) Non-Functionals (Locked)

### SLOs / SLIs

#### Latency (p95)
| Operation | Target | Alert Threshold | Current Baseline |
|-----------|:------:|:---------------:|:----------------:|
| Goal selection | < 500ms | 750ms | 120ms |
| Viral video discovery | < 3s | 5s | 2.1s |
| AI suggestions | < 10s | 15s | 8.4s |
| Viral prediction | < 30s | 45s | 18.5s |
| Full workflow (all 4 steps) | < 60s | 90s | 42s |

#### Error Rate
| Operation | Target | Alert Threshold |
|-----------|:------:|:---------------:|
| Discovery API | < 1% | 3% |
| Suggestion API | < 2% | 5% (LLM timeouts common) |
| Prediction API | < 1% | 3% |

#### Availability
- **Target**: 99.5% uptime (43.8h downtime/year allowed)
- **Dependencies**:
  - FEAT-001 Scraper: 98% (can use cache)
  - FEAT-070 Prediction: 99% (critical path)
  - OpenAI API: 99.9% (external)
  - Anthropic API: 99.9% (external)

### Alerting
**Channels**: PagerDuty (critical), Slack #alerts (warning)

**Thresholds**:
- Prediction latency p95 > 45s for 5 min → Page on-call
- Error rate > 5% for 10 min → Page on-call
- Discovery cache age > 48h → Slack warning
- Rate limit breaches > 100/hr → Slack warning (possible abuse)

**Error-Budget Policy**:
- If error budget exhausted (>0.5% error rate in 30 days), freeze new features
- Auto-rollback if canary error rate > 3× baseline

### Privacy & Logging
**PII Handling**:
- User scripts may contain PII (names, locations, personal stories)
- Flag scripts with detected PII: `pii_flags: {contains_name: true}`
- Scripts NOT used for model training without explicit consent
- Retention: 90 days, then auto-delete (GDPR compliant)

**Logging Limits**:
- Never log full user scripts in application logs
- Log only: script word count, framework matched, DPS score
- Audit logs (with auditId) retained 1 year for compliance

### Rate Limits / Quotas
**Free Tier**:
- 5 predictions/day
- 20 framework views/day
- 10 viral video discoveries/day

**Pro Tier** ($197/month):
- 50 predictions/day
- Unlimited framework views
- Unlimited discoveries

**Enterprise** (custom pricing):
- Unlimited everything
- Dedicated capacity
- 99.9% SLA

**Enforcement**:
- Redis-based rate limiter (sliding window)
- 429 response with `retry_after` header
- Upgrade prompts shown at 80% quota

---

## 9) Failure Modes & Runbook

### Failure Mode 1: Viral Video Discovery Returns 0 Results

**Symptoms**:
- `actDiscoverViralVideos` returns `{videos: []}`
- User sees "No viral videos found in [niche]"
- EVT.CreatorWorkflow.DiscoveryComplete shows `videos_found: 0`

**Detect**:
- Alert: "Discovery zero results >10% of requests (5 min window)"
- Dashboard: `/dashboards/creator-workflow` → Discovery Success Rate panel

**Fix**:
1. Check FEAT-001 Scraper status: `/admin/scraper-health`
2. If scraper down: Enable cached mode (stale data from last 30 days)
   ```bash
   # Set feature flag
   curl -X POST /api/flags/set -d '{"flag":"FF-DiscoveryCache","value":true}'
   ```
3. If scraper up but niche unpopulated:
   - Trigger manual scrape for niche: `/api/admin/scraper/trigger?niche=personal-finance`
   - Expand search to adjacent niches (show in UI)
4. If database empty:
   - Restore from backup: `pg_restore -d cleancopy backups/latest.dump`

**Verify**:
- Run test discovery: `curl -X POST /api/creator-workflow/discover -d '{"goalId":"OBJ-01","niche":"personal-finance","limit":10}'`
- Confirm `videos.length > 0`
- Check dashboard shows success rate >90%

**Owner**: On-call engineer (escalate to platform team if >1h)

---

### Failure Mode 2: Prediction API Timeout (>30s)

**Symptoms**:
- `actPredictViral` takes >30s
- User sees "Prediction taking longer than expected..."
- 408 timeout errors in logs

**Detect**:
- Alert: "Prediction latency p95 >45s (5 min window)"
- Metric: `prediction_latency_p95` in Grafana

**Fix**:
1. Check FEAT-070 service health: `/api/health/prediction`
2. If multi-LLM consensus slow (GPT+Claude+Gemini all queried):
   - Enable fast mode (GPT-4 only): `FF-FastPrediction=true`
   - Reduce consensus requirement: 1 LLM instead of 3 (accuracy drop acceptable)
3. If OpenAI/Anthropic API slow:
   - Check status pages: status.openai.com, status.anthropic.com
   - Failover to Gemini only if both down
4. If database query slow:
   - Check `scraped_videos` table size and indexes
   - Run VACUUM ANALYZE: `psql -c 'VACUUM ANALYZE scraped_videos;'`

**Verify**:
- Run test prediction: `curl -X POST /api/creator-workflow/predict -d '{...}'`
- Confirm response time <20s
- Check dashboard shows p95 latency <30s

**Owner**: On-call engineer (escalate to ML team if LLM-related)

---

### Failure Mode 3: AI Suggestions Return Partial/Empty Data

**Symptoms**:
- `actSuggestContent` returns incomplete fields
- User sees some fields auto-filled, others blank
- Event: EVT.CreatorWorkflow.SuggestionGenerated with `partial: true`

**Detect**:
- Alert: "AI suggestion partial results >20% (10 min window)"
- Dashboard: `/dashboards/creator-workflow` → Suggestion Quality panel

**Fix**:
1. Check FEAT-060 Knowledge Extraction service: `/api/health/knowledge`
2. If LLM quota exceeded:
   - Increase OpenAI/Anthropic tier (temporary fix)
   - Enable fallback to cached suggestions (use most recent successful suggestions for similar niche)
3. If prompt engineering issue:
   - Review recent failing suggestions in logs (filter by `partial: true`)
   - Adjust prompt in `src/lib/services/content-suggester.ts`
   - A/B test new prompt with `FF-SuggestionPromptV2`
4. If viral examples too sparse:
   - Require minimum 3 examples (currently allowing 1-2)
   - Show user: "Need more examples for better suggestions"

**Verify**:
- Run test suggestion: `curl -X POST /api/creator-workflow/suggest -d '{...}'`
- Confirm all 9 fields populated
- Check dashboard shows completion rate >90%

**Owner**: AI/ML team (on-call engineer can enable fallbacks)

---

## 10) Rollout & Versioning

### Feature Flags

#### Primary Flag
- **Name**: `FF-CreatorWorkflow`
- **Default**: `false` (off by default)
- **Rollout Plan**:
  - Week 1: Internal team only (5 users)
  - Week 2: Beta testers (50 users)
  - Week 3: Canary 5% (free + pro users)
  - Week 4: Canary 25%
  - Week 5: Canary 50%
  - Week 6: 100% if metrics green

#### Kill Switch
- **Name**: `FF-CreatorWorkflow-KillSwitch`
- **Purpose**: Instant rollback if critical issue
- **Action**: Set to `true` → Redirects all users to old flow
- **Who executes**: On-call engineer or CTO
- **Rollback steps**:
  1. Set flag: `curl -X POST /api/flags/set -d '{"flag":"FF-CreatorWorkflow-KillSwitch","value":true}'`
  2. Verify redirect: Visit `/creator-workflow` → Should 302 to `/dashboard`
  3. Monitor error rate drop (expect <1% within 5 min)
  4. Post-mortem: Create incident report within 24h

#### Sub-Feature Flags
- `FF-DiscoveryCache` (use cached videos if scraper down)
- `FF-FastPrediction` (GPT-4 only, skip consensus)
- `FF-SuggestionPromptV2` (A/B test new AI prompt)

---

### Synthetic → Live Flip

#### Synthetic Environment (Dev/Staging)
- **Data**: Seed database with 100 viral videos across 10 niches
- **Toggles**: All feature flags ON
- **Success Criteria**:
  - 100% of test workflows complete all 4 steps
  - Prediction latency <20s (faster than production due to smaller DB)
  - All events emitted with auditId

#### Live Environment (Production)
- **Data**: Real viral videos from FEAT-001 scraper (currently 116 videos)
- **Toggles**: `FF-CreatorWorkflow` starts at 0%, increases per plan
- **Success Criteria**:
  - Error rate <1%
  - Prediction latency p95 <30s
  - User completion rate >60% (60% who start Step 1 finish Step 4)

---

### Canary Promotion Gates

**Auto-Promote Criteria** (advance from 5% → 25% → 50% → 100%):
- ✅ Error rate < 2% (baseline +1%)
- ✅ Prediction latency p95 < 35s
- ✅ User completion rate > 55%
- ✅ No critical bugs reported (P0/P1)
- ✅ Zero kill-switch activations

**Auto-Rollback Criteria** (revert to previous %):
- ❌ Error rate > 5% for 10 min
- ❌ Prediction latency p95 > 50s for 10 min
- ❌ Crash rate > 1% (client-side errors)
- ❌ Kill-switch activated

**Manual Hold** (pause rollout, require approval):
- User completion rate drops >10% from baseline
- Customer support tickets spike >3x
- Viral prediction accuracy drops (requires offline validation)

---

### Data Migration & Backout

**Migration**:
- No schema changes to existing tables
- New tables: `creator_workflows`, `workflow_events`
- Backfill: Not required (fresh feature)

**Backout**:
- Drop tables: `DROP TABLE workflow_events; DROP TABLE creator_workflows;`
- Remove feature flag: `FF-CreatorWorkflow` deleted
- Redirect: Update nginx config to 404 on `/creator-workflow`

**Cleanup**:
- After 100% rollout + 30 days stable: Remove old prediction flow code
- Archive: Old code moved to `archive/legacy-prediction-v1/`

---

## 11) RACI & Approvals

### Ownership
- **Owner**: Product Manager (Emma Chen)
- **Technical Lead**: Senior Engineer (Alex Martinez)
- **On-Call**: Platform team rotation (24/7)

### Approvals

#### PRD Approval
- **Approver**: VP Product (Sarah Johnson)
- **Status**: Draft (pending approval)
- **Deadline**: 2025-10-25

#### Release Approval
- **Approver**: CTO (Michael Nguyen)
- **Gate**: After staging validation + canary 5% success
- **Criteria**:
  - All acceptance tests green
  - Security review passed (no critical vulnerabilities)
  - Performance budgets met

#### Rollback Approval
- **Who**: On-call engineer (no approval needed for kill-switch)
- **When**: Immediate if auto-rollback criteria met
- **Post-rollback**: CTO notified within 1h, post-mortem within 24h

---

## 12) ADRs & Dependencies

### ADRs
- **ADR-014**: Use multi-LLM consensus for predictions (GPT-4 + Claude + Gemini)
  - **Decision**: Combine 3 LLMs for higher accuracy
  - **Trade-off**: Slower (30s) vs. single LLM (10s), but +15% accuracy
  - **Status**: Approved 2025-09-15

- **ADR-015**: Progressive disclosure (one-page flow) vs. multi-page wizard
  - **Decision**: Single page with fragment navigation (#step-1, #step-2, etc.)
  - **Trade-off**: More complex state management, but lower drop-off
  - **Status**: Approved 2025-10-10

### Dependencies

#### Upstream (This Feature Depends On)
- **FEAT-001** (TikTok Scraper): Provides viral videos for discovery
  - **Risk**: If scraper down, use cached data (max age 48h)
- **FEAT-002** (DPS Calculator): Filters videos by viral score
  - **Risk**: If DPS not calculated, fall back to raw view count
- **FEAT-060** (Knowledge Extraction): Powers AI suggestions
  - **Risk**: If extraction fails, show manual entry mode
- **FEAT-070** (Prediction API): Core prediction engine
  - **Risk**: CRITICAL - no fallback, feature unusable if down

#### Downstream (Other Features Depend On This)
- **FEAT-072** (Analytics Dashboard): Will consume workflow events for reporting
- **FEAT-073** (Template UI System): Will integrate into Step 3 (Design) in future

#### External Dependencies
- **OpenAI API** (GPT-4): For predictions and suggestions
- **Anthropic API** (Claude): For multi-LLM consensus
- **Google Gemini API**: For multi-LLM consensus
- **Redis**: For rate limiting
- **PostgreSQL**: For data persistence

---

## 13) Security & Privacy Mini-Threat Model (STRIDE-lite)

### Data Classes
- **User-Generated Scripts**: May contain PII (names, personal stories, locations)
- **Viral Video Metadata**: Public data (no PII), but creator usernames tracked
- **Prediction Results**: Not sensitive, but reveals user's content strategy

### Attack Surfaces

#### 1. Spoofing
**Threat**: Attacker impersonates user to access workflow sessions
**Mitigation**:
- Require authentication (JWT) for all API endpoints
- Workflow sessions tied to `userId` (can't access other users' drafts)
- Audit all actions with IP address tracking

#### 2. Tampering
**Threat**: Attacker modifies prediction results or viral video data
**Mitigation**:
- API responses signed with HMAC (verify integrity)
- Database: Row-level security (RLS) enabled (users can only modify own workflows)
- Immutable event log (workflow_events table, no UPDATE/DELETE allowed)

#### 3. Repudiation
**Threat**: User claims "I never requested this prediction" (billing dispute)
**Mitigation**:
- Every action logged with `auditId` + timestamp + IP address
- Audit logs retained 1 year (immutable, append-only)
- Prediction requests include user consent checkbox (saved in events)

#### 4. Information Disclosure
**Threat**: User's script ideas leaked to competitors
**Mitigation**:
- Scripts encrypted at rest (database column-level encryption)
- Scripts never logged in application logs (only word count logged)
- Scripts not used for training without explicit consent (opt-in checkbox)
- API responses: HTTPS only (TLS 1.3)

#### 5. Denial of Service
**Threat**: Attacker floods prediction API, exhausting LLM quotas
**Mitigation**:
- Rate limiting: 5 predictions/day (free), 50/day (pro)
- Redis-based sliding window (prevents burst attacks)
- CAPTCHA on prediction submit (if >3 requests/min)
- CloudFlare DDoS protection (upstream)

#### 6. Elevation of Privilege
**Threat**: Free user accesses pro features (unlimited predictions)
**Mitigation**:
- RBAC enforced at API layer (check user.tier before processing)
- Feature flags per-user (free users see `FF-CreatorWorkflow-Free`, pros see `FF-CreatorWorkflow-Pro`)
- Audit: Log tier checks in every API call

---

### Privacy Rules (GDPR/CCPA Compliance)

#### User Rights
- **Right to Access**: Users can export workflow history via `/api/user/export`
- **Right to Delete**: Users can delete all workflows via `/settings/privacy` (soft delete, 30-day grace period)
- **Right to Portability**: Export format: JSON (machine-readable)

#### Retention Policy
- **Workflows**: 90 days after creation (auto-delete)
- **Audit logs**: 1 year (compliance requirement)
- **Prediction results**: 30 days (cached for deduplication, then purged)

#### PII Handling
- **Detection**: Scan user scripts for PII patterns (names, emails, phone numbers)
- **Flagging**: Set `pii_flags: {contains_email: true}` if detected
- **Consent**: Explicit checkbox: "Allow CleanCopy to analyze my script" (required before prediction)

---

## Definition of Done

### Feature Completeness
- [ ] All 4 steps (Goal → Discover → Design → Predict) implemented
- [ ] All TestIDs present and functional
- [ ] All server actions return expected payloads
- [ ] All events emitted with auditId

### Contracts & Schemas
- [ ] OpenAPI spec committed: `/docs/contracts/openapi.yaml`
- [ ] Event schemas committed: `/docs/contracts/events/*.schema.json`
- [ ] CHANGELOG.md updated with new endpoints/events
- [ ] CDC tests green (no breaking changes to consumers)

### Tests
- [ ] UI tests: All TestIDs render correctly (Playwright)
- [ ] Trace-based tests: Events emitted with matching auditId (Jest)
- [ ] Contract tests: API request/response match OpenAPI spec
- [ ] E2E smoke test: Golden path (goal → discover → design → predict) completes in <60s
- [ ] Performance test: Prediction latency p95 <30s under load (100 concurrent users)

### Observability
- [ ] SLOs defined and live in Grafana
- [ ] Alerts wired to PagerDuty (critical) and Slack (warning)
- [ ] Runbooks linked in `/docs/observability/runbooks/creator-workflow.md`
- [ ] Error-budget policy active (freeze releases if budget exhausted)

### Security & Privacy
- [ ] SBOM generated (all dependencies listed)
- [ ] Dependency scan passed (no critical vulnerabilities)
- [ ] OPA policies enforce RBAC (free vs. pro tier checks)
- [ ] PII detection active (scripts scanned for sensitive data)

### Rollout Readiness
- [ ] Feature flags ready: `FF-CreatorWorkflow`, `FF-CreatorWorkflow-KillSwitch`
- [ ] Canary gates defined (5% → 25% → 50% → 100%)
- [ ] Auto-rollback criteria configured
- [ ] Release/Rollback Playbook documented: `/docs/ops/release-playbook.md`

### Approvals
- [ ] PRD approved by VP Product
- [ ] Security review passed
- [ ] CTO approval for production release

---

**End of PRD**
**Next Steps**: Review, approve, and begin implementation (estimated 8-10 weeks)
