# Workflow Mapping - CleanCopy System

**Purpose**: Master reference document for all workflows across all pages in the CleanCopy system. Tracks what each workflow does, which features it uses, how workflows interact, and modification history.

**Last Updated**: 2025-10-19

---

## Table of Contents

1. [Admin: The Proving Grounds](#page-1-admin-the-proving-grounds)
2. [Admin: Script Intelligence](#page-2-admin-script-intelligence)
3. [Workflow Interactions](#workflow-interactions)
4. [Modification History](#modification-history)

---

## Page 1: Admin: The Proving Grounds

**URL**: `http://localhost:3000/admin/pipeline-manager`

**Purpose**: Manage the video ingestion pipeline - scrape viral videos, transcribe them, filter for patterns, and track viral metrics.

### Workflows

#### Workflow 1.1: Run TikTok Scraper
- **Trigger**: Click "Run Scraper" button
- **Features Used**: FEAT-001 (TikTok Scraper Integration)
- **What It Does**:
  - Calls Apify TikTok scraper API
  - Fetches videos matching viral criteria (view thresholds, engagement)
  - Saves video metadata to `scraped_videos` table (video_id, url, creator info, views, likes, caption)
- **Success Criteria**:
  - Toast notification shows "X videos scraped successfully"
  - Stats cards update (Total Videos count increases)
  - New video cards appear in grid below
- **Result Location**: Video grid section below pipeline actions
- **Interactions**: Provides raw video data for Workflows 1.2, 1.3, 1.4

#### Workflow 1.2: Transcribe Videos
- **Trigger**: Click "Transcribe Videos" button
- **Features Used**: FEAT-001 (TikTok Scraper Integration - transcription component)
- **What It Does**:
  - Queries `scraped_videos` for videos without transcripts
  - Sends video audio to transcription service
  - Updates `transcript_text` field in `scraped_videos` table
- **Success Criteria**:
  - Toast notification: "Successfully transcribed X videos! Video cards now show transcripts. Go to Script Intelligence → Run Knowledge Extraction to analyze them."
  - Video cards now display transcript text
- **Result Location**: Transcript text appears in video cards in grid
- **Interactions**: Prepares data for Workflow 2.1 (Knowledge Extraction)

#### Workflow 1.3: Run Viral Filter
- **Trigger**: Click "Run Viral Filter" button
- **Features Used**:
  - FEAT-002 (DPS Calculator)
  - FEAT-003 (Pattern Extraction)
- **What It Does**:
  - Calculates DPS score for each video: `(views / cohort_median) × platform_weight × decay_factor`
  - Classifies videos as viral (≥70 DPS) or negative (<70 DPS)
  - Inserts viral videos into `viral_pool` table
  - Inserts negative videos into `negative_pool` table
  - Extracts common patterns from viral videos
  - Saves patterns to `viral_patterns` table
- **Success Criteria**:
  - Toast notification: "Processed X videos! Found Y viral + Z negative samples. Check stats cards and patterns section below."
  - Stats cards update (Avg DPS Score, Viral Videos count)
  - Patterns section populates with extracted patterns
- **Result Location**:
  - Stats cards (top of page)
  - Patterns section (middle of page)
  - Video cards show DPS scores
- **Interactions**: Uses data from Workflow 1.1, provides patterns for Workflow 2.2 (Script Predictor)

#### Workflow 1.4: View All Patterns
- **Trigger**: Click "→ View All Patterns (X)" button in Patterns section
- **Features Used**: FEAT-003 (Pattern Extraction - data retrieval)
- **What It Does**:
  - Queries `viral_patterns` table for ALL patterns (no limit)
  - Opens modal displaying pattern grid with full details
  - Shows: pattern type, description, frequency, success rate, avg DPS, viral video count
- **Success Criteria**:
  - Modal opens showing all patterns in 2-column grid
  - Each pattern card displays complete metadata
  - Close button dismisses modal
- **Result Location**: Modal overlay (full screen)
- **Interactions**: Read-only view of data created by Workflow 1.3

#### Workflow 1.5: Load More Videos
- **Trigger**: Click "Load More Videos" button at bottom of video grid
- **Features Used**: Database query (no specific feature)
- **What It Does**:
  - Queries next batch of 12 videos from `scraped_videos` using offset pagination
  - Appends new videos to existing grid
  - Increments offset by 12
  - Hides button when no more videos available
- **Success Criteria**:
  - Next 12 videos appear below existing videos
  - Button shows "Loading..." during fetch
  - Button disappears when all videos loaded
- **Result Location**: Video grid (new cards appended to bottom)
- **Interactions**: Displays data from Workflow 1.1

#### Workflow 1.6: Refresh Data
- **Trigger**: Click "↻ Refresh Data" button
- **Features Used**: Database query (no specific feature)
- **What It Does**:
  - Reloads stats cards (total videos, avg DPS, viral count)
  - Reloads video grid from database (first 12 videos)
  - Reloads patterns section (top 6 patterns)
- **Success Criteria**:
  - All sections update with latest database data
  - Video grid resets to first page
  - Stats reflect current database state
- **Result Location**: Entire page refreshes
- **Interactions**: Reflects changes from all other workflows

---

## Page 2: Admin: Script Intelligence

**URL**: `http://localhost:3000/admin/research-review`

**Purpose**: Extract viral knowledge from transcripts and predict viral potential of new scripts before filming.

### Workflows

#### Workflow 2.1: Run Knowledge Extraction (Keyword Research Tab)
- **Trigger**: Click "Extract Knowledge" button
- **Features Used**: FEAT-060 (Knowledge Extraction)
- **What It Does**:
  - Queries `scraped_videos` for videos with transcripts but no keywords
  - Sends transcripts to 3 AI models (GPT-4, Claude, Gemini)
  - Extracts viral keywords, hooks, patterns, and content elements
  - Saves extracted keywords to `extracted_keywords` table (status: pending_review)
  - Auto-refreshes keyword list when complete
- **Success Criteria**:
  - Toast notification: "Knowledge extraction complete! X succeeded, Y failed. Keywords now appear below - scroll down to review and approve them."
  - Keywords section populates with extracted data
  - Each keyword shows: keyword, category, frequency, confidence score
- **Result Location**: Keywords section below the extraction button (same page, scroll down)
- **Interactions**:
  - Requires Workflow 1.2 (transcripts must exist)
  - Provides data for Workflow 2.2 (patterns used in predictions)

#### Workflow 2.2: Approve Keywords (Keyword Research Tab)
- **Trigger**: Click "✓" (approve) button on keyword card
- **Features Used**: FEAT-060 (Knowledge Extraction - approval component)
- **What It Does**:
  - Updates keyword record in `extracted_keywords` table
  - Changes status from `pending_review` to `approved`
  - Approved keywords become part of active viral knowledge base
- **Success Criteria**:
  - Keyword card changes visual state (likely background color or border)
  - Toast notification: "Keyword approved"
- **Result Location**: Same keyword card (visual state change)
- **Interactions**: Approved keywords used by Workflow 2.3 for predictions

#### Workflow 2.3: Reject Keywords (Keyword Research Tab)
- **Trigger**: Click "✗" (reject) button on keyword card
- **Features Used**: FEAT-060 (Knowledge Extraction - approval component)
- **What It Does**:
  - Updates keyword record in `extracted_keywords` table
  - Changes status from `pending_review` to `rejected`
  - Rejected keywords excluded from active viral knowledge base
- **Success Criteria**:
  - Keyword card changes visual state or is removed from view
  - Toast notification: "Keyword rejected"
- **Result Location**: Same keyword card (visual state change or removal)
- **Interactions**: Rejected keywords excluded from Workflow 2.3 predictions

#### Workflow 2.4: Predict Script Viral Potential (Script Predictor Tab)
- **Trigger**: Enter script text and click "ANALYZE & PREDICT" button
- **Features Used**: FEAT-070 (Pre-Content Prediction)
- **What It Does**:
  - Sends script text to Claude AI
  - AI analyzes script against:
    - Approved viral keywords from `extracted_keywords`
    - Viral patterns from `viral_patterns` table
    - Viral thresholds from `viral-thresholds.ts` config
  - Returns:
    - Viral potential score (0-100)
    - Explanation of why score was given
    - Specific recommendations for improvement
    - Breakdown by category (hook strength, value density, etc.)
- **Success Criteria**:
  - Results section appears showing:
    - Large viral score display
    - Detailed explanation text
    - Numbered list of recommendations
  - "Copy Results" button appears
- **Result Location**: Results section on same page (below input area)
- **Interactions**:
  - Uses patterns from Workflow 1.3 (viral filter)
  - Uses keywords from Workflow 2.1 (knowledge extraction)

#### Workflow 2.5: Copy Prediction Results (Script Predictor Tab)
- **Trigger**: Click "📋 COPY RESULTS" button
- **Features Used**: Browser clipboard API (no specific feature)
- **What It Does**:
  - Formats prediction result as JSON
  - Copies to system clipboard
  - Shows alert notification
- **Success Criteria**:
  - Alert popup: "Results copied to clipboard!"
  - Clipboard contains formatted JSON with score, explanation, recommendations
- **Result Location**: System clipboard
- **Interactions**: Read-only operation on data from Workflow 2.4

---

## Workflow Interactions

### Primary Data Flow
```
Workflow 1.1 (Scraper)
    ↓ provides video data
Workflow 1.2 (Transcribe)
    ↓ provides transcripts
Workflow 2.1 (Knowledge Extraction)
    ↓ provides keywords/patterns
Workflow 2.4 (Script Predictor)
```

### Secondary Data Flow
```
Workflow 1.1 (Scraper)
    ↓ provides video data
Workflow 1.3 (Viral Filter)
    ↓ provides viral patterns
Workflow 2.4 (Script Predictor)
```

### Dependencies Map

| Workflow | Depends On | Provides Data For |
|----------|------------|-------------------|
| 1.1 Scraper | None | 1.2, 1.3, 1.5, 1.6 |
| 1.2 Transcribe | 1.1 | 2.1 |
| 1.3 Viral Filter | 1.1 | 1.4, 1.6, 2.4 |
| 1.4 View Patterns | 1.3 | None (read-only) |
| 1.5 Load More | 1.1 | None (read-only) |
| 1.6 Refresh | All | None (read-only) |
| 2.1 Knowledge Extract | 1.2 | 2.2, 2.3, 2.4 |
| 2.2 Approve Keyword | 2.1 | 2.4 |
| 2.3 Reject Keyword | 2.1 | 2.4 (exclusion) |
| 2.4 Predict Script | 1.3, 2.1 | 2.5 |
| 2.5 Copy Results | 2.4 | None (export) |

### Database Tables Used

| Workflow | Tables Read | Tables Written |
|----------|-------------|----------------|
| 1.1 Scraper | None | `scraped_videos` |
| 1.2 Transcribe | `scraped_videos` | `scraped_videos` (update) |
| 1.3 Viral Filter | `scraped_videos` | `viral_pool`, `negative_pool`, `viral_patterns` |
| 1.4 View Patterns | `viral_patterns` | None |
| 1.5 Load More | `scraped_videos` | None |
| 1.6 Refresh | `scraped_videos`, `viral_patterns` | None |
| 2.1 Knowledge Extract | `scraped_videos` | `extracted_keywords` |
| 2.2 Approve Keyword | `extracted_keywords` | `extracted_keywords` (update) |
| 2.3 Reject Keyword | `extracted_keywords` | `extracted_keywords` (update) |
| 2.4 Predict Script | `extracted_keywords`, `viral_patterns` | None |
| 2.5 Copy Results | None | None |

---

## Modification History

### 2025-10-19: Initial Workflow Fixes

#### Issue #1: View All Patterns Not Implemented
- **Problem**: "View All Patterns" was just a non-functional link
- **Workflow Affected**: 1.4 View All Patterns
- **Fix Applied**:
  - Added state management (`showAllPatterns`, `allPatterns`)
  - Created `fetchAllPatterns()` function
  - Built modal UI with pattern grid
  - Changed link to functional button
- **Files Modified**: `src/app/admin/pipeline-manager/page.tsx`
- **Verification**: Click button → modal opens → all patterns display → close button works

#### Issue #2: Load More Pagination Not Working
- **Problem**: "Load More Videos" button reloaded same 12 videos instead of fetching next batch
- **Workflow Affected**: 1.5 Load More Videos
- **Fix Applied**:
  - Added pagination state (`videoOffset`, `hasMoreVideos`)
  - Updated `fetchVideos()` to support append mode
  - Implemented offset-based querying with `.range(offset, offset + 11)`
  - Button conditionally renders based on `hasMoreVideos`
- **Files Modified**: `src/app/admin/pipeline-manager/page.tsx`
- **Verification**: Click "Load More" → next 12 videos append → offset increments → button hides when done

#### Issue #3: Database Error in Viral Filter
- **Problem**: `null value in column 'follower_bucket' violates not-null constraint`
- **Workflow Affected**: 1.3 Run Viral Filter
- **Fix Applied**:
  - Updated `insertNegativePool()` to include all required fields
  - Updated `insertViralPool()` to include all required fields
  - Added: `follower_bucket`, `engagement_score`, `views_1h`, `likes_1h`, `creator_followers`
- **Files Modified**: `src/lib/services/viralFilter.ts`
- **Verification**: Run Viral Filter → no database errors → viral/negative pools populate correctly

#### Issue #4: Unclear Success Messages
- **Problem**: Success notifications didn't tell users where to look for results
- **Workflows Affected**: 1.2 Transcribe Videos, 1.3 Run Viral Filter, 2.1 Knowledge Extraction
- **Fix Applied**:
  - **Transcribe**: Added "Go to Script Intelligence → Run Knowledge Extraction to analyze them"
  - **Viral Filter**: Added "Check stats cards and patterns section below"
  - **Knowledge Extract**: Added "Keywords now appear below - scroll down to review and approve them"
- **Files Modified**:
  - `src/app/admin/pipeline-manager/page.tsx` (Workflows 1.2, 1.3)
  - `src/app/admin/research-review/page.tsx` (Workflow 2.1)
- **Verification**: Success messages now guide users to result locations

#### Issue #5: Copy Results Verification
- **Problem**: User unsure if "Copy Results" button was implemented
- **Workflow Affected**: 2.5 Copy Prediction Results
- **Fix Applied**: No fix needed - verified implementation exists and works
- **Files Modified**: None
- **Verification**: Confirmed code exists at `research-review/page.tsx:733-742`

### 2025-10-19: Database Tables Missing (CRITICAL)
- **Problem**: `viral_pool`, `negative_pool`, and `viral_filter_runs` tables don't exist in database
- **Error**: "Failed to insert negative pool: Could not find the 'engagement_score' column of 'negative_pool' in the schema cache"
- **Workflow Affected**: 1.3 Run Viral Filter, 1.4 View All Patterns
- **Root Cause**: Tables were never created via migrations
- **Fix Applied**:
  - Created migration file: `supabase/migrations/20251019_viral_filter_tables.sql`
  - Created manual SQL script: `scripts/create-viral-filter-tables.sql`
  - SQL must be run manually in Supabase SQL Editor to create tables
- **Files Created**:
  - `supabase/migrations/20251019_viral_filter_tables.sql`
  - `scripts/create-viral-filter-tables.sql`
- **Verification**: Run SQL in Supabase → Run Viral Filter → no errors → patterns populate → View All Patterns shows data

---

## Critical UX Issues Identified (2025-10-19)

### Progress Summary

**Completed** ✅
- [x] UX-001: Filter Dropdowns Have Invisible Text
- [x] UX-002: Knowledge Extraction Shows Zero Results
- [x] UX-004: Transcript Visibility (already working)

**Not Started** ⬜
- [ ] UX-003: Limited Video Display (Only ~13 Videos Shown)
- [ ] UX-005: Multi-Page Workflow Is Absurd and Confusing
- [ ] UX-006: Predictions Not Stored (Clipboard-Only)
- [ ] UX-007: No Time-Based Projections in Predictions
- [ ] UX-008: No Script Editing Based on Recommendations
- [ ] UX-009: No Prediction History/Comparison Dashboard
- [ ] UX-010: XGBoost Integration for Improved Predictions

---

### Issues Requiring Immediate Attention

#### ✅ UX-001: Filter Dropdowns Have Invisible Text [FIXED 2025-10-19]
- **Location**: The Proving Grounds page, filter section (red rectangle in workflow review)
- **Problem**:
  - "Pattern: All" dropdown only shows one option
  - Dropdown options have white text on white background (invisible)
  - User cannot see available filter options
- **Impact**: Users cannot filter videos by pattern type or DPS range
- **Status**: ✅ **FIXED**
- **Priority**: HIGH
- **Fix Applied**:
  - Added explicit `bg-gray-900 text-white` classes to all `<option>` elements
  - Added Tailwind arbitrary variant `[&>option]:bg-gray-900 [&>option]:text-white` to select elements
  - Populated Pattern dropdown with actual pattern types from `patterns` state
  - Dynamically renders unique pattern types from database
- **Files Modified**: `src/app/admin/pipeline-manager/page.tsx`
- **Verification**: Refresh page → Open dropdowns → Options are now visible with dark background and white text

#### ✅ UX-002: Knowledge Extraction Shows Zero Results [FIXED 2025-10-19]
- **Location**: Script Intelligence page, Keyword Research tab
- **Problem**:
  - "Extract Knowledge" button completes successfully
  - Success message appears but no keywords/hooks/patterns display
  - Keywords section remains empty
- **Impact**: Users cannot approve/reject keywords, predictions lack data
- **Status**: ✅ **FIXED**
- **Priority**: CRITICAL
- **Root Cause**: UI was parsing wrong field names from `consensus_insights` JSON
  - UI expected: `hooks`, `keywords`, `triggers`
  - Actual data: `viral_hooks`, `emotional_triggers`, `viral_coefficient_factors`
- **Fix Applied**:
  - Updated `loadExtractedKeywords()` to parse correct field names
  - Added support for `viral_hooks` → category: 'hook'
  - Added support for `emotional_triggers` → category: 'trigger'
  - Added support for `viral_coefficient_factors` → category: 'keyword'
  - Added support for `pattern_match` → category: 'pattern'
  - Maintained backward compatibility for old field names
- **Files Modified**: `src/app/admin/research-review/page.tsx`
- **Verification**: Go to Script Intelligence → Keywords should now display hooks, triggers, and patterns from extracted_knowledge table

#### ⬜ UX-003: Limited Video Display (Only ~13 Videos Shown) [NOT STARTED]
- **Location**: The Proving Grounds page, video grid
- **Problem**:
  - Only first 12-13 videos display on initial page load
  - Database likely contains 100+ videos
  - Users cannot access most of their video data
  - "Load More" button helps but requires many clicks
- **Impact**: Users have incomplete view of their data, cannot analyze full dataset
- **Status**: ⬜ **NOT STARTED**
- **Priority**: HIGH
- **Suggested Fix Options**:
  1. **Option A**: Increase initial page size to 50-100 videos
  2. **Option B**: Add "Load All Videos" button that fetches everything
  3. **Option C**: Add infinite scroll (auto-loads more as user scrolls)
  4. **Option D**: Add pagination controls (1, 2, 3...10) to jump between pages
- **User Preference**: Needs clarification from user

#### ✅ UX-004: Transcript Visibility Confirmed Working [NO ACTION NEEDED]
- **Location**: The Proving Grounds page, video cards
- **Problem**: NONE - User confirmed transcript snippets ARE visible on video cards
- **Status**: ✅ **WORKING CORRECTLY**
- **Priority**: N/A
- **No Action Needed**: Transcripts display as expected

#### ⬜ UX-005: Multi-Page Workflow Is Absurd and Confusing [NOT STARTED]
- **Location**: The Proving Grounds → Script Intelligence navigation
- **Problem**:
  - Transcribe videos on Page 1 (The Proving Grounds)
  - Navigate manually to Page 2 (Script Intelligence)
  - Click "Extract Knowledge" on Page 2
  - No indication this workflow is required
  - Users get stuck not knowing next steps
- **Impact**: Workflow is confusing, inefficient, and error-prone
- **Status**: ⬜ **NOT STARTED**
- **Priority**: CRITICAL
- **Suggested Fix**:
  1. Add "Transcribe & Extract Knowledge" button on The Proving Grounds
  2. Single button runs both operations sequentially
  3. Results appear on same page (no navigation required)
  4. Alternative: Add clear workflow guide/tutorial on first page load
- **User Feedback**: "There's no reason why an individual should have click between two different pages for a feature that is contained on one of them that makes no sense"

### UX Issues Requiring Design Discussion

#### ⬜ UX-006: Predictions Not Stored (Clipboard-Only) [NOT STARTED]
- **Problem**: Script predictions are only available via "Copy Results" to clipboard
- **Impact**: No prediction history, no comparison to actual results, no verification
- **Status**: ⬜ **NOT STARTED**
- **Priority**: MEDIUM
- **Requires**: Database schema design, new UI page/section
- **Suggested Features**:
  1. `script_predictions` database table
  2. Prediction history dashboard
  3. Predicted vs. actual comparison view
  4. Export options (PDF, JSON, email)
  5. Blockchain receipt for verification/marketing

#### ⬜ UX-007: No Time-Based Projections in Predictions [NOT STARTED]
- **Problem**: Predictions show single score (0-100) with no time frame
- **Impact**: Cannot verify predictions against actual results, no actionable metrics
- **Status**: ⬜ **NOT STARTED**
- **Priority**: MEDIUM
- **Requires**: Enhanced prediction algorithm, database schema update
- **Suggested Features**:
  - 4-hour projection: "15K-25K views, 800-1.2K likes"
  - 24-hour projection: "50K-75K views, 3K-5K likes"
  - 72-hour projection: "150K-200K views, 10K-15K likes"
  - 7-day projection: "500K-750K views, 35K-50K likes"

#### ⬜ UX-008: No Script Editing Based on Recommendations [NOT STARTED]
- **Problem**: Predictions give recommendations but user must manually edit elsewhere
- **Impact**: Workflow broken, users must copy/paste/edit/re-analyze manually
- **Status**: ⬜ **NOT STARTED**
- **Priority**: MEDIUM
- **Requires**: New UI component, value editing functionality
- **Suggested Features**:
  - Split-pane view: original script (left) + recommendations (right)
  - Click recommendation → AI auto-edits that section
  - "Apply Changes" button to update script
  - "Re-Analyze" button to check improved version
- **User Reference**: Similar to Quick Win value editing workflow

#### ⬜ UX-009: No Prediction History/Comparison Dashboard [NOT STARTED]
- **Problem**: Related to UX-006, but broader scope - needs dedicated page
- **Impact**: Cannot track prediction accuracy over time, no proof of system value
- **Status**: ⬜ **NOT STARTED**
- **Priority**: LOW (depends on UX-006)
- **Requires**: New page, analytics dashboard
- **Suggested Features**:
  - List of all predictions with dates
  - Click to view prediction details
  - Link to actual video performance (if published)
  - Accuracy metrics (MAE, confidence intervals)
  - Filter by date range, score range, script type

#### ⬜ UX-010: XGBoost Integration for Improved Predictions (FEAT-073) [NOT STARTED]
- **Problem**: Current FEAT-070 uses LLM subjective analysis (MAE ~50)
- **Impact**: Predictions may be inaccurate, low confidence
- **Status**: ⬜ **NOT STARTED** (Future Enhancement)
- **Priority**: LOW (test current system first)
- **Requires**:
  - Validation test on existing 60+ videos
  - 100+ videos with transcripts for training
  - XGBoost model development (267-1,267 features)
  - Keyword reservoir (1,000 trending keywords)
- **Expected Improvement**: MAE 50 → MAE 10-15 (4-5x better accuracy)
- **Decision Tree**:
  - If current MAE < 20 → Current system works, optimize later
  - If current MAE 20-40 → Build basic XGBoost (267 features)
  - If current MAE > 40 → Build full XGBoost with keywords (1,267 features)
- **User Feedback**: "Seems relevant to improving this feature... what do you think?"

---

## Future Pages (Placeholder)

### Page 3: [TBD]
*To be added when additional pages are implemented*

### Page 4: [TBD]
*To be added when additional pages are implemented*

### Page 5: [TBD]
*To be added when additional pages are implemented*

### Page 6: [TBD]
*To be added when additional pages are implemented*

### Page 7: [TBD]
*To be added when additional pages are implemented*

### Page 8: [TBD]
*To be added when additional pages are implemented*

### Page 9: [TBD]
*To be added when additional pages are implemented*

### Page 10: [TBD]
*To be added when additional pages are implemented*

---

## Notes

- This document should be updated whenever workflows are modified, added, or removed
- Each modification should be documented in the Modification History section
- When new pages are added to the system, create a new section following the same structure
- Success criteria should be specific and testable
- Interaction maps should be updated when workflow dependencies change
