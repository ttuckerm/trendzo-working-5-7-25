# Unified Workflow Architecture for Trendzo

## Section 1: Clear Workflow Definitions

### WORKFLOW 5: Template Library (Entry Hub)

**Purpose:** Default landing experience where users browse viral templates and choose their creation path.

**User Journey Time:** 1-2 minutes to selection

**Entry Point:** `/admin/studio` (Template Library tab) or `/templates`

```
Landing View
    |
    v
Browse Viral Video Templates (UI-within-UI preview cards)
    |
    +---> View template details (DPS, engagement, hook/CTA preview)
    |
    +---> Select template
            |
            +---> "Quick Win" --> WORKFLOW 3 (guided fast-track)
            |
            +---> "Full Creation" --> WORKFLOW 1 (comprehensive)
```

**Key UI Elements:**
- Template gallery with mini video previews
- DPS scores and viral metrics on each card
- Filter by niche, performance tier, recency
- "Use This Template" button with path selection modal

---

### WORKFLOW 3: Quick Win (Guided Fast-Track)

**Purpose:** Generate viral content in under 15 minutes using proven templates.

**User Journey Time:** 12-15 minutes

**Entry Point:** From Workflow 5 template selection OR direct via `/workflows/quick-win`

```
STEP 1: Starter Pack (auto-curated)
    - System pre-selects 3 best templates based on user profile/history
    - Each shows: thumbnail, DPS, success rate, delta trend
    |
    v
STEP 2: Template Selection
    - Choose 1 of 3 curated templates
    - See full preview + value editor side-by-side
    |
    v
STEP 3: Hook Generation
    - Generate 3 AI hooks based on template pattern
    - Each hook shows: text, predicted retention metrics
    |
    v
STEP 4: Beat Selector
    - Visual timeline with beat elements (Hook, Problem, Reveal, CTA, etc.)
    - Drag-and-drop or click-to-select beat suggestions
    - Audio trend integration (trending sounds matched to beats)
    |
    v
STEP 5: Pre-Film Analysis
    - Live DPS score preview
    - Optimization suggestions before filming
    |
    v
STEP 6: Film Video
    - Teleprompter feature for script reading
    - Camera integration or upload option
    |
    v
STEP 7: Post-Film Analysis
    - AI analyzes recorded video
    - Provides specific fix suggestions
    |
    v
STEP 8: Apply Fixes
    - One-click fixes for identified issues
    - Re-analyze after each fix
    |
    v
STEP 9: Final Prediction
    - Final DPS prediction with confidence
    - Blockchain receipt for verification
    - Publishing recommendations
```

**Shared Components from Existing Code:**
- `src/app/sandbox/quick-win-workflow/page.tsx` - Main implementation
- `src/app/admin/workflows/quick-win/page.tsx` - Template loading logic
- `src/lib/services/audioSyncEngine.ts` - Beat sync

---

### WORKFLOW 1: Viral Content Creator (Comprehensive)

**Purpose:** Build viral video from scratch with full control over every element.

**User Journey Time:** 30-60 minutes (can save and resume)

**Entry Point:** From Workflow 5 OR direct via `/studio/creator`

```
PHASE 1: RESEARCH
    1.1 Choose Niche --> dropdown of 20 top niches
    1.2 Target Audience --> age, interests, pain points
    1.3 Goal --> engagement rate, lead gen, brand awareness, etc.
    1.4 Keyword Selection --> trending keywords in niche
    1.5 Content Topic --> AI-suggested topics based on keywords
    |
    v
PHASE 2: PLAN
    2.1 Format Analysis --> list style, storytelling, tutorial, etc.
    2.2 Content Pillar --> education, entertainment, inspiration, etc.
    2.3 Content Goals --> knowledge transfer, trust building, etc.
    2.4 Content Beat --> hooks, value props, proof points, CTAs
    2.5 SEO Pack --> primary terms, alt terms, hashtags
    |
    v
PHASE 3: CREATE
    3.1 On-Screen Display --> text overlays, graphics
    3.2 Captions --> auto-generated or manual
    3.3 Optimization Checklist --> pre-film verification
    3.4 Film/Generate Video --> teleprompter or AI generation
    |
    v
PHASE 4: OPTIMIZE
    4.1 Live DPS Analysis --> real prediction via Pack 1/2/3/V pipeline
    4.2 AI Recommendations --> specific actionable fixes
    4.3 Apply Fixes --> iterate until score target met
    |
    v
PHASE 5: PUBLISH
    5.1 Platform Selection --> TikTok, Instagram, YouTube
    5.2 Scheduling --> optimal time recommendations
    5.3 Final Review --> one-click publish
    |
    v
PHASE 6: ENGAGE & LEARN
    6.1 Track Results --> views, avg watch time, engagement, shares
    6.2 Performance Over Time --> 1hr, 24hr, 7day metrics
    6.3 Audience Retention --> drop-off analysis
    6.4 Content Iteration --> improvement suggestions, feedback loop
```

**Existing Implementation:**
- `src/app/studio/creator/page.tsx` - 17-step UI
- `src/app/admin/studio/page.tsx` - Creator tab (lines 113-143)
- Database schema in `supabase/migrations/20260119_workflow_tables.sql`

---

## Section 2: Workflow Interconnections

```
                    SHARED COMPONENTS
                          |
    +---------------------+---------------------+
    |                     |                     |
WORKFLOW 1:          WORKFLOW 3:          WORKFLOW 5:
Full Creator         Quick Win            Template Library
    |                     |                     |
    +---------------------+---------------------+
                          |
                    ENTRY POINTS
                    /          \
              Quick Path    Full Path
```

**Shared Systems:**
- DPS Prediction Engine
- Template Database
- Hook Generator
- Audio Sync Engine
- Teleprompter
- Blockchain Receipt

---

## Section 3: Unicorn UX Implementation

### Principle 1: Invisible Interface

**Implementation:**
- Intent-first CTAs: "Create Viral Video" not "Start Workflow"
- Point-of-need actions: Hook suggestions appear when user reaches hook step
- Contextual affordances: Beat suggestions based on selected template
- Auto-save with "Saved" indicator (never lose work)

### Principle 2: Emotional Design

**Implementation:**
- Micro-confirmations: Checkmarks and progress animations at each step
- Friendly loading: "Analyzing viral patterns..." with relevant tips
- Non-blaming errors: "Let's try a different approach" not "Invalid input"
- Celebrations: Confetti animation when DPS exceeds 80

### Principle 3: Contextual Intelligence

**Implementation:**
- Smart defaults: Pre-select user's most-used niche
- Adaptive navigation: Skip steps user has completed before
- Next-best-action: "Your hook is strong, but consider adding urgency"
- Prefill with explanation: "Based on your niche, we suggest..."

### Principle 4: Progressive Disclosure

**Implementation:**
- Default surface: Essential inputs only (niche, template, hook)
- Revealed surface: Advanced options appear after basic completion
- Expert surface: Batch operations, custom beat timings, API access

### Principle 5: Sensory Harmony

**Implementation:**
- Consistent tokens: Use existing design system from `src/components/ui/`
- Motion tokens: Feedback animations for interactions
- Reduce-motion support: Static alternatives for all animations

---

## Section 4: Implementation Architecture

### Shared Components to Create/Enhance

| Component | Purpose | Used By |
|-----------|---------|---------|
| WorkflowPicker | Entry modal to select/create workflow | WF1, WF5 |
| TemplateGallery | Browse viral templates | WF3, WF5 |
| HookGenerator | AI hook generation UI | WF1, WF3 |
| BeatTimeline | Visual beat editor | WF1, WF3 |
| TeleprompterView | Script reading during filming | WF1, WF3 |
| DPSPreview | Live prediction display | WF1, WF3 |
| BlockchainReceipt | Prediction verification | WF3 |
| WorkflowStepper | Progress indicator | WF1, WF3 |

### Database Tables (Already Exist)

- `workflow_runs` - Master workflow records
- `workflow_run_steps` - Individual phase data
- `workflow_run_artifacts` - Generated content
- `scraped_videos` - Template source
- `prediction_events` - DPS predictions with blockchain hash

### API Routes Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/workflows` | GET/POST | List/create workflows |
| `/api/workflows/[id]` | GET/PUT | Get/update specific workflow |
| `/api/workflows/[id]/steps/[phase]` | PUT | Update phase data |
| `/api/templates/curated` | GET | Get 3 best templates for Quick Win |
| `/api/hooks/generate` | POST | Generate hooks from template |
| `/api/beats/suggestions` | POST | Get beat suggestions |
| `/api/prediction/verify` | POST | Create blockchain receipt |

---

## Section 5: Implementation Priority

### Priority 1: Wire Workflow 1 to Database (Phase 78)

This is the foundation - makes Workflow 1 persistent and resumable.

- Replace local React state with database-backed state
- Implement auto-save with debounce
- Wire Optimize phase to prediction pipeline

### Priority 2: Unify Quick Win (Workflow 3)

Consolidate the sandbox and admin implementations into one production-ready flow.

- Merge best features from both implementations
- Add teleprompter and blockchain receipt
- Connect to shared template database

### Priority 3: Build Template Library Hub (Workflow 5)

Create the unified entry point that connects both workflows.

- Template gallery with UI-within-UI previews
- Path selection modal (Quick Win vs Full Creator)
- User preference persistence

### Priority 4: Shared Component Library

Extract and document shared components for consistency.

- Create Storybook entries for each component
- Document props and usage patterns
- Add Unicorn UX compliance tests

---

## Section 6: Files to Modify/Create

### Workflow 1 (Wire to DB):

- `src/app/admin/studio/page.tsx` - Add workflow picker, wire state
- `src/hooks/useWorkflowPersistence.ts` - New hook for auto-save
- `src/app/api/workflows/route.ts` - CRUD endpoints

### Workflow 3 (Consolidate):

- `src/app/admin/workflows/quick-win/page.tsx` - Main file to enhance
- `src/components/workflow/TeleprompterView.tsx` - Extract from sandbox
- `src/components/workflow/BlockchainReceipt.tsx` - New component

### Workflow 5 (Entry Hub):

- `src/app/templates/page.tsx` - New entry page
- `src/components/templates/TemplateHubGallery.tsx` - New gallery component
- `src/components/templates/PathSelectionModal.tsx` - New modal

---

## To-dos (Completed In Order)

1. [ ] Wire Workflow 1 (Creator tab) to database persistence with auto-save
2. [ ] Consolidate Quick Win implementations into single production-ready flow
3. [ ] Build Template Library as unified entry hub with path selection
4. [ ] Extract shared components (HookGenerator, BeatTimeline, DPSPreview)
5. [ ] Apply Unicorn UX principles across all workflows

---

*Created: 2026-01-21*
*Source: User-provided Unified Workflow Architecture document*
