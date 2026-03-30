# Workflow 1: Viral Content Creator - Design Specification

## Project Context

Trendzo is a viral video prediction platform. Workflow 1 is the comprehensive content creation pipeline that guides users from research to publishing.

**Current State:** 18 steps across 6 phases - feels like "97 steps" to users
**Target State:** 3 mental steps (Strategy → Create → Ship) with Paul's methodology enforced

---

## Implementation Location

**Phase 1:** Rebuild `/admin/workflows/creator` (standalone page) from scratch with the 3-step design
**Phase 2:** After user confirmation, migrate to `/admin/studio` Creator tab

The standalone page at `src/app/admin/workflows/creator/page.tsx` should be REPLACED, not modified incrementally. Create new components in `src/components/workflow-redesign/` and replace the page entirely.

**CRITICAL:** Do NOT modify the existing 19-step workflow components in `src/components/workflow-1/`. Build fresh components for the redesign.

---

## Paul's Methodology (Source of Truth)

Paul teaches a specific framework for viral content creation:

### The 4x4 Method (Non-Negotiable Structure)
```
┌─────────────────┬─────────────────┐
│ 1. HOOK (0-4s)  │ 2. PROOF        │
│ Pain points     │ Stats/studies   │
│ Desires         │ Testimonials    │
│ Polarizing      │ Authority       │
└─────────────────┴─────────────────┘
┌─────────────────┬─────────────────┐
│ 3. VALUE        │ 4. CTA          │
│ The recipe      │ Based on        │
│ Tips/steps      │ Know/Like/Trust │
│ Process         │ goal            │
└─────────────────┴─────────────────┘
```

### Know/Like/Trust Framework
- **KNOW** = Awareness content → CTA: "Comment below", "Follow for more"
- **LIKE** = Connection content → CTA: "Share with someone", "Tag a friend"  
- **TRUST** = Conversion content → CTA: "Link in bio", "DM me 'KEYWORD'"

### Research → Create Ratio
Paul teaches "Research once, create many" - one content strategy should generate multiple videos, not 1:1.

### Content Pillars
- Educational (how-to, tutorials)
- Entertainment (skits, trends)
- Inspirational (stories, motivation)
- Validation (relatable, "you're not alone")

---

## Gap Analysis: Current vs. Ideal

| Aspect | Current Implementation | Paul's Methodology | Gap |
|--------|----------------------|-------------------|-----|
| 4x4 Method | Beat Editor has Hook/Proof/Value/CTA fields | Explicit 4-quadrant visual with timing | No visual structure, no time enforcement |
| Know/Like/Trust | Selected in Research phase step 1.3 | Cascades to CTA suggestions throughout | Selection has no downstream effect |
| Research:Create ratio | 1:1 (one research = one video) | 1:many (strategy reused for multiple videos) | No "Content Strategy" persistence |
| SEO | Separate step in Create phase | Baked into Create, auto-populates | Extra step, not integrated |
| Exemplar Swoop | Collects viral videos | Extracts hook templates from exemplars | No template extraction |
| User perception | 18 steps, 6 phases | 3 steps: Strategy → Create → Ship | UI doesn't collapse complexity |
| DPS Prediction | Pass/fail gate | Diagnostic with 4x4 feedback | No structure-specific feedback |

---

## Target UI/UX Design

### High-Level Flow (3 Steps)
```
┌──────────────────────────────────────────────────────────────┐
│ WORKFLOW 1: FULL CREATOR                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [1. STRATEGY]  ──▶  [2. CREATE]  ──▶  [3. SHIP]            │
│   (one-time)          (per video)      (per video)          │
│                                                              │
│  • Niche              • 4x4 Beats      • DPS Check          │
│  • Audience           • SEO (baked)    • Platform           │
│  • Purpose            • Caption        • Schedule           │
│  • Exemplars                           • Track              │
│  • Keywords                                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Strategy (Reusable)
```
┌─────────────────────────────────────────────────────────────┐
│ YOUR CONTENT STRATEGY                     [Edit] [New]      │
├─────────────────────────────────────────────────────────────┤
│ Niche: Self-Publishing Books                                │
│ Audience: 25-34 year olds, aspiring authors                 │
│ Purpose: TRUST (teaching how-tos)                           │
│ Goal: 100K views, 10K followers                             │
│ Keywords: self-publish, KDP, Amazon, book marketing         │
│ Exemplars: 5 viral videos saved → [View Templates]          │
└─────────────────────────────────────────────────────────────┘
│ [Create Video from this Strategy]                           │
└─────────────────────────────────────────────────────────────┘
```

User does Research ONCE, then creates MULTIPLE videos from that strategy.

### Step 2: Create (4x4 Beat Editor)
```
┌─────────────────────────────────────────────────────────────┐
│ 4x4 VIDEO STRUCTURE                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ 1. HOOK (0-4s)  │───▶│ 2. PROOF        │                │
│  │                 │    │                 │                │
│  │ "If you're      │    │ "According to   │                │
│  │ trying to..."   │    │ Amazon data..." │                │
│  │                 │    │                 │                │
│  │ [Pain Point] ▼  │    │ [Stat/Study] ▼  │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │ 3. VALUE        │───▶│ 4. CTA          │                │
│  │                 │    │                 │                │
│  │ "Here's the     │    │ "Follow for     │                │
│  │ exact process..." │   │ more tips..."   │                │
│  │                 │    │                 │                │
│  │ [Steps/Tips] ▼  │    │ [Based on       │                │
│  │                 │    │  TRUST goal] ▼  │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Each quadrant has:
- Templates pulled from Exemplar Swoop
- AI-assisted suggestions based on niche/pillar
- Time estimate (Paul says 4 seconds for hook)

### SEO Health (Baked In, Not Separate Step)
```
┌─────────────────────────────────────────────────────────────┐
│ SEO HEALTH                                    [Edit Keywords]│
├─────────────────────────────────────────────────────────────┤
│ Keywords in caption: 4/5 ✓                                  │
│ Keywords in hook: 2/3 ✓                                     │
│ Keywords on screen: 0/2 ⚠️ (Add on-screen text)             │
│                                                             │
│ Suggested keywords: #selfpublish #KDP #amazonbooks          │
└─────────────────────────────────────────────────────────────┘
```

### Dynamic CTA Based on Know/Like/Trust
```
// When user selected TRUST in Strategy:
Suggested CTAs for TRUST content:
• "Link in bio for my free guide"
• "DM me 'BOOK' for the template"
• "Comment 'how to publish' for more"

// When user selected KNOW in Strategy:
Suggested CTAs for KNOW content:
• "What's your biggest struggle? Comment below"
• "Follow for my journey"
• "Share with someone who needs this"
```

### Step 3: Ship (DPS + Publish)
```
┌─────────────────────────────────────────────────────────────┐
│ VIRALITY PREDICTION                                         │
├─────────────────────────────────────────────────────────────┤
│ DPS Score: 72 (Good)                                        │
│                                                             │
│ 4x4 Analysis:                                               │
│ ✓ Hook: Strong pain point detected (8/10)                  │
│ ⚠️ Proof: No stats/studies found (4/10)                    │
│ ✓ Value: 3 actionable tips detected (7/10)                 │
│ ✓ CTA: Matches TRUST goal (9/10)                           │
│                                                             │
│ Improvement: Add a stat like "67% of first-time authors..." │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Requirements

### Database Changes
1. **content_strategies** table - Stores reusable strategies (niche, audience, purpose, keywords, exemplars)
2. **strategy_videos** table - Links videos to their parent strategy (1:many)
3. Update **workflow_runs** to reference strategy_id

### Component Changes
1. **StrategyPanel** - Display/edit saved content strategy
2. **FourByFourBeatEditor** - Visual 4-quadrant beat editor with timing
3. **DynamicCTASuggester** - CTA suggestions based on Know/Like/Trust
4. **SEOHealthIndicator** - Inline SEO feedback (not separate step)
5. **ExemplarTemplateExtractor** - Extract hook/beat templates from saved exemplars

### State Management
1. Separate "Strategy" state (persisted, reusable)
2. "Video" state (per-video, references strategy)
3. Auto-save both to database

### API Endpoints
1. `POST /api/strategies` - Create new content strategy
2. `GET /api/strategies` - List user's strategies
3. `POST /api/strategies/[id]/videos` - Create video from strategy
4. `POST /api/exemplars/extract-templates` - Extract templates from exemplar videos

---

## Success Criteria

1. User can create a Content Strategy ONCE and generate MULTIPLE videos from it
2. 4x4 Beat Editor is visual and enforces timing structure
3. Know/Like/Trust selection automatically influences CTA suggestions
4. SEO is not a separate step - it's baked into the Create phase
5. DPS Prediction gives 4x4-specific feedback (Hook strength, Proof quality, etc.)
6. User perceives workflow as 3 steps, not 18

---

## Existing Files to Modify

- `src/lib/workflow-specs/workflow-1-spec.ts` - Add strategy concept, 4x4 types
- `src/app/studio/creator/page.tsx` - Rebuild UI around 3-step model
- `src/components/workflow/` - Add new components
- `supabase/migrations/` - New tables for strategies

## Existing Files for Reference

- `.planning/WORKFLOW-ARCHITECTURE.md` - Current architecture
- `docs/workflow-mapping.md` - Current workflow documentation
- `CLAUDE.md` - Project operating system
