# Claude Skills Briefing Document
## CleanCopy: Viral Video Analytics Platform

**Date Created**: 2025-10-19
**Purpose**: Provide context for creating 3 custom Claude Skills to improve UX/UI consistency, project planning, and feature integration across our platform.

---

## Platform Overview

**CleanCopy** is a Next.js/React/Supabase SaaS platform that helps content creators predict viral potential of TikTok videos before filming. We analyze existing viral videos to extract patterns, then use AI to predict whether a creator's script will go viral.

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI/ML**: OpenAI GPT-4, Anthropic Claude, Google Gemini
- **External APIs**: Apify (TikTok scraping)

---

## Our 6 Core Features

### FEAT-001: TikTok Scraper Integration
- **Purpose**: Scrape viral TikTok videos using Apify API
- **Database Tables**: `scraped_videos`
- **What It Does**: Fetches video metadata (views, likes, creator info, captions) and downloads videos that meet viral thresholds
- **UI Location**: The Proving Grounds page (pipeline-manager)
- **Trigger**: "Run Scraper" button

### FEAT-002: DPS (Dynamic Percentile System) Calculator
- **Purpose**: Calculate viral scores based on engagement metrics
- **Formula**: `DPS = (views / cohort_median) × platform_weight × decay_factor`
- **Database Tables**: `scraped_videos.dps_score`, `scraped_videos.dps_classification`
- **What It Does**: Assigns viral scores (0-100) to videos, classifies as Viral (70-79), Mega-Viral (80-100)
- **UI Location**: The Proving Grounds page (stats cards, video cards)
- **Trigger**: Automatic after scraping

### FEAT-003: Pattern Extraction
- **Purpose**: Identify common patterns in viral videos
- **Database Tables**: `viral_patterns`, `viral_pool`, `negative_pool`
- **What It Does**: Extracts hooks, story structures, visual patterns, audio patterns from viral videos
- **UI Location**: The Proving Grounds page (Patterns section, "View All Patterns" modal)
- **Trigger**: "Run Viral Filter" button

### FEAT-004: Feature Store Schema
- **Purpose**: Database architecture for storing features
- **Database Tables**: Multiple feature-related tables
- **What It Does**: Backend infrastructure (no UI component)
- **UI Location**: None (backend only)
- **Trigger**: N/A

### FEAT-060: Knowledge Extraction
- **Purpose**: Extract viral keywords, hooks, and triggers using 3 LLMs
- **Database Tables**: `extracted_knowledge`
- **What It Does**: Analyzes transcripts with GPT-4, Claude, and Gemini to find consensus insights
- **Data Structure**:
  ```json
  {
    "viral_hooks": ["hook1", "hook2"],
    "emotional_triggers": ["trigger1", "trigger2"],
    "viral_coefficient_factors": ["factor1", "factor2"],
    "pattern_match": "description",
    "confidence": 0.8
  }
  ```
- **UI Location**: Script Intelligence page (Keyword Research tab)
- **Trigger**: "Extract Knowledge" button

### FEAT-070: Pre-Content Prediction
- **Purpose**: Predict viral potential of scripts BEFORE filming
- **Database Tables**: `predictions` (needs to be created - currently clipboard-only)
- **What It Does**: Uses Claude AI to analyze scripts against viral patterns and extracted keywords, returns score (0-100) + recommendations
- **UI Location**: Script Intelligence page (Script Predictor tab)
- **Trigger**: "ANALYZE & PREDICT" button

---

## Current Admin Pages

### Page 1: The Proving Grounds (`/admin/pipeline-manager`)
**Purpose**: Manage video ingestion pipeline and viral analysis

**Workflows**:
1. Run Scraper (FEAT-001)
2. Transcribe Videos (FEAT-001)
3. Run Viral Filter (FEAT-002 + FEAT-003)
4. View All Patterns (FEAT-003)
5. Load More Videos (pagination)
6. Refresh Data (reload all stats)

**Features Used**: FEAT-001, FEAT-002, FEAT-003

### Page 2: Script Intelligence (`/admin/research-review`)
**Purpose**: Extract knowledge from videos and predict viral potential of new scripts

**Tabs**:
- **Keyword Research**: Extract knowledge (FEAT-060), approve/reject keywords
- **Script Predictor**: Analyze scripts (FEAT-070), get predictions

**Features Used**: FEAT-060, FEAT-070

---

## Design System

### Color Palette
- **Background**: `#0F0A1E` (dark purple-black)
- **Accents**: Purple (`#9333EA`) → Pink (`#EC4899`) gradients
- **Glass Morphism**: `backdrop-blur-xl bg-white/5 border border-white/10`
- **Text**: White (`#FFFFFF`), Gray-400 (`#9CA3AF`)

### UI Components
- **Buttons**: Gradient backgrounds (purple→pink), rounded corners, hover effects
- **Cards**: Glass morphism with white/5 background, border white/10
- **Stats Cards**: Color-coded (cyan for viral count, pink for mega-viral, purple for avg score)
- **Toast Notifications**: Color-coded by type
  - Success: Green
  - Error: Red
  - Loading: Blue
  - Info: Gray

### Toast Notification Standards
**CRITICAL RULE**: Every success message MUST tell users WHERE to see results.

**Examples**:
- ❌ BAD: "Successfully transcribed 10 videos!"
- ✅ GOOD: "Successfully transcribed 10 videos! Video cards now show transcripts. Go to Script Intelligence → Run Knowledge Extraction to analyze them."

- ❌ BAD: "Viral filter complete"
- ✅ GOOD: "Processed 116 videos! Found 13 viral + 5 negative samples. Check stats cards and patterns section below."

---

## Current UX Issues (As of 2025-10-19)

### ✅ Fixed Issues
1. **UX-001**: Filter dropdowns had invisible text (white on white)
2. **UX-002**: Knowledge extraction showed zero results (wrong JSON field names)
3. **UX-004**: Transcript visibility (already working)

### ⬜ Outstanding Issues

#### UX-003: Limited Video Display
- Only 13 videos shown, database has 100+
- "Load More" requires many clicks
- Users cannot see full dataset

#### UX-005: Multi-Page Workflow Is Absurd (CRITICAL)
- User must:
  1. Click "Transcribe Videos" on Page 1
  2. Navigate to Page 2 manually
  3. Click "Extract Knowledge" on Page 2
- No indication this workflow is required
- User quote: "There's no reason why an individual should have click between two different pages for a feature that is contained on one of them that makes no sense"

#### UX-006: Predictions Not Stored
- Results only available via "Copy Results" button (clipboard)
- No prediction history
- No comparison to actual video performance
- No way to verify accuracy

#### UX-007: No Time-Based Projections
- Predictions show single score (0-100) with no time frame
- Should show: 4-hour, 24-hour, 72-hour, 7-day projections
- Example: "4h: 15K-25K views, 800-1.2K likes"

#### UX-008: No Script Editing Based on Recommendations
- Predictions give recommendations but user must manually edit elsewhere
- Should have split-pane UI with AI-assisted editing
- Similar to "Quick Win" value editing workflow

#### UX-009: No Prediction History Dashboard
- No way to track predictions over time
- No accuracy metrics (MAE, confidence intervals)

#### UX-010: XGBoost Integration (Future)
- Current LLM predictions may have MAE ~50
- XGBoost could reduce to MAE 10-15 (4-5x improvement)
- Requires 100+ training videos

---

## Workflow Mapping System

We maintain a living document (`docs/workflow-mapping.md`) that tracks:
- Every workflow on every page
- Which features each workflow uses
- Success criteria for each workflow
- Workflow dependencies and interactions
- Modification history with dates
- UX issues with progress tracking (checkboxes)

**Example Entry**:
```markdown
#### Workflow 1.2: Transcribe Videos
- **Trigger**: Click "Transcribe Videos" button
- **Features Used**: FEAT-001
- **What It Does**: Sends video audio to transcription service, updates `transcript_text` field
- **Success Criteria**: Toast shows "Successfully transcribed X videos! ..."
- **Result Location**: Transcript text appears in video cards
- **Interactions**: Prepares data for Workflow 2.1 (Knowledge Extraction)
```

**Progress Tracking Format**:
```markdown
### Progress Summary
**Completed** ✅
- [x] UX-001: Filter Dropdowns Have Invisible Text
- [x] UX-002: Knowledge Extraction Shows Zero Results

**Not Started** ⬜
- [ ] UX-003: Limited Video Display
- [ ] UX-005: Multi-Page Workflow
```

---

## Database Schema Patterns

### Table Naming
- Feature tables: `viral_patterns`, `extracted_knowledge`, `scraped_videos`
- Pool tables: `viral_pool`, `negative_pool`
- Audit tables: `viral_filter_runs`

### Common Fields
- `id`: UUID primary key (auto-generated)
- `created_at`: Timestamp (default NOW())
- `video_id`: TEXT reference to scraped video

### JSONB Fields
- `consensus_insights`: Stores LLM extraction results
- `matched_patterns`: Stores pattern matching data

---

## API Route Patterns

### Location
`src/app/api/[feature]/[action]/route.ts`

### Structure
- POST: Create/process data
- GET: Retrieve data
- Error handling with try/catch
- Supabase client with service key for writes

### Example
```typescript
// src/app/api/knowledge/extract/route.ts
export async function POST(request: NextRequest) {
  try {
    const { video_id } = await request.json();

    // Step 1: Validate input
    // Step 2: Fetch video data
    // Step 3: Call LLMs
    // Step 4: Store results
    // Step 5: Return response

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## UI Component Patterns

### Page Structure
```tsx
'use client'

export default function PageName() {
  // State declarations
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('info')

  // Data fetching functions
  const fetchData = async () => { /* ... */ }

  // Action handlers
  const handleAction = async () => {
    setLoading(true)
    try {
      // Call API
      // Update state
      setMessageType('success')
      setMessage('Action completed! Results appear [WHERE].')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Render
  return (
    <div className="min-h-screen bg-[#0F0A1E] text-white">
      {/* Header */}
      {/* Stats Cards */}
      {/* Action Buttons */}
      {/* Data Grid */}
      {/* Modals */}
    </div>
  )
}
```

### Data Source Labels
Every section that displays data MUST show which feature provides it:

```tsx
<div className="mb-6 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
  <span className="text-purple-400 font-mono">
    📊 DATA SOURCE: FEAT-002 DPS Calculator → Stats from scraped_videos table
  </span>
</div>
```

---

## Framework Context (for FEAT-070 enhancement)

We have 3 proprietary frameworks that should eventually integrate with predictions:

### 1. Social Media Growth Framework Compendium (61 Frameworks)
- Example: "Problem-Agitate-Solve (PAS)", "AIDA Model", "Story Arc"
- Each has tactics and benchmarks
- Currently NOT integrated with FEAT-070

### 2. Nine Attributes Framework for Viral Content
- TAM Resonance, Sharability, Hook Strength, Format Innovation, Value Density, Pacing & Rhythm, Curiosity Gaps, Emotional Journey, Payoff
- Currently NOT integrated with FEAT-070

### 3. DPS Powered Idea Mining System (7 Idea Legos)
- Topic, Angle, Hook Structure, Story Structure, Visual Format, Key Visuals, Audio
- Currently NOT integrated with FEAT-060

**Future Goal**: FEAT-060 should extract these elements, FEAT-070 should score scripts on these attributes.

---

## Success Criteria for Good UX/UI

A workflow is considered **user-friendly** when:

1. ✅ User knows what will happen BEFORE clicking a button (clear labels)
2. ✅ User gets immediate feedback DURING the action (loading states)
3. ✅ User knows what happened AFTER the action (success message with location)
4. ✅ User knows what to do NEXT (clear next action or result visibility)
5. ✅ All related actions are on the SAME PAGE (no navigation required)
6. ✅ Results appear WHERE the user expects them (not hidden elsewhere)
7. ✅ Data sources are TRANSPARENT (feature labels visible)
8. ✅ Errors are ACTIONABLE (tell user how to fix, not just what broke)

**Example of Perfect Workflow**:
```
User clicks "Transcribe Videos"
  → Button shows "Transcribing... (3/10)" (immediate feedback)
  → Toast: "Successfully transcribed 10 videos! Transcripts now appear in video cards below. Next step: Extract knowledge to analyze them." (clear result + next action)
  → Video cards update with transcript text (result visible on same page)
  → "Extract Knowledge" button appears or is highlighted (next action obvious)
```

---

# SKILL CREATION REQUESTS

Now that you have full context, please create these 3 custom skills for me:

---

## SKILL REQUEST #1: UX/UI Workflow Development

**Request:**
Help me create a skill for "designing and implementing consistent UX/UI workflows for a viral video analytics platform with 6 core features (FEAT-001 TikTok Scraper, FEAT-002 DPS Calculator, FEAT-003 Pattern Extraction, FEAT-060 Knowledge Extraction, FEAT-070 Pre-Content Prediction, FEAT-004 Feature Store). The skill should ensure every workflow follows our design system (glass morphism, gradient accents, toast notifications with color coding), maintains clear user feedback at each step (before/during/after), provides obvious next actions, avoids multi-page navigation for single workflows, and integrates our features cohesively without confusing the user. Output should include wireframes, user flow diagrams, success criteria, and implementation notes for developers."

**Context to Reference:**
- Design System section (colors, glass morphism, toast standards)
- Success Criteria for Good UX/UI section
- Current UX Issues (especially UX-005 multi-page workflow problem)
- UI Component Patterns section

---

## SKILL REQUEST #2: Project Planning & Development Organization

**Request:**
Help me create a skill for "organizing and planning feature development for a Next.js/React/Supabase viral video analytics SaaS platform. The skill should help break down complex features into discrete tasks with acceptance criteria, track dependencies between workflows, maintain a living workflow-mapping document with visual progress indicators (checkboxes ✅ and ⬜, status labels like [FIXED] and [NOT STARTED]), identify UX issues systematically, prioritize fixes by impact and complexity, and ensure database schema, API routes, and UI components are all considered for each feature. Output should include structured task lists with acceptance criteria, database migration plans, API endpoint specs, UI component requirements, testing verification steps, and modification history entries."

**Context to Reference:**
- Workflow Mapping System section (example entry format)
- Database Schema Patterns section
- API Route Patterns section
- Our 6 Core Features section (to understand feature breakdown)
- Current UX Issues section (example of systematic issue identification)

---

## SKILL REQUEST #3: Feature Integration Consistency

**Request:**
Help me create a skill for "ensuring consistent integration of viral video analysis features across a multi-page admin dashboard. The platform has 6 core features that must work together seamlessly: video scraping (FEAT-001), DPS scoring (FEAT-002), pattern extraction (FEAT-003), knowledge extraction (FEAT-060), and pre-content prediction (FEAT-070). The skill should verify that each new workflow clearly indicates which features are being used, provides data source transparency (e.g., 'DATA SOURCE: FEAT-002 DPS Calculator'), maintains consistent success/error messaging that guides users to result locations, avoids orphaned workflows that require navigation between pages, and ensures database tables, API endpoints, and UI components all reference the correct feature numbers. Output should include feature integration checklist, cross-workflow dependency map, user journey verification steps, and toast notification templates."

**Context to Reference:**
- Our 6 Core Features section (understand how features interact)
- Data Source Labels section (transparency requirement)
- Toast Notification Standards section (CRITICAL RULE about WHERE results appear)
- Workflow Mapping System section (dependency tracking)
- Success Criteria for Good UX/UI section (items 5-7 about same-page actions and transparency)

---

## Additional Context for All Skills

**Development Workflow:**
1. Plan the feature (DB → API → UI)
2. Create database migration if needed
3. Build API route with error handling
4. Create UI components with loading states
5. Test all success/error paths
6. Document in workflow-mapping.md
7. Verify against 8 success criteria

**Common Mistakes to Avoid:**
- ❌ Creating workflows that span multiple pages
- ❌ Success messages that don't explain where to look
- ❌ No loading states during async operations
- ❌ Missing data source labels
- ❌ No clear next action after completing a step
- ❌ Forgetting to update workflow-mapping.md
- ❌ Not considering mobile/responsive design

**File References:**
- Workflow Mapping: `docs/workflow-mapping.md`
- The Proving Grounds: `src/app/admin/pipeline-manager/page.tsx`
- Script Intelligence: `src/app/admin/research-review/page.tsx`
- Viral Filter Service: `src/lib/services/viralFilter.ts`
- Knowledge Extraction API: `src/app/api/knowledge/extract/route.ts`

---

## Questions for Claude After Skill Creation

Once these skills are created, I'd like to use them to:

1. **Redesign UX-005** (multi-page workflow) into a single-page experience
2. **Design UX-006** (prediction storage) with proper database schema + UI
3. **Plan UX-007** (time-based projections) with API changes + UI updates
4. **Organize remaining UX fixes** (UX-003, UX-008, UX-009, UX-010) into sprints

Please create these 3 skills now, and let me know when they're ready to use!
