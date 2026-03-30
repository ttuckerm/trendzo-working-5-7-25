# Workflow 1 Redesign Plan (Paul's 3-Step Model)

## Target: Replace /admin/workflows/creator with new design

This plan rebuilds the workflow from scratch using Paul's 3-step mental model:
- **Step 1: Strategy** (do once, reuse for multiple videos)
- **Step 2: Create** (4x4 Beat Editor with baked-in SEO)
- **Step 3: Ship** (DPS prediction + platform publish)

---

## Phase 1: Database Foundation

### Task 1.1: Create content_strategies table
- [x] Create migration `supabase/migrations/20260127_content_strategies.sql`
- [x] Table schema:
  ```sql
  CREATE TABLE content_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    audience_age_band TEXT,
    content_purpose TEXT NOT NULL CHECK (content_purpose IN ('KNOW', 'LIKE', 'TRUST')),
    goals JSONB DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    exemplar_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] Add RLS policies for user access

### Task 1.2: Create strategy_videos link table
- [x] Add to same migration:
  ```sql
  CREATE TABLE strategy_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id UUID REFERENCES content_strategies(id) ON DELETE CASCADE,
    video_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- [x] This enables 1:many (one strategy → many videos)

---

## Phase 2: Build Step 1 - Strategy Panel

### Task 2.1: Create StrategyPanel component
- [x] Create `src/components/workflow-redesign/StrategyPanel.tsx`
- [x] Display saved strategy info:
  - Strategy name (editable)
  - Niche badge
  - Audience age band
  - Purpose badge (KNOW/LIKE/TRUST with color)
  - Keywords as tags
  - Exemplar count
- [x] "Edit Strategy" button
- [x] "Create New Strategy" button
- [x] "Create Video from Strategy" button

### Task 2.2: Create StrategyCreator modal
- [x] Create `src/components/workflow-redesign/StrategyCreator.tsx`
- [x] Single-screen modal with collapsible sections:
  1. Niche dropdown (from existing NICHE_OPTIONS)
  2. Audience age band selector
  3. Purpose cards (KNOW/LIKE/TRUST) - big buttons
  4. Keywords input (tags)
  5. Goals input (optional)
- [x] Save to database on submit
- [x] Auto-select newly created strategy

### Task 2.3: Create Strategy API endpoints
- [x] Create `src/app/api/strategies/route.ts`:
  - GET: List user's strategies
  - POST: Create new strategy
- [x] Create `src/app/api/strategies/[id]/route.ts`:
  - GET: Get single strategy
  - PUT: Update strategy
  - DELETE: Delete strategy

---

## Phase 3: Build Step 2 - 4x4 Create Editor

### Task 3.1: Create FourByFourBeatEditor component
- [x] Create `src/components/workflow-redesign/FourByFourBeatEditor.tsx`
- [x] Visual 2x2 grid layout (NOT tabs):
  ```
  ┌─────────────┬─────────────┐
  │ HOOK (0-4s) │ PROOF       │
  │ [textarea]  │ [textarea]  │
  ├─────────────┼─────────────┤
  │ VALUE       │ CTA         │
  │ [textarea]  │ [textarea]  │
  └─────────────┴─────────────┘
  ```
- [x] Each quadrant shows:
  - Label + timing estimate
  - Textarea for content
  - "Generate" button for AI suggestions
  - Character count

### Task 3.2: Create DynamicCTASuggester component
- [x] Create `src/components/workflow-redesign/DynamicCTASuggester.tsx`
- [x] Reads `content_purpose` from active strategy
- [x] Shows suggested CTAs based on purpose:
  - KNOW → "Comment below", "Follow for more", "Share with someone"
  - LIKE → "Tag a friend", "Duet this", "Share your story"
  - TRUST → "Link in bio", "DM me [keyword]", "Get the guide"
- [x] Pre-populate CTA quadrant with top suggestion
- [x] User can select different suggestion or type custom

### Task 3.3: Create SEOHealthIndicator component
- [x] Create `src/components/workflow-redesign/SEOHealthIndicator.tsx`
- [x] Appears BELOW beat editor (not separate step)
- [x] Shows real-time keyword usage:
  - Keywords in hook: X/Y
  - Keywords in value: X/Y
  - Total keyword density
- [x] Hashtag suggestions based on niche
- [x] Green/yellow/red status indicators

### Task 3.4: Create CaptionEditor component
- [x] Create `src/components/workflow-redesign/CaptionEditor.tsx`
- [x] Simple textarea for caption
- [x] Auto-includes hashtags from SEOHealthIndicator
- [x] Character count with platform limits
- [x] "Generate Caption" button

---

## Phase 4: Build Step 3 - Ship

### Task 4.1: Create ShipPanel component
- [x] Create `src/components/workflow-redesign/ShipPanel.tsx`
- [x] DPS Prediction section:
  - "Get Prediction" button
  - DPS score display (large number)
  - 4x4 breakdown scores:
    - Hook: X/10
    - Proof: X/10
    - Value: X/10
    - CTA: X/10
  - Improvement suggestions per quadrant
- [x] Platform selection:
  - TikTok, Instagram, YouTube, Twitter cards
- [x] "Copy & Go" button:
  - Copies caption + hashtags to clipboard
  - Shows "Copied!" confirmation

### Task 4.2: Create ResultsTracker component (optional section)
- [x] Create `src/components/workflow-redesign/ResultsTracker.tsx`
- [x] Collapsible "Track Results" section
- [x] Input fields for views, likes, comments, shares
- [x] Save to strategy_videos.video_data

---

## Phase 5: Assemble the Page

### Task 5.1: Replace the standalone page
- [x] Backup existing `src/app/admin/workflows/creator/page.tsx`
- [x] Create new page with 3-tab layout:
  ```tsx
  <Tabs defaultValue="strategy">
    <TabsList>
      <TabsTrigger value="strategy">1. Strategy</TabsTrigger>
      <TabsTrigger value="create">2. Create</TabsTrigger>
      <TabsTrigger value="ship">3. Ship</TabsTrigger>
    </TabsList>
    <TabsContent value="strategy">
      <StrategyPanel />
    </TabsContent>
    <TabsContent value="create">
      <FourByFourBeatEditor />
      <SEOHealthIndicator />
      <CaptionEditor />
    </TabsContent>
    <TabsContent value="ship">
      <ShipPanel />
    </TabsContent>
  </Tabs>
  ```

### Task 5.2: Wire up state management
- [x] Create `src/hooks/useStrategy.ts`:
  - Load/save strategies from database
  - Select active strategy
  - CRUD operations
- [x] Create `src/hooks/useVideoCreation.ts`:
  - Beat content state
  - Caption state
  - Auto-save to localStorage
  - Save to database when publishing

### Task 5.3: Test the full flow (MANUAL - SKIP IN RALPH LOOP)
- [MANUAL] Test: Create new strategy → fills all fields → saves to database
- [MANUAL] Test: Load existing strategy → shows in panel
- [MANUAL] Test: Fill 4x4 beats → SEO health updates real-time
- [MANUAL] Test: CTA suggestions match strategy purpose
- [MANUAL] Test: Get DPS prediction → shows 4x4 breakdown
- [MANUAL] Test: Create ANOTHER video from same strategy (1:many)

> **Note:** These tests require manual verification by the user at `/admin/workflows/creator`

---

## Phase 5.4: UI Visibility + Methodology Fixes

### Task 5.4.1: Fix text contrast/visibility
- [x] Fix StrategyCreator.tsx: All label text should use text-zinc-200 or text-white (not text-zinc-500)
- [x] Fix section headers: "Caption & Hashtags", "Select Platform", "Track Results", "Virality Prediction" must be visible
- [x] Fix platform labels: TikTok, Instagram, YouTube, Twitter text must be readable
- [x] Fix all input placeholder text to be visible (text-zinc-400 minimum)

### Task 5.4.2: Add reusable Strategy display
- [x] StrategyPanel should show a card with saved strategy info (niche, audience, purpose, keywords)
- [x] Add "Edit" and "New Strategy" buttons on the card
- [x] Add "Create Video from this Strategy" button

### Task 5.4.3: Dynamic CTA based on KNOW/LIKE/TRUST
- [x] DynamicCTASuggester should read content_purpose from selected strategy
- [x] Auto-populate CTA textarea with first suggestion
- [x] Show suggestion pills user can click to insert

### Task 5.4.4: SEO Health breakdown
- [x] Show "Keywords in hook: X/Y" count
- [x] Show "Keywords in caption: X/Y" count
- [x] Show "Keywords on screen: X/Y" with warning if 0

### Task 5.4.5: DPS 4x4 Analysis display
- [x] After prediction, show per-quadrant scores: Hook X/10, Proof X/10, Value X/10, CTA X/10
- [x] Show improvement suggestion per weak quadrant

---

## Phase 6: Migration to /admin/studio (AFTER USER CONFIRMATION)

### Task 6.1: Wait for confirmation
- [ ] DO NOT proceed until user confirms standalone version works
- [ ] User must test full flow and approve

### Task 6.2: Integrate into Studio
- [ ] Copy components to work within `/admin/studio` structure
- [ ] Replace Creator tab content with new components
- [ ] Wire up to existing Studio state management
- [ ] Test integration with other Studio tabs

---

## Verification Checklist (MANUAL VERIFICATION REQUIRED)

Before marking complete, verify at `/admin/workflows/creator`:

- [ ] User can create a Content Strategy and it saves to database
- [ ] User can create MULTIPLE videos from ONE strategy (1:many works)
- [ ] 4x4 Beat Editor shows all 4 quadrants simultaneously (not tabs)
- [ ] CTA suggestions change based on KNOW/LIKE/TRUST
- [ ] SEO health appears inline, not as separate step
- [ ] DPS prediction shows 4x4-specific scores
- [ ] User perceives workflow as 3 steps, not 19
- [ ] All TypeScript compiles: `npx tsc --noEmit`
- [ ] Page loads without errors at `/admin/workflows/creator`

> **Note:** Automated Ralph Loop cannot verify UI behavior. User must test manually.

---

---

## Phase 7: Unicorn UX Immersion

### Vision
Transform Workflow 1 from a form-filling exercise into an immersive AI-powered content creation experience where:
- Users feel they CAN'T create viral content without Trendzo
- Every suggestion shows WHY it will work (proof from viral data)
- One click generates a complete ready-to-post script
- The system learns and gets smarter over time
- Gamification keeps users engaged and coming back

---

### Task 7.1: "Generate Complete Script" One-Click Magic

#### Task 7.1.1: Add "Generate Complete Script" button
- [x] Location: Create tab, above the 4x4 grid
- [x] Button text: "✨ Generate Complete Script"
- [x] Styling: Large, prominent, gradient background

#### Task 7.1.2: Implement one-click generation behavior
- [x] Show loading animation with reassuring text:
  - "Analyzing 500+ viral videos in your niche..."
  - "Finding the perfect hook for your audience..."
  - "Optimizing for maximum engagement..."
- [x] Generate all 4 sections simultaneously (HOOK, PROOF, VALUE, CTA)
- [x] Auto-generate caption with strategy keywords
- [x] Auto-select top 5 hashtags based on niche
- [x] Show celebration animation: "🎉 Your viral script is ready!"

#### Task 7.1.3: Personalized mock content
- [x] Include user's niche in generated content
- [x] Include their keywords naturally
- [x] Match CTA to KNOW/LIKE/TRUST purpose:
  - KNOW → "Follow for more", "Comment below"
  - LIKE → "Tag a friend", "Share with someone"
  - TRUST → "Link in bio", "DM me [keyword]"

---

### Task 7.2: "Why This Works" Proof System

#### Task 7.2.1: Add proof badge to generated sections
- [x] After AI generates content, show badge on each section
- [x] Badge text: "Based on 47 viral videos in [Niche]" (mock number)
- [x] Add expandable link: "Show me why this works →"

#### Task 7.2.2: Create "Why This Works" expandable panel
- [x] On click "Show me why this works", expand panel below section
- [x] Show 3 mock viral video examples:
  - Example 1: "Side Hustle that made me $10K" - 2.3M views
  - Example 2: "Nobody talks about this side income" - 1.8M views
  - Example 3: "If you want extra money, watch this" - 3.1M views
- [x] Summary text: "These videos used similar hooks and averaged 2.4M views"

#### Task 7.2.3: Mini-carousel of viral examples
- [x] Below each 4x4 section, add horizontal scroll of 3 video thumbnails
- [x] Use placeholder images (dark rectangles with play button overlay)
- [x] On hover: Show title and view count tooltip
- [x] On click: Future - will open video modal (placeholder for now)

---

### Task 7.3: Gamification Foundation

#### Task 7.3.1: Add "Creator Score" to header
- [x] Location: Top right of workflow page, next to strategy name
- [x] Display: "Creator Score: 73" with flame/star icon
- [x] Store in localStorage for now
- [x] Tooltip: "Your score increases as you create more viral content"

#### Task 7.3.2: Add "Streak" indicator
- [x] Location: Below Creator Score
- [x] Display: "🔥 5 day streak"
- [x] Track in localStorage (days with at least 1 script created)
- [x] Tooltip: "You've created content 5 days in a row!"

#### Task 7.3.3: Add completion celebration
- [x] Trigger when all 4 sections + caption are filled
- [x] Show confetti animation (CSS-based, no heavy libraries)
- [x] Display toast: "Script Complete! +10 points"
- [x] Animate Creator Score number incrementing

---

### Task 7.4: Viral Readiness Progress Meter

#### Task 7.4.1: Add "Viral Readiness" meter component
- [x] Location: Fixed right side of Create tab OR below 4x4 grid
- [x] Display: Circular or horizontal progress bar (0-100%)
- [x] Color states:
  - 0-25%: Red - "Needs work"
  - 26-50%: Orange - "Getting there"
  - 51-75%: Yellow - "Good potential"
  - 76-100%: Green - "Viral ready! 🚀"

#### Task 7.4.2: Real-time meter calculation
- [x] HOOK filled: +15%
- [x] PROOF filled: +15%
- [x] VALUE filled: +20%
- [x] CTA filled: +15%
- [x] Caption with keywords: +20%
- [x] Hashtags added (3+): +15%
- [x] Animate meter smoothly as each section completes

---

### Task 7.5: Personalization Signals

#### Task 7.5.1: "Learning your style" indicator
- [x] Track generation/completion in component state
- [x] After content generation, show toast:
  - "📚 Learning your style..."
  - Shows niche optimization: "Optimizing for [niche]"
- [x] Toast auto-dismisses after 3 seconds
- [x] Transitions to "Style preferences saved!" confirmation

#### Task 7.5.2: "Recommended for you" badge
- [ ] When returning to create new video (not first video)
- [ ] Show "Recommended for you" badge on prefilled content
- [ ] Subtitle: "Based on your previous viral content"
- [ ] Store "has created before" flag in localStorage

---

### Implementation Notes

1. **All "viral video data" is MOCK** - we'll connect real data later
2. **All gamification scores are LOCAL** (localStorage) - database later
3. **Focus on VISUAL experience first** - make it feel magical
4. **Every loading state needs reassuring copy:**
   - "Analyzing patterns from 500+ viral videos..."
   - "Finding the perfect hook for your audience..."
   - "Optimizing for maximum engagement..."

---

### Phase 7 Verification Checklist

Before marking Phase 7 complete, verify at localhost:3000/admin/workflows/creator:

- [x] "✨ Generate Complete Script" button exists above 4x4 grid
- [x] Button fills all 4 sections + caption + hashtags with one click
- [x] Loading shows reassuring messages during generation
- [x] Celebration animation plays when generation completes
- [x] Each AI-generated section shows "Based on X viral videos" badge
- [x] "Show me why this works" expands to show 3 example videos
- [x] Creator Score displays in header (e.g., "Creator Score: 73")
- [x] Streak indicator shows (e.g., "🔥 5 day streak")
- [x] Confetti + "+10 points" shows on script completion
- [x] Viral Readiness meter (0-100%) appears and updates in real-time
- [x] Meter color changes: Red → Orange → Yellow → Green
- [x] "📚 Learning your style..." toast appears on content generation
- [x] All text is visible (no dark-on-dark issues)

---

## Current Progress

- [x] Phase 1: Database Foundation
- [x] Phase 2: Strategy Panel
- [x] Phase 3: 4x4 Create Editor
- [x] Phase 4: Ship Panel
- [x] Phase 5: Assemble Page
- [x] Phase 5.4: UI Visibility + Methodology Fixes
- [ ] Phase 6: Migration (pending user confirmation)
- [x] Phase 7: Unicorn UX Immersion (Tasks 7.1-7.5.1 complete, 7.5.2 pending)
