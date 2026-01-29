# UX-005 & UX-003 Implementation Guide

**Created**: 2025-10-19
**Status**: PARTIAL - Functions added, UI components pending
**Priority**: CRITICAL (UX-005), HIGH (UX-003)

---

## Progress Status

### ✅ Completed
- [x] Added interfaces: `ExtractedKnowledge`, `TranscribeExtractProgress`
- [x] Added state variables for both UX-005 and UX-003
- [x] Implemented `handleTranscribeAndExtract()` function (UX-005)
- [x] Implemented `getTranscribeExtractButtonText()` helper (UX-005)

### ⬜ Remaining Work
- [ ] Add UX-003 functions (`fetchTotalCount`, `loadAllVideos`)
- [ ] Add "Transcribe & Extract Knowledge" button to UI
- [ ] Add "Extracted Knowledge" section to UI
- [ ] Add "Load All Videos" button and counter to UI
- [ ] Update workflow-mapping.md with both workflows
- [ ] Test in browser

---

## What's Been Added to Code

### File: `src/app/admin/pipeline-manager/page.tsx`

**Lines 44-62**: New Interfaces
```typescript
interface ExtractedKnowledge {
  id: string
  video_id: string
  consensus_insights: {
    viral_hooks?: string[]
    emotional_triggers?: string[]
    viral_coefficient_factors?: string[]
    pattern_match?: string
    confidence?: number
  }
  confidence_score: number
  created_at: string
}

interface TranscribeExtractProgress {
  phase: 'idle' | 'transcribing' | 'extracting' | 'complete' | 'error'
  transcriptionProgress: { current: number; total: number }
  extractionProgress: { current: number; total: number }
}
```

**Lines 98-110**: New State Variables
```typescript
// Combined workflow state (UX-005 fix)
const [combinedProgress, setCombinedProgress] = useState<TranscribeExtractProgress>({
  phase: 'idle',
  transcriptionProgress: { current: 0, total: 0 },
  extractionProgress: { current: 0, total: 0 }
})
const [extractedKnowledge, setExtractedKnowledge] = useState<ExtractedKnowledge[]>([])
const [knowledgeExpanded, setKnowledgeExpanded] = useState(false)

// Video count state (UX-003 fix)
const [totalVideoCount, setTotalVideoCount] = useState<number | null>(null)
const [loadingAll, setLoadingAll] = useState(false)
const [allVideosLoaded, setAllVideosLoaded] = useState(false)
```

**Lines 260-383**: New Functions for UX-005
- `handleTranscribeAndExtract()` - Main combined workflow
- `getTranscribeExtractButtonText()` - Dynamic button text

---

## Remaining Code to Add

### 1. Add UX-003 Functions

Insert after `getTranscribeExtractButtonText()` function (around line 383):

```typescript
// UX-003 FIX: Fetch total video count
const fetchTotalCount = async () => {
  try {
    const { count } = await supabase
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .gte('dps_score', 70)

    setTotalVideoCount(count || 0)
  } catch (error) {
    console.error('Error fetching video count:', error)
    setTotalVideoCount(null)
  }
}

// UX-003 FIX: Load all videos at once
const loadAllVideos = async () => {
  if (loadingAll || allVideosLoaded) return

  setLoadingAll(true)
  setMessageType('loading')
  setMessage(`Loading all ${totalVideoCount || '...'} videos...`)

  try {
    const { data, error } = await supabase
      .from('scraped_videos')
      .select('*')
      .gte('dps_score', 70)
      .order('dps_score', { ascending: false })

    if (error) throw error

    setVideos(data || [])
    setAllVideosLoaded(true)
    setHasMoreVideos(false)
    setVideoOffset(data?.length || 0)

    setMessageType('success')
    setMessage(
      `Loaded all ${data?.length || 0} videos successfully! ` +
      `You can now scroll through the complete dataset.`
    )
  } catch (error: any) {
    setMessageType('error')
    setMessage(
      `Error loading all videos: ${error.message}. ` +
      `Try using "Load More" to load videos incrementally, or refresh the page.`
    )
  } finally {
    setLoadingAll(false)
    setTimeout(() => setMessage(''), 8000)
  }
}

// UX-003 FIX: Get current video count text
const getVideoCountText = () => {
  if (totalVideoCount === null) return 'Loading count...'
  if (allVideosLoaded) return `Showing all ${videos.length} videos`
  return `Showing ${videos.length} of ${totalVideoCount} videos`
}
```

### 2. Update useEffect to fetch count

Find the existing `useEffect` (likely around line 400-410) and add `fetchTotalCount()`:

```typescript
useEffect(() => {
  fetchStats()
  fetchPatterns()
  fetchVideos()
  fetchTotalCount() // ADD THIS LINE
}, [])
```

### 3. Update fetchVideos to track "all loaded" state

Find `fetchVideos()` function and update the end:

```typescript
const fetchVideos = async (append = false) => {
  setLoading(true)
  try {
    // ... existing query code ...

    setHasMoreVideos(data && data.length === 12)

    // ADD THIS: Check if all videos are loaded
    if (totalVideoCount !== null) {
      const currentCount = append ? videos.length + (data || []).length : (data || []).length
      setAllVideosLoaded(currentCount >= totalVideoCount)
    }
  } catch (error: any) {
    setMessage(`Error: ${error.message}`)
  } finally {
    setLoading(false)
  }
}
```

---

## UI Components to Add

### 1. Add "Transcribe & Extract Knowledge" Button

Find the pipeline actions section (likely around line 450-500) where "Transcribe Videos" button exists.

Add this AFTER the existing "Transcribe Videos" button:

```tsx
{/* UX-005 FIX: Combined Transcribe & Extract Knowledge Button */}
<button
  onClick={handleTranscribeAndExtract}
  disabled={loading || combinedProgress.phase === 'transcribing' || combinedProgress.phase === 'extracting'}
  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all flex items-center justify-center gap-2"
>
  {getTranscribeExtractButtonText()}
</button>
```

### 2. Add "Extracted Knowledge" Section

Add this BEFORE the video grid section (likely around line 600):

```tsx
{/* UX-005 FIX: Extracted Knowledge Section */}
{extractedKnowledge.length > 0 && (
  <div className="mb-8">
    <div
      className="flex items-center justify-between mb-4 cursor-pointer"
      onClick={() => setKnowledgeExpanded(!knowledgeExpanded)}
    >
      <h2 className="text-2xl font-bold">Extracted Knowledge</h2>
      <button className="text-purple-400 hover:text-purple-300">
        {knowledgeExpanded ? '▼ Collapse' : '▶ Expand'}
      </button>
    </div>

    {knowledgeExpanded && (
      <>
        {/* Data Source Label */}
        <div className="mb-6 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <span className="text-purple-400 font-mono text-sm">
            🧠 DATA SOURCE: FEAT-060 Knowledge Extraction → extracted_knowledge table
          </span>
        </div>

        {/* Knowledge Display */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">

          {/* Viral Hooks */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-purple-400 mb-3">
              Viral Hooks ({extractedKnowledge.reduce((sum, item) => sum + (item.consensus_insights?.viral_hooks?.length || 0), 0)} found)
            </h3>
            <div className="space-y-2">
              {extractedKnowledge.slice(0, 3).map((item, idx) => (
                item.consensus_insights?.viral_hooks?.slice(0, 3).map((hook, hookIdx) => (
                  <div key={`${idx}-${hookIdx}`} className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-gray-300">• {hook}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {Math.round(item.confidence_score * 100)}%
                    </p>
                  </div>
                ))
              ))}
            </div>
          </div>

          {/* Emotional Triggers */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-pink-400 mb-3">
              Emotional Triggers ({extractedKnowledge.reduce((sum, item) => sum + (item.consensus_insights?.emotional_triggers?.length || 0), 0)} found)
            </h3>
            <div className="flex flex-wrap gap-2">
              {extractedKnowledge.slice(0, 5).map((item, idx) => (
                item.consensus_insights?.emotional_triggers?.slice(0, 5).map((trigger, triggerIdx) => (
                  <span
                    key={`${idx}-${triggerIdx}`}
                    className="bg-pink-500/20 text-pink-300 px-3 py-1 rounded-full text-sm border border-pink-500/30"
                  >
                    {trigger}
                  </span>
                ))
              ))}
            </div>
          </div>

          {/* Confidence Scores */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-cyan-400 mb-3">Confidence Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Average Confidence</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {Math.round(extractedKnowledge.reduce((sum, item) => sum + item.confidence_score, 0) / extractedKnowledge.length * 100)}%
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-sm text-gray-400 mb-1">Videos Analyzed</p>
                <p className="text-2xl font-bold text-purple-400">
                  {extractedKnowledge.length}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <a
              href="/admin/research-review"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg transition-all"
            >
              Use in Script Predictor (FEAT-070) →
            </a>
          </div>
        </div>
      </>
    )}
  </div>
)}
```

### 3. Update Video Grid Section

Find the video grid header (likely around line 650-700) and replace with:

```tsx
{/* UX-003 FIX: Video Grid with Counter */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-2xl font-bold mb-2">🔥 Viral Videos ({stats?.viral || 0})</h2>

      {/* Data Source Label */}
      <div className="mb-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30 inline-block">
        <span className="text-purple-400 font-mono text-sm">
          🎬 DATA SOURCE: FEAT-001 TikTok Scraper + FEAT-002 DPS Calculator → scraped_videos table
        </span>
      </div>
    </div>

    {/* UX-003 FIX: Video Counter */}
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg px-6 py-3">
      <p className="text-sm text-gray-400 mb-1">Video Count</p>
      <p className="text-xl font-bold text-cyan-400">
        {getVideoCountText()}
      </p>
    </div>
  </div>

  {/* Filter dropdowns... */}
  {/* Video cards grid... */}

  {/* UX-003 FIX: Enhanced Loading Controls */}
  {!allVideosLoaded && (
    <div className="flex justify-center gap-4 mt-8">
      {/* Existing Load More button */}
      {hasMoreVideos && (
        <button
          onClick={() => fetchVideos(true)}
          disabled={loading || loadingAll}
          className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Loading...' : 'Load More (12 videos)'}
        </button>
      )}

      {/* NEW: Load All Videos button */}
      <button
        onClick={loadAllVideos}
        disabled={loading || loadingAll || allVideosLoaded}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
      >
        {loadingAll ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading all {totalVideoCount || '...'} videos...
          </>
        ) : (
          `Load All Videos (${totalVideoCount || '...'})`
        )}
      </button>
    </div>
  )}

  {/* Show message when all videos loaded */}
  {allVideosLoaded && (
    <div className="text-center backdrop-blur-xl bg-green-500/10 border border-green-500/30 rounded-lg px-6 py-4 mt-8">
      <p className="text-green-400 font-semibold">
        ✓ All {videos.length} videos loaded
      </p>
      <p className="text-sm text-gray-400 mt-1">
        You're viewing the complete dataset
      </p>
    </div>
  )}
</div>
```

---

## Testing Checklist

Once implementation is complete:

### UX-005 Testing
- [ ] Click "Transcribe & Extract Knowledge" button
- [ ] Verify button shows "Transcribing... (X/Y)" during transcription
- [ ] Verify button shows "Extracting knowledge..." after transcription
- [ ] Verify "Extracted Knowledge" section auto-expands
- [ ] Verify viral hooks and emotional triggers display correctly
- [ ] Verify confidence scores calculate correctly
- [ ] Verify success message says WHERE results appear
- [ ] Verify "Use in Script Predictor" link works

### UX-003 Testing
- [ ] Verify video counter shows "Showing X of Y videos"
- [ ] Click "Load More" and verify counter updates
- [ ] Click "Load All Videos" and verify all videos load
- [ ] Verify "All videos loaded" message appears
- [ ] Verify buttons disappear when all loaded
- [ ] Verify performance is acceptable with 100+ videos

---

## Files to Update After Implementation

### 1. workflow-mapping.md

Add these entries as shown in Claude.ai's response (see full text in session summary).

### 2. session-summary-2025-10-19.md

Update the "Remaining Work" section to mark UX-003 and UX-005 as complete.

---

## Estimated Time to Complete

- **Add remaining functions**: 10 minutes
- **Add UI components**: 30 minutes
- **Test and debug**: 20 minutes
- **Update documentation**: 10 minutes

**Total**: ~70 minutes

---

## Next Session Instructions

1. Open `src/app/admin/pipeline-manager/page.tsx`
2. Follow this guide step-by-step
3. Add the remaining functions (UX-003)
4. Add all UI components
5. Test in browser
6. Update workflow-mapping.md
7. Mark UX-003 and UX-005 as complete in session summary

---

**End of Implementation Guide**
