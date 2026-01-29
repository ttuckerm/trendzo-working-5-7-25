# Phase 74: Create & Optimize Phases - Context

**Phase**: 74 - Create & Optimize Phases
**Milestone**: v1.1 - Workflow 1 (Viral Content Creator)
**Captured**: 2026-01-20

---

## Vision Summary

Build the Create (Phase 3) and Optimize (Phase 4) UI components. Create handles video recording/upload and script writing with side-by-side 4x4 Method editing. Optimize runs prediction, displays combined DPS score with section breakdown, and allows inline editing to fix Gate A warnings.

---

## Key Decisions

### Create Phase - Video Input
- **Recording Options**: Full support for file upload + webcam recording + screen capture
- **Storage**: Supabase Storage bucket with auto-delete after 7 days
- **File Types**: MP4 primary, support common video formats

### Create Phase - Script Flow
- **4x4 Method Connection**: Side-by-side editing view
  - Left panel: Plan phase's 4x4 outline (Hook/Proof/Value/CTA) as read-only reference
  - Right panel: Editable script sections for actual video script
- **Pre-fill**: Pull values from Plan phase step output_data

### Create Phase - Content Fields
- **Title**: Text input for video title
- **Description**: Text area for video description
- **Duration Target**: Dropdown or slider for target duration (15s, 30s, 60s, 3min)
- **Proof Assets**: Optional text notes field (not file upload)
  - User notes what proof they'll include in video
  - Examples: "Screenshot of $5k month", "Before/after transformation"

### Optimize Phase - Prediction Display
- **Score Layout**: Combined Score + Section Breakdown
  - Large, prominent DPS prediction score at top
  - Section-by-section scores below: Hook score, Proof score, Value score, CTA score
  - Pack results (1/2/3/V) available in expandable detail panels

### Optimize Phase - Gate A Handling
- **Warning Display**: Show Gate A warnings inline with the content
- **Edit Mode**: User can edit script/content right in Optimize phase
- **Re-run**: "Re-analyze" button to run prediction again after edits
- **Proceed**: "Proceed Anyway" option even with warnings (soft gates)

### Optimize Phase - AI Suggestions
- **Pack 2 Location**: Show Editing Coach suggestions only in Optimize phase
- **Not in Create**: No real-time AI during writing (cleaner workflow)
- **Timing**: After prediction runs, show max 3 improvement suggestions

---

## UI Components Needed

### Create Phase Components

1. **CreatePhase.tsx** - Main container
   - Auto-save with debounce (500ms)
   - Video upload section
   - Script editing section
   - Footer navigation

2. **VideoInput.tsx** - Video recording/upload
   - Tab interface: Upload | Webcam | Screen
   - File drag-and-drop for upload
   - Webcam preview and record button
   - Screen capture with audio options
   - Upload to Supabase Storage

3. **ScriptEditor.tsx** - Side-by-side 4x4 editing
   - Left panel: Plan phase reference (read-only)
   - Right panel: Hook, Proof, Value, CTA text areas
   - Character/word counts per section

4. **ContentMetadata.tsx** - Title, description, duration
   - Title input with character limit
   - Description textarea
   - Duration target selector

### Optimize Phase Components

1. **OptimizePhase.tsx** - Main container
   - Trigger prediction on phase entry
   - Display results
   - Inline editing support

2. **DPSScoreCard.tsx** - Combined score display
   - Large DPS number prominently displayed
   - Tier badge (Good/Great/Viral)
   - Confidence indicator

3. **SectionScores.tsx** - Section breakdown
   - Hook score with evidence
   - Proof score with evidence
   - Value score with evidence
   - CTA score with evidence

4. **GateAWarnings.tsx** - Gate check warnings
   - List of warnings with severity
   - Inline edit capability
   - "Fix This" quick actions

5. **AIRecommendations.tsx** - Pack 2 suggestions
   - Max 3 suggestions displayed
   - Estimated lift per suggestion
   - Apply/Dismiss actions

6. **OptimizeActions.tsx** - Phase actions
   - "Re-analyze" button
   - "Proceed to Publish" button
   - Back to Create button

---

## Data Flow

### Create Phase
```
1. Load Plan phase output_data (4x4 Method values)
2. Display side-by-side with editable script
3. User records/uploads video → Supabase Storage
4. User fills title, description, duration target
5. Auto-save to workflow step input_data
6. On "Continue", save final state and advance to Optimize
```

### Optimize Phase
```
1. On phase entry, trigger runPredictionPipeline()
2. Save prediction results as artifact (type: 'prediction')
3. Display DPS score, section scores, warnings
4. If user edits inline → update step input_data
5. "Re-analyze" → run prediction again, save new artifact version
6. On "Continue", check soft gates, show warnings, allow proceed
```

---

## API Dependencies

Uses existing Phase 72 endpoints:
- GET/PUT `/api/workflows/:id/steps/3` - Create phase data
- GET/PUT `/api/workflows/:id/steps/4` - Optimize phase data
- POST `/api/workflows/:id/artifacts` - Save prediction results
- GET/POST `/api/workflows/:id/optimize` - Trigger prediction
- POST `/api/workflows/:id/optimize/gate-checks` - Get Gate A results

---

## File Upload Flow

```
1. User selects/records video
2. Frontend generates unique filename: workflow_{id}_video_{timestamp}.mp4
3. Upload to Supabase Storage: bucket 'workflow-videos'
4. Store video_url in step input_data
5. Pass video_url to prediction pipeline
6. Auto-cleanup: Supabase policy deletes files older than 7 days
```

---

## Technical Considerations

### Video Recording
- Use `MediaRecorder` API for webcam/screen capture
- `navigator.mediaDevices.getUserMedia()` for webcam
- `navigator.mediaDevices.getDisplayMedia()` for screen
- Handle permission requests gracefully
- Show preview before finalizing

### Side-by-Side Editor
- Use CSS Grid or Flexbox for two-column layout
- Plan panel: readonly display of 4x4 from previous phase
- Script panel: 4 text areas (Hook/Proof/Value/CTA)
- Sync scroll if content is long

### Prediction Integration
- Use existing `runPredictionPipeline()` via WorkflowService
- Extract section-specific scores from Pack 1 results
- Display Pack 2 suggestions in AI Recommendations panel

---

## Next Steps

1. Create Phase 74 execution plans (multiple plans for modularity)
2. Plan 74-01: Create Phase container and navigation
3. Plan 74-02: Video input component (upload/webcam/screen)
4. Plan 74-03: Script editor with side-by-side view
5. Plan 74-04: Optimize phase with prediction display

---

*Created from discuss-phase session on 2026-01-20*
