# Plan 74-04 Summary: Optimize Phase with Prediction Display

**Status:** COMPLETED (pending human verification)
**Executed:** 2026-01-20
**Wave:** 2
**Dependencies:** 74-01 (CreatePhase) - COMPLETE

---

## Objective

Create Optimize Phase with DPS display, section scores, Gate A warnings, and AI recommendations.

---

## Files Created

### 1. `src/components/workflow/DPSScoreCard.tsx`
Large, prominent DPS score display component:
- Score number (64px+) with color coding (green >= 80, yellow >= 60, orange >= 40, red < 40)
- Tier badge: VIRAL (purple), GREAT (green), GOOD (blue), LOW (gray)
- Confidence indicator with percentage
- Score interpretation helper text
- Loading skeleton with pulsing animation
- Glow effect on score based on color

**Props:** `score: number | null`, `tier: PredictionTier | null`, `confidence: number | null`, `isLoading: boolean`

### 2. `src/components/workflow/SectionScores.tsx`
Section-by-section score breakdown (Hook/Proof/Value/CTA):
- 2x2 grid on desktop, stack on mobile
- Each card shows: section label with icon, score (1-10), progress bar, evidence text
- Color coding: 9-10 green, 7-8 blue, 5-6 yellow, 1-4 red
- Expandable evidence text (truncated to 100 chars)
- Loading skeleton with 4 placeholder cards

**Props:** `scores: SectionScore[] | null`, `isLoading: boolean`

### 3. `src/components/workflow/GateAWarnings.tsx`
Gate A warning display with inline edit capability:
- Warning cards with severity styling: Critical (red), Warning (yellow), Suggestion (blue)
- Type badges: Hook, Proof, Value, CTA, General
- "Fix This" button for editable fields
- Summary count by severity
- Empty state: Green checkmark "All checks passed!"
- Soft gate notice explaining user can proceed

**Props:** `warnings: GateWarning[]`, `onEditField: (field, value) => void`, `isLoading: boolean`

### 4. `src/components/workflow/AIRecommendations.tsx`
Pack 2 (Editing Coach) suggestions display:
- Header with sparkle icon and before/after DPS potential
- Max 3 recommendation cards
- Priority badges: High Impact (purple), Medium Impact (blue), Low Impact (gray)
- Target field, suggestion text, estimated DPS lift
- Apply/Dismiss action buttons
- Empty state: "Content is well-optimized!"

**Props:** `recommendations: Recommendation[]`, `predictedBefore: number`, `predictedAfter: number`, `onApply: (rec) => void`, `onDismiss: (id) => void`, `isLoading: boolean`

### 5. `src/components/workflow/phases/OptimizePhase.tsx`
Main Optimize phase container:
- Auto-triggers prediction via POST `/api/workflows/:id/optimize` on mount
- Checks for existing prediction first via GET
- Runs gate checks after prediction
- Extracts section scores from Pack 1 `qualitative_analysis.unified_grading`
- Extracts recommendations from Pack 2 `qualitative_analysis.editing_suggestions`
- Re-analyze button to re-run prediction
- Continue to Publish button (always available - soft gates)
- Back to Create button
- Error handling with retry option
- Pro tip box explaining soft gates

**Props:** `workflow: WorkflowRunWithDetails`, `onSave: (data) => Promise<void>`, `onBack: () => void`, `onContinue: () => void`

---

## Files Modified

### 1. `src/components/workflow/index.ts`
Added exports for Optimize phase components:
- `OptimizePhase` component and `OptimizePhaseData` type
- `DPSScoreCard` component and `PredictionTier` type
- `SectionScores` component and `SectionScore`, `SectionType` types
- `GateAWarnings` component and `GateWarning`, `WarningSeverity`, `WarningType` types
- `AIRecommendations` component and `Recommendation` type

### 2. `src/app/workflows/[id]/page.tsx`
- Imported `OptimizePhase` and `OptimizePhaseData`
- Added `OptimizePhaseWrapper` component
- Added `handleSaveOptimizeData` function (saves to phase 4 step)
- Updated switch statement: case 4 now renders `OptimizePhaseWrapper`
- Updated `FuturePhase` to only handle phases 5-6 (removed phase 4)
- Fixed pre-existing TypeScript errors in Research/Plan save handlers (added type casting)

---

## Data Structures

```typescript
// Optimize phase data structure
interface OptimizePhaseData {
  prediction_run_id: string | null;
  edited_content: {
    hook?: string;
    proof?: string;
    value?: string;
    cta?: string;
  };
  gate_check_results: GateWarning[];
}

// Section score from Pack 1
interface SectionScore {
  section: 'hook' | 'proof' | 'value' | 'cta';
  score: number;  // 1-10
  evidence: string;
}

// Gate warning
interface GateWarning {
  id: string;
  type: 'hook' | 'proof' | 'value' | 'cta' | 'general';
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  field?: string;  // If present, allows editing
}

// AI recommendation from Pack 2
interface Recommendation {
  id: string;
  target_field: string;
  suggestion: string;
  estimated_lift: number;
  priority: 1 | 2 | 3;
}
```

---

## API Integration

**Endpoints used:**
- `GET /api/workflows/:id/optimize` - Check for existing prediction
- `POST /api/workflows/:id/optimize` - Run prediction pipeline
- `POST /api/workflows/:id/optimize/gate-checks` - Run Gate A checks

**Data extraction:**
- Section scores mapped from `qualitative_analysis.unified_grading.attribute_scores`
- Recommendations mapped from `qualitative_analysis.editing_suggestions.changes`

---

## TypeScript Verification

```
npx tsc --noEmit --project tsconfig.json 2>&1 | grep -E "(DPSScoreCard|SectionScores|GateAWarnings|AIRecommendations|OptimizePhase)"
# Result: No errors found in Plan 74-04 files
```

All newly created files pass TypeScript compilation.

---

## Deviations from Plan

1. **Type casting for save handlers:** Added `as unknown as Record<string, unknown>` cast to all save handlers (Research, Plan, Create, Optimize) for consistency with the API's `StepInputData` type. This was already done for Create phase but was missing for Research and Plan.

2. **Section score mapping:** Extended the section score extraction logic to handle various Pack 1 output formats, including fallback mappings when specific attributes aren't available.

---

## Human Verification Required

This plan has a human checkpoint. Before marking as complete, user should verify:

1. **Start a workflow and navigate to Optimize phase (phase 4)**
2. **Verify DPSScoreCard displays:**
   - Large score number with correct color
   - Tier badge (VIRAL/GREAT/GOOD/LOW)
   - Confidence percentage
3. **Verify SectionScores shows:**
   - 4 section cards (Hook, Proof, Value, CTA)
   - Scores 1-10 with progress bars
   - Evidence text
4. **Verify GateAWarnings displays:**
   - Warnings with severity styling
   - "Fix This" buttons for editable fields
   - OR "All checks passed!" if no warnings
5. **Verify AIRecommendations shows:**
   - Max 3 suggestions with priority badges
   - Apply/Dismiss buttons
   - OR "Content is well-optimized!" if no suggestions
6. **Test Re-analyze button** - Re-runs prediction
7. **Test Continue button** - Advances to Publish phase

---

## Next Steps

- Phase 75: Publish & Engage Phases (phases 5-6)

---

*Created from Plan 74-04 execution on 2026-01-20*
